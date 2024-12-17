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
  address, // Add wallet address prop
}: {
  onAmountChange?: (amount: string) => void;
  maxAmount?: string;
  decimals?: number;
  address?: `0x${string}`; // Wallet address
}) {
  const pathname = usePathname();
  const tokenAddress = pathname.split("/").pop() || "";

  const [amount, setAmount] = useState("");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
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

  // Check allowance
  const { data: allowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [address as `0x${string}`, FACTORY_ADDRESS],
    // enabled: !!address && !!tokenAddress,
  });

  // Check if approval is needed whenever amount changes
  useEffect(() => {
    if (amount && allowance !== undefined) {
      const parsedAmount = parseEther(amount);
      setNeedsApproval(parsedAmount > allowance);
    }
  }, [amount, allowance]);

  const handleApprove = async () => {
    if (!tokenAddress || !amount) return;

    try {
      setIsApproving(true);
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
      toast({
        title: "Error",
        description: "Failed to approve tokens. Please try again.",
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
      const parsedAmount = parseEther(amount);

      writeSellContract({
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "sell",
        args: [tokenAddress, parsedAmount],
      });

      toast({
        title: "Transaction Submitted",
        description: "Waiting for confirmation...",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to sell tokens. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle approval confirmation
  useEffect(() => {
    if (approvalReceipt) {
      setIsApproving(false);
      setNeedsApproval(false);
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

        toast({
          title: "Sale Confirmed",
          description: `You sold ${amount} tokens for ${avaxReceived} AVAX.`,
        });
      }
    }
  }, [sellReceipt, amount, toast]);

  // Add this function to your SellTokenForm component
  const calculateMaxSellAmount = async (
    tokenAddress: string,
    currentPrice: bigint
  ) => {
    try {
      // Get collateral for the token
      // @ts-expect-error no params
      const collateral = await readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "collateral",
        args: [tokenAddress],
      });

      // Account for the trading fee (0.3%)
      const collateralWithFee =
        ((collateral as bigint) * 10000n) / (10000n - 30n);

      // Calculate max tokens that can be sold given the collateral
      const maxTokens = (collateralWithFee * 10n ** 18n) / currentPrice;

      // Return slightly less to account for price impact
      return (maxTokens * 995n) / 1000n; // 0.5% buffer
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
            <Label htmlFor="amount">Amount (Tokens)</Label>
            <span
              className="text-sm text-muted-foreground cursor-pointer hover:text-primary"
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
            className="text-center pr-2 dark:bg-black/80"
          />
        </div>
      </div>

      {needsApproval ? (
        <Button
          type="button"
          className="mt-4 w-full"
          onClick={handleApprove}
          disabled={isApprovalPending || isApproving}
        >
          {isApprovalPending || isApproving ? "Approving..." : "Approve Tokens"}
        </Button>
      ) : (
        <Button
          type="submit"
          className="mt-4 w-full"
          disabled={isSellPending || !tokenAddress || !amount}
        >
          {isSellPending ? "Processing..." : "Sell Tokens"}
        </Button>
      )}

      {(isApprovalConfirming || isSellConfirming) && (
        <div className="mt-2 text-center">Waiting for confirmation...</div>
      )}

      {receiptDetails.tokensSold && (
        <div className="mt-4">
          <p className="font-semibold">Transaction Receipt:</p>
          <ul className="mt-2 space-y-1">
            <li>Tokens Sold: {receiptDetails.tokensSold}</li>
            <li>AVAX Received: {receiptDetails.avaxReceived} AVAX</li>
            <li className="flex items-center">
              Transaction: <AddressComponent hash={`${sellData}`} type="tx" />
            </li>
          </ul>
        </div>
      )}

      {(sellError || approvalError) && (
        <div className="mt-4 text-red-600">
          Error: {(sellError || approvalError)?.message || "An error occurred"}
        </div>
      )}
    </form>
  );
}
