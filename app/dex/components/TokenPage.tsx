// app/dex/components/TokenPage.tsx
"use client";
import React, { useState, useEffect } from "react";
import { TokenHeaderStyled as TokenHeader } from "../components/TokenHeaderStyled";
import { TokenPriceCharts } from "../components/TokenPriceCharts";
import { BuyTokenFormOptimized } from "../components/BuyTokenFormOptimized";
import { SellTokenFormOptimized } from "../components/SellTokenFormOptimized";
import { ChatComponent } from "../components/ChatComponent";
import { MobileChatModal } from "../components/MobileChatModal";
import RecentTrades from "../components/RecentTrades";
import { useTokenData } from "@/final-hooks/useTokenData";
import { TradesProvider } from "@/contexts/TradesContext";
import { Address } from "viem";
import { useAccount, useConnect } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  BarChart3,
  MessageCircle,
  Activity,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { TokenDataProvider } from "@/contexts/TokenDataProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TokenState } from "@/types";

interface TokenPageProps {
  tokenAddress: string;
}

// Optimized Trading Card Component - This replaces the old TokenTradeCard
const OptimizedTokenTradeCard = ({
  tokenData,
  isConnected,
}: {
  tokenData: any;
  isConnected: boolean;
}) => {
  const [activeTab, setActiveTab] = useState("buy");
  const { connect, connectors } = useConnect();

  // Check if token is in goal reached state
  const isGoalReached = tokenData?.currentState === TokenState.GOAL_REACHED;
  const isTrading =
    tokenData?.currentState === TokenState.TRADING ||
    tokenData?.currentState === TokenState.RESUMED;

  const renderConnectWallet = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-8 space-y-6"
    >
      <div className="space-y-3">
        <div className="text-4xl">👋</div>
        <h3 className="text-xl font-bold text-foreground">
          Connect Your Wallet
        </h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Connect your wallet to start trading {tokenData?.symbol || "tokens"}
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        {connectors.map((connector) => (
          <motion.div
            key={connector.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => connect({ connector })}
              className="w-full btn-primary py-3 font-medium"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Connect {connector.name}
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 max-w-sm mx-auto">
        <div className="flex items-center gap-2 text-sm text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span>Secure • Non-custodial</span>
        </div>
      </div>
    </motion.div>
  );

  const renderGoalReachedState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center space-y-6 p-8"
    >
      <div className="space-y-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-green-400 mb-2">
            Funding Goal Reached!
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            This token has successfully reached its funding goal of{" "}
            <span className="font-semibold text-green-400">
              {tokenData?.fundingGoal || "0"} AVAX
            </span>
            . Trading is temporarily halted.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderTradingInterface = () => (
    <div className="space-y-6">
      {/* Trading Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/30">
          <TabsTrigger
            value="buy"
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 transition-all duration-200"
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Buy
          </TabsTrigger>
          <TabsTrigger
            value="sell"
            className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 transition-all duration-200"
          >
            <ArrowDownLeft className="h-4 w-4 mr-2" />
            Sell
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="mt-0 space-y-4">
          <BuyTokenFormOptimized />
        </TabsContent>

        <TabsContent value="sell" className="mt-0 space-y-4">
          <SellTokenFormOptimized />
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <Card className="unified-card border-primary/20 overflow-hidden">
      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {isGoalReached ? (
            <motion.div key="goal-reached">
              {renderGoalReachedState()}
            </motion.div>
          ) : isTrading && isConnected ? (
            <motion.div key="trading">{renderTradingInterface()}</motion.div>
          ) : (
            <motion.div key="connect">{renderConnectWallet()}</motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default function TokenPage({ tokenAddress }: TokenPageProps) {
  const { isConnected } = useAccount();
  const { token, isLoading, error } = useTokenData(tokenAddress as Address);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen animated-bg floating-particles">
        <div className="container mx-auto pt-20 p-4 space-y-8">
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur-sm border border-border/50">
              <div className="h-80 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gradient bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Loading Token Data
                    </h2>
                    <p className="text-muted-foreground">
                      Fetching contract state and metadata...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isLoading) {
    return (
      <div className="min-h-screen animated-bg floating-particles">
        <div className="container mx-auto pt-20 p-4">
          <div className="flex flex-col justify-center items-center min-h-[70vh] text-center space-y-6">
            <div className="text-8xl">🤔</div>
            <div className="space-y-4 max-w-md">
              <h2 className="text-3xl font-bold text-red-400">
                Token Not Found
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {error ||
                  "The token could not be found. The address might be invalid or the token hasn't been created yet."}
              </p>
              <button
                onClick={() => window.history.back()}
                className="btn-primary px-8 py-3 rounded-xl font-semibold"
              >
                ← Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No token state
  if (!isLoading && !token) {
    return (
      <div className="min-h-screen animated-bg floating-particles">
        <div className="container mx-auto pt-20 p-4">
          <div className="flex flex-col justify-center items-center min-h-[70vh] text-center space-y-6">
            <div className="text-8xl">🤔</div>
            <div className="space-y-4 max-w-md">
              <h2 className="text-3xl font-bold text-red-400">
                Token Not Found
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The token could not be found. The address might be invalid or
                the token hasn't been created yet.
              </p>
              <button
                onClick={() => window.history.back()}
                className="btn-primary px-8 py-3 rounded-xl font-semibold"
              >
                ← Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  // Main component render
  return (
    <TradesProvider>
      <TokenDataProvider tokenAddress={token.address}>
        <div className="min-h-screen">
          <div className="container mx-auto pt-20 p-4">
            {/* Token Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <TokenHeader address={token.address} />
            </motion.div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt-8">
              {/* Left Column - Charts and Trading */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="xl:col-span-3 space-y-8"
              >
                {/* Price Charts */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        Price Analysis
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Real-time market data and trends
                      </p>
                    </div>
                  </div>
                  <TokenPriceCharts address={token.address} />
                </div>

                {/* Trading Interface - Using Optimized Component */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        Trade {token.symbol}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Buy and sell with instant execution
                      </p>
                    </div>
                  </div>

                  {/* THE KEY CHANGE: Using OptimizedTokenTradeCard instead of TokenTradeCard */}
                  <OptimizedTokenTradeCard
                    tokenData={token}
                    isConnected={isConnected}
                  />
                </div>
              </motion.div>

              {/* Right Sidebar - Desktop Only */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="hidden xl:flex xl:flex-col gap-6"
              >
                {/* Single sticky container with proper top spacing */}
                <div className="sticky top-6 space-y-6 h-fit">
                  {/* Chat Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                        <MessageCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          Community Chat
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Join the conversation
                        </p>
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="ml-auto"
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </motion.div>
                    </div>
                    <div className="h-[450px] unified-card rounded-xl border-primary/20 overflow-hidden">
                      <ChatComponent
                        tokenAddress={token.address}
                        creatorAddress={token.creator}
                      />
                    </div>
                  </div>

                  {/* Recent Trades Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          Recent Trades
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Live market activity
                        </p>
                      </div>
                    </div>
                    <div className="h-[400px] unified-card rounded-xl border-primary/20 overflow-hidden">
                      <RecentTrades tokenAddress={token.address} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Mobile Chat Modal */}
            <div className="xl:hidden">
              <MobileChatModal
                tokenAddress={token.address}
                creatorAddress={token.creator}
              />
            </div>
          </div>
        </div>
      </TokenDataProvider>
    </TradesProvider>
  );
}
