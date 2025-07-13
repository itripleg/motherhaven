// app/dex/components/trading/BuyTokenFormOptimized.tsx - SIMPLIFIED: Cleaner, more maintainable code
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useSimulateContract,
} from "wagmi";
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

// Helper to validate calculation amounts
const isValidForCalculation = (amount: string): boolean => {
  if (!amount || amount === "0") return false;
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return false;
  const decimals = (amount.split(".")[1] || "").length;
  return decimals <= 10;
};

// Helper to parse contract errors
const parseContractError = (error: any): string => {
  if (!error?.message) return "Transaction failed";

  const message = error.message;

  if (message.includes("User rejected"))
    return "Transaction was rejected by user";
  if (message.includes("insufficient funds"))
    return "Insufficient funds for gas";
  if (message.includes("Insufficient output amount"))
    return "Slippage too high - try increasing tolerance";
  if (message.includes("Max supply"))
    return "Would exceed maximum token supply";
  if (message.includes("Exceeds max wallet"))
    return "Would exceed maximum wallet limit (5%)";

  // Extract revert reason
  const patterns = [
    /execution reverted with reason: ([^.]+)/,
    /execution reverted: ([^.]+)/,
    /Details: execution reverted: ([^.]+)/,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim();
  }

  if (message.includes("execution reverted"))
    return "Transaction was reverted by contract";
  if (message.includes("gas")) return "Transaction failed due to gas issues";

  // Fallback to first line if reasonable length
  const firstLine = message.split("\n")[0];
  return firstLine.length > 0 && firstLine.length < 100
    ? firstLine
    : "Transaction failed";
};

export function BuyTokenFormOptimized({
  onAmountChange,
}: BuyTokenFormOptimizedProps) {
  // Form state
  const [amount, setAmount] = useState("");
  const [slippageTolerance, setSlippageTolerance] = useState("1");

  // Calculation state
  const [estimatedTokensOut, setEstimatedTokensOut] = useState("0");
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Transaction state
  const [transactionError, setTransactionError] = useState<string | null>(null);

  // Refs for optimization
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCalculationRef = useRef<string>("");
  const lastSuccessfulTxRef = useRef<string | null>(null);

  const { toast } = useToast();
  const { data, token, calculateTokensForEth, isValidAmount, getMaxBuyAmount } =
    useTokenDataContext();

  // Computed values
  const minTokensOut = useMemo(() => {
    if (!estimatedTokensOut || estimatedTokensOut === "0") return "0";
    try {
      const estimated = parseFloat(estimatedTokensOut);
      if (isNaN(estimated) || estimated <= 0) return "0";
      const slippageMultiplier = (100 - parseFloat(slippageTolerance)) / 100;
      return (estimated * slippageMultiplier).toFixed(6);
    } catch {
      return "0";
    }
  }, [estimatedTokensOut, slippageTolerance]);

  // Input validation
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

    if (!isValidForCalculation(amount)) {
      return { valid: false, message: "Too many decimal places" };
    }

    return { valid: true, message: "" };
  }, [amount, data]);

  // Contract interactions
  const {
    data: transactionData,
    error: buyError,
    isPending: isBuyPending,
    writeContract,
    reset,
  } = useWriteContract();
  const {
    isLoading: isBuyConfirming,
    data: receipt,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: transactionData });

  // Simulation for early error detection
  const simulationArgs = useMemo(() => {
    if (!token || !amount || !validation.valid || !minTokensOut)
      return undefined;
    try {
      return {
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "buy" as const,
        args: [token.address, parseEther(minTokensOut)] as const,
        value: parseEther(amount),
      };
    } catch {
      return undefined;
    }
  }, [token, amount, minTokensOut, validation.valid]);

  const { error: simulationError } = useSimulateContract(
    simulationArgs || {
      abi: FACTORY_ABI,
      address: FACTORY_ADDRESS,
      functionName: "buy",
      args: ["0x0000000000000000000000000000000000000000", 0n],
      value: 0n,
      query: { enabled: false },
    }
  );

  // Debounced calculation
  const debouncedCalculateTokens = useCallback(
    (inputAmount: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      setCalculationError(null);

      if (!inputAmount || !isValidAmount(inputAmount, "buy")) {
        setEstimatedTokensOut("0");
        setIsCalculating(false);
        return;
      }

      if (!isValidForCalculation(inputAmount)) {
        setCalculationError("Amount has too many decimal places");
        setEstimatedTokensOut("0");
        setIsCalculating(false);
        return;
      }

      if (inputAmount === lastCalculationRef.current) return;

      setIsCalculating(true);
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          lastCalculationRef.current = inputAmount;
          const result = await calculateTokensForEth(inputAmount);
          setEstimatedTokensOut(result);
          setCalculationError(null);
        } catch (error) {
          console.error("Calculation error:", error);
          setEstimatedTokensOut("0");
          setCalculationError("Failed to calculate token amount");
        } finally {
          setIsCalculating(false);
        }
      }, 500);
    },
    [calculateTokensForEth, isValidAmount]
  );

  // Effects
  useEffect(() => {
    debouncedCalculateTokens(amount);
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [amount, debouncedCalculateTokens]);

  useEffect(() => onAmountChange?.(amount), [amount, onAmountChange]);

  // Clear errors on new transaction
  useEffect(() => {
    if (isBuyPending) {
      setTransactionError(null);
    }
  }, [isBuyPending]);

  // Unified error handling
  useEffect(() => {
    const error = buyError || receiptError;
    if (error) {
      const errorMessage = parseContractError(error);
      setTransactionError(errorMessage);
      reset();
      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [buyError, receiptError, toast, reset]);

  // Simulation error handling
  useEffect(() => {
    if (simulationError && amount && validation.valid) {
      const errorMessage = parseContractError(simulationError);
      setTransactionError(errorMessage);
    } else if (!simulationError && transactionError?.includes("would fail")) {
      setTransactionError(null);
    }
  }, [simulationError, amount, validation.valid, transactionError]);

  // Success handling
  useEffect(() => {
    if (receipt?.status === "success") {
      const txHash = receipt.transactionHash;
      if (lastSuccessfulTxRef.current !== txHash) {
        lastSuccessfulTxRef.current = txHash;
        setTransactionError(null);
        toast({
          title: "Purchase Successful!",
          description: `Successfully bought tokens with ${amount} AVAX`,
        });
        setAmount("");
        setEstimatedTokensOut("0");
      }
    } else if (receipt?.status === "reverted") {
      setTransactionError("Transaction was reverted");
      toast({
        title: "Transaction Reverted",
        description: "The transaction was reverted by the contract.",
        variant: "destructive",
      });
    }
  }, [receipt, amount, toast]);

  // Event handlers
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

    setTransactionError(null);
    reset();

    try {
      const amountInWei = parseEther(amount);
      const minTokensWei = parseEther(minTokensOut);

      writeContract({
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "buy",
        args: [token?.address as `0x${string}`, minTokensWei],
        value: amountInWei,
      });

      toast({
        title: "Transaction Submitted",
        description: `Buying with ${slippageTolerance}% slippage protection...`,
      });
    } catch (error) {
      const errorMessage = parseContractError(error);
      setTransactionError(errorMessage);
      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleMaxClick = () => {
    const maxAmount = getMaxBuyAmount();
    setAmount(maxAmount);
  };

  const handleAmountChange = (value: string) => {
    // Truncate excessive decimal places
    const parts = value.split(".");
    if (parts.length > 1 && parts[1].length > 10) {
      value = `${parts[0]}.${parts[1].slice(0, 10)}`;
    }

    setAmount(value);

    if (value !== amount) {
      setEstimatedTokensOut("0");
      setCalculationError(null);
      setTransactionError(null);
    }
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

  const isSubmitDisabled =
    isBuyPending ||
    (isBuyConfirming && !transactionError) ||
    !validation.valid ||
    !amount ||
    parseFloat(amount) <= 0 ||
    isCalculating ||
    calculationError !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="amount">Amount (AVAX)</Label>
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
            onChange={(e) => handleAmountChange(e.target.value)}
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
        {calculationError && (
          <p className="text-xs text-orange-400">{calculationError}</p>
        )}
      </div>

      {/* Slippage Controls */}
      <div className="space-y-2">
        <Label>Slippage Tolerance (%)</Label>
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
      {amount && validation.valid && !calculationError && (
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
      <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
        {isBuyPending
          ? "Submitting..."
          : isBuyConfirming && !transactionError
          ? "Confirming..."
          : "Buy Tokens"}
      </Button>

      {/* Error Display */}
      {transactionError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-destructive text-sm font-medium">
            {transactionError}
          </p>
          <button
            type="button"
            onClick={() => {
              setTransactionError(null);
              reset();
            }}
            className="text-xs text-destructive/70 hover:text-destructive underline mt-1"
          >
            Try again
          </button>
        </div>
      )}

      {/* Transaction Status */}
      {isBuyConfirming && !transactionError && (
        <div className="text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <div className="h-3 w-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
            Waiting for confirmation...
          </div>
        </div>
      )}

      {/* Success Receipt */}
      {receipt?.status === "success" && transactionData && (
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
              <AddressComponent hash={transactionData} type="tx" />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
