// pet/components/FeedingSection.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Utensils,
  ExternalLink,
  Info,
  Zap,
  Heart,
  ArrowRight,
  Copy,
  CheckCircle,
  Loader2,
  AlertCircle,
  Coins,
  Calculator,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useWriteContract, useReadContracts } from "wagmi";
import { parseUnits, formatUnits, type Address } from "viem";

// CHOW Token ABI (minimal required functions)
const CHOW_TOKEN_ABI = [
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
    inputs: [{ name: "amount", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Pet Contract ABI for health preview
const PET_CONTRACT_ABI = [
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "previewHealthGain",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// CHOW Token Address
const CHOW_TOKEN_ADDRESS: Address =
  "0xd701634Bd3572Dd34b8C303D2590a29691a333d3";

interface FeedingSectionProps {
  petName: string;
  petIsAlive: boolean;
  isConnected: boolean;
  isWritePending: boolean;
  contractAddress?: string;
}

export const FeedingSection: React.FC<FeedingSectionProps> = ({
  petName,
  petIsAlive,
  isConnected,
  isWritePending,
  contractAddress,
}) => {
  const { toast } = useToast();
  const { address } = useAccount();
  const { writeContract, isPending: isBurnPending } = useWriteContract();

  const [burnAmount, setBurnAmount] = useState("");
  const [copiedAddress, setCopiedAddress] = useState("");

  // Consolidate all token-related reads into a single call
  const tokenContracts = useMemo(() => {
    const contracts: any[] = [
      // CHOW token info
      {
        address: CHOW_TOKEN_ADDRESS,
        abi: CHOW_TOKEN_ABI,
        functionName: "name",
      },
      {
        address: CHOW_TOKEN_ADDRESS,
        abi: CHOW_TOKEN_ABI,
        functionName: "symbol",
      },
      {
        address: CHOW_TOKEN_ADDRESS,
        abi: CHOW_TOKEN_ABI,
        functionName: "decimals",
      },
    ];

    // Add user balance if connected
    if (address) {
      contracts.push({
        address: CHOW_TOKEN_ADDRESS,
        abi: CHOW_TOKEN_ABI,
        functionName: "balanceOf",
        args: [address],
      });
    }

    return contracts;
  }, [address]);

  // Single consolidated read for all token data
  const { data: tokenData } = useReadContracts({
    contracts: tokenContracts,
    query: {
      enabled: Boolean(address || !isConnected),
      refetchInterval: 30000, // 30 seconds
    },
  });

  // Process token data
  const processedTokenData = useMemo(() => {
    if (!tokenData) return null;

    const [nameResult, symbolResult, decimalsResult, balanceResult] = tokenData;

    return {
      name:
        nameResult.status === "success"
          ? String(nameResult.result)
          : "CHOW Token",
      symbol:
        symbolResult.status === "success"
          ? String(symbolResult.result)
          : "CHOW",
      decimals:
        decimalsResult.status === "success"
          ? Number(decimalsResult.result)
          : 18,
      balance:
        balanceResult?.status === "success"
          ? (balanceResult.result as bigint)
          : null,
    };
  }, [tokenData]);

  // Calculate burn amount in wei
  const burnAmountInWei = useMemo(() => {
    if (!burnAmount || !processedTokenData || isNaN(parseFloat(burnAmount))) {
      return BigInt(0);
    }
    return parseUnits(burnAmount, processedTokenData.decimals);
  }, [burnAmount, processedTokenData]);

  // Preview health gain for current burn amount
  const { data: healthGainPreview } = useReadContracts({
    contracts: [
      {
        address: contractAddress as Address,
        abi: PET_CONTRACT_ABI,
        functionName: "previewHealthGain",
        args: [burnAmountInWei] as const,
      },
    ],
    query: {
      enabled: Boolean(contractAddress && burnAmountInWei > 0),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  });

  const displayHealthGain = useMemo(() => {
    if (!healthGainPreview?.[0] || healthGainPreview[0].status !== "success") {
      return null;
    }
    return Number(healthGainPreview[0].result);
  }, [healthGainPreview]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(label);
      toast({
        title: "Address Copied!",
        description: `${label} address copied to clipboard`,
      });
      setTimeout(() => setCopiedAddress(""), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleBurnTokens = async () => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to feed the pet.",
        variant: "destructive",
      });
      return;
    }

    if (!petIsAlive) {
      toast({
        title: "Pet is Dead",
        description: "Please revive the pet before feeding.",
        variant: "destructive",
      });
      return;
    }

    if (!burnAmount || parseFloat(burnAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to burn.",
        variant: "destructive",
      });
      return;
    }

    if (!processedTokenData) {
      toast({
        title: "Token Data Loading",
        description: "Please wait for token data to load.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user has enough balance
      if (
        processedTokenData.balance &&
        burnAmountInWei > processedTokenData.balance
      ) {
        toast({
          title: "Insufficient Balance",
          description: `You don't have enough ${processedTokenData.symbol} tokens.`,
          variant: "destructive",
        });
        return;
      }

      await writeContract({
        address: CHOW_TOKEN_ADDRESS,
        abi: CHOW_TOKEN_ABI,
        functionName: "burn",
        args: [burnAmountInWei],
      });

      const healthGain = displayHealthGain ? displayHealthGain : "some";

      toast({
        title: "🍖 Feeding Transaction Sent!",
        description: `Burning ${burnAmount} ${processedTokenData.symbol} to give ${petName} +${healthGain} health!`,
      });

      setBurnAmount("");
    } catch (error: any) {
      console.error("Burn error:", error);
      toast({
        title: "Feeding Failed",
        description: error.message || "Failed to burn tokens and feed pet.",
        variant: "destructive",
      });
    }
  };

  const formatBalance = (
    balance: bigint | null,
    decimals: number = 18
  ): string => {
    if (!balance) return "0";
    return parseFloat(formatUnits(balance, decimals)).toFixed(2);
  };

  const handleQuickAmount = (percentage: number) => {
    if (processedTokenData?.balance) {
      const maxBalance = parseFloat(
        formatBalance(processedTokenData.balance, processedTokenData.decimals)
      );
      const amount = ((maxBalance * percentage) / 100).toFixed(2);
      setBurnAmount(amount);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pet Status Alert */}
      {!petIsAlive ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {petName} is currently dead and cannot be fed. Please revive the pet
            first!
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            {petName} is alive and ready to eat! Health gain depends on the
            amount of CHOW you burn.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Feeding Interface */}
      <Card className="unified-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            Feed with CHOW Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Info & Balance */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">
                  {processedTokenData?.name || "CHOW Token"}
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  {CHOW_TOKEN_ADDRESS.slice(0, 6)}...
                  {CHOW_TOKEN_ADDRESS.slice(-4)}
                  <Button
                    onClick={() => copyToClipboard(CHOW_TOKEN_ADDRESS, "CHOW")}
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2"
                  >
                    {copiedAddress === "CHOW" ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {isConnected && processedTokenData && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Your Balance
                </div>
                <div className="text-xl font-bold">
                  {formatBalance(
                    processedTokenData.balance,
                    processedTokenData.decimals
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {processedTokenData.symbol}
                </div>
              </div>
            )}
          </div>

          {/* Burn Amount Input */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-red-500" />
                Amount to Burn
              </label>
              <Input
                type="number"
                placeholder="0.0"
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
                className="themed-input"
                min="0"
                step="0.01"
              />
            </div>

            {/* Quick Amount Buttons */}
            {isConnected && processedTokenData?.balance && (
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(25)}
                  className="text-xs"
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(50)}
                  className="text-xs"
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(75)}
                  className="text-xs"
                >
                  75%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(100)}
                  className="text-xs"
                >
                  Max
                </Button>
              </div>
            )}

            {/* Health Gain Preview */}
            {burnAmount && displayHealthGain !== null && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-700 dark:text-green-300">
                      Health Gain Preview
                    </span>
                  </div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    +{displayHealthGain} HP
                  </div>
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                  for {burnAmount} {processedTokenData?.symbol || "CHOW"} tokens
                </div>
              </div>
            )}

            {/* Feed Button */}
            <Button
              onClick={handleBurnTokens}
              disabled={
                !isConnected ||
                !petIsAlive ||
                isBurnPending ||
                isWritePending ||
                !burnAmount ||
                parseFloat(burnAmount) <= 0
              }
              className="w-full themed-button feed-button"
              size="lg"
            >
              {isBurnPending || isWritePending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Burning Tokens...
                </>
              ) : (
                <>
                  <Utensils className="h-4 w-4 mr-2" />
                  Burn {burnAmount || "0"}{" "}
                  {processedTokenData?.symbol || "CHOW"}
                  {displayHealthGain !== null && burnAmount && (
                    <span className="ml-2">→ +{displayHealthGain} HP</span>
                  )}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            {!isConnected && (
              <p className="text-center text-sm text-muted-foreground">
                Connect your wallet to feed {petName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* How Feeding Works */}
        <Card className="unified-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              How Feeding Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Mechanics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">🔥 Token Burning</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• CHOW tokens are permanently destroyed</p>
                    <p>• Triggers automatic pet feeding notification</p>
                    <p>• Health gain scales with amount burned</p>
                    <p>• Total supply decreases with each burn</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">⚡ Health Calculation</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Scaled health gain from tokens</p>
                    <p>• Minimum 1 health point per feeding</p>
                    <p>• Maximum 50 health points per feeding</p>
                    <p>• Preview shows exact health gain</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded">
                  <div className="font-bold text-green-600 dark:text-green-400">
                    1-50
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Health/feed
                  </div>
                </div>
                <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded">
                  <div className="font-bold text-red-600 dark:text-red-400">
                    -1
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Health/hour
                  </div>
                </div>
                <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded">
                  <div className="font-bold text-blue-600 dark:text-blue-400">
                    100
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Max health
                  </div>
                </div>
                <div className="text-center p-3 bg-orange-100 dark:bg-orange-900/30 rounded">
                  <div className="font-bold text-orange-600 dark:text-orange-400">
                    0
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Death point
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Information */}
        <Card className="unified-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              Contract Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CHOW Token Contract */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">CHOW Token Contract</div>
                <Button
                  onClick={() => copyToClipboard(CHOW_TOKEN_ADDRESS, "CHOW")}
                  variant="outline"
                  size="sm"
                >
                  {copiedAddress === "CHOW" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-xs font-mono text-muted-foreground break-all mb-3">
                {CHOW_TOKEN_ADDRESS}
              </div>
              <Button
                onClick={() =>
                  window.open(
                    `https://testnet.snowtrace.io/address/${CHOW_TOKEN_ADDRESS}`,
                    "_blank"
                  )
                }
                variant="outline"
                size="sm"
                className="w-full"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View on Snowtrace
              </Button>
            </div>

            {/* Pet Contract */}
            {contractAddress && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Pet Contract</div>
                  <Button
                    onClick={() => copyToClipboard(contractAddress, "Pet")}
                    variant="outline"
                    size="sm"
                  >
                    {copiedAddress === "Pet" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="text-xs font-mono text-muted-foreground break-all mb-3">
                  {contractAddress}
                </div>
                <Button
                  onClick={() =>
                    window.open(
                      `https://testnet.snowtrace.io/address/${contractAddress}`,
                      "_blank"
                    )
                  }
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View on Snowtrace
                </Button>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground">
              All contracts are deployed on Avalanche Fuji Testnet
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
