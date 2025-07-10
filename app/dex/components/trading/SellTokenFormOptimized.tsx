// app/dex/components/SellTokenFormOptimized.tsx - FIXED DEBOUNCING
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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

// Utility to safely truncate token amounts
function truncateTokenAmount(amount: string, maxDecimals: number = 6): string {
  try {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return "0";

    // Truncate to reasonable decimal places to prevent API issues
    return num.toFixed(maxDecimals);
  } catch (error) {
    console.error("Error truncating token amount:", error);
    return "0";
  }
}

// Utility to check if amount is valid for calculations
function isValidCalculationAmount(amount: string): boolean {
  if (!amount || amount === "0") return false;

  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return false;

  // Check for reasonable decimal places (max 18 but practically max 8-10)
  const parts = amount.split(".");
  if (parts.length > 1 && parts[1].length > 10) {
    return false; // Too many decimal places
  }

  return true;
}

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
  const [calculationError, setCalculationError] = useState<string | null>(null);

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

  // Debouncing refs
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCalculationRef = useRef<string>("");

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

  // 🚀 FIXED: Debounced calculation function
  const debouncedCalculateEth = useCallback(
    (inputAmount: string) => {
      // Clear any existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      // Clear previous states
      setCalculationError(null);

      // Quick validation checks
      if (!inputAmount || !isValidAmount(inputAmount, "sell")) {
        setEstimatedEthOut("0");
        setIsCalculating(false);
        return;
      }

      // Additional validation for calculation amount
      if (!isValidCalculationAmount(inputAmount)) {
        setCalculationError("Amount has too many decimal places");
        setEstimatedEthOut("0");
        setIsCalculating(false);
        return;
      }

      // Don't make API call if amount hasn't changed
      if (inputAmount === lastCalculationRef.current) {
        return;
      }

      // Set calculating state immediately for user feedback
      setIsCalculating(true);

      // Set up debounced calculation
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          lastCalculationRef.current = inputAmount;
          console.log(`🔄 Making API call for: ${inputAmount}`);

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
      }, 500); // 500ms delay - enough to prevent typing spam
    },
    [calculateEthForTokens, isValidAmount]
  );

  // Trigger calculation when amount changes
  useEffect(() => {
    debouncedCalculateEth(amount);

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [amount, debouncedCalculateEth]);

  // Check approval status
  useEffect(() => {
    if (amount && allowance !== undefined) {
      try {
        const amountWei = parseEther(amount);
        setNeedsApproval(amountWei > allowance);
      } catch (error) {
        console.error("Error checking approval:", error);
        setNeedsApproval(false);
      }
    }
  }, [amount, allowance]);

  // Notify parent of amount changes
  useEffect(() => {
    onAmountChange?.(amount);
  }, [amount, onAmountChange]);

  // Calculate slippage-protected minimum ETH with better number handling
  const minEthOut = useMemo(() => {
    if (!estimatedEthOut || estimatedEthOut === "0") return "0";

    try {
      const estimated = parseFloat(estimatedEthOut);
      if (isNaN(estimated) || estimated <= 0) return "0";

      const slippageMultiplier = (100 - parseFloat(slippageTolerance)) / 100;
      const minEth = estimated * slippageMultiplier;

      // Format to avoid precision issues
      return minEth.toFixed(6);
    } catch (error) {
      console.error("Error calculating min ETH:", error);
      return "0";
    }
  }, [estimatedEthOut, slippageTolerance]);

  // Input validation
  const validation = useMemo(() => {
    if (!amount) return { valid: true, message: "" };
    if (!data) return { valid: false, message: "Loading..." };

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { valid: false, message: "Enter a valid amount" };
    }

    const maxTokens = parseFloat(data.truncatedTokenBalance);
    if (amountNum > maxTokens) {
      return { valid: false, message: "Insufficient token balance" };
    }

    // Check for too many decimal places
    if (!isValidCalculationAmount(amount)) {
      return { valid: false, message: "Too many decimal places" };
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
      // Parse amounts with proper BigInt conversion
      let amountWei: bigint;
      let minEthWei: bigint;

      try {
        amountWei = parseEther(amount);

        // Handle minEthOut conversion safely
        const minEthFloat = parseFloat(minEthOut);
        if (isNaN(minEthFloat) || minEthFloat < 0) {
          throw new Error("Invalid minimum ETH calculation");
        }

        minEthWei = parseEther(minEthOut);
      } catch (conversionError) {
        console.error("BigInt conversion error:", conversionError);
        toast({
          title: "Calculation Error",
          description: "Failed to calculate minimum ETH. Please try again.",
          variant: "destructive",
        });
        return;
      }

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

  // FIXED: Properly truncate max amount
  const handleMaxClick = () => {
    const rawMaxAmount = getMaxSellAmount();
    console.log(`Max click: setting amount to ${rawMaxAmount}`);
    setAmount(rawMaxAmount);
  };

  // Handle input changes with truncation and immediate visual feedback
  const handleAmountChange = (value: string) => {
    // Allow user to type, but truncate if they paste something with too many decimals
    const parts = value.split(".");
    if (parts.length > 1 && parts[1].length > 10) {
      // Truncate to 10 decimal places max during typing
      const truncated = `${parts[0]}.${parts[1].slice(0, 10)}`;
      setAmount(truncated);
    } else {
      setAmount(value);
    }

    // Clear previous calculation immediately for better UX
    if (value !== amount) {
      setEstimatedEthOut("0");
      setCalculationError(null);
    }
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
              onChange={(e) => handleAmountChange(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              className={`text-center pr-16 ${
                !validation.valid && amount ? "border-destructive" : ""
              }`}
              step="0.000001"
              min="0"
              placeholder="0.000000"
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

        {/* Approval or Sell Button */}
        {needsApproval ? (
          <Button
            type="button"
            onClick={handleApprove}
            className="w-full"
            disabled={
              isApprovalPending ||
              !validation.valid ||
              !amount ||
              calculationError !== null
            }
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
              isCalculating ||
              calculationError !== null
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
