// app/VanityNameManager/components/VanityNameRequest.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { formatEther, Address } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Crown,
  Flame,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  User,
  Coins,
  ArrowRight,
  Info,
  Loader2,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  VanityNameValidationError,
  VANITY_NAME_CONSTANTS,
  type VanityNameValidationResult,
} from "@/types/vanity";

interface VanityNameRequestProps {
  userAddress: string;
  currentName: string;
  onSuccess: () => void;
}

// Contract addresses
const VANITY_BURN_MANAGER_ADDRESS = process.env
  .NEXT_PUBLIC_VANITY_BURN_MANAGER_ADDRESS as Address;
const BURN_TOKEN_ADDRESS =
  "0xC3DF61f5387fE2E0e6521ffdad338b1bbf5e5f7c" as Address; // Hardcoded VAIN

// Updated ABIs for new contract
const VANITY_BURN_MANAGER_ABI = [
  {
    inputs: [{ name: "newName", type: "string" }],
    name: "setVanityName",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getCostPerNameChange",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "name", type: "string" }],
    name: "isNameAvailable",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserVanityName",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserBurnInfo",
    outputs: [
      { name: "totalBurned", type: "uint256" },
      { name: "totalSpent", type: "uint256" },
      { name: "availableBalance", type: "uint256" },
      { name: "possibleNameChanges", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "canUserSetName",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const BURN_TOKEN_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function VanityNameRequest({
  userAddress,
  currentName,
  onSuccess,
}: VanityNameRequestProps) {
  const { address } = useAccount();
  const { toast } = useToast();

  // Form state
  const [requestedName, setRequestedName] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<VanityNameValidationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contract reads
  const { data: nameCost } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "getCostPerNameChange",
  });

  const { data: tokenBalance } = useBalance({
    address: address,
    token: BURN_TOKEN_ADDRESS,
  });

  const { data: burnInfo } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "getUserBurnInfo",
    args: address ? [address] : undefined,
  });

  const { data: canSetName } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "canUserSetName",
    args: address ? [address] : undefined,
  });

  // Contract writes
  const {
    writeContract: writeBurn,
    data: burnTxHash,
    error: burnError,
    isPending: isBurnPending,
  } = useWriteContract();

  const {
    writeContract: writeSetName,
    data: setNameTxHash,
    error: setNameError,
    isPending: isSetNamePending,
  } = useWriteContract();

  // Transaction receipts
  const { isLoading: isWaitingForBurn, isSuccess: burnSuccess } =
    useWaitForTransactionReceipt({
      hash: burnTxHash,
    });

  const { isLoading: isWaitingForSetName, isSuccess: setNameSuccess } =
    useWaitForTransactionReceipt({
      hash: setNameTxHash,
    });

  // Parse burn info
  const totalBurned = burnInfo ? formatEther(burnInfo[0]) : "0";
  const totalSpent = burnInfo ? formatEther(burnInfo[1]) : "0";
  const availableBalance = burnInfo ? formatEther(burnInfo[2]) : "0";
  const possibleNameChanges = burnInfo ? Number(burnInfo[3]) : 0;

  // Client-side validation
  const validateVanityNameClient = useCallback(
    async (name: string): Promise<VanityNameValidationResult> => {
      // Length validation
      if (name.length < VANITY_NAME_CONSTANTS.MIN_LENGTH) {
        return {
          isValid: false,
          error: VanityNameValidationError.TOO_SHORT,
          message: `Name must be at least ${VANITY_NAME_CONSTANTS.MIN_LENGTH} characters long`,
        };
      }

      if (name.length > VANITY_NAME_CONSTANTS.MAX_LENGTH) {
        return {
          isValid: false,
          error: VanityNameValidationError.TOO_LONG,
          message: `Name must be no more than ${VANITY_NAME_CONSTANTS.MAX_LENGTH} characters long`,
        };
      }

      // Character validation
      if (!VANITY_NAME_CONSTANTS.ALLOWED_CHARACTERS.test(name)) {
        return {
          isValid: false,
          error: VanityNameValidationError.INVALID_CHARACTERS,
          message: "Name can only contain letters, numbers, and underscores",
        };
      }

      // Reserved names
      if (
        VANITY_NAME_CONSTANTS.RESERVED_NAMES.includes(name.toLowerCase() as any)
      ) {
        return {
          isValid: false,
          error: VanityNameValidationError.RESERVED,
          message: "This name is reserved and cannot be used",
        };
      }

      return { isValid: true };
    },
    []
  );

  // Contract-side validation
  const validateVanityNameContract = useCallback(
    async (name: string): Promise<VanityNameValidationResult> => {
      try {
        // Check availability via API
        const response = await fetch("/api/vanity-name/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        const data = await response.json();

        if (!data.available) {
          return {
            isValid: false,
            error: data.reason || VanityNameValidationError.ALREADY_TAKEN,
            message:
              data.reason === VanityNameValidationError.ALREADY_TAKEN
                ? "This name is already taken"
                : "This name is not available",
          };
        }

        return { isValid: true };
      } catch (error) {
        return {
          isValid: false,
          error: VanityNameValidationError.INVALID_CHARACTERS,
          message: "Unable to check availability. Please try again.",
        };
      }
    },
    []
  );

  // Validation effect
  useEffect(() => {
    const validateName = async () => {
      if (!requestedName.trim()) {
        setValidationResult(null);
        return;
      }

      setIsValidating(true);

      try {
        // Client-side validation
        const result = await validateVanityNameClient(requestedName);
        setValidationResult(result);

        // Contract-side validation if client-side passes
        if (result.isValid) {
          const contractResult = await validateVanityNameContract(
            requestedName
          );
          setValidationResult(contractResult);
        }
      } catch (error) {
        console.error("Validation error:", error);
        setValidationResult({
          isValid: false,
          error: VanityNameValidationError.INVALID_CHARACTERS,
          message: "Unable to validate name. Please try again.",
        });
      } finally {
        setIsValidating(false);
      }
    };

    const timeoutId = setTimeout(validateName, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [requestedName, validateVanityNameClient, validateVanityNameContract]);

  // Handle transaction success
  useEffect(() => {
    if (burnSuccess) {
      toast({
        title: "Tokens Burned! 🔥",
        description:
          "Your burn balance has been updated. You can now set names!",
      });
    }
  }, [burnSuccess, toast]);

  useEffect(() => {
    if (setNameSuccess) {
      toast({
        title: "Name Set! 🎉",
        description: `Your vanity name "${requestedName}" is now active!`,
      });

      // Reset form
      setRequestedName("");
      setValidationResult(null);
      setIsSubmitting(false);

      // Notify parent
      onSuccess();
    }
  }, [setNameSuccess, toast, onSuccess, requestedName]);

  // Handle errors
  useEffect(() => {
    if (burnError) {
      toast({
        title: "Burn Failed",
        description: burnError.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }, [burnError, toast]);

  useEffect(() => {
    if (setNameError) {
      toast({
        title: "Name Setting Failed",
        description: setNameError.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }, [setNameError, toast]);

  // Handle burn tokens
  const handleBurnTokens = async (amount: bigint) => {
    if (!address || !tokenBalance) return;

    if (amount > tokenBalance.value) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${formatEther(amount)} VAIN tokens.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await writeBurn({
        address: BURN_TOKEN_ADDRESS,
        abi: BURN_TOKEN_ABI,
        functionName: "burn",
        args: [amount],
      });

      toast({
        title: "🔥 Burning Tokens...",
        description: `Burning ${formatEther(
          amount
        )} VAIN tokens to earn name changes!`,
      });
    } catch (error: any) {
      console.error("Burn failed:", error);
      toast({
        title: "Burn Failed",
        description:
          error.message || "Failed to burn tokens. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Handle set vanity name
  const handleSetVanityName = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validationResult?.isValid || !address || !canSetName) return;

    setIsSubmitting(true);

    try {
      await writeSetName({
        address: VANITY_BURN_MANAGER_ADDRESS,
        abi: VANITY_BURN_MANAGER_ABI,
        functionName: "setVanityName",
        args: [requestedName.trim()],
      });

      toast({
        title: "🎭 Setting Name...",
        description: `Setting your vanity name to "${requestedName}"!`,
      });
    } catch (error: any) {
      console.error("Set name failed:", error);
      toast({
        title: "Name Setting Failed",
        description:
          error.message || "Failed to set vanity name. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const getValidationIcon = () => {
    if (isValidating)
      return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
    if (!validationResult) return null;
    return validationResult.isValid ? (
      <CheckCircle className="h-4 w-4 text-green-400" />
    ) : (
      <XCircle className="h-4 w-4 text-red-400" />
    );
  };

  const getValidationColor = () => {
    if (isValidating) return "border-blue-400/50";
    if (!validationResult) return "border-border";
    return validationResult.isValid
      ? "border-green-400/50"
      : "border-red-400/50";
  };

  const getProcessingStatus = () => {
    if (isBurnPending || isWaitingForBurn) {
      return "Burning tokens...";
    }
    if (isSetNamePending || isWaitingForSetName) {
      return "Setting name...";
    }
    if (isSubmitting) {
      return "Preparing...";
    }
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card className="unified-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-primary" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Current Name
              </Label>
              <div className="flex items-center gap-2">
                {currentName ? (
                  <>
                    <User className="h-4 w-4 text-green-400" />
                    <span className="font-medium text-foreground">
                      {currentName}
                    </span>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      No vanity name set
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Available Name Changes
              </Label>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">
                  {possibleNameChanges}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Burn Balance */}
      <Card className="unified-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Flame className="h-5 w-5 text-primary" />
            Burn Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Coins className="h-4 w-4 text-blue-400" />
                <Label className="text-sm text-muted-foreground">
                  Total Burned
                </Label>
              </div>
              <div className="text-xl font-bold text-foreground">
                {parseFloat(totalBurned).toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Crown className="h-4 w-4 text-orange-400" />
                <Label className="text-sm text-muted-foreground">
                  Total Spent
                </Label>
              </div>
              <div className="text-xl font-bold text-foreground">
                {parseFloat(totalSpent).toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Zap className="h-4 w-4 text-green-400" />
                <Label className="text-sm text-muted-foreground">
                  Available
                </Label>
              </div>
              <div className="text-xl font-bold text-green-400">
                {parseFloat(availableBalance).toLocaleString()}
              </div>
            </div>
          </div>

          {possibleNameChanges === 0 && (
            <Alert className="border-orange-400/20 bg-orange-500/5">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-300">
                You need to burn {nameCost ? formatEther(nameCost) : "1000"}{" "}
                VAIN tokens to set a vanity name.
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => nameCost && handleBurnTokens(nameCost)}
                    disabled={!tokenBalance || nameCost! > tokenBalance.value}
                  >
                    <Flame className="h-3 w-3 mr-1" />
                    Burn {nameCost ? formatEther(nameCost) : "1000"} VAIN
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => nameCost && handleBurnTokens(nameCost * 5n)}
                    disabled={
                      !tokenBalance || nameCost! * 5n > tokenBalance.value
                    }
                  >
                    <Flame className="h-3 w-3 mr-1" />
                    Burn {nameCost ? formatEther(nameCost * 5n) : "5000"} VAIN
                    (5 names)
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Name Setting Form */}
      {possibleNameChanges > 0 && (
        <Card className="unified-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              Set Vanity Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetVanityName} className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="vanityName">Vanity Name</Label>
                <div className="relative">
                  <Input
                    id="vanityName"
                    type="text"
                    value={requestedName}
                    onChange={(e) => setRequestedName(e.target.value)}
                    placeholder="Enter your desired name"
                    className={`pr-10 ${getValidationColor()}`}
                    minLength={VANITY_NAME_CONSTANTS.MIN_LENGTH}
                    maxLength={VANITY_NAME_CONSTANTS.MAX_LENGTH}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {getValidationIcon()}
                  </div>
                </div>

                {/* Validation Messages */}
                <AnimatePresence>
                  {validationResult && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Alert
                        variant={
                          validationResult.isValid ? "default" : "destructive"
                        }
                      >
                        <div className="flex items-center gap-2">
                          {validationResult.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                          <AlertDescription>
                            {validationResult.message ||
                              (validationResult.isValid
                                ? "Name is available!"
                                : "Name is not available")}
                          </AlertDescription>
                        </div>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Separator />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={
                  !validationResult?.isValid ||
                  !canSetName ||
                  isSubmitting ||
                  isBurnPending ||
                  isWaitingForBurn ||
                  isSetNamePending ||
                  isWaitingForSetName ||
                  !requestedName.trim()
                }
                className="w-full h-12 text-lg font-semibold"
              >
                {isSubmitting || isSetNamePending || isWaitingForSetName ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{getProcessingStatus()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    <span>Set Name "{requestedName}"</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  This will use 1 of your {possibleNameChanges} available name
                  changes
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="unified-card border-blue-400/20 bg-blue-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-400">How it works</h3>
              <div className="text-sm text-blue-300 space-y-1">
                <p>
                  <strong>Step 1:</strong> Burn VAIN tokens to earn name changes
                </p>
                <p>
                  <strong>Step 2:</strong> Use your burn balance to set vanity
                  names
                </p>
                <p>
                  <strong>Step 3:</strong> No approvals needed - direct burns
                  only!
                </p>
                <p className="mt-2 text-xs text-blue-400">
                  💡 <strong>Tip:</strong> Burn extra tokens to save for future
                  name changes!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
