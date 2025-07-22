// pet/components/FeedingSection.tsx
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Utensils,
  ExternalLink,
  Zap,
  Heart,
  ArrowRight,
  Copy,
  CheckCircle,
  Loader2,
  AlertCircle,
  Coins,
  Calculator,
  Info,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  const { data: tokenData } = useReadContracts({
    contracts: tokenContracts,
    query: {
      enabled: Boolean(address || !isConnected),
      refetchInterval: 30000,
    },
  });

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

  const burnAmountInWei = useMemo(() => {
    if (!burnAmount || !processedTokenData || isNaN(parseFloat(burnAmount))) {
      return BigInt(0);
    }
    return parseUnits(burnAmount, processedTokenData.decimals);
  }, [burnAmount, processedTokenData]);

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
    <div className="space-y-8">
      {/* Hero Section - Asymmetric Layout */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
          {/* Left: Pet Status & Title */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-6 mb-6">
              <div className="text-8xl">🍖</div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-2">
                  Feed {petName}
                </h1>
                <p className="text-xl text-muted-foreground">
                  Burn CHOW tokens to restore health
                </p>
              </div>
            </div>
            
            {/* Status Alert - Integrated into hero */}
            {!petIsAlive ? (
              <Alert variant="destructive" className="border-2">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-base">
                  ⚠️ {petName} is dead and cannot be fed. Please revive first!
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-2 border-primary/30 bg-primary/5">
                <Zap className="h-5 w-5" />
                <AlertDescription className="text-base">
                  ✨ {petName} is ready to eat! Health scales with CHOW burned.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right: Balance Card - Floating */}
          {isConnected && processedTokenData && (
            <div className="lg:col-span-2">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl border-2 border-primary/30 backdrop-blur-sm"
              >
                <div className="text-center">
                  <Coins className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Your Balance
                  </div>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {formatBalance(
                      processedTokenData.balance,
                      processedTokenData.decimals
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {processedTokenData.symbol}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Feeding Interface + Contract Info - Side by Side */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <Card className="unified-card overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 p-1">
            <CardContent className="bg-background rounded-lg p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left: Feeding Interface */}
                <div className="space-y-6">
                  <div className="text-center">
                    <Flame className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                    <h3 className="text-2xl font-bold mb-2">Burn CHOW</h3>
                    <p className="text-muted-foreground">
                      Enter amount to burn for {petName}
                    </p>
                  </div>

                  {/* Amount Input - Rounded */}
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={burnAmount}
                      onChange={(e) => setBurnAmount(e.target.value)}
                      className="text-2xl h-16 text-center rounded-full border-2 bg-muted/30"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Quick Buttons - Pill shaped */}
                  {isConnected && processedTokenData?.balance && (
                    <div className="flex gap-2 justify-center flex-wrap">
                      {[25, 50, 75, 100].map((percent) => (
                        <Button
                          key={percent}
                          variant="outline"
                          onClick={() => handleQuickAmount(percent)}
                          className="rounded-full px-6 h-10 text-sm font-medium"
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Health Preview - Floating bubble */}
                  {burnAmount && displayHealthGain !== null && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative"
                    >
                      <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30">
                        <div className="text-center">
                          <Calculator className="h-6 w-6 text-green-500 mx-auto mb-2" />
                          <div className="text-3xl font-bold text-green-500 mb-1">
                            +{displayHealthGain} HP
                          </div>
                          <div className="text-green-600 dark:text-green-400 text-sm">
                            for {burnAmount} {processedTokenData?.symbol}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Feed Button - Rounded */}
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
                    className="w-full h-14 text-lg rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0"
                    size="lg"
                  >
                    {isBurnPending || isWritePending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Burning...
                      </>
                    ) : (
                      <>
                        <Utensils className="h-5 w-5 mr-2" />
                        Burn {burnAmount || "0"} {processedTokenData?.symbol || "CHOW"}
                        {displayHealthGain !== null && burnAmount && (
                          <>
                            <ArrowRight className="h-4 w-4 mx-2" />
                            +{displayHealthGain} HP
                          </>
                        )}
                      </>
                    )}
                  </Button>

                  {!isConnected && (
                    <p className="text-center text-muted-foreground">
                      Connect your wallet to feed {petName}
                    </p>
                  )}
                </div>

                {/* Right: Contract Info */}
                <div className="space-y-6">
                  <div className="text-center">
                    <Coins className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="text-2xl font-bold mb-2">CHOW Token</h3>
                    <p className="text-muted-foreground">
                      Contract details and links
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-2xl border">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          Contract Address
                        </div>
                        <code className="text-xs text-muted-foreground break-all block">
                          {CHOW_TOKEN_ADDRESS}
                        </code>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        onClick={() => copyToClipboard(CHOW_TOKEN_ADDRESS, "CHOW")}
                        variant="outline"
                        className="w-full rounded-full"
                      >
                        {copiedAddress === "CHOW" ? (
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        Copy Address
                      </Button>
                      <Button
                        onClick={() =>
                          window.open(
                            `https://testnet.snowtrace.io/address/${CHOW_TOKEN_ADDRESS}`,
                            "_blank"
                          )
                        }
                        variant="outline"
                        className="w-full rounded-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Snowtrace
                      </Button>
                    </div>

                    <div className="text-center p-4 bg-primary/5 rounded-2xl border border-primary/20">
                      <div className="text-sm text-primary font-medium mb-1">
                        🔗 Avalanche Fuji Testnet
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Deployed and verified on-chain
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* How It Works - Balanced 2x2 Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="space-y-6"
      >
        <div className="text-center">
          <Info className="h-8 w-8 text-primary mx-auto mb-3" />
          <h2 className="text-3xl font-bold mb-2">How Feeding Works</h2>
          <p className="text-muted-foreground text-lg">
            Simple mechanics for pet care
          </p>
        </div>

        {/* Balanced 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Token Burning */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-3xl border border-red-500/20"
          >
            <div className="text-4xl mb-4">🔥</div>
            <h3 className="text-xl font-bold mb-3">Token Burning</h3>
            <div className="space-y-2 text-sm">
              <p>• CHOW tokens are permanently destroyed</p>
              <p>• Total supply decreases with each feeding</p>
              <p>• More burned = more health gained (1-50 HP)</p>
            </div>
          </motion.div>

          {/* Health System */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl border border-green-500/20"
          >
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-3">Health System</h3>
            <div className="space-y-2 text-sm">
              <p>• Pet health ranges from 0 to 100 HP</p>
              <p>• Health decreases by 1 point every hour</p>
              <p>• Pet dies at 0 HP and needs revival</p>
            </div>
          </motion.div>

          {/* Community Care */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl border border-blue-500/20"
          >
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold mb-3">Community Care</h3>
            <div className="space-y-2 text-sm">
              <p>• Everyone shares responsibility for the pet</p>
              <p>• Your contributions help the whole community</p>
              <p>• Keep our digital companion alive together!</p>
            </div>
          </motion.div>

          {/* Revival System */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl border border-purple-500/20"
          >
            <div className="text-4xl mb-4">💀</div>
            <h3 className="text-xl font-bold mb-3">Revival System</h3>
            <div className="space-y-2 text-sm">
              <p>• Anyone can revive a dead pet with AVAX</p>
              <p>• Revival cost doubles with each death</p>
              <p>• Reviver becomes the new pet caretaker</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};