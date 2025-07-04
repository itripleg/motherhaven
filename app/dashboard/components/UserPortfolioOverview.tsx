// app/dashboard/components/UserPortfolioOverview.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAccount, useBalance } from "wagmi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Wallet,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  Sparkles,
  Target,
} from "lucide-react";
import { useRealtimeTokenPrices } from "@/hooks/token/useRealtimeTokenPrices";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import { type Address } from "viem";

// Mock data - replace with actual data from your hooks
const mockPortfolioHistory = [
  { date: "2024-01-01", value: 100 },
  { date: "2024-01-02", value: 105 },
  { date: "2024-01-03", value: 98 },
  { date: "2024-01-04", value: 112 },
  { date: "2024-01-05", value: 125 },
  { date: "2024-01-06", value: 118 },
  { date: "2024-01-07", value: 134 },
];

interface TokenHolding {
  address: Address;
  symbol: string;
  name: string;
  balance: string;
  value: number;
  change24h: number;
  allocation: number;
}

interface PortfolioStats {
  totalValue: number;
  change24h: number;
  changePercent24h: number;
  topGainer: TokenHolding | null;
  topLoser: TokenHolding | null;
  diversificationScore: number;
}

export function UserPortfolioOverview() {
  const { address, isConnected } = useAccount();
  const { data: avaxBalance, refetch: refetchBalance } = useBalance({
    address,
  });

  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("7d");
  const [isLoading, setIsLoading] = useState(true);

  // Mock token holdings - replace with actual data
  const [tokenHoldings, setTokenHoldings] = useState<TokenHolding[]>([
    {
      address: "0x1234..." as Address,
      symbol: "MEME",
      name: "Meme Token",
      balance: "1000.00",
      value: 45.67,
      change24h: 12.34,
      allocation: 36.5,
    },
    {
      address: "0x5678..." as Address,
      symbol: "MOON",
      name: "Moon Coin",
      balance: "500.00",
      value: 32.1,
      change24h: -5.67,
      allocation: 25.7,
    },
    {
      address: "0x9abc..." as Address,
      symbol: "DOGE",
      name: "Doge Classic",
      balance: "2000.00",
      value: 28.9,
      change24h: 8.91,
      allocation: 23.1,
    },
  ]);

  // Get addresses for price fetching
  const tokenAddresses = tokenHoldings.map((holding) => holding.address);
  const { prices, isLoading: pricesLoading } =
    useRealtimeTokenPrices(tokenAddresses);

  // Calculate portfolio stats
  const portfolioStats = useMemo((): PortfolioStats => {
    const avaxValue = parseFloat(avaxBalance?.formatted || "0") * 1; // Assume 1 AVAX = $1 for demo
    const tokenValues = tokenHoldings.map((h) => h.value);
    const totalTokenValue = tokenValues.reduce((sum, val) => sum + val, 0);
    const totalValue = avaxValue + totalTokenValue;

    const changes24h = tokenHoldings.map((h) => (h.value * h.change24h) / 100);
    const totalChange24h = changes24h.reduce((sum, change) => sum + change, 0);
    const changePercent24h =
      totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

    // Find top gainer and loser
    const sortedByChange = [...tokenHoldings].sort(
      (a, b) => b.change24h - a.change24h
    );
    const topGainer = sortedByChange[0] || null;
    const topLoser = sortedByChange[sortedByChange.length - 1] || null;

    // Calculate diversification score (0-100, higher is more diversified)
    const allocations = tokenHoldings.map((h) => h.allocation / 100);
    const herfindahlIndex = allocations.reduce(
      (sum, alloc) => sum + alloc * alloc,
      0
    );
    const diversificationScore = Math.max(0, (1 - herfindahlIndex) * 100);

    return {
      totalValue,
      change24h: totalChange24h,
      changePercent24h,
      topGainer,
      topLoser,
      diversificationScore,
    };
  }, [tokenHoldings, avaxBalance]);

  // Pie chart data
  const pieChartData = useMemo(() => {
    const avaxValue = parseFloat(avaxBalance?.formatted || "0") * 1;
    const totalValue = portfolioStats.totalValue;

    const data = [
      {
        name: "AVAX",
        value: avaxValue,
        percentage: totalValue > 0 ? (avaxValue / totalValue) * 100 : 0,
        color: "#E84142",
      },
      ...tokenHoldings.map((holding, index) => ({
        name: holding.symbol,
        value: holding.value,
        percentage: totalValue > 0 ? (holding.value / totalValue) * 100 : 0,
        color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      })),
    ];

    return data.filter((item) => item.value > 0);
  }, [tokenHoldings, portfolioStats.totalValue, avaxBalance]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const formatValue = (value: number) => {
    return isBalanceVisible ? `${value.toFixed(2)} AVAX` : "****";
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-primary/20 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          <p className="text-lg font-bold text-primary">
            {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-primary/20 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-foreground">{data.name}</p>
          <p className="text-lg font-bold text-primary">
            {formatValue(data.value)} ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="unified-card border-primary/20 h-[600px]">
        <CardContent className="flex items-center justify-center h-full">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
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
            <CardTitle className="flex items-center gap-3 text-2xl">
              <PieChartIcon className="h-6 w-6 text-primary" />
              Portfolio Overview
            </CardTitle>
            <CardDescription>
              Track your holdings and performance across all tokens
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
              onClick={() => refetchBalance()}
              className="hover:bg-primary/20"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Portfolio Value Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Portfolio Value
              </p>
              <h2 className="text-3xl font-bold text-foreground">
                {formatValue(portfolioStats.totalValue)}
              </h2>
            </div>
            <div className="text-right">
              <div
                className={`flex items-center gap-1 ${
                  portfolioStats.changePercent24h >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {portfolioStats.changePercent24h >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-semibold">
                  {portfolioStats.changePercent24h >= 0 ? "+" : ""}
                  {portfolioStats.changePercent24h.toFixed(2)}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {portfolioStats.change24h >= 0 ? "+" : ""}
                {formatValue(portfolioStats.change24h)} (24h)
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="unified-card border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="h-4 w-4 text-green-400" />
                <span className="text-xs text-muted-foreground">
                  Top Gainer
                </span>
              </div>
              <p className="font-semibold text-foreground">
                {portfolioStats.topGainer?.symbol || "N/A"}
              </p>
              <p className="text-xs text-green-400">
                +{portfolioStats.topGainer?.change24h.toFixed(2) || "0"}%
              </p>
            </div>

            <div className="unified-card border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownLeft className="h-4 w-4 text-red-400" />
                <span className="text-xs text-muted-foreground">Top Loser</span>
              </div>
              <p className="font-semibold text-foreground">
                {portfolioStats.topLoser?.symbol || "N/A"}
              </p>
              <p className="text-xs text-red-400">
                {portfolioStats.topLoser?.change24h.toFixed(2) || "0"}%
              </p>
            </div>

            <div className="unified-card border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Diversity</span>
              </div>
              <p className="font-semibold text-foreground">
                {portfolioStats.diversificationScore.toFixed(0)}/100
              </p>
              <Progress
                value={portfolioStats.diversificationScore}
                className="h-2 mt-1"
              />
            </div>

            <div className="unified-card border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">Assets</span>
              </div>
              <p className="font-semibold text-foreground">
                {tokenHoldings.length + 1}
              </p>
              <p className="text-xs text-muted-foreground">Including AVAX</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Value Chart */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Performance
              </h3>
              <div className="flex gap-2">
                {["24h", "7d", "30d"].map((period) => (
                  <Button
                    key={period}
                    variant={timeframe === period ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeframe(period as any)}
                    className="text-xs"
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockPortfolioHistory}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--muted-foreground))"
                    strokeOpacity={0.1}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value} AVAX`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      stroke: "hsl(var(--primary))",
                      strokeWidth: 2,
                      fill: "hsl(var(--background))",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Allocation Pie Chart */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Allocation
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    formatter={(value, entry) => (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Holdings List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Holdings</h3>
          <div className="space-y-2">
            {/* AVAX Balance */}
            <div className="flex items-center justify-between p-4 unified-card border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-red-400">AVAX</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Avalanche</p>
                  <p className="text-sm text-muted-foreground">Native Token</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {isBalanceVisible ? avaxBalance?.formatted || "0.00" : "****"}{" "}
                  AVAX
                </p>
                <p className="text-sm text-muted-foreground">
                  {pieChartData[0]?.percentage.toFixed(1) || "0"}% allocation
                </p>
              </div>
            </div>

            {/* Token Holdings */}
            {tokenHoldings.map((holding, index) => (
              <motion.div
                key={holding.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 unified-card border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center`}
                    style={{
                      backgroundColor: `hsl(${
                        (index * 137.5) % 360
                      }, 70%, 20%)`,
                    }}
                  >
                    <span
                      className="text-sm font-bold"
                      style={{
                        color: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
                      }}
                    >
                      {holding.symbol[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {holding.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {holding.symbol}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {isBalanceVisible ? holding.balance : "****"}{" "}
                    {holding.symbol}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {isBalanceVisible
                        ? `${holding.value.toFixed(2)} AVAX`
                        : "****"}
                    </p>
                    <span
                      className={`text-sm font-medium ${
                        holding.change24h >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {holding.change24h >= 0 ? "+" : ""}
                      {holding.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
