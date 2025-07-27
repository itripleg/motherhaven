// app/shop/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Coins,
  Search,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
  User,
  ArrowUpRight,
  Flame,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import the new shop components
import { ShopItemsContainer } from "./components/ShopItemsContainer";
import { useVanityBalance } from "./hooks/useVanityBalance";
import { type ShopItem, type PurchaseResult } from "./types";

export default function ShopPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { toast } = useToast();

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Use the vanity balance hook
  const {
    vainTokenBalance,
    burnedBalance,
    avaxBalance,
    totalBurned,
    currentVanityName,
    canSetName,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    error: balanceError,
    refetch: refetchBalance,
    hasTokens,
    hasBurnedTokens,
    hasAvax,
  } = useVanityBalance();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle balance errors
  useEffect(() => {
    if (isBalanceError && balanceError) {
      console.error("Vanity balance error:", balanceError);
      toast({
        title: "Balance Error",
        description:
          "Failed to load your VAIN balance. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [isBalanceError, balanceError, toast]);

  // Handle item purchase
  const handlePurchase = async (item: ShopItem): Promise<void> => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to make purchases",
        variant: "destructive",
      });
      return;
    }

    // Special handling for vanity name token - redirect to name manager
    if (item.id === "vanity_name_change") {
      router.push("/VanityNameManager");
      return;
    }

    if (burnedBalance < item.cost) {
      toast({
        title: "Insufficient burned VAIN",
        description: `You need ${(
          item.cost - burnedBalance
        ).toLocaleString()} more burned VAIN tokens`,
        variant: "destructive",
      });
      return;
    }

    if (!item.isAvailable) {
      toast({
        title: "Item not available",
        description: "This item is not yet available for purchase",
        variant: "destructive",
      });
      return;
    }

    try {
      // TODO: Implement actual purchase transaction
      // For now, just show success message
      toast({
        title: "Purchase initiated",
        description: `Purchasing ${
          item.name
        } for ${item.cost.toLocaleString()} VAIN...`,
      });

      // Simulate purchase delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // TODO: Replace with actual contract call
      console.log("Purchasing item:", item);

      toast({
        title: "Purchase successful!",
        description: `You have successfully purchased ${item.name}`,
      });

      // Refresh user data
      refetchBalance();
    } catch (error) {
      console.error("Purchase failed:", error);
      toast({
        title: "Purchase failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchBalance();
      toast({
        title: "Data refreshed",
        description: "Your balance and shop data have been updated",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Navigate to name manager
  const handleNameManager = () => {
    router.push("/VanityNameManager");
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-muted-foreground">Loading shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-accent/20">
      {/* Animated background elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Floating coins */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={`coin-${i}`}
            className="absolute text-6xl opacity-5"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              rotate: [0, 360],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          >
            🪙
          </motion.div>
        ))}

        {/* Floating shop items */}
        {["🏪", "💎", "✨", "🛍️", "🎁"].map((emoji, i) => (
          <motion.div
            key={`shop-${i}`}
            className="absolute text-4xl opacity-5"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 container mx-auto p-6 pt-24 space-y-8">
        {/* Header */}
        <motion.div
          className="text-center space-y-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Shop Icon */}
          <div className="text-8xl">🏪</div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              VAIN Shop
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Customize your experience with exclusive items, upgrades, and
              effects
            </p>
          </div>

          {/* Balance Cards */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* AVAX Balance - Always show when connected but keep it subtle */}
            {isConnected && (
              <Card className="w-fit bg-card/80 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Coins className="h-6 w-6 text-muted-foreground" />
                    <div className="text-left">
                      <div className="flex items-baseline gap-2">
                        {isBalanceLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                            <span className="text-sm text-muted-foreground">
                              AVAX
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-foreground">
                              {avaxBalance.toFixed(4)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              AVAX
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        AVAX Balance
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VAIN Token Balance - Show if user has VAIN tokens */}
            {isConnected && hasTokens && (
              <Card className="w-fit bg-card/80 backdrop-blur border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Coins className="h-6 w-6 text-primary" />
                    <div className="text-left">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {vainTokenBalance.toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          VAIN
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Token Balance
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Burned Balance (Shop Credits) - Always show when connected */}
            {isConnected && (
              <Card className="w-fit bg-card/80 backdrop-blur border-orange-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Flame className="h-6 w-6 text-orange-500" />
                    <div className="text-left">
                      <div className="flex items-baseline gap-2">
                        {isBalanceLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                            <span className="text-sm text-muted-foreground">
                              VAIN
                            </span>
                          </div>
                        ) : isBalanceError ? (
                          <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">
                              Error loading balance
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-orange-500">
                              {burnedBalance.toLocaleString()}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              VAIN
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Shop Credits (Burned)
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRefresh}
                      disabled={isRefreshing || isBalanceLoading}
                      className="h-8 w-8"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Balance Explanation - Brief loading state then minimal messaging */}
          {isConnected && (
            <div className="flex justify-center">
              <AnimatePresence mode="wait">
                {isBalanceLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                    />
                    <span className="text-sm">Loading balances...</span>
                  </motion.div>
                ) : !hasBurnedTokens && hasTokens ? (
                  <motion.div
                    key="burn-vain"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <p className="text-sm text-muted-foreground">
                      🔥 <span className="text-blue-400">Burn VAIN tokens</span>{" "}
                      to earn shop credits
                    </p>
                  </motion.div>
                ) : !hasTokens && hasAvax ? (
                  <motion.div
                    key="get-vain"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    <p className="text-sm text-muted-foreground">
                      💰 <span className="text-green-400">Get VAIN tokens</span>{" "}
                      to use in the shop
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/80 backdrop-blur border-primary/30 focus:border-primary"
            />
          </div>
        </motion.div>

        {/* Connection Status */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="max-w-md mx-auto bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🔌</div>
                <h3 className="text-lg font-semibold text-yellow-600 mb-2">
                  Wallet Not Connected
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your wallet to view your balance and make purchases
                </p>
                <Button
                  variant="outline"
                  className="border-yellow-500/30 text-yellow-600"
                >
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Shop Items Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <ShopItemsContainer
            searchQuery={searchQuery}
            userBalance={burnedBalance} // Use burned balance for purchases
            onPurchase={handlePurchase}
          />
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center py-8"
        >
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              🔥 Burn VAIN tokens to earn shop credits
            </p>
            <p className="text-muted-foreground/70 text-xs">
              All purchases are final • Items are non-transferable
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
