// app/dashboard/components/UserTokensCreated.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Crown,
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Activity,
  ArrowUpRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Eye,
  BarChart3,
  DollarSign,
  Clock,
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import Image from "next/image";

interface CreatedToken {
  address: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  createdAt: string;
  fundingGoal: string;
  collateral: string;
  currentPrice: string;
  state: number;
  statistics?: {
    volumeETH: string;
    tradeCount: number;
    uniqueHolders: number;
  };
  lastTrade?: {
    timestamp: string;
    type: "buy" | "sell";
    price: string;
  };
}

interface TokenStats {
  totalCreated: number;
  totalValue: string;
  totalVolume: string;
  avgPerformance: number;
}

export function UserTokensCreated() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [tokens, setTokens] = useState<CreatedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "performance" | "volume">(
    "newest"
  );

  // Subscribe to user's created tokens
  useEffect(() => {
    if (!isConnected || !address) {
      setIsLoading(false);
      return;
    }

    const tokensQuery = query(
      collection(db, "tokens"),
      where("creator", "==", address.toLowerCase())
    );

    const unsubscribe = onSnapshot(
      tokensQuery,
      (snapshot) => {
        const tokenData: CreatedToken[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            address: doc.id,
            name: data.name || "Unknown Token",
            symbol: data.symbol || "TOKEN",
            imageUrl: data.imageUrl,
            createdAt: data.createdAt || new Date().toISOString(),
            fundingGoal: data.fundingGoal || "25",
            collateral: data.collateral || "0",
            currentPrice:
              data.statistics?.currentPrice || data.lastPrice || "0.000001",
            state: data.currentState || data.state || 1,
            statistics: data.statistics,
            lastTrade: data.lastTrade,
          };
        });

        // Sort tokens
        const sortedTokens = [...tokenData].sort((a, b) => {
          switch (sortBy) {
            case "newest":
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            case "performance":
              const aProgress =
                (parseFloat(a.collateral) / parseFloat(a.fundingGoal)) * 100;
              const bProgress =
                (parseFloat(b.collateral) / parseFloat(b.fundingGoal)) * 100;
              return bProgress - aProgress;
            case "volume":
              const aVolume = parseFloat(a.statistics?.volumeETH || "0");
              const bVolume = parseFloat(b.statistics?.volumeETH || "0");
              return bVolume - aVolume;
            default:
              return 0;
          }
        });

        setTokens(sortedTokens);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching user tokens:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [address, isConnected, sortBy]);

  // Calculate stats
  const stats: TokenStats = {
    totalCreated: tokens.length,
    totalValue: tokens
      .reduce((sum, token) => {
        const value = parseFloat(token.collateral) || 0;
        return sum + value;
      }, 0)
      .toFixed(4),
    totalVolume: tokens
      .reduce((sum, token) => {
        const volume = parseFloat(token.statistics?.volumeETH || "0");
        return sum + volume;
      }, 0)
      .toFixed(4),
    avgPerformance:
      tokens.length > 0
        ? tokens.reduce((sum, token) => {
            const progress =
              (parseFloat(token.collateral) / parseFloat(token.fundingGoal)) *
              100;
            return sum + progress;
          }, 0) / tokens.length
        : 0,
  };

  const getTokenStatusBadge = (token: CreatedToken) => {
    const progress =
      (parseFloat(token.collateral) / parseFloat(token.fundingGoal)) * 100;

    if (token.state === 2 || progress >= 100) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
          Completed
        </Badge>
      );
    } else if (progress >= 80) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
          Near Goal
        </Badge>
      );
    } else if (
      token.statistics?.tradeCount &&
      token.statistics.tradeCount > 10
    ) {
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
          Active
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-500/20 text-gray-400 border-gray-400/30">
        Funding
      </Badge>
    );
  };

  const getPerformanceColor = (progress: number) => {
    if (progress >= 100) return "text-green-400";
    if (progress >= 80) return "text-yellow-400";
    if (progress >= 50) return "text-blue-400";
    return "text-gray-400";
  };

  const timeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const created = new Date(dateString).getTime();
    const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <Card className="unified-card border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <Crown className="h-12 w-12 text-muted-foreground opacity-50" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Connect Wallet
            </h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to view your created tokens
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="unified-card border-primary/20">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-primary" />
              My Tokens
            </CardTitle>
            <CardDescription>
              Tokens you&apos;ve created and their performance
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dex/factory")}
            className="bg-primary/10 hover:bg-primary/20 border-primary/30"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {stats.totalCreated}
            </p>
            <p className="text-xs text-muted-foreground">Tokens Created</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">
              {stats.totalValue}
            </p>
            <p className="text-xs text-muted-foreground">Total Raised (AVAX)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">
              {stats.totalVolume}
            </p>
            <p className="text-xs text-muted-foreground">Total Volume (AVAX)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">
              {stats.avgPerformance.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Avg. Progress</p>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          {["newest", "performance", "volume"].map((option) => (
            <Button
              key={option}
              variant={sortBy === option ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy(option as any)}
              className="text-xs capitalize"
            >
              {option}
            </Button>
          ))}
        </div>

        {/* Tokens List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
          ) : tokens.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 space-y-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 blur-xl rounded-full" />
                <div className="relative p-6 unified-card border-primary/30 bg-primary/5">
                  <Plus className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No Tokens Created Yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Launch your first token and start building your legacy
                  </p>
                  <Button
                    onClick={() => router.push("/dex/factory")}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Token
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {tokens.map((token, index) => {
                const progress =
                  (parseFloat(token.collateral) /
                    parseFloat(token.fundingGoal)) *
                  100;
                const clampedProgress = Math.min(progress, 100);

                return (
                  <motion.div
                    key={token.address}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="unified-card border-primary/20 bg-primary/5 p-4 hover:bg-primary/10 transition-all duration-300 cursor-pointer group"
                    onClick={() => router.push(`/dex/${token.address}`)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Token Image */}
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
                        {token.imageUrl ? (
                          <Image
                            src={token.imageUrl}
                            alt={token.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-lg font-bold text-primary">
                              {token.symbol[0]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Token Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">
                                {token.name}
                              </h3>
                              <span className="text-sm text-muted-foreground">
                                ({token.symbol})
                              </span>
                              {getTokenStatusBadge(token)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeAgo(token.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatTokenPrice(token.currentPrice)} AVAX
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${getPerformanceColor(
                                progress
                              )}`}
                            >
                              {clampedProgress.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {token.collateral} / {token.fundingGoal} AVAX
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <Progress value={clampedProgress} className="h-2" />
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {token.statistics?.tradeCount || 0} trades
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {token.statistics?.uniqueHolders || 0} holders
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              {formatTokenPrice(
                                token.statistics?.volumeETH || "0"
                              )}{" "}
                              vol
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dex/${token.address}`);
                              }}
                              className="h-7 px-3 text-xs hover:bg-primary/20"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer Actions */}
        {tokens.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Manage your token portfolio and track performance
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dex/factory")}
                className="bg-primary/10 hover:bg-primary/20 border-primary/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Another
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
