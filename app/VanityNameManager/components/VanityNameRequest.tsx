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
import { parseUnits, formatEther, Address } from "viem";
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
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  VanityRequestStatus,
  VanityNameValidationError,
  VANITY_NAME_CONSTANTS,
  type VanityRequestDocument,
  type VanityNameValidationResult,
} from "@/types/vanity";

interface VanityNameRequestProps {
  userAddress: string;
  currentName: string;
  pendingRequests: VanityRequestDocument[];
  onSuccess: () => void;
}

// Contract addresses
const VANITY_BURN_MANAGER_ADDRESS = process.env
  .NEXT_PUBLIC_VANITY_BURN_MANAGER_ADDRESS as Address;
const BURN_TOKEN_ADDRESS = process.env
  .NEXT_PUBLIC_BURN_TOKEN_ADDRESS as Address;

// Supported tokens for vanity name requests
const SUPPORTED_TOKENS = [
  {
    address: BURN_TOKEN_ADDRESS,
    symbol: "VAIN",
    name: "Vanity Token",
    decimals: 18,
    icon: "🎭",
  },
];

// VanityNameBurnManager ABI - Atomic version
const VANITY_BURN_MANAGER_ABI = [
  {
    inputs: [
      { name: "newName", type: "string" },
      { name: "tokenAddress", type: "address" },
      { name: "burnAmount", type: "uint256" },
    ],
    name: "requestVanityNameWithBurn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getBurnCost",
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
] as const;

// BurnToken ABI - Just for balance and approval
const BURN_TOKEN_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
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

export function VanityNameRequest({
  userAddress,
  currentName,
  pendingRequests,
  onSuccess,
}: VanityNameRequestProps) {
  const { address } = useAccount();
  const { toast } = useToast();

  // Form state
  const [requestedName, setRequestedName] = useState("");
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<VanityNameValidationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contract reads
  const { data: burnCost } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "getBurnCost",
  });

  const { data: tokenBalance } = useBalance({
    address: address,
    token: selectedToken.address,
  });

  // Check current allowance
  const { data: currentAllowance } = useReadContract({
    address: selectedToken.address,
    abi: BURN_TOKEN_ABI,
    functionName: "allowance",
    args: address && VANITY_BURN_MANAGER_ADDRESS ? [address, VANITY_BURN_MANAGER_ADDRESS] : undefined,
  });

  // Contract writes
  const {
    writeContract: writeApprove,
    data: approveTxHash,
    error: approveError,
    isPending: isApprovePending,
  } = useWriteContract();

  const {
    writeContract: writeRequest,
    data: requestTxHash,
    error: requestError,
    isPending: isRequestPending,
  } = useWriteContract();

  // Transaction receipts
  const { isLoading: isWaitingForApprove, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveTxHash,
    });

  const { isLoading: isWaitingForRequest, isSuccess: requestSuccess } =
    useWaitForTransactionReceipt({
      hash: requestTxHash,
    });

  // Check if approval is needed
  const needsApproval = burnCost && currentAllowance ? currentAllowance < burnCost : true;

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
          const contractResult = await validateVanityNameContract(requestedName);
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
    if (approveSuccess) {
      toast({
        title: "Approval Complete! ✅",
        description: "Now processing your vanity name request...",
      });
    }
  }, [approveSuccess, toast]);

  useEffect(() => {
    if (requestSuccess) {
      toast({
        title: "Request Completed! 🎉",
        description: "Your vanity name has been processed and is now active!",
      });

      // Reset form
      setRequestedName("");
      setValidationResult(null);
      setIsSubmitting(false);

      // Notify parent
      onSuccess();
    }
  }, [requestSuccess, toast, onSuccess]);

  // Handle errors
  useEffect(() => {
    if (approveError) {
      toast({
        title: "Approval Failed",
        description: approveError.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }, [approveError, toast]);

  useEffect(() => {
    if (requestError) {
      toast({
        title: "Request Failed",
        description: requestError.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }, [requestError, toast]);

  // Auto-proceed after approval
  useEffect(() => {
    const proceedAfterApproval = async () => {
      if (!approveSuccess || !burnCost || isRequestPending || isWaitingForRequest) return;

      try {
        console.log("🎭 Proceeding with vanity name request after approval...");
        
        await writeRequest({
          address: VANITY_BURN_MANAGER_ADDRESS,
          abi: VANITY_BURN_MANAGER_ABI,
          functionName: "requestVanityNameWithBurn",
          args: [requestedName.trim(), selectedToken.address, burnCost],
        });

        toast({
          title: "🔥 Processing Request...",
          description: `Burning ${formatEther(burnCost)} ${selectedToken.symbol} for "${requestedName}"!`,
        });
      } catch (error: any) {
        console.error("Request after approval failed:", error);
        toast({
          title: "Request Failed",
          description: error.message || "Failed to process request after approval.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    };

    proceedAfterApproval();
  }, [approveSuccess, burnCost, requestedName, selectedToken.address, selectedToken.symbol, writeRequest, toast, isRequestPending, isWaitingForRequest]);

  // Handle the complete request process
  const handleRequestVanityName = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validationResult?.isValid || !address || !burnCost) return;

    // Check if user has enough balance
    if (tokenBalance && burnCost > tokenBalance.value) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${formatEther(burnCost)} ${selectedToken.symbol} tokens.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("🎭 Starting atomic vanity name request:", {
        name: requestedName,
        burnCost: formatEther(burnCost),
        needsApproval,
        address,
      });

      if (needsApproval) {
        // Step 1: Approve tokens
        console.log("✅ Approving tokens...");
        await writeApprove({
          address: selectedToken.address,
          abi: BURN_TOKEN_ABI,
          functionName: "approve",
          args: [VANITY_BURN_MANAGER_ADDRESS, burnCost],
        });

        toast({
          title: "🔓 Approving Tokens...",
          description: `Approving ${formatEther(burnCost)} ${selectedToken.symbol} for vanity name request.`,
        });

        // The rest will be handled by the approval success effect
      } else {
        // Step 2: Direct request (already approved)
        console.log("🎭 Tokens already approved, proceeding with request...");
        await writeRequest({
          address: VANITY_BURN_MANAGER_ADDRESS,
          abi: VANITY_BURN_MANAGER_ABI,
          functionName: "requestVanityNameWithBurn",
          args: [requestedName.trim(), selectedToken.address, burnCost],
        });

        toast({
          title: "🔥 Processing Request...",
          description: `Burning ${formatEther(burnCost)} ${selectedToken.symbol} for "${requestedName}"!`,
        });
      }
    } catch (error: any) {
      console.error("Request failed:", error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to start vanity name request. Please try again.",
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

  const formatBalance = (
    balance: bigint | null,
    decimals: number = 18
  ): string => {
    if (!balance) return "0";
    return parseFloat(formatEther(balance)).toFixed(2);
  };

  const getProcessingStatus = () => {
    if (isApprovePending || isWaitingForApprove) {
      return "Approving tokens...";
    }
    if (isRequestPending || isWaitingForRequest) {
      return "Processing request...";
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
                Token Approval
              </Label>
              <div className="flex items-center gap-2">
                {!needsApproval ? (
                  <>
                    <Shield className="h-4 w-4 text-green-400" />
                    <span className="font-medium text-green-400">
                      Approved
                    </span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 text-yellow-400" />
                    <span className="text-muted-foreground">
                      Approval needed
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Form */}
      <Card className="unified-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            Request New Vanity Name
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestVanityName} className="space-y-6">
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

              {/* Name Requirements */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Requirements:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>
                    {VANITY_NAME_CONSTANTS.MIN_LENGTH}-
                    {VANITY_NAME_CONSTANTS.MAX_LENGTH} characters long
                  </li>
                  <li>Letters, numbers, and underscores only</li>
                  <li>Must be unique across all users</li>
                  <li>Cannot be a reserved name</li>
                </ul>
              </div>
            </div>

            <Separator />

            {/* Token Information */}
            <div className="space-y-4">
              <Label>Cost Information</Label>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{selectedToken.icon}</div>
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedToken.symbol}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedToken.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Current Balance:
                    </span>
                    <span className="font-medium text-foreground">
                      {tokenBalance ? formatBalance(tokenBalance.value) : "0"}{" "}
                      {selectedToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Required Cost:
                    </span>
                    <span className="font-medium text-foreground">
                      {burnCost ? formatEther(burnCost) : "Loading..."} {selectedToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Approval Status:
                    </span>
                    <span className={`font-medium ${needsApproval ? 'text-yellow-500' : 'text-green-500'}`}>
                      {needsApproval ? 'Approval needed' : 'Ready to burn'}
                    </span>
                  </div>
                </div>
              </div>

              <Alert className="border-blue-400/20 bg-blue-500/5">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  <strong>Atomic Transaction:</strong> We check availability and burn tokens in one secure transaction. No wasted burns on taken names!
                </AlertDescription>
              </Alert>
            </div>

            <Separator />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={
                !validationResult?.isValid ||
                isSubmitting ||
                isApprovePending ||
                isWaitingForApprove ||
                isRequestPending ||
                isWaitingForRequest ||
                !requestedName.trim() ||
                !burnCost ||
                !tokenBalance ||
                burnCost > tokenBalance.value
              }
              className="w-full h-12 text-lg font-semibold"
            >
              {isSubmitting || isApprovePending || isWaitingForApprove || isRequestPending || isWaitingForRequest ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{getProcessingStatus()}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  <span>
                    {needsApproval ? &quot;Approve &amp; &quot; : &quot;&quot;}Request &quot;{requestedName}&quot; for {burnCost ? formatEther(burnCost) : "..."} {selectedToken.symbol}
                  </span>
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>

            {/* Balance Warning */}
            {tokenBalance && burnCost && burnCost > tokenBalance.value && (
              <div className="text-center">
                <p className="text-sm text-destructive">
                  Insufficient balance. You need {formatEther(burnCost)} {selectedToken.symbol} but only have {formatBalance(tokenBalance.value)}.
                </p>
              </div>
            )}

            {/* Two-step process info */}
            {needsApproval && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  This will require two transactions: approval and then the vanity name request.
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="unified-card border-blue-400/20 bg-blue-500/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-400">How it works</h3>
              <div className="text-sm text-blue-300 space-y-1">
                <p>
                  <strong>Step 1:</strong> Enter your desired name and validate availability
                </p>
                <p>
                  <strong>Step 2:</strong> {needsApproval ? 'Approve tokens for the contract' : 'Skip approval (already approved)'}
                </p>
                <p>
                  <strong>Step 3:</strong> Contract checks availability and burns tokens atomically
                </p>
                <p>
                  <strong>Step 4:</strong> Your new name is processed and activated immediately
                </p>
                <p className="mt-2 text-xs text-blue-400">
                  💡 <strong>Bulletproof process!</strong> Name availability is checked right before burning - no wasted tokens!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VanityNameRequest;