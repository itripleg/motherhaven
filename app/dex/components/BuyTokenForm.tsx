"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
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

export function BuyTokenForm({ onAmountChange, maxAmount }: any) {
  const pathname = usePathname();
  const tokenAddress = pathname.split("/").pop() || "";

  const [amount, setAmount] = useState("");
  const [slippageTolerance, setSlippageTolerance] = useState("1"); // 1% default slippage
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [estimatedTokensOut, setEstimatedTokensOut] = useState<string>("0");
  const [receiptDetails, setReceiptDetails] = useState<{
    pricePaid?: string;
    tokensReceived?: string;
  }>({});

  const { toast } = useToast();

  const {
    data: transactionData,
    error,
    isPending,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, data: receipt } =
    useWaitForTransactionReceipt({
      hash: transactionData,
    });

  // Get estimated token output for the current amount using contract function
  useEffect(() => {
    const getEstimatedTokensOut = async () => {
      if (!amount || !tokenAddress || parseFloat(amount) <= 0) {
        setEstimatedTokensOut("0");
        return;
      }

      try {
        const parsedAmount = parseEther(amount);
        // Calculate fee (0.3%)
        const fee = (parsedAmount * 30n) / 10000n;
        const purchaseAmount = parsedAmount - fee;

        const estimatedTokens = await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: FACTORY_ABI,
          functionName: "calculateTokenAmount",
          args: [tokenAddress as `0x${string}`, purchaseAmount],
        });

        setEstimatedTokensOut(formatEther(estimatedTokens as bigint));
      } catch (error) {
        console.error("Error calculating token amount:", error);
        setEstimatedTokensOut("0");
      }
    };

    getEstimatedTokensOut();
  }, [amount, tokenAddress]);

  // Helper function to extract revert reason
  const extractRevertReason = (error: any): string => {
    if (!error) return "Unknown error";

    const errorMessage = error.message || error.toString();
    console.log("Full error object:", error);
    console.log("Error message:", errorMessage);

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
    if (errorMessage.includes("Invalid amount")) {
      return "Invalid purchase amount - check min/max limits";
    }

    if (errorMessage.includes("Max supply")) {
      return "Transaction would exceed maximum token supply";
    }

    if (errorMessage.includes("Exceeds max wallet")) {
      return "Purchase would exceed maximum wallet percentage (5%)";
    }

    if (errorMessage.includes("Not trading")) {
      return "Token is not currently trading";
    }

    if (errorMessage.includes("Insufficient output amount")) {
      return "Slippage too high - try increasing slippage tolerance or reducing amount";
    }

    // Check for gas/value issues
    if (errorMessage.includes("insufficient funds")) {
      return "Insufficient AVAX balance for this purchase";
    }

    if (
      errorMessage.includes("gas required exceeds allowance") ||
      errorMessage.includes("intrinsic gas too low")
    ) {
      return "Transaction would fail - check AVAX balance and purchase amount";
    }

    // Return simplified error message
    return errorMessage.split("\n")[0] || "Transaction failed";
  };

  // Clear error when amount changes
  useEffect(() => {
    setErrorDetails(null);
  }, [amount, slippageTolerance]);

  // Handle errors
  useEffect(() => {
    if (error) {
      const revertReason = extractRevertReason(error);
      setErrorDetails(revertReason);
      toast({
        title: "Transaction Failed",
        description: revertReason,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenAddress) {
      toast({
        title: "Error",
        description: "Token address is not available.",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      setErrorDetails(null);

      // Calculate minimum tokens out with slippage protection
      const estimatedTokensBigInt = parseEther(estimatedTokensOut);
      const slippageMultiplier = BigInt(
        Math.floor((100 - parseFloat(slippageTolerance)) * 100)
      );
      const minTokensOut =
        (estimatedTokensBigInt * slippageMultiplier) / 10000n;

      writeContract({
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "buy",
        args: [tokenAddress as `0x${string}`, minTokensOut],
        value: parseEther(amount || "0"),
      });

      toast({
        title: "Transaction Submitted",
        description: `Buying with ${slippageTolerance}% slippage protection...`,
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

  const [hasHandledReceipt, setHasHandledReceipt] = useState(false);

  useEffect(() => {
    if (receipt && !hasHandledReceipt) {
      const pricePaid = amount;

      try {
        // Try to find the TokensPurchased event log
        const tokensPurchasedLog = receipt.logs?.find((log: any) => {
          // TokensPurchased event signature
          return (
            log.topics[0] ===
            "0x377aadedb6b2a771959584d10a6a36eccb5f56b4eb3a48525f76108d2660d8d4"
          );
        });

        if (tokensPurchasedLog && tokensPurchasedLog.data) {
          // The event data contains: amount, price, fee (all uint256)
          // We need to decode the first value (amount of tokens)
          const dataWithoutPrefix = tokensPurchasedLog.data.slice(2); // Remove 0x

          // Each uint256 is 64 hex characters (32 bytes)
          const amountHex = "0x" + dataWithoutPrefix.slice(0, 64);
          const tokensReceivedBigInt = BigInt(amountHex);
          const tokensReceivedFormatted = formatEther(tokensReceivedBigInt);

          // Format safely
          const tokensReceivedNumber = parseFloat(tokensReceivedFormatted);
          const tokensReceivedDisplay = tokensReceivedNumber.toLocaleString(
            "en-US",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          );

          setReceiptDetails({
            pricePaid,
            tokensReceived: tokensReceivedDisplay,
          });

          toast({
            title: "Purchase Confirmed",
            description: `You received ${tokensReceivedDisplay} tokens for ${pricePaid} AVAX.`,
          });
        } else {
          // Fallback to estimated amount if we can't parse the event
          const fallbackDisplay = estimatedTokensOut
            ? parseFloat(estimatedTokensOut).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "Unknown";

          setReceiptDetails({
            pricePaid,
            tokensReceived: `~${fallbackDisplay} (estimated)`,
          });

          toast({
            title: "Purchase Confirmed",
            description: `Transaction successful for ${pricePaid} AVAX.`,
          });
        }

        setErrorDetails(null);
        setHasHandledReceipt(true);
      } catch (error) {
        console.error("Error parsing transaction receipt:", error);

        // Fallback to estimated amount with clear indication
        const fallbackDisplay = estimatedTokensOut
          ? parseFloat(estimatedTokensOut).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "Unknown";

        setReceiptDetails({
          pricePaid,
          tokensReceived: `~${fallbackDisplay} (estimated)`,
        });

        toast({
          title: "Purchase Confirmed",
          description: `Transaction successful for ${pricePaid} AVAX.`,
        });

        setHasHandledReceipt(true);
      }
    }
  }, [receipt, hasHandledReceipt, amount, estimatedTokensOut, toast]);

  // Calculate minimum tokens out with current slippage
  const minTokensOut = estimatedTokensOut
    ? (
        (parseFloat(estimatedTokensOut) *
          (100 - parseFloat(slippageTolerance))) /
        100
      ).toFixed(2)
    : "0";

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="amount" className="text-foreground">
                Amount (AVAX)
              </Label>
              <span
                className="text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => {
                  setAmount(maxAmount);
                  onAmountChange(maxAmount);
                }}
              >
                Max
              </span>
            </div>
            <Input
              id="amount"
              onScroll={(e) => e.stopPropagation()}
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                onAmountChange(e.target.value);
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
                <span className="text-foreground">Estimated Tokens:</span>
                <span className="font-mono text-primary">
                  {parseFloat(estimatedTokensOut).toFixed(2)} tokens
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground">
                  Minimum Tokens (after {slippageTolerance}% slippage):
                </span>
                <span className="font-mono text-primary">
                  {minTokensOut} tokens
                </span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Fee (0.3%):</span>
                <span className="font-mono">
                  ~{(parseFloat(amount) * 0.003).toFixed(6)} AVAX
                </span>
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 transition-all duration-200 border-0"
          disabled={
            isPending || !tokenAddress || !amount || parseFloat(amount) <= 0
          }
        >
          {isPending ? "Processing..." : "Buy Tokens"}
        </Button>

        {isConfirming && (
          <div className="mt-2 text-center text-muted-foreground">
            Waiting for confirmation...
          </div>
        )}

        {/* Enhanced Error Display */}
        {errorDetails && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive font-medium text-sm">
              Error Details:
            </p>
            <p className="text-destructive/80 text-sm mt-1">{errorDetails}</p>
          </div>
        )}

        {receiptDetails.tokensReceived && (
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="font-semibold text-foreground mb-2">
              Transaction Receipt:
            </p>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Price Paid:</span>
                <span className="text-foreground font-medium">
                  {receiptDetails.pricePaid} AVAX
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Tokens Received:</span>
                <span className="text-foreground font-medium">
                  {receiptDetails.tokensReceived}
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
                <AddressComponent hash={`${transactionData}`} type="tx" />
              </li>
            </ul>
          </div>
        )}

        {/* {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-secondary/20 border border-border rounded-md">
            <p className="text-foreground font-medium text-sm mb-2">
              Debug Info:
            </p>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>Token Address: {tokenAddress}</div>
              <div>Amount to Buy: {amount} AVAX</div>
              <div>Estimated Tokens Out: {estimatedTokensOut}</div>
              <div>Min Tokens Out: {minTokensOut}</div>
              <div>Slippage: {slippageTolerance}%</div>
            </div>
          </div>
        )} */}
      </form>
    </>
  );
}
