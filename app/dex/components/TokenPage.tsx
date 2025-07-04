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
import { DebugTokenLoading } from "../components/DebugTokenLoading";
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

  // Use unified token data hook that combines Firestore + contract data
  const { token, isLoading, error } = useTokenData(tokenAddress as Address);

  if (isLoading) {
    return (
      <div className="min-h-screen animated-bg floating-particles">
        <div className="container mx-auto pt-20 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Header Skeleton */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur-sm border border-border/50">
              <div className="h-80 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="mx-auto w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                  />
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

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              <div className="xl:col-span-3 space-y-8">
                {/* Chart skeleton */}
                <div className="h-96 bg-muted/20 rounded-2xl border border-border/30 animate-pulse" />
                {/* Trade card skeleton */}
                <div className="h-64 bg-muted/20 rounded-2xl border border-border/30 animate-pulse" />
              </div>
              <div className="hidden xl:block space-y-6">
                <div className="h-96 bg-muted/20 rounded-2xl border border-border/30 animate-pulse" />
                <div className="h-64 bg-muted/20 rounded-2xl border border-border/30 animate-pulse" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Only show error if there's actually an error AND we're not loading
  if (error && !isLoading) {
    return (
      <div className="min-h-screen animated-bg floating-particles">
        <div className="container mx-auto pt-20 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col justify-center items-center min-h-[70vh] text-center space-y-6"
          >
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="text-8xl"
            >
              🤔
            </motion.div>

            <div className="space-y-4 max-w-md">
              <h2 className="text-3xl font-bold text-red-400">
                Token Not Found
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {error ||
                  "The token could not be found. The address might be invalid or the token hasn&apos;t been created yet."}
              </p>

              <motion.div
                // whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => window.history.back()}
                  className="btn-primary px-8 py-3 rounded-xl font-semibold"
                >
                  ← Go Back
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Only show "token not found" if we're done loading and there's no token
  if (!isLoading && !token) {
    return (
      <div className="min-h-screen animated-bg floating-particles">
        <div className="container mx-auto pt-20 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col justify-center items-center min-h-[70vh] text-center space-y-6"
          >
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="text-8xl"
            >
              🤔
            </motion.div>

            <div className="space-y-4 max-w-md">
              <h2 className="text-3xl font-bold text-red-400">
                Token Not Found
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The token could not be found. The address might be invalid or
                the token hasn&apos;t been created yet.
              </p>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => window.history.back()}
                  className="btn-primary px-8 py-3 rounded-xl font-semibold"
                >
                  ← Go Back
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Early return if token is null - TypeScript now knows token is not null below this point
  if (!token) {
    return null;
  }

  return (
    <TradesProvider>
      <div className="min-h-screen animated-bg floating-particles">
        <div className="container mx-auto pt-20 p-4 space-y-8">
          {/* Token Header with enhanced design */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <TokenHeader address={token.address} />
          </motion.div>

          {/* Main Content Grid with improved spacing */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Left Column - Main Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="xl:col-span-3 space-y-8"
            >
              {/* Price Charts Section */}
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
                <motion.div>
                  <TokenPriceCharts address={token.address} />
                </motion.div>
              </div>

              {/* Trading Interface Section */}
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
                <motion.div
                  // whileHover={{ scale: 1.005 }}
                  transition={{ duration: 0.2 }}
                >
                  <TokenTradeCard
                    address={tokenAddress}
                    tokenData={token}
                    isConnected={isConnected}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Right Sidebar - Desktop Only */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="hidden xl:flex xl:flex-col gap-6"
            >
              <div className="sticky top-24 space-y-6 h-fit">
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
                  <motion.div
                    // whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    className="h-[450px] unified-card border-primary/20 overflow-hidden"
                  >
                    <ChatComponent
                      tokenAddress={token.address}
                      creatorAddress={token.creator}
                    />
                  </motion.div>
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
                  <motion.div
                    // whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    className="unified-card border-primary/20 overflow-hidden"
                  >
                    <RecentTrades tokenAddress={token.address} />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mobile Chat Modal */}
          <AnimatePresence>
            <div className="xl:hidden">
              <MobileChatModal
                tokenAddress={token.address}
                creatorAddress={token.creator}
              />
            </div>
          </AnimatePresence>

          {/* Debug Component - Development Only */}
          {process.env.NODE_ENV === "development" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12"
            >
              {/* <DebugTokenLoading tokenAddress={tokenAddress} /> */}
            </motion.div>
          )}
        </div>
      </div>
    </TradesProvider>
  );
}
