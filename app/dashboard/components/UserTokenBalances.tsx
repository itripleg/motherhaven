// app/dashboard/components/UserTokenBalances.tsx
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wallet,
  Coins,
  TrendingUp,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUpRight,
  Search,
  Filter,
  BarChart3,
  DollarSign,
  Activity,
  Sparkles,
  Star,
  AlertTriangle,
} from "lucide-react";
import { useUserTokenBalances } from "@/hooks/token/useUserTokenBalances";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import Image from "next/image";

interface TokenBalanceDisplay {
  address: string;
  name: string;
  symbol: string;
  balance: string;
  formattedBalance: string;
  decimals: number;
  imageUrl?: string;
  usdValue?: number;
  change24h?: number;
}

export function UserTokenBalances() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { balances, isLoading, error, refetch, totalTokens } =
    useUserTokenBalances();

  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [sortBy, setSortBy] = useState<"balance" | "name" | "symbol">(
    "balance"
  );
  const [filterQuery, setFilterQuery] = useState("");

  // Filter and sort balances
  const filteredBalances = balances
    .filter((token) => {
      if (!filterQuery) return true;
      const query = filterQuery.toLowerCase();
      return (
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "symbol":
          return a.symbol.localeCompare(b.symbol);
        case "balance":
        default:
          return (
            parseFloat(b.formattedBalance) - parseFloat(a.formattedBalance)
          );
      }
    });

  // Calculate total value (simplified - you could add real USD values)
  const totalValue = balances.reduce((sum, token) => {
    return sum + parseFloat(token.formattedBalance);
  }, 0);

  const formatBalance = (balance: string, symbol: string) => {
    if (!isBalanceVisible) return "****";
    const num = parseFloat(balance);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M ${symbol}`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K ${symbol}`;
    return `${num.toFixed(4)} ${symbol}`;
  };

  if (!isConnected) {
    return (
      <Card className="unified-card border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <Wallet className="h-12 w-12 text-muted-foreground opacity-50" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Connect Wallet
            </h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to view your token balances
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
              <Coins className="h-5 w-5 text-primary" />
              Token Balances
            </CardTitle>
            <CardDescription>
              Your holdings across all DX tokens
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
              className="hover:bg-primary/20"
            >
              {isBalanceVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={refetch}
              disabled={isLoading}
              className="hover:bg-primary/20"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="unified-card border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">
                Total Tokens
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalTokens}</p>
            <p className="text-xs text-blue-400">With Balance</p>
          </div>

          <div className="unified-card border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Total Value</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {isBalanceVisible ? totalValue.toFixed(2) : "****"}
            </p>
            <p className="text-xs text-green-400">Tokens</p>
          </div>

          <div className="unified-card border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-muted-foreground">Largest</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {balances.length > 0 ? balances[0].symbol : "N/A"}
            </p>
            <p className="text-xs text-yellow-400">
              {balances.length > 0 && isBalanceVisible
                ? formatBalance(balances[0].formattedBalance, "")
                : "****"}
            </p>
          </div>

          <div className="unified-card border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Diversity</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {totalTokens > 5 ? "High" : totalTokens > 2 ? "Medium" : "Low"}
            </p>
            <p className="text-xs text-purple-400">Portfolio</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="balance">Sort by Balance</option>
              <option value="name">Sort by Name</option>
              <option value="symbol">Sort by Symbol</option>
            </select>
          </div>
        </div>

        {/* Token List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
          ) : filteredBalances.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 space-y-4"
            >
              {filterQuery ? (
                <>
                  <Search className="h-12 w-12 text-muted-foreground opacity-50 mx-auto" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      No matches found
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Try adjusting your search query
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setFilterQuery("")}
                    >
                      Clear Search
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Coins className="h-12 w-12 text-muted-foreground opacity-50 mx-auto" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      No Token Balances
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You don&apos;t hold any DX tokens yet. Start trading to
                      build your portfolio!
                    </p>
                    <Button onClick={() => router.push("/dex")}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Explore Tokens
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredBalances.map((token, index) => (
                <motion.div
                  key={token.address}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="unified-card border-primary/20 bg-primary/5 p-4 hover:bg-primary/10 transition-all duration-300 cursor-pointer group"
                  onClick={() => router.push(`/dex/${token.address}`)}
                >
                  <div className="flex items-center gap-4">
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
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {token.name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {token.symbol}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {token.address.slice(0, 8)}...
                            {token.address.slice(-6)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-foreground text-lg">
                            {formatBalance(
                              token.formattedBalance,
                              token.symbol
                            )}
                          </p>
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-sm text-muted-foreground">
                              Balance
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dex/${token.address}`);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer Actions */}
        {filteredBalances.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredBalances.length} of {totalTokens} tokens
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dex")}
                  className="bg-primary/10 hover:bg-primary/20 border-primary/30"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Trade Tokens
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                  disabled={isLoading}
                  className="bg-primary/10 hover:bg-primary/20 border-primary/30"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
