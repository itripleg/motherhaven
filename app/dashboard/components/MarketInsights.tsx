// app/dashboard/components/MarketInsights.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  Clock,
  Users,
  Zap,
  Target,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Crown,
  Flame,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface MarketToken {
  address: string;
  name: string;
  symbol: string;
  price: string;
  change24h: number;
  volume24h: string;
  trades24h: number;
  category: "trending" | "new" | "hot" | "volume";
}

interface MarketStats {
  totalTokens: number;
  activeTraders: number;
  totalVolume24h: string;
  newTokens24h: number;
}

export function MarketInsights() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<
    "trending" | "new" | "hot" | "volume"
  >("trending");

  // Mock data - replace with actual data from your hooks
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalTokens: 1247,
    activeTraders: 892,
    totalVolume24h: "2,456.78",
    newTokens24h: 23,
  });

  const [marketTokens, setMarketTokens] = useState<MarketToken[]>([
    {
      address: "0x1234",
      name: "Meme Supreme",
      symbol: "MEME",
      price: "0.001234",
      change24h: 156.78,
      volume24h: "45.67",
      trades24h: 234,
      category: "trending",
    },
    {
      address: "0x5678",
      name: "Moon Rocket",
      symbol: "MOON",
      price: "0.000567",
      change24h: 89.12,
      volume24h: "32.10",
      trades24h: 189,
      category: "hot",
    },
    {
      address: "0x9abc",
      name: "Doge Classic",
      symbol: "DOGE",
      price: "0.002345",
      change24h: -12.34,
      volume24h: "78.90",
      trades24h: 345,
      category: "volume",
    },
    {
      address: "0xdef0",
      name: "New Token",
      symbol: "NEW",
      price: "0.000890",
      change24h: 23.45,
      volume24h: "12.34",
      trades24h: 56,
      category: "new",
    },
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const categories = [
    {
      id: "trending" as const,
      label: "Trending",
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-400/30",
    },
    {
      id: "new" as const,
      label: "New",
      icon: Sparkles,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-400/30",
    },
    {
      id: "hot" as const,
      label: "Hot",
      icon: Flame,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-400/30",
    },
    {
      id: "volume" as const,
      label: "Volume",
      icon: Activity,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-400/30",
    },
  ];

  const filteredTokens = marketTokens.filter(
    (token) => token.category === selectedCategory
  );

  if (isLoading) {
    return (
      <Card className="unified-card border-primary/20">
        <CardContent className="flex items-center justify-center h-[400px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
          />
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
              <Target className="h-5 w-5 text-primary" />
              Market Insights
            </CardTitle>
            <CardDescription>
              Real-time market data and trending tokens
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dex")}
            className="hover:bg-primary/20"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Market Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-muted-foreground">
                Total Tokens
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {marketStats.totalTokens.toLocaleString()}
            </p>
            <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
              +{marketStats.newTokens24h} today
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-muted-foreground">
                Active Traders
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {marketStats.activeTraders.toLocaleString()}
            </p>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
              24h active
            </Badge>
          </div>
        </div>

        {/* Volume Display */}
        <div className="unified-card border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  24h Volume
                </span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {marketStats.totalVolume24h} AVAX
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-semibold">+12.5%</span>
              </div>
              <p className="text-xs text-muted-foreground">vs yesterday</p>
            </div>
          </div>
        </div>

        {/* Category Selector */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Categories
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`justify-start gap-2 ${
                  selectedCategory === category.id
                    ? `${category.bgColor} ${category.color} ${category.borderColor}`
                    : "hover:bg-primary/10"
                }`}
              >
                <category.icon className="h-4 w-4" />
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Token List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground">
              {categories.find((c) => c.id === selectedCategory)?.label} Tokens
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dex")}
              className="text-xs hover:bg-primary/20"
            >
              View All
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredTokens.map((token, index) => (
              <motion.div
                key={token.address}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 unified-card border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
                onClick={() => router.push(`/dex/${token.address}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {token.symbol[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {token.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {token.symbol}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-foreground text-sm">
                    {token.price} AVAX
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        token.change24h >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {token.change24h >= 0 ? "+" : ""}
                      {token.change24h.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {token.trades24h} trades
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredTokens.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No {selectedCategory} tokens found</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Footer */}
        <div className="pt-4 border-t border-border/50">
          <Button
            variant="outline"
            className="w-full bg-primary/10 hover:bg-primary/20 border-primary/30"
            onClick={() => router.push("/dex")}
          >
            <Eye className="h-4 w-4 mr-2" />
            Explore All Tokens
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
