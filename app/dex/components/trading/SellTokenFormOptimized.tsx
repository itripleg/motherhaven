// app/dex/components/trading/SellTokenFormOptimized.tsx - SIMPLIFIED: Cleaner, more maintainable code
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

interface SellTokenFormOptimizedProps {
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
  if (message.includes("Insufficient balance"))
    return "Insufficient token balance";
  if (message.includes("Sell amount too small"))
    return "Minimum sell amount is 1 token";

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

export function SellTokenFormOptimized({
  onAmountChange,
}: SellTokenFormOptimizedProps) {
  // Form state
  const [amount, setAmount] = useState("");
  const [slippageTolerance, setSlippageTolerance] = useState("1");

  // Calculation state
  const [estimatedEthOut, setEstimatedEthOut] = useState("0");
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Transaction state
  const [transactionError, setTransactionError] = useState<string | null>(null);

  // Refs for optimization
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCalculationRef = useRef<string>("");
  const lastSuccessfulTxRef = useRef<string | null>(null);

  const { toast } = useToast();
  const {
    data,
    token,
    calculateEthForTokens,
    isValidAmount,
    getMaxSellAmount,
  } = useTokenDataContext();

  // Computed values
  const minEthOut = useMemo(() => {
    if (!estimatedEthOut || estimatedEthOut === "0") return "0";
    try {
      const estimated = parseFloat(estimatedEthOut);
      if (isNaN(estimated) || estimated <= 0) return "0";
      const slippageMultiplier = (100 - parseFloat(slippageTolerance)) / 100;
      return (estimated * slippageMultiplier).toFixed(6);
    } catch {
      return "0";
    }
  }, [estimatedEthOut, slippageTolerance]);

  // Input validation
  const validation = useMemo(() => {
    if (!amount) return { valid: true, message: "" };
    if (!data || !token) return { valid: false, message: "Loading..." };

    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum < 1) {
      return { valid: false, message: "Minimum sell amount is 1 token" };
    }

    const tokenBalance = Math.floor(parseFloat(data.formatted.tokenBalance));
    if (amountNum > tokenBalance) {
      return { valid: false, message: "Insufficient token balance" };
    }

    return { valid: true, message: "" };
  }, [amount, data, token]);

  // Contract interactions
  const {
    data: sellData,
    error: sellError,
    isPending: isSellPending,
    writeContract,
    reset,
  } = useWriteContract();
  const {
    isLoading: isSellConfirming,
    data: sellReceipt,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: sellData });

  // Simulation for early error detection
  const simulationArgs = useMemo(() => {
    if (!token || !amount || !validation.valid || !minEthOut) return undefined;
    try {
      return {
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "sell" as const,
        args: [
          token.address,
          parseEther(amount),
          parseEther(minEthOut),
        ] as const,
      };
    } catch {
      return undefined;
    }
  }, [token, amount, minEthOut, validation.valid]);

  const { error: simulationError } = useSimulateContract(
    simulationArgs || {
      abi: FACTORY_ABI,
      address: FACTORY_ADDRESS,
      functionName: "sell",
      args: ["0x0000000000000000000000000000000000000000", 0n, 0n],
      query: { enabled: false },
    }
  );

  // Debounced calculation
  const debouncedCalculateEth = useCallback(
    (inputAmount: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      setCalculationError(null);

      if (!inputAmount || !isValidAmount(inputAmount, "sell")) {
        setEstimatedEthOut("0");
        setIsCalculating(false);
        return;
      }

      if (!isValidForCalculation(inputAmount)) {
        setCalculationError("Amount has too many decimal places");
        setEstimatedEthOut("0");
        setIsCalculating(false);
        return;
      }

      if (inputAmount === lastCalculationRef.current) return;

      setIsCalculating(true);
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          lastCalculationRef.current = inputAmount;
          const result = await calculateEthForTokens(inputAmount);
          setEstimatedEthOut(result);
          setCalculationError(null);
        } catch (error) {
          console.error("Calculation error:", error);
          setEstimatedEthOut("0");
          setCalculationError("Failed to calculate ETH amount");
        } finally {
          setIsCalculating(false);
        }
      }, 500);
    },
    [calculateEthForTokens, isValidAmount]
  );

  // Effects
  useEffect(() => {
    debouncedCalculateEth(amount);
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [amount, debouncedCalculateEth]);

  useEffect(() => onAmountChange?.(amount), [amount, onAmountChange]);

  // Clear errors on new transaction
  useEffect(() => {
    if (isSellPending) {
      setTransactionError(null);
    }
  }, [isSellPending]);

  // Unified error handling
  useEffect(() => {
    const error = sellError || receiptError;
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
  }, [sellError, receiptError, toast, reset]);

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
    if (sellReceipt?.status === "success") {
      const txHash = sellReceipt.transactionHash;
      if (lastSuccessfulTxRef.current !== txHash) {
        lastSuccessfulTxRef.current = txHash;
        setTransactionError(null);
        toast({
          title: "Sale Successful!",
          description: `Successfully sold ${amount} ${
            token?.symbol || "tokens"
          }`,
        });
        setAmount("");
        setEstimatedEthOut("0");
      }
    } else if (sellReceipt?.status === "reverted") {
      setTransactionError("Transaction was reverted");
      toast({
        title: "Transaction Reverted",
        description: "The transaction was reverted by the contract.",
        variant: "destructive",
      });
    }
  }, [sellReceipt, amount, token?.symbol, toast]);

  // Event handlers
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

    setTransactionError(null);
    reset();

    try {
      const amountWei = parseEther(amount);
      const minEthWei = parseEther(minEthOut);

      writeContract({
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
    const rawMaxAmount = getMaxSellAmount();
    const wholeTokenAmount = Math.floor(parseFloat(rawMaxAmount)).toString();
    setAmount(wholeTokenAmount);
  };

  const handleAmountChange = (value: string) => {
    // Only allow whole numbers
    const cleanValue = value.replace(/[^0-9]/g, "");
    const numValue = cleanValue ? parseInt(cleanValue, 10).toString() : "";

    setAmount(numValue);

    if (numValue !== amount) {
      setEstimatedEthOut("0");
      setCalculationError(null);
      setTransactionError(null);
    }
  };

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

  const isSubmitDisabled =
    isSellPending ||
    (isSellConfirming && !transactionError) ||
    !validation.valid ||
    !amount ||
    isCalculating ||
    calculationError !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="amount">Amount ({token.symbol})</Label>
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
            onChange={(e) => handleAmountChange(e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className={`text-center pr-16 ${
              !validation.valid && amount ? "border-destructive" : ""
            }`}
            step="1"
            min="1"
            placeholder="1"
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
        {!amount && (
          <p className="text-xs text-muted-foreground">
            Minimum: 1 token (whole numbers only)
          </p>
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

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
        {isSellPending
          ? "Submitting..."
          : isSellConfirming && !transactionError
          ? "Confirming..."
          : "Sell Tokens"}
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
      {isSellConfirming && !transactionError && (
        <div className="text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <div className="h-3 w-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
            Waiting for confirmation...
          </div>
        </div>
      )}

      {/* Success Receipt */}
      {sellReceipt?.status === "success" && sellData && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="font-semibold text-foreground mb-2">Sale Successful!</p>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Tokens Sold:</span>
              <span>
                {amount} {token.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Transaction:</span>
              <AddressComponent hash={sellData} type="tx" />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
