"use client";
import React from "react";
import { TokenHeaderStyled as TokenHeader } from "../components/TokenHeaderStyled";
import { TokenPriceCharts } from "../components/TokenPriceCharts";
import { TokenTradeCard } from "../components/TokenTradeCard";
import { ChatComponent } from "../components/ChatComponent";
import { MobileChatModal } from "../components/MobileChatModal";
import RecentTrades from "../components/RecentTrades";
import { useTokenData } from "@/final-hooks/useTokenData";
import { TradesProvider } from "@/contexts/TradesContext";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  BarChart3,
  MessageCircle,
  Activity,
  Sparkles,
} from "lucide-react";

interface TokenPageProps {
  tokenAddress: string;
}

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

              {/* Trading Interface */}
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
                <TokenTradeCard
                  address={tokenAddress}
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
              {/* THE KEY: Single sticky container with proper top spacing */}
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
    </TradesProvider>
  );
}
