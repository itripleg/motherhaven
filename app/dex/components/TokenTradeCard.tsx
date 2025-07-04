"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddressComponent } from "@/components/AddressComponent";
import { BuyTokenForm } from "./BuyTokenForm";
import { SellTokenForm } from "./SellTokenForm";
import { Token, TokenState } from "@/types";
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

  const { useCalculateTokens, useCalculateBuyPrice, useCalculateSellPrice } =
    useFactoryContract();

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
  const calculateRealPriceImpact = (amount: string, isBuy: boolean): number => {
    if (!amount || amount === "0" || !tokenData) return 0;

    try {
      const tradeAmount = parseFloat(amount);
      if (isNaN(tradeAmount) || tradeAmount <= 0) return 0;
      const currentPriceNum = parseFloat(currentPrice || "0");
      if (currentPriceNum === 0) return 0;

      if (isBuy) {
        if (!calculatedBuyPrice) return 0;
        const ethCostFromContract = parseFloat(formatEther(calculatedBuyPrice));
        const expectedEthCost = tradeAmount * currentPriceNum;
        const priceImpact =
          ((ethCostFromContract - expectedEthCost) / expectedEthCost) * 100;
        return Math.max(0, Math.min(95, priceImpact));
      } else {
        if (!calculatedEth) return 0;
        const ethFromContract = parseFloat(formatEther(calculatedEth));
        const expectedEthReceived = tradeAmount * currentPriceNum;
        const priceImpact =
          ((expectedEthReceived - ethFromContract) / expectedEthReceived) * 100;
        return Math.max(0, Math.min(95, priceImpact));
      }
    } catch (error) {
      console.error("Error calculating real price impact:", error);
      return 0;
    }
  };

  useEffect(() => {
    if (!tokenData?.address) return;

    const handleTokenEvent = (event: any) => {
      if (
        event.eventName === "TokensPurchased" ||
        event.eventName === "TokensSold"
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
  }, [
    tokenData,
    currentAmount,
    currentTradeType,
    calculatedTokens,
    calculatedBuyPrice,
    calculatedEth,
    currentPrice,
  ]);

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

  // Safe state checking
  const isHalted =
    tokenData?.state === TokenState.GOAL_REACHED ||
    tokenData?.state === TokenState.HALTED;

  const renderHaltedState = () => (
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
              . Trading is now moved to Uniswap.
            </p>
          </div>
        </motion.div>

        {/* Uniswap Link */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={() =>
              window.open("https://app.uniswap.org/#/swap", "_blank")
            }
            className="btn-primary px-8 py-4 text-lg font-semibold rounded-xl group"
          >
            <span>Trade on Uniswap</span>
            <ExternalLink className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
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
    <div className="space-y-8">
      {/* Main Trading Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Overview */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="unified-card border-primary/20 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Your Portfolio</h4>
              <p className="text-sm text-muted-foreground">Current balances</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* AVAX Balance */}
            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-400/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="font-medium text-foreground">AVAX</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">
                    {avaxFormatted.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
              </div>
            </div>

            {/* Token Balance */}
            <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Crown className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">
                    {tokenData?.symbol}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">
                    {tokenFormatted.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ≈ {tokenFormatted.value} AVAX
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Market Info */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="unified-card border-primary/20 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Market Info</h4>
              <p className="text-sm text-muted-foreground">Live trading data</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Current Price */}
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-400/20">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Price</span>
                <div className="text-right">
                  <p className="font-bold text-foreground">
                    {priceLoading ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      `${currentPrice || "0.000000"} AVAX`
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Price Impact */}
            <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-400/20">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price Impact</span>
                <div className="text-right">
                  <span
                    className={getPriceImpactColor(tradeEstimation.priceImpact)}
                  >
                    {formatNumber(tradeEstimation.priceImpact)}%
                  </span>
                </div>
              </div>
              {getPriceImpactWarning(tradeEstimation.priceImpact) && (
                <div className="text-xs text-orange-400 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {getPriceImpactWarning(tradeEstimation.priceImpact)}
                </div>
              )}
            </div>

            {/* Slippage Setting */}
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-400/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground">
                  Slippage Tolerance
                </span>
                <SlippageTolerance
                  value={tradeEstimation.slippage}
                  onChange={handleSlippageChange}
                  disabled={!effectivelyConnected}
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-purple-400">
                <ShieldCheck className="h-3 w-3" />
                <span>UI only - contract protection pending</span>
              </div>
            </div>

            {/* Debug Info (Development) */}
            {process.env.NODE_ENV === "development" && (
              <div className="p-3 bg-muted/20 rounded-lg border border-border/30">
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div>Collateral: {tokenData.collateral || "0"} AVAX</div>
                  <div>Virtual Supply: {tokenData.virtualSupply || "0"}</div>
                  <div>State: {tokenData.state}</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Trading Forms */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="unified-card border-primary/20 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Execute Trade</h4>
                <p className="text-sm text-muted-foreground">
                  Buy or sell tokens
                </p>
              </div>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
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
                  onAmountChange={(amount: any) =>
                    handleAmountChange(amount, true)
                  }
                />
              </TabsContent>

              <TabsContent value="sell" className="mt-0">
                <SellTokenForm
                  maxAmount={tokenBalance?.formatted || "0"}
                  onAmountChange={(amount: any) =>
                    handleAmountChange(amount, false)
                  }
                />
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
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
          {isHalted ? (
            <motion.div key="halted">{renderHaltedState()}</motion.div>
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
