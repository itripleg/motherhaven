// app/dex/components/BuyTokenFormOptimized.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AddressComponent } from "@/components/AddressComponent";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types";
import { useTokenDataContext } from "@/contexts/TokenDataProvider";

interface BuyTokenFormOptimizedProps {
  onAmountChange?: (amount: string) => void;
}

export function BuyTokenFormOptimized({
  onAmountChange,
}: BuyTokenFormOptimizedProps) {
  const [amount, setAmount] = useState("");
  const [slippageTolerance, setSlippageTolerance] = useState("1");
  const [estimatedTokensOut, setEstimatedTokensOut] = useState("0");
  const [isCalculating, setIsCalculating] = useState(false);

  const { toast } = useToast();

  // Get optimized data from context
  const { data, token, calculateTokensForEth, isValidAmount, getMaxBuyAmount } =
    useTokenDataContext();

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

  // Debounced calculation using context method
  useEffect(() => {
    if (!amount || !isValidAmount(amount, "buy")) {
      setEstimatedTokensOut("0");
      return;
    }

    setIsCalculating(true);
    calculateTokensForEth(amount)
      .then(setEstimatedTokensOut)
      .finally(() => setIsCalculating(false));
  }, [amount, calculateTokensForEth, isValidAmount]);

  // Notify parent of amount changes
  useEffect(() => {
    onAmountChange?.(amount);
  }, [amount, onAmountChange]);

  // Calculate slippage-protected minimum tokens
  const minTokensOut = useMemo(() => {
    if (!estimatedTokensOut || estimatedTokensOut === "0") return "0";
    const estimated = parseFloat(estimatedTokensOut);
    const slippageMultiplier = (100 - parseFloat(slippageTolerance)) / 100;
    return (estimated * slippageMultiplier).toFixed(6);
  }, [estimatedTokensOut, slippageTolerance]);

  // Input validation with instant feedback
  const validation = useMemo(() => {
    if (!amount) return { valid: true, message: "" };
    if (!data) return { valid: false, message: "Loading..." };

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { valid: false, message: "Enter a valid amount" };
    }

    const maxAvax = parseFloat(data.formatted.avaxBalance);
    if (amountNum > maxAvax) {
      return { valid: false, message: "Insufficient AVAX balance" };
    }

    if (amountNum > maxAvax * 0.95) {
      return { valid: false, message: "Leave some AVAX for gas fees" };
    }

    return { valid: true, message: "" };
  }, [amount, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.valid || !data) {
      toast({
        title: "Invalid Input",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    try {
      const minTokensBigInt = parseEther(minTokensOut);

      writeContract({
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "buy",
        args: [token?.address as `0x${string}`, minTokensBigInt],
        value: parseEther(amount),
      });

      toast({
        title: "Transaction Submitted",
        description: `Buying with ${slippageTolerance}% slippage protection...`,
      });
    } catch (error) {
      console.error("Buy error:", error);
      toast({
        title: "Transaction Failed",
        description: "Failed to submit buy transaction",
        variant: "destructive",
      });
    }
  };

  const handleMaxClick = () => {
    const maxAmount = getMaxBuyAmount();
    setAmount(maxAmount);
  };

  // Loading state
  if (!data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">
            Loading trading data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="amount" className="text-foreground">
            Amount (AVAX)
          </Label>
          <button
            type="button"
            onClick={handleMaxClick}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Balance: {data.formatted.avaxBalance} AVAX
          </button>
        </div>
        <div className="relative">
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className={`text-center pr-16 ${
              !validation.valid && amount ? "border-destructive" : ""
            }`}
            step="0.001"
            min="0"
            placeholder="0.000"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMaxClick}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
          >
            MAX
          </Button>
        </div>
        {!validation.valid && amount && (
          <p className="text-xs text-destructive">{validation.message}</p>
        )}
      </div>

      {/* Slippage Controls */}
      <div className="space-y-2">
        <Label className="text-foreground">Slippage Tolerance (%)</Label>
        <div className="flex gap-2">
          {["0.5", "1", "2", "5"].map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              onClick={() => setSlippageTolerance(preset)}
              variant={slippageTolerance === preset ? "default" : "outline"}
              className="flex-1"
            >
              {preset}%
            </Button>
          ))}
          <Input
            type="number"
            value={slippageTolerance}
            onChange={(e) => setSlippageTolerance(e.target.value)}
            className="w-20 text-center"
            step="0.1"
            min="0"
            max="50"
          />
        </div>
      </div>

      {/* Transaction Preview */}
      {amount && validation.valid && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Estimated Tokens:</span>
            <span className="font-mono">
              {isCalculating ? (
                <span className="flex items-center gap-1">
                  <div className="h-3 w-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                  Calculating...
                </span>
              ) : (
                `${parseFloat(estimatedTokensOut).toFixed(2)} tokens`
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Minimum Tokens ({slippageTolerance}% slippage):</span>
            <span className="font-mono">
              {parseFloat(minTokensOut).toFixed(2)} tokens
            </span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Trading Fee (0.3%):</span>
            <span className="font-mono">
              ~{(parseFloat(amount || "0") * 0.003).toFixed(6)} AVAX
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={
          isPending ||
          !validation.valid ||
          !amount ||
          parseFloat(amount) <= 0 ||
          isCalculating
        }
      >
        {isPending ? "Processing..." : "Buy Tokens"}
      </Button>

      {/* Transaction Status */}
      {isConfirming && (
        <div className="text-center text-sm text-muted-foreground">
          Waiting for confirmation...
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-destructive text-sm">
            Transaction failed. Please try again.
          </p>
        </div>
      )}

      {receipt && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="font-semibold text-foreground mb-2">
            Purchase Successful!
          </p>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span>{amount} AVAX</span>
            </div>
            <div className="flex justify-between">
              <span>Transaction:</span>
              <AddressComponent hash={transactionData!} type="tx" />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
