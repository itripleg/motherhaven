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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Crown,
  Flame,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  User,
  Coins,
  ArrowRight,
  RefreshCw,
  Info,
  Loader2,
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

// Contract addresses - these should come from environment variables
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

// VanityNameBurnManager ABI (updated functions)
const VANITY_BURN_MANAGER_ABI = [
  {
    inputs: [
      { name: "newName", type: "string" },
      { name: "tokenAddress", type: "address" },
    ],
    name: "requestVanityName",
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
    name: "getUserPendingRequest",
    outputs: [
      { name: "requestId", type: "uint256" },
      { name: "requestedName", type: "string" },
      { name: "burnAmount", type: "uint256" },
      { name: "token", type: "address" },
      { name: "timestamp", type: "uint256" },
      { name: "hasPending", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// BurnToken ABI (only burn function needed)
const BURN_TOKEN_ABI = [
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
  const [step, setStep] = useState<"request" | "burn">("request");

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

  const { data: pendingRequestData } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "getUserPendingRequest",
    args: address ? [address] : undefined,
  });

  // Contract writes
  const {
    writeContract: writeRequest,
    data: requestTxHash,
    error: requestError,
  } = useWriteContract();

  const {
    writeContract: writeBurn,
    data: burnTxHash,
    error: burnError,
  } = useWriteContract();

  // Transaction receipts
  const { isLoading: isWaitingForRequest, isSuccess: requestSuccess } =
    useWaitForTransactionReceipt({
      hash: requestTxHash,
    });

  const { isLoading: isWaitingForBurn, isSuccess: burnSuccess } =
    useWaitForTransactionReceipt({
      hash: burnTxHash,
    });

  // Check if user has a pending request (from contract state)
  const hasPendingRequest = pendingRequestData && pendingRequestData[5]; // hasPending boolean

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

        // Server-side validation if client-side passes
        if (result.isValid) {
          const serverResult = await validateVanityNameServer(requestedName);
          setValidationResult(serverResult);
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
  }, [requestedName]);

  // Handle transaction success
  useEffect(() => {
    if (requestSuccess) {
      toast({
        title: "Request Created! ✅",
        description: "Now burn tokens to activate your vanity name request.",
      });
      setStep("burn");
      setIsSubmitting(false);
    }
  }, [requestSuccess, toast]);

  useEffect(() => {
    if (burnSuccess) {
      toast({
        title: "Tokens Burned! 🔥",
        description: "Your vanity name request is being processed.",
      });

      // Reset form
      setRequestedName("");
      setValidationResult(null);
      setIsSubmitting(false);
      setStep("request");

      // Notify parent
      onSuccess();
    }
  }, [burnSuccess, toast, onSuccess]);

  // Handle errors
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

  // Server-side validation
  const validateVanityNameServer = useCallback(
    async (name: string): Promise<VanityNameValidationResult> => {
      try {
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

  // Handle request submission (Step 1)
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validationResult?.isValid || !address || !burnCost) return;

    setIsSubmitting(true);

    try {
      // Call requestVanityName - this creates a pending request
      await writeRequest({
        address: VANITY_BURN_MANAGER_ADDRESS,
        abi: VANITY_BURN_MANAGER_ABI,
        functionName: "requestVanityName",
        args: [requestedName, selectedToken.address],
      });
    } catch (error) {
      console.error("Request failed:", error);
      toast({
        title: "Request Failed",
        description: "Unable to create vanity name request. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // Handle burn submission (Step 2)
  const handleBurn = async () => {
    if (!burnCost || !address) return;

    setIsSubmitting(true);

    try {
      // Check token balance
      const currentBalance = tokenBalance?.value || 0n;

      if (currentBalance < burnCost) {
        toast({
          title: "Insufficient Balance",
          description: `You need ${formatEther(
            burnCost
          )} VAIN to complete this request.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Call burn directly on the token
      await writeBurn({
        address: selectedToken.address,
        abi: BURN_TOKEN_ABI,
        functionName: "burn",
        args: [burnCost],
      });
    } catch (error) {
      console.error("Burn failed:", error);
      toast({
        title: "Burn Failed",
        description: "Unable to burn tokens. Please try again.",
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

  const getPendingRequestInfo = () => {
    if (!pendingRequestData || !pendingRequestData[5]) return null;

    return {
      requestId: Number(pendingRequestData[0]),
      requestedName: pendingRequestData[1],
      burnAmount: pendingRequestData[2],
      token: pendingRequestData[3],
      timestamp: Number(pendingRequestData[4]),
    };
  };

  const pendingInfo = getPendingRequestInfo();

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
                Pending Requests
              </Label>
              <div className="flex items-center gap-2">
                {pendingRequests.length > 0 || hasPendingRequest ? (
                  <>
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium text-foreground">
                      {pendingRequests.length + (hasPendingRequest ? 1 : 0)}{" "}
                      pending
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-muted-foreground">
                      No pending requests
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Pending Request Alert */}
          {pendingInfo && (
            <Alert className="border-yellow-400/30 bg-yellow-500/10">
              <Clock className="h-4 w-4 text-yellow-400" />
              <AlertDescription>
                <div className="font-medium text-yellow-400 mb-1">
                  Pending Request: "{pendingInfo.requestedName}"
                </div>
                <div className="text-sm text-muted-foreground">
                  You need to burn {formatEther(pendingInfo.burnAmount)} VAIN
                  tokens to activate this request.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Completed Pending Requests List */}
          {pendingRequests.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Processing Requests
              </Label>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request.requestId}
                    className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="font-medium text-foreground">
                          {request.newName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Processing since{" "}
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                      Processing
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Form */}
      {pendingInfo ? (
        /* Step 2: Burn Tokens */
        <Card className="unified-card border-orange-400/20 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-orange-400" />
              Step 2: Burn Tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your request for "<strong>{pendingInfo.requestedName}</strong>"
                is ready. Burn {formatEther(pendingInfo.burnAmount)} VAIN tokens
                to activate it.
              </AlertDescription>
            </Alert>

            {/* Token Balance */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Your Balance
                  </span>
                </div>
                <span className="font-medium text-foreground">
                  {tokenBalance ? formatEther(tokenBalance.value) : "0"} VAIN
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-400">Will Burn</span>
                </div>
                <span className="font-medium text-red-400">
                  {formatEther(pendingInfo.burnAmount)} VAIN
                </span>
              </div>
            </div>

            <Button
              onClick={handleBurn}
              disabled={
                isSubmitting ||
                isWaitingForBurn ||
                !tokenBalance ||
                tokenBalance.value < BigInt(pendingInfo.burnAmount)
              }
              className="w-full h-12 text-lg font-semibold"
            >
              {isSubmitting || isWaitingForBurn ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Burning Tokens...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  <span>Burn {formatEther(pendingInfo.burnAmount)} VAIN</span>
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Step 1: Request Name */
        <Card className="unified-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              Step 1: Request New Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequest} className="space-y-6">
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
                        {tokenBalance ? formatEther(tokenBalance.value) : "0"}{" "}
                        VAIN
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Required Cost:
                      </span>
                      <span className="font-medium text-foreground">
                        {burnCost ? formatEther(burnCost) : "Loading..."} VAIN
                      </span>
                    </div>
                  </div>
                </div>

                <Alert className="border-blue-400/20 bg-blue-500/5">
                  <Info className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-300">
                    <strong>Two-Step Process:</strong> First create your
                    request, then burn tokens to activate it. No approval needed
                    - you burn tokens directly!
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
                  isWaitingForRequest ||
                  !requestedName.trim() ||
                  !burnCost ||
                  hasPendingRequest
                }
                className="w-full h-12 text-lg font-semibold"
              >
                {isSubmitting || isWaitingForRequest ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating Request...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Create Vanity Name Request</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>

              {/* Disabled Reason */}
              {hasPendingRequest && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    You already have a pending request. Complete it by burning
                    tokens first.
                  </p>
                </div>
              )}
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
                  <strong>Step 1:</strong> Create a vanity name request with
                  your desired name
                </p>
                <p>
                  <strong>Step 2:</strong> Burn the required VAIN tokens to
                  activate the request
                </p>
                <p>
                  <strong>Step 3:</strong> Your request will be processed
                  automatically if valid
                </p>
                <p>
                  <strong>Step 4:</strong> Your new name will be active across
                  the platform
                </p>
                <p className="mt-2 text-xs text-blue-400">
                  💡 <strong>No approval needed!</strong> You burn tokens
                  directly - much simpler than traditional ERC20 transfers.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
