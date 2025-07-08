// pet/components/FeedingSection.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Utensils,
  Wallet,
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
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { parseUnits, formatUnits, type Address } from "viem";
import { FeedingSectionProps } from "../types";

// CHOW Token ABI (ERC20 + burn function)
const CHOW_TOKEN_ABI = [
  // ERC20 functions
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
  // Burn function
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// CHOW Token Address
const CHOW_TOKEN_ADDRESS: Address =
  "0xd701634Bd3572Dd34b8C303D2590a29691a333d3";

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

  // Read CHOW token data
  const { data: chowBalance } = useReadContract({
    address: CHOW_TOKEN_ADDRESS,
    abi: CHOW_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: chowName } = useReadContract({
    address: CHOW_TOKEN_ADDRESS,
    abi: CHOW_TOKEN_ABI,
    functionName: "name",
  });

  const { data: chowSymbol } = useReadContract({
    address: CHOW_TOKEN_ADDRESS,
    abi: CHOW_TOKEN_ABI,
    functionName: "symbol",
  });

  const { data: chowDecimals } = useReadContract({
    address: CHOW_TOKEN_ADDRESS,
    abi: CHOW_TOKEN_ABI,
    functionName: "decimals",
  });

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

    try {
      const decimals = chowDecimals || 18;
      const amountInWei = parseUnits(burnAmount, decimals);

      // Check if user has enough balance
      if (chowBalance && amountInWei > chowBalance) {
        toast({
          title: "Insufficient Balance",
          description: `You don't have enough ${chowSymbol || "CHOW"} tokens.`,
          variant: "destructive",
        });
        return;
      }

      await writeContract({
        address: CHOW_TOKEN_ADDRESS,
        abi: CHOW_TOKEN_ABI,
        functionName: "burn",
        args: [amountInWei],
      });

      toast({
        title: "🍖 Feeding Transaction Sent!",
        description: `Burning ${burnAmount} ${
          chowSymbol || "CHOW"
        } to feed ${petName}!`,
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
    balance: bigint | undefined,
    decimals: number = 18
  ): string => {
    if (!balance) return "0";
    return parseFloat(formatUnits(balance, decimals)).toFixed(2);
  };

  const handleQuickAmount = (percentage: number) => {
    if (chowBalance && chowDecimals) {
      const maxBalance = parseFloat(formatBalance(chowBalance, chowDecimals));
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
            in the Status tab first!
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            {petName} is alive and ready to eat! Each feeding increases health
            by 10 points.
          </AlertDescription>
        </Alert>
      )}

      {/* CHOW Token Feeding Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-green-500" />
            Feed with CHOW Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Information */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-lg border">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Coins className="h-5 w-5 text-orange-500" />
                {chowName || "CHOW Token"}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Symbol: {chowSymbol || "CHOW"}</span>
                <span>•</span>
                <span className="font-mono">
                  {CHOW_TOKEN_ADDRESS.slice(0, 6)}...
                  {CHOW_TOKEN_ADDRESS.slice(-4)}
                </span>
                <Button
                  onClick={() => copyToClipboard(CHOW_TOKEN_ADDRESS, "CHOW")}
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                >
                  {copiedAddress === "CHOW" ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {isConnected && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Your Balance
                </div>
                <div className="text-xl font-bold">
                  {formatBalance(chowBalance, chowDecimals)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {chowSymbol || "CHOW"}
                </div>
              </div>
            )}
          </div>

          {/* Burn Amount Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Amount to Burn (gives +10 health to {petName})
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  className="flex-1"
                  min="0"
                  step="0.01"
                />
                <Button
                  variant="outline"
                  onClick={() => handleQuickAmount(100)}
                  disabled={!chowBalance || !isConnected}
                  className="px-3"
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            {isConnected && chowBalance && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(25)}
                  className="flex-1"
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(50)}
                  className="flex-1"
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(75)}
                  className="flex-1"
                >
                  75%
                </Button>
              </div>
            )}

            {/* Feeding Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                <Heart className="h-3 w-3 text-red-500" />
                <span>+10 Health</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                <Zap className="h-3 w-3 text-purple-500" />
                <span>Instant Effect</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span>Helps Community</span>
              </div>
            </div>
          </div>

          {/* Feed Button */}
          <Button
            onClick={handleBurnTokens}
            disabled={
              !isConnected ||
              !petIsAlive ||
              isBurnPending ||
              !burnAmount ||
              parseFloat(burnAmount) <= 0
            }
            className="w-full feed-button"
            size="lg"
          >
            {isBurnPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Burning Tokens...
              </>
            ) : (
              <>
                <Utensils className="h-4 w-4 mr-2" />
                Burn {burnAmount || "0"} {chowSymbol || "CHOW"} to Feed{" "}
                {petName}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          {!isConnected && (
            <p className="text-center text-sm text-muted-foreground">
              Connect your wallet to feed {petName}
            </p>
          )}
        </CardContent>
      </Card>

      {/* How Feeding Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            How Feeding Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">🔥 Token Burning Process</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• CHOW tokens are permanently destroyed when burned</p>
                <p>• Burn triggers automatic pet feeding notification</p>
                <p>• Pet health increases by +10 points immediately</p>
                <p>• Total supply of CHOW decreases with each burn</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">⚡ Instant Benefits</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Health boost happens on-chain automatically</p>
                <p>• No waiting period or delays</p>
                <p>• Visible in pet status within seconds</p>
                <p>• Contributes to community statistics</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">📊 Health Mechanics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded">
                <div className="font-bold text-green-600 dark:text-green-400">
                  +10
                </div>
                <div className="text-muted-foreground">Health per feed</div>
              </div>
              <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded">
                <div className="font-bold text-red-600 dark:text-red-400">
                  -1
                </div>
                <div className="text-muted-foreground">Health per hour</div>
              </div>
              <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded">
                <div className="font-bold text-blue-600 dark:text-blue-400">
                  100
                </div>
                <div className="text-muted-foreground">Maximum health</div>
              </div>
              <div className="text-center p-3 bg-orange-100 dark:bg-orange-900/30 rounded">
                <div className="font-bold text-orange-600 dark:text-orange-400">
                  0
                </div>
                <div className="text-muted-foreground">Death threshold</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-purple-500" />
            Contract Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="text-center text-sm text-muted-foreground">
            All contracts are deployed on Avalanche Fuji Testnet
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
