import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";
import { AddressComponent } from "@/components/AddressComponent";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types";
import { readContract } from "@wagmi/core";
import { publicClient } from "@/wagmi-config";

// Basic ERC20 ABI for approval
const ERC20_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function SellTokenForm({
  onAmountChange,
  maxAmount,
  decimals = 18,
  address,
}: {
  onAmountChange?: (amount: string) => void;
  maxAmount?: string;
  decimals?: number;
  address?: `0x${string}`;
}) {
  const pathname = usePathname();
  const tokenAddress = pathname.split("/").pop() || "";

  const [amount, setAmount] = useState("");
  const [slippageTolerance, setSlippageTolerance] = useState("1"); // 1% default slippage
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [estimatedEthOut, setEstimatedEthOut] = useState<string>("0");
  const [receiptDetails, setReceiptDetails] = useState<{
    avaxReceived?: string;
    tokensSold?: string;
  }>({});

  const { toast } = useToast();

  // Contract write hooks
  const {
    data: sellData,
    error: sellError,
    isPending: isSellPending,
    writeContract: writeSellContract,
  } = useWriteContract();

  const {
    data: approvalData,
    error: approvalError,
    isPending: isApprovalPending,
    writeContract: writeApprovalContract,
  } = useWriteContract();

  // Transaction receipt hooks
  const { isLoading: isSellConfirming, data: sellReceipt } =
    useWaitForTransactionReceipt({
      hash: sellData,
    });

  const { isLoading: isApprovalConfirming, data: approvalReceipt } =
    useWaitForTransactionReceipt({
      hash: approvalData,
    });

  // Get estimated ETH output for the current amount
  useEffect(() => {
    const getEstimatedEthOut = async () => {
      if (!amount || !tokenAddress || parseFloat(amount) <= 0) {
        setEstimatedEthOut("0");
        return;
      }

      try {
        const parsedAmount = parseEther(amount);
        const estimatedEth = await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: FACTORY_ABI,
          functionName: "calculateSellPrice",
          args: [tokenAddress as `0x${string}`, parsedAmount],
        });

        setEstimatedEthOut(formatEther(estimatedEth as bigint));
      } catch (error) {
        console.error("Error calculating sell price:", error);
        setEstimatedEthOut("0");
      }
    };

    getEstimatedEthOut();
  }, [amount, tokenAddress]);

  const { data: allowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address as `0x${string}`, FACTORY_ADDRESS],
  });

  // Helper function to extract revert reason
  const extractRevertReason = (error: any): string => {
    if (!error) return "Unknown error";

    // Check for common revert patterns
    const errorMessage = error.message || error.toString();

    // Extract revert reason from different error formats
    if (errorMessage.includes("execution reverted:")) {
      const match = errorMessage.match(/execution reverted: (.+)/);
      return match ? match[1] : "Transaction reverted";
    }

    if (errorMessage.includes("revert")) {
      const match = errorMessage.match(/revert (.+)/);
      return match ? match[1] : "Transaction reverted";
    }

    // Check for specific contract errors
    if (errorMessage.includes("Insufficient token collateral")) {
      return "Insufficient token collateral - try selling a smaller amount";
    }

    if (errorMessage.includes("Insufficient balance")) {
      return "You don't have enough tokens to sell this amount";
    }

    if (errorMessage.includes("Not trading")) {
      return "Token is not currently trading";
    }

    if (errorMessage.includes("Amount must be > 0")) {
      return "Amount must be greater than 0";
    }

    if (errorMessage.includes("Sell amount too small")) {
      return "Sell amount too small - minimum sell value not met";
    }

    if (errorMessage.includes("Insufficient output amount")) {
      return "Slippage tolerance exceeded - try reducing amount or accepting higher slippage";
    }

    // Check for gas estimation failures (often indicates revert)
    if (
      errorMessage.includes("gas required exceeds allowance") ||
      errorMessage.includes("intrinsic gas too low")
    ) {
      return "Transaction would fail - check token balance and collateral";
    }

    // Return simplified error message
    return errorMessage.split("\n")[0] || "Transaction failed";
  };

  // Clear error when amount changes
  useEffect(() => {
    setErrorDetails(null);
  }, [amount, slippageTolerance]);

  // Check if approval is needed whenever amount changes
  useEffect(() => {
    if (amount && allowance !== undefined) {
      const parsedAmount = parseEther(amount);
      setNeedsApproval(parsedAmount > allowance);
    }
  }, [amount, allowance]);

  // Handle errors
  useEffect(() => {
    if (sellError) {
      const revertReason = extractRevertReason(sellError);
      setErrorDetails(revertReason);
      toast({
        title: "Transaction Failed",
        description: revertReason,
        variant: "destructive",
      });
    }
  }, [sellError, toast]);

  useEffect(() => {
    if (approvalError) {
      const revertReason = extractRevertReason(approvalError);
      setErrorDetails(revertReason);
      toast({
        title: "Approval Failed",
        description: revertReason,
        variant: "destructive",
      });
    }
  }, [approvalError, toast]);

  const handleApprove = async () => {
    if (!tokenAddress || !amount) return;

    try {
      setIsApproving(true);
      setErrorDetails(null);
      const parsedAmount = parseEther(amount);

      writeApprovalContract({
        abi: ERC20_ABI,
        address: tokenAddress as `0x${string}`,
        functionName: "approve",
        args: [FACTORY_ADDRESS, parsedAmount],
      });

      toast({
        title: "Approval Submitted",
        description: "Please wait for the approval transaction to complete...",
      });
    } catch (error) {
      console.error("Approval error:", error);
      const revertReason = extractRevertReason(error);
      setErrorDetails(revertReason);
      toast({
        title: "Error",
        description: revertReason,
        variant: "destructive",
      });
      setIsApproving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenAddress || !amount) {
      toast({
        title: "Error",
        description:
          "Please enter an amount and ensure token address is available.",
        variant: "destructive",
      });
      return;
    }

    try {
      setErrorDetails(null);
      const parsedAmount = parseEther(amount);

      // Calculate minimum ETH out with slippage protection
      const estimatedEthBigInt = parseEther(estimatedEthOut);
      const slippageMultiplier = BigInt(
        Math.floor((100 - parseFloat(slippageTolerance)) * 100)
      );
      const minEthOut = (estimatedEthBigInt * slippageMultiplier) / 10000n;

      writeSellContract({
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "sell",
        args: [tokenAddress, parsedAmount, minEthOut], // Added the required third parameter
      });

      toast({
        title: "Transaction Submitted",
        description: `Selling with ${slippageTolerance}% slippage protection...`,
      });
    } catch (error) {
      console.error("Error:", error);
      const revertReason = extractRevertReason(error);
      setErrorDetails(revertReason);
      toast({
        title: "Error",
        description: revertReason,
        variant: "destructive",
      });
    }
  };

  // Handle approval confirmation
  useEffect(() => {
    if (approvalReceipt) {
      setIsApproving(false);
      setNeedsApproval(false);
      setErrorDetails(null);
      toast({
        title: "Approval Confirmed",
        description: "You can now proceed with selling your tokens.",
      });
    }
  }, [approvalReceipt, toast]);

  // Handle sell confirmation
  useEffect(() => {
    if (sellReceipt) {
      const sellEvent = sellReceipt.logs?.find(
        (log) =>
          log.topics[0] ===
          "0x697c42d55a5e1fed3f464ec6f38b32546a0bd368dc8068b065c67566d73f3290"
      );

      if (sellEvent) {
        const avaxReceived = formatEther(BigInt(sellEvent.data));

        setReceiptDetails({
          avaxReceived,
          tokensSold: amount,
        });

        setErrorDetails(null);
        toast({
          title: "Sale Confirmed",
          description: `You sold ${amount} tokens for ${avaxReceived} AVAX.`,
        });
      }
    }
  }, [sellReceipt, amount, toast]);

  const calculateMaxSellAmount = async (
    tokenAddress: string,
    currentPrice: bigint
  ) => {
    try {
      // @ts-expect-error no params
      const collateral = await readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "collateral",
        args: [tokenAddress],
      });

      const collateralWithFee =
        ((collateral as bigint) * 10000n) / (10000n - 30n);

      const maxTokens = (collateralWithFee * 10n ** 18n) / currentPrice;

      return (maxTokens * 995n) / 1000n;
    } catch (error) {
      console.error("Error calculating max sell amount:", error);
      return 0n;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="amount" className="text-foreground">
              Amount (Tokens)
            </Label>
            <span
              className="text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={() => {
                if (maxAmount) {
                  setAmount(maxAmount);
                  onAmountChange?.(maxAmount);
                }
              }}
            >
              Max
            </span>
          </div>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              onAmountChange?.(e.target.value);
            }}
            onWheel={(e) => e.currentTarget.blur()}
            className="text-center pr-2 !bg-input !border-border text-foreground placeholder:text-muted-foreground focus:!border-primary focus:!ring-2 focus:!ring-primary/20 focus:!ring-offset-0 transition-all duration-200"
            step="0.001"
            min="0"
            placeholder="0.000"
          />
        </div>

        {/* Slippage Tolerance Setting */}
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="slippage" className="text-foreground">
            Slippage Tolerance (%)
          </Label>
          <div className="flex gap-2">
            {["0.5", "1", "2", "5"].map((preset) => (
              <Button
                key={preset}
                type="button"
                size="sm"
                onClick={() => setSlippageTolerance(preset)}
                className={`flex-1 transition-all duration-200 focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 ${
                  slippageTolerance === preset
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary/50 text-foreground border border-border hover:bg-secondary hover:border-primary/30"
                }`}
                variant="ghost"
              >
                {preset}%
              </Button>
            ))}
            <Input
              id="slippage"
              type="number"
              value={slippageTolerance}
              onChange={(e) => setSlippageTolerance(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className="w-20 text-center !bg-input !border-border text-foreground placeholder:text-muted-foreground focus:!border-primary focus:!ring-2 focus:!ring-primary/20 focus:!ring-offset-0 transition-all duration-200"
              step="0.1"
              min="0"
              max="50"
              placeholder="1.0"
            />
          </div>
        </div>

        {/* Transaction Preview */}
        {amount && parseFloat(amount) > 0 && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">Estimated ETH:</span>
              <span className="font-mono text-primary">
                {parseFloat(estimatedEthOut).toFixed(6)} ETH
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground">
                Minimum ETH (after {slippageTolerance}% slippage):
              </span>
              <span className="font-mono text-primary">
                {(
                  (parseFloat(estimatedEthOut) *
                    (100 - parseFloat(slippageTolerance))) /
                  100
                ).toFixed(6)}{" "}
                ETH
              </span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Fee (0.3%):</span>
              <span className="font-mono">
                ~{(parseFloat(estimatedEthOut) * 0.003).toFixed(6)} ETH
              </span>
            </div>
          </div>
        )}
      </div>

      {needsApproval ? (
        <Button
          type="button"
          className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 transition-all duration-200 border-0"
          onClick={handleApprove}
          disabled={isApprovalPending || isApproving}
        >
          {isApprovalPending || isApproving ? "Approving..." : "Approve Tokens"}
        </Button>
      ) : (
        <Button
          type="submit"
          className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 transition-all duration-200 border-0"
          disabled={isSellPending || !tokenAddress || !amount}
        >
          {isSellPending ? "Processing..." : "Sell Tokens"}
        </Button>
      )}

      {(isApprovalConfirming || isSellConfirming) && (
        <div className="mt-2 text-center text-muted-foreground">
          Waiting for confirmation...
        </div>
      )}

      {/* Enhanced Error Display */}
      {errorDetails && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-destructive font-medium text-sm">Error Details:</p>
          <p className="text-destructive/80 text-sm mt-1">{errorDetails}</p>
        </div>
      )}

      {/* {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-secondary/20 border border-border rounded-md">
          <p className="text-foreground font-medium text-sm mb-2">
            Debug Info:
          </p>
          <div className="text-xs space-y-1 text-muted-foreground">
            <div>Token Address: {tokenAddress}</div>
            <div>Amount to Sell: {amount}</div>
            <div>Token Balance: {maxAmount}</div>
            <div>Allowance: {allowance?.toString()}</div>
            <div>Needs Approval: {needsApproval.toString()}</div>
            <div>Estimated ETH Out: {estimatedEthOut}</div>
            <div>
              Min ETH Out:{" "}
              {(
                (parseFloat(estimatedEthOut) *
                  (100 - parseFloat(slippageTolerance))) /
                100
              ).toFixed(6)}
            </div>
            <div>Slippage: {slippageTolerance}%</div>
          </div>
        </div>
      )} */}

      {receiptDetails.tokensSold && (
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="font-semibold text-foreground mb-2">
            Transaction Receipt:
          </p>
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Tokens Sold:</span>
              <span className="text-foreground font-medium">
                {receiptDetails.tokensSold}
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">AVAX Received:</span>
              <span className="text-foreground font-medium">
                {receiptDetails.avaxReceived} AVAX
              </span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Slippage Used:</span>
              <span className="text-foreground font-medium">
                {slippageTolerance}%
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Transaction:</span>
              <AddressComponent hash={`${sellData}`} type="tx" />
            </li>
          </ul>
        </div>
      )}
    </form>
  );
}
