"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddressComponent } from "@/components/AddressComponent";
import { BuyTokenForm } from "./BuyTokenForm";
import { SellTokenForm } from "./SellTokenForm";
import {
  Token,
  TokenState,
  getTimeUntilAutoResume,
  formatTimeUntilResume,
  isAutoResumeReady,
} from "@/types";
import { useConnect, useBalance, useAccount } from "wagmi";
import { tokenEventEmitter } from "@/components/EventWatcher";
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice";
import { useFactoryContract } from "@/final-hooks/useFactoryContract";
import { SlippageTolerance } from "./SlippageTolerance";
import {
  getPriceImpactColor,
  getPriceImpactWarning,
} from "@/utils/priceImpactCalculator";
import { Address, parseEther, formatEther } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  Settings,
  ExternalLink,
  Zap,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Crown,
  Sparkles,
  BarChart3,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Play,
} from "lucide-react";

interface TokenTradeCardProps {
  address: string;
  tokenData: Token;
  isConnected: boolean;
}

interface TradeEstimation {
  priceImpact: number;
  slippage: number;
}

export function TokenTradeCard({
  address,
  tokenData,
  isConnected: isConnectedProp,
}: TokenTradeCardProps) {
  const { connect, connectors } = useConnect();
  const { address: userAddress, isConnected } = useAccount();

  // Get live price data and contract calculation functions
  const { formatted: currentPrice, isLoading: priceLoading } =
    useUnifiedTokenPrice(tokenData?.address as Address);

  const {
    useCalculateTokens,
    useCalculateBuyPrice,
    useCalculateSellPrice,
    useTokenState,
  } = useFactoryContract();

  // Get current token state from contract
  const { state: contractState } = useTokenState(tokenData?.address as Address);

  const effectivelyConnected = isConnected || isConnectedProp;

  // State
  const [tradeEstimation, setTradeEstimation] = useState<TradeEstimation>({
    priceImpact: 0,
    slippage: 0.5, // Default to 0.5%
  });

  // State for trade calculations
  const [currentAmount, setCurrentAmount] = useState("0");
  const [currentTradeType, setCurrentTradeType] = useState<"buy" | "sell">(
    "buy"
  );
  const [shouldRefresh, setShouldRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState("buy");
  const [autoResumeCountdown, setAutoResumeCountdown] = useState<string>("");

  // Auto-resume countdown timer
  useEffect(() => {
    if (
      tokenData?.goalReachedTimestamp &&
      tokenData?.currentState === TokenState.GOAL_REACHED
    ) {
      const updateCountdown = () => {
        const timeRemaining = getTimeUntilAutoResume(
          tokenData.goalReachedTimestamp
        );
        if (timeRemaining > 0) {
          setAutoResumeCountdown(
            formatTimeUntilResume(tokenData.goalReachedTimestamp)
          );
        } else {
          setAutoResumeCountdown("Ready to resume");
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

      return () => clearInterval(interval);
    }
  }, [tokenData?.goalReachedTimestamp, tokenData?.currentState]);

  // Get contract calculations for current trade
  const { tokenAmount: calculatedTokens, isLoading: buyCalculationLoading } =
    useCalculateTokens(
      tokenData?.address as Address,
      currentTradeType === "buy" && currentAmount !== "0"
        ? currentAmount
        : undefined
    );

  const { ethAmount: calculatedBuyPrice, isLoading: buyPriceLoading } =
    useCalculateBuyPrice(
      tokenData?.address as Address,
      currentTradeType === "buy" && currentAmount !== "0"
        ? currentAmount
        : undefined
    );

  const { ethAmount: calculatedEth, isLoading: sellCalculationLoading } =
    useCalculateSellPrice(
      tokenData?.address as Address,
      currentTradeType === "sell" && currentAmount !== "0"
        ? currentAmount
        : undefined
    );

  // AVAX Balance
  const { data: avaxBalance, refetch: refetchAvaxBalance } = useBalance({
    address: userAddress,
  });

  // Token Balance
  const { data: tokenBalance, refetch: refetchTokenBalance } = useBalance({
    address: userAddress,
    token: tokenData?.address as `0x${string}`,
  });

  // Calculate price impact using actual contract functions
  const calculateRealPriceImpact = useCallback(
    (amount: string, isBuy: boolean): number => {
      if (!amount || amount === "0" || !tokenData || !currentPrice) return 0;

      try {
        const tradeAmount = parseFloat(amount);
        if (isNaN(tradeAmount) || tradeAmount <= 0) return 0;

        const currentPriceNum = parseFloat(currentPrice);
        if (currentPriceNum === 0) return 0;

        if (isBuy) {
          // For buys: compare contract calculation vs simple multiplication
          if (!calculatedTokens) return 0;

          const tokensFromContract = parseFloat(formatEther(calculatedTokens));
          const expectedTokens = tradeAmount / currentPriceNum; // ETH amount / current price = expected tokens

          if (expectedTokens === 0) return 0;

          const priceImpact =
            ((expectedTokens - tokensFromContract) / expectedTokens) * 100;
          return Math.max(0, Math.min(50, priceImpact)); // Cap at 50%
        } else {
          // For sells: compare contract calculation vs simple multiplication
          if (!calculatedEth) return 0;

          const ethFromContract = parseFloat(formatEther(calculatedEth));
          const expectedEth = tradeAmount * currentPriceNum; // Token amount * current price = expected ETH

          if (expectedEth === 0) return 0;

          const priceImpact =
            ((expectedEth - ethFromContract) / expectedEth) * 100;
          return Math.max(0, Math.min(50, priceImpact)); // Cap at 50%
        }
      } catch (error) {
        console.error("Error calculating real price impact:", error);
        return 0;
      }
    },
    [tokenData, currentPrice, calculatedTokens, calculatedEth]
  );

  useEffect(() => {
    if (!tokenData?.address) return;

    const handleTokenEvent = (event: any) => {
      if (
        event.eventName === "TokensPurchased" ||
        event.eventName === "TokensSold" ||
        event.eventName === "TradingAutoResumed" ||
        event.eventName === "TradingResumed"
      ) {
        setShouldRefresh((prev) => prev + 1);
      }
    };

    tokenEventEmitter.addEventListener(
      tokenData.address.toLowerCase(),
      handleTokenEvent
    );

    return () => {
      tokenEventEmitter.removeEventListener(
        tokenData.address.toLowerCase(),
        handleTokenEvent
      );
    };
  }, [tokenData?.address]);

  useEffect(() => {
    if (shouldRefresh > 0) {
      refetchAvaxBalance();
      refetchTokenBalance();
    }
  }, [shouldRefresh, refetchAvaxBalance, refetchTokenBalance]);

  useEffect(() => {
    if (currentAmount && currentAmount !== "0") {
      const impact = calculateRealPriceImpact(
        currentAmount,
        currentTradeType === "buy"
      );
      setTradeEstimation((prev) => ({
        ...prev,
        priceImpact: impact,
      }));
    }
  }, [currentAmount, currentTradeType, calculateRealPriceImpact]);

  const handleSlippageChange = (value: number) => {
    setTradeEstimation((prev) => ({
      ...prev,
      slippage: value,
    }));
  };

  const handleAmountChange = (amount: string, isBuy: boolean) => {
    setCurrentAmount(amount);
    setCurrentTradeType(isBuy ? "buy" : "sell");
    const impact = calculateRealPriceImpact(amount, isBuy);
    setTradeEstimation((prev) => ({
      ...prev,
      priceImpact: impact,
    }));
  };

  const formatNumber = (num: number | string, decimals: number = 2): string => {
    try {
      const value = typeof num === "string" ? parseFloat(num) : num;
      if (isNaN(value)) return "0.00";

      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    } catch (error) {
      console.error("Error formatting number:", error);
      return "0.00";
    }
  };

  const formatBalance = (
    balance: any,
    price: number = 0
  ): { amount: string; value: string } => {
    if (!balance?.formatted) return { amount: "0.00", value: "0.00" };
    try {
      const amount = formatNumber(balance.formatted);
      const value = formatNumber(parseFloat(balance.formatted) * price);
      return { amount, value };
    } catch (error) {
      console.error("Error formatting balance:", error);
      return { amount: "0.00", value: "0.00" };
    }
  };

  // Safe price parsing with fallbacks
  const safePrice = (() => {
    try {
      if (priceLoading) return 0;
      if (currentPrice && currentPrice !== "0.000000") {
        return parseFloat(currentPrice);
      }
      if (tokenData.lastPrice && tokenData.lastPrice !== "0") {
        return parseFloat(tokenData.lastPrice);
      }
      return 0;
    } catch {
      return 0;
    }
  })();

  const avaxFormatted = formatBalance(avaxBalance, 1);
  const tokenFormatted = formatBalance(tokenBalance, safePrice);

  // Use currentState instead of state, and check both database and contract state
  const effectiveState = contractState ?? tokenData?.currentState;

  const isGoalReached = effectiveState === TokenState.GOAL_REACHED;
  const isResumed = effectiveState === TokenState.RESUMED;
  const isHalted = effectiveState === TokenState.HALTED;
  const isTrading = effectiveState === TokenState.TRADING || isResumed;

  const renderGoalReachedState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center space-y-8 p-8"
    >
      <div className="space-y-6">
        {/* Success Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 blur-xl rounded-full" />
          <div className="relative p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-400/30 backdrop-blur-sm">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h3 className="text-3xl font-bold text-green-400 mb-3">
              Funding Goal Reached!
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
              This token has successfully reached its funding goal of{" "}
              <span className="font-semibold text-green-400">
                {formatNumber(tokenData.fundingGoal || "0")} AVAX
              </span>
              . Trading is temporarily halted.
            </p>

            {/* Auto-resume countdown */}
            {tokenData?.goalReachedTimestamp &&
              // @ts-expect-error type
              !isAutoResumeReady(tokenData.goalReachedTimestamp) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-400/30"
                >
                  <div className="flex items-center justify-center gap-2 text-blue-400">
                    <Clock className="h-5 w-5" />
                    <span className="font-semibold">
                      Auto-resume in: {autoResumeCountdown}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Trading will automatically resume after 3 hours
                  </p>
                </motion.div>
              )}

            {/* Ready to resume */}
            {tokenData?.goalReachedTimestamp &&
              // @ts-expect-error type
              isAutoResumeReady(tokenData.goalReachedTimestamp) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-400/30"
                >
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <Play className="h-5 w-5" />
                    <span className="font-semibold">
                      Ready to Resume Trading
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Trading can now be resumed automatically with any
                    transaction
                  </p>
                </motion.div>
              )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto"
        >
          <div className="p-6 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
            <h4 className="font-semibold mb-4 text-center flex items-center justify-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Final Stats
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Raised:</span>
                <span className="font-bold text-green-400">
                  {formatNumber(tokenData.collateral || "0")} AVAX
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Final Price:</span>
                <span className="font-bold text-foreground">
                  {priceLoading
                    ? "Loading..."
                    : `${currentPrice || "0.000000"} AVAX`}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
            <h4 className="font-semibold mb-4 text-center flex items-center justify-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Your Holdings
            </h4>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-center">
              <p className="text-2xl font-bold text-foreground">
                {tokenFormatted.amount} {tokenData?.symbol || "TOKEN"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ≈ {tokenFormatted.value} AVAX
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderTradingInterface = () => (
    <div className="space-y-6">
      {/* Single Consolidated Trading Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="unified-card border-primary/20 p-6"
      >
        {/* Header with balances */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Trade {tokenData?.symbol}
            </h3>
            <p className="text-sm text-muted-foreground">
              Current price:{" "}
              {priceLoading
                ? "Loading..."
                : `${currentPrice || "0.000000"} AVAX`}
            </p>
          </div>
          <div className="text-right space-y-1">
            <div className="text-sm">
              <span className="text-muted-foreground">AVAX:</span>{" "}
              <span className="font-medium">{avaxFormatted.amount}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">
                {tokenData?.symbol}:
              </span>{" "}
              <span className="font-medium">{tokenFormatted.amount}</span>
            </div>
          </div>
        </div>

        {/* Trading Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger
              value="buy"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Buy
            </TabsTrigger>
            <TabsTrigger
              value="sell"
              className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
            >
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              Sell
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="mt-0">
            <BuyTokenForm
              maxAmount={avaxBalance?.formatted || "0"}
              onAmountChange={(amount: any) => handleAmountChange(amount, true)}
            />
          </TabsContent>

          <TabsContent value="sell" className="mt-0">
            <SellTokenForm
              maxAmount={tokenBalance?.formatted || "0"}
              onAmountChange={(amount: any) =>
                handleAmountChange(amount, false)
              }
              address={userAddress}
            />
          </TabsContent>
        </Tabs>

        {/* Price Impact Warning - Only show if significant */}
        {currentAmount !== "0" &&
          parseFloat(currentAmount) > 0 &&
          tradeEstimation.priceImpact > 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 p-3 bg-orange-500/10 rounded-lg border border-orange-400/30"
            >
              <div className="flex items-center gap-2 text-orange-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  High Price Impact: {formatNumber(tradeEstimation.priceImpact)}
                  %
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This trade will move the price due to the bonding curve. Your
                slippage protection ({tradeEstimation.slippage}%) may still
                allow the transaction if you receive more tokens than your
                minimum.
              </p>
            </motion.div>
          )}
      </motion.div>
    </div>
  );

  const renderConnectWallet = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12 space-y-8"
    >
      <div className="space-y-4">
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
          }}
          className="text-6xl"
        >
          👋
        </motion.div>

        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Connect your wallet to start trading {tokenData?.symbol || "tokens"}
            . Your funds remain secure in your wallet.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        {connectors.map((connector) => (
          <motion.div
            key={connector.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => connect({ connector })}
              className="w-full btn-primary py-3 text-lg font-semibold rounded-xl"
            >
              Connect {connector.name}
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 max-w-md mx-auto">
        <div className="flex items-center gap-2 text-sm text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span>Secure • Non-custodial • Your keys, your crypto</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <Card className="unified-card border-primary/20 overflow-hidden">
      <CardContent className="p-0">
        <AnimatePresence mode="wait">
          {isGoalReached ? (
            <motion.div key="goal-reached">
              {renderGoalReachedState()}
            </motion.div>
          ) : isTrading ? (
            <motion.div key="trading" className="p-8">
              {renderTradingInterface()}
            </motion.div>
          ) : effectivelyConnected ? (
            <motion.div key="trading" className="p-8">
              {renderTradingInterface()}
            </motion.div>
          ) : (
            <motion.div key="connect" className="p-8">
              {renderConnectWallet()}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
