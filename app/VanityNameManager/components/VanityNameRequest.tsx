// app/VanityNameManager/components/VanityNameRequest.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { formatEther, Address, parseEther } from "viem";
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
  RefreshCw,
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

// Contract addresses - these should be set in your environment
const VANITY_BURN_MANAGER_ADDRESS = (process.env
  .NEXT_PUBLIC_VANITY_BURN_MANAGER_ADDRESS ||
  "0x915f7D77daf5214A1d1dB42312388eFA8E663915") as Address;
const VAIN_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_BURN_TOKEN_ADDRESS ||
  "0xYourVAINTokenAddressHere") as Address;

// CORRECTED Contract ABIs - Updated to match your actual contract
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
    name: "costPerNameChange",
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
    name: "userBurnBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "userSpentBalance",
    outputs: [{ name: "", type: "uint256" }],
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
    name: "getUserVanityName",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBurnToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const VAIN_TOKEN_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
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
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
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

  // Read VAIN token balance with real-time updates
  const {
    data: vainBalance,
    error: vainBalanceError,
    isLoading: isVainBalanceLoading,
    refetch: refetchVainBalance,
  } = useReadContract({
    address: VAIN_TOKEN_ADDRESS,
    abi: VAIN_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!VAIN_TOKEN_ADDRESS,
      refetchInterval: 3000,
    },
  });

  const { data: vainSymbol } = useReadContract({
    address: VAIN_TOKEN_ADDRESS,
    abi: VAIN_TOKEN_ABI,
    functionName: "symbol",
    query: {
      enabled: !!VAIN_TOKEN_ADDRESS,
    },
  });

  // Read burn manager data with real-time updates
  const { data: nameCost } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "costPerNameChange",
    query: {
      enabled: !!VANITY_BURN_MANAGER_ADDRESS,
    },
  });

  const {
    data: burnInfo,
    error: burnInfoError,
    refetch: refetchBurnInfo,
  } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "getUserBurnInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!VANITY_BURN_MANAGER_ADDRESS,
      refetchInterval: 3000,
    },
  });

  const { data: canSetName, refetch: refetchCanSetName } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "canUserSetName",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!VANITY_BURN_MANAGER_ADDRESS,
      refetchInterval: 3000,
    },
  });

  // Check contract vanity name to stay in sync
  const { data: contractVanityName, refetch: refetchContractName } =
    useReadContract({
      address: VANITY_BURN_MANAGER_ADDRESS,
      abi: VANITY_BURN_MANAGER_ABI,
      functionName: "getUserVanityName",
      args: address ? [address] : undefined,
      query: {
        enabled: !!address && !!VANITY_BURN_MANAGER_ADDRESS,
        refetchInterval: 3000,
      },
    });

  // Check name availability on contract
  const { data: nameAvailable } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "isNameAvailable",
    args: requestedName.trim() ? [requestedName.trim()] : undefined,
    query: {
      enabled: !!requestedName.trim() && !!VANITY_BURN_MANAGER_ADDRESS,
    },
  });

  const { data: burnToken } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "getBurnToken",
    query: {
      enabled: !!VANITY_BURN_MANAGER_ADDRESS,
    },
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

  // Calculate balances from burnInfo
  const formattedVainBalance = vainBalance ? formatEther(vainBalance) : "0";
  const totalBurned = burnInfo?.[0] ? formatEther(burnInfo[0]) : "0";
  const totalSpent = burnInfo?.[1] ? formatEther(burnInfo[1]) : "0";
  const availableBalance = burnInfo?.[2] ? formatEther(burnInfo[2]) : "0";
  const possibleNameChanges = burnInfo?.[3] ? Number(burnInfo[3]) : 0;

  // Get the current name from contract or prop (contract takes precedence)
  const displayCurrentName = contractVanityName || currentName || "";

  // Auto-refetch data when transactions complete
  useEffect(() => {
    if (burnSuccess) {
      refetchVainBalance();
      refetchBurnInfo();
      refetchCanSetName();
      toast({
        title: "Tokens Burned! 🔥",
        description:
          "Your burn balance has been updated. You can now set names!",
      });
    }
  }, [
    burnSuccess,
    refetchVainBalance,
    refetchBurnInfo,
    refetchCanSetName,
    toast,
  ]);

  useEffect(() => {
    if (setNameSuccess) {
      refetchBurnInfo();
      refetchCanSetName();
      refetchContractName();

      if (requestedName && requestedName.trim()) {
        toast({
          title: "Name Set! 🎉",
          description: `Your vanity name "${requestedName}" is now active!`,
        });
      }

      setRequestedName("");
      setValidationResult(null);
      setIsSubmitting(false);
      onSuccess();
    }
  }, [
    setNameSuccess,
    toast,
    onSuccess,
    requestedName,
    refetchBurnInfo,
    refetchCanSetName,
    refetchContractName,
  ]);

  // Client-side validation
  const validateVanityNameClient = useCallback(
    (name: string): VanityNameValidationResult => {
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

      if (!VANITY_NAME_CONSTANTS.ALLOWED_CHARACTERS.test(name)) {
        return {
          isValid: false,
          error: VanityNameValidationError.INVALID_CHARACTERS,
          message: "Name can only contain letters, numbers, and underscores",
        };
      }

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

  // Validation effect with contract call
  useEffect(() => {
    const validateName = async () => {
      if (!requestedName.trim()) {
        setValidationResult(null);
        return;
      }

      setIsValidating(true);

      // Client-side validation first
      const clientResult = validateVanityNameClient(requestedName);
      if (!clientResult.isValid) {
        setValidationResult(clientResult);
        setIsValidating(false);
        return;
      }

      // Check availability via contract
      if (nameAvailable === false) {
        setValidationResult({
          isValid: false,
          error: VanityNameValidationError.ALREADY_TAKEN,
          message: "This name is already taken",
        });
      } else if (nameAvailable === true) {
        setValidationResult({
          isValid: true,
          message: "Name is available!",
        });
      } else {
        setValidationResult({
          isValid: true,
          message: "Checking availability...",
        });
      }

      setIsValidating(false);
    };

    const timeoutId = setTimeout(validateName, 500);
    return () => clearTimeout(timeoutId);
  }, [requestedName, validateVanityNameClient, nameAvailable]);

  // Handle errors - reset submitting state on error
  useEffect(() => {
    if (burnError) {
      console.error("Burn error:", burnError);
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
      console.error("Set name error:", setNameError);
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
    if (!address || !vainBalance) {
      toast({
        title: "No Balance Data",
        description: "Unable to read your VAIN balance. Please try refreshing.",
        variant: "destructive",
      });
      return;
    }

    if (amount > vainBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${formatEther(
          amount
        )} VAIN but only have ${formattedVainBalance}.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await writeBurn({
        address: VAIN_TOKEN_ADDRESS,
        abi: VAIN_TOKEN_ABI,
        functionName: "burn",
        args: [amount],
      });

      toast({
        title: "🔥 Burning Tokens...",
        description: `Burning ${formatEther(amount)} VAIN tokens!`,
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

    if (!validationResult?.isValid || !address || !canSetName) {
      toast({
        title: "Cannot Set Name",
        description:
          validationResult?.message ||
          "Invalid name or insufficient burn balance",
        variant: "destructive",
      });
      return;
    }

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
    if (isValidating) return "border-blue-400/50 focus:border-blue-400";
    if (!validationResult) return "";
    return validationResult.isValid
      ? "border-green-400/50 focus:border-green-400"
      : "border-red-400/50 focus:border-red-400";
  };

  const getProcessingStatus = () => {
    if (isBurnPending) {
      return "Confirming burn...";
    }
    if (isWaitingForBurn) {
      return "Burning tokens...";
    }
    if (isSetNamePending) {
      return "Confirming name...";
    }
    if (isWaitingForSetName) {
      return "Setting name...";
    }
    if (isSubmitting) {
      return "Preparing...";
    }
    return "";
  };

  const isProcessing =
    isSubmitting ||
    isBurnPending ||
    isWaitingForBurn ||
    isSetNamePending ||
    isWaitingForSetName;

  // Show connection requirement
  if (!address) {
    return (
      <Card className="unified-card border-primary/20">
        <CardContent className="p-12 text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Wallet Required
          </h3>
          <p className="text-muted-foreground">
            Please connect your wallet to manage vanity names.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (!VANITY_BURN_MANAGER_ADDRESS || !VAIN_TOKEN_ADDRESS) {
    return (
      <Card className="unified-card border-yellow-400/20 bg-yellow-500/5">
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">
            Configuration Required
          </h3>
          <p className="text-yellow-300">
            Contract addresses are not configured. Please check your environment
            variables.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card className="unified-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-primary" />
            Current Status
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                refetchVainBalance();
                refetchBurnInfo();
                refetchCanSetName();
                refetchContractName();
              }}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Current Name
              </Label>
              <div className="flex items-center gap-2">
                {displayCurrentName ? (
                  <>
                    <User className="h-4 w-4 text-green-400" />
                    <span className="font-medium text-foreground">
                      {displayCurrentName}
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

      {/* VAIN Token Balance */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Coins className="h-5 w-5 text-primary" />
            VAIN Token Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Coins className="h-4 w-4 text-blue-400" />
                <Label className="text-sm text-muted-foreground">
                  Wallet Balance
                </Label>
              </div>
              <div className="text-xl font-bold text-foreground">
                {isVainBalanceLoading ? (
                  <div className="flex items-center gap-2 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : vainBalanceError ? (
                  <div className="text-red-400 text-sm">
                    Error loading balance
                  </div>
                ) : (
                  `${parseFloat(formattedVainBalance).toLocaleString()} ${
                    vainSymbol || "VAIN"
                  }`
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" />
                <Label className="text-sm text-muted-foreground">
                  Burn Cost per Name
                </Label>
              </div>
              <div className="text-xl font-bold text-foreground">
                {nameCost ? formatEther(nameCost) : "1000"}{" "}
                {vainSymbol || "VAIN"}
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
            {burnInfoError && (
              <Badge variant="destructive" className="ml-2">
                Error
              </Badge>
            )}
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
                    disabled={
                      !vainBalance ||
                      (nameCost && nameCost > vainBalance) ||
                      isSubmitting
                    }
                  >
                    <Flame className="h-3 w-3 mr-1" />
                    Burn {nameCost ? formatEther(nameCost) : "1000"} VAIN
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => nameCost && handleBurnTokens(nameCost * 5n)}
                    disabled={
                      !vainBalance ||
                      (nameCost && nameCost * 5n > vainBalance) ||
                      isSubmitting
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
                    placeholder="Enter your desired name (3-32 characters)"
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
                  isProcessing ||
                  !requestedName.trim()
                }
                className="w-full h-12 text-lg font-semibold"
              >
                {isProcessing ? (
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

      {/* How it works */}
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
