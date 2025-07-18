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

// VanityNameBurnManager ABI (only functions we need)
const VANITY_BURN_MANAGER_ABI = [
  {
    inputs: [
      { name: "newName", type: "string" },
      { name: "tokenAddress", type: "address" },
      { name: "burnAmount", type: "uint256" },
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
] as const;

// BurnToken ABI (only functions we need)
const BURN_TOKEN_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
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
  const [needsApproval, setNeedsApproval] = useState(false);

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

  const { data: allowance } = useReadContract({
    address: selectedToken.address,
    abi: BURN_TOKEN_ABI,
    functionName: "allowance",
    args:
      address && VANITY_BURN_MANAGER_ADDRESS
        ? [address, VANITY_BURN_MANAGER_ADDRESS]
        : undefined,
  });

  // Contract writes
  const {
    writeContract: writeApprove,
    data: approveTxHash,
    error: approveError,
  } = useWriteContract();

  const {
    writeContract: writeRequest,
    data: requestTxHash,
    error: requestError,
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
  useEffect(() => {
    if (burnCost && allowance !== undefined) {
      setNeedsApproval(allowance < burnCost);
    }
  }, [burnCost, allowance]);

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
    if (approveSuccess) {
      toast({
        title: "Approval Successful! ✅",
        description: "You can now request your vanity name.",
      });
      setNeedsApproval(false);
    }
  }, [approveSuccess, toast]);

  useEffect(() => {
    if (requestSuccess) {
      toast({
        title: "Request Submitted! 🎉",
        description:
          "Your vanity name request has been submitted and is being processed.",
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

  // Handle approval
  const handleApprove = async () => {
    if (!burnCost || !address) return;

    setIsSubmitting(true);

    try {
      await writeApprove({
        address: selectedToken.address,
        abi: BURN_TOKEN_ABI,
        functionName: "approve",
        args: [VANITY_BURN_MANAGER_ADDRESS, burnCost],
      });
    } catch (error) {
      console.error("Approval failed:", error);
      setIsSubmitting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validationResult?.isValid || !address || !burnCost) return;

    if (needsApproval) {
      await handleApprove();
      return;
    }

    setIsSubmitting(true);

    try {
      // Check token balance
      const currentBalance = tokenBalance?.value || 0n;

      if (currentBalance < burnCost) {
        toast({
          title: "Insufficient Balance",
          description: `You need ${formatEther(
            burnCost
          )} VAIN to request this name.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Call contract function
      await writeRequest({
        address: VANITY_BURN_MANAGER_ADDRESS,
        abi: VANITY_BURN_MANAGER_ABI,
        functionName: "requestVanityName",
        args: [requestedName, selectedToken.address, burnCost],
      });
    } catch (error) {
      console.error("Contract call failed:", error);
      toast({
        title: "Request Failed",
        description: "Unable to submit vanity name request. Please try again.",
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

  const getButtonText = () => {
    if (isSubmitting || isWaitingForApprove || isWaitingForRequest) {
      if (isWaitingForApprove) return "Confirming Approval...";
      if (isWaitingForRequest) return "Confirming Request...";
      return needsApproval ? "Approving Tokens..." : "Submitting Request...";
    }

    if (needsApproval) {
      return "Approve Tokens";
    }

    return "Request Vanity Name";
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
                Pending Requests
              </Label>
              <div className="flex items-center gap-2">
                {pendingRequests.length > 0 ? (
                  <>
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium text-foreground">
                      {pendingRequests.length} pending
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

          {/* Pending Requests List */}
          {pendingRequests.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Pending Requests
              </Label>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request.requestId}
                    className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <div>
                        <p className="font-medium text-foreground">
                          {request.newName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested{" "}
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
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
      <Card className="unified-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            Request New Name
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label>Burn Token Information</Label>
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

                {/* Token Balance */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-3">
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

                {/* Burn Cost */}
                <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-400">
                      Required to Burn
                    </span>
                  </div>
                  <span className="font-medium text-red-400">
                    {burnCost ? formatEther(burnCost) : "Loading..."} VAIN
                  </span>
                </div>
              </div>

              {/* Approval Status */}
              {needsApproval && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You need to approve the burn manager to spend your tokens
                    before requesting a name.
                  </AlertDescription>
                </Alert>
              )}

              <div className="p-4 bg-red-500/10 border border-red-400/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">
                    Important
                  </span>
                </div>
                <p className="text-sm text-red-300">
                  These tokens will be permanently burned and cannot be
                  recovered. Make sure you have enough balance before
                  proceeding.
                </p>
              </div>
            </div>

            <Separator />

            {/* Submit Button */}
            <div className="space-y-4">
              <Button
                type="submit"
                disabled={
                  !validationResult?.isValid ||
                  isSubmitting ||
                  isWaitingForApprove ||
                  isWaitingForRequest ||
                  !requestedName.trim() ||
                  pendingRequests.length > 0 ||
                  !burnCost
                }
                className="w-full h-12 text-lg font-semibold"
              >
                {isSubmitting || isWaitingForApprove || isWaitingForRequest ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{getButtonText()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {needsApproval ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Approve Tokens</span>
                      </>
                    ) : (
                      <>
                        <Flame className="h-5 w-5" />
                        <span>Burn Tokens & Request Name</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </div>
                )}
              </Button>

              {/* Disabled Reason */}
              {pendingRequests.length > 0 && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    You cannot request a new name while you have pending
                    requests.
                  </p>
                </div>
              )}
            </div>
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
                <p>1. Choose a unique vanity name following our requirements</p>
                <p>2. Approve the burn manager to spend your tokens</p>
                <p>
                  3. Submit your request - tokens will be burned automatically
                </p>
                <p>4. Your request will be processed and approved if valid</p>
                <p>
                  5. Once confirmed, your new name will be active across the
                  platform
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
