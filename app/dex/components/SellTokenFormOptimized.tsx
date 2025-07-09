// app/dex/components/SellTokenFormOptimized.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseEther, Address } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AddressComponent } from "@/components/AddressComponent";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types";
import { useTokenDataContext } from "@/contexts/TokenDataProvider";
import { useAccount } from "wagmi";

// ERC20 ABI for approval
const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface SellTokenFormOptimizedProps {
  onAmountChange?: (amount: string) => void;
}

export function SellTokenFormOptimized({
  onAmountChange,
}: SellTokenFormOptimizedProps) {
  const [amount, setAmount] = useState("");
  const [slippageTolerance, setSlippageTolerance] = useState("1");
  const [estimatedEthOut, setEstimatedEthOut] = useState("0");
  const [isCalculating, setIsCalculating] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);

  const { address } = useAccount();
  const { toast } = useToast();

  // Get optimized data from context
  const {
    data,
    token,
    calculateEthForTokens,
    isValidAmount,
    getMaxSellAmount,
  } = useTokenDataContext();

  // Contract interactions
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

  const { isLoading: isSellConfirming, data: sellReceipt } =
    useWaitForTransactionReceipt({ hash: sellData });

  const { isLoading: isApprovalConfirming, data: approvalReceipt } =
    useWaitForTransactionReceipt({ hash: approvalData });

  // Check allowance
  const { data: allowance } = useReadContract({
    address: token?.address as Address,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && token ? [address, FACTORY_ADDRESS] : undefined,
    query: { enabled: Boolean(address && token) },
  });

  // Debounced calculation using context method
  useEffect(() => {
    if (!amount || !isValidAmount(amount, "sell")) {
      setEstimatedEthOut("0");
      return;
    }

    setIsCalculating(true);
    calculateEthForTokens(amount)
      .then(setEstimatedEthOut)
      .finally(() => setIsCalculating(false));
  }, [amount, calculateEthForTokens, isValidAmount]);

  // Check approval status
  useEffect(() => {
    if (amount && allowance !== undefined) {
      const amountWei = parseEther(amount);
      setNeedsApproval(amountWei > allowance);
    }
  }, [amount, allowance]);

  // Notify parent of amount changes
  useEffect(() => {
    onAmountChange?.(amount);
  }, [amount, onAmountChange]);

  // Calculate slippage-protected minimum ETH
  const minEthOut = useMemo(() => {
    if (!estimatedEthOut || estimatedEthOut === "0") return "0";
    const estimated = parseFloat(estimatedEthOut);
    const slippageMultiplier = (100 - parseFloat(slippageTolerance)) / 100;
    return (estimated * slippageMultiplier).toFixed(6);
  }, [estimatedEthOut, slippageTolerance]);

  // Input validation
  const validation = useMemo(() => {
    if (!amount) return { valid: true, message: "" };
    if (!data) return { valid: false, message: "Loading..." };

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { valid: false, message: "Enter a valid amount" };
    }

    const maxTokens = parseFloat(data.formatted.tokenBalance);
    if (amountNum > maxTokens) {
      return { valid: false, message: "Insufficient token balance" };
    }

    return { valid: true, message: "" };
  }, [amount, data]);

  const handleApprove = async () => {
    if (!token || !amount) return;

    try {
      const amountWei = parseEther(amount);

      writeApprovalContract({
        abi: ERC20_ABI,
        address: token.address,
        functionName: "approve",
        args: [FACTORY_ADDRESS, amountWei],
      });

      toast({
        title: "Approval Submitted",
        description: "Please wait for approval confirmation...",
      });
    } catch (error) {
      console.error("Approval error:", error);
      toast({
        title: "Approval Failed",
        description: "Failed to submit approval transaction",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.valid || !token) {
      toast({
        title: "Invalid Input",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    try {
      const amountWei = parseEther(amount);
      const minEthWei = parseEther(minEthOut);

      writeSellContract({
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "sell",
        args: [token.address, amountWei, minEthWei],
      });

      toast({
        title: "Transaction Submitted",
        description: `Selling with ${slippageTolerance}% slippage protection...`,
      });
    } catch (error) {
      console.error("Sell error:", error);
      toast({
        title: "Transaction Failed",
        description: "Failed to submit sell transaction",
        variant: "destructive",
      });
    }
  };

  const handleMaxClick = () => {
    const maxAmount = getMaxSellAmount();
    setAmount(maxAmount);
  };

  // Handle successful approval
  useEffect(() => {
    if (approvalReceipt) {
      setNeedsApproval(false);
      toast({
        title: "Approval Confirmed",
        description: "You can now proceed with selling your tokens.",
      });
    }
  }, [approvalReceipt, toast]);

  // Loading state
  if (!data || !token) {
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
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="amount" className="text-foreground">
              Amount ({token.symbol})
            </Label>
            <button
              type="button"
              onClick={handleMaxClick}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Balance: {data.formatted.tokenBalance} {token.symbol}
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
              <span>Estimated AVAX:</span>
              <span className="font-mono">
                {isCalculating ? (
                  <span className="flex items-center gap-1">
                    <div className="h-3 w-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                    Calculating...
                  </span>
                ) : (
                  `${parseFloat(estimatedEthOut).toFixed(6)} AVAX`
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Minimum AVAX ({slippageTolerance}% slippage):</span>
              <span className="font-mono">
                {parseFloat(minEthOut).toFixed(6)} AVAX
              </span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Trading Fee (0.3%):</span>
              <span className="font-mono">
                ~{(parseFloat(estimatedEthOut || "0") * 0.003).toFixed(6)} AVAX
              </span>
            </div>
          </div>
        )}

        {/* Approval or Sell Button */}
        {needsApproval ? (
          <Button
            type="button"
            onClick={handleApprove}
            className="w-full"
            disabled={isApprovalPending || !validation.valid || !amount}
          >
            {isApprovalPending ? "Approving..." : "Approve Tokens"}
          </Button>
        ) : (
          <Button
            type="submit"
            className="w-full"
            disabled={
              isSellPending ||
              !validation.valid ||
              !amount ||
              parseFloat(amount) <= 0 ||
              isCalculating
            }
          >
            {isSellPending ? "Processing..." : "Sell Tokens"}
          </Button>
        )}

        {/* Transaction Status */}
        {(isApprovalConfirming || isSellConfirming) && (
          <div className="text-center text-sm text-muted-foreground">
            Waiting for confirmation...
          </div>
        )}

        {/* Errors */}
        {(sellError || approvalError) && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-destructive text-sm">
              Transaction failed. Please try again.
            </p>
          </div>
        )}

        {/* Success Receipt */}
        {sellReceipt && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="font-semibold text-foreground mb-2">
              Sale Successful!
            </p>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Tokens Sold:</span>
                <span>
                  {amount} {token.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Transaction:</span>
                <AddressComponent hash={sellData!} type="tx" />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
