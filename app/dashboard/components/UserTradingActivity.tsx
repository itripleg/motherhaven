// app/dashboard/components/UserTradingActivity.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Target,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  ExternalLink,
  Filter,
  Calendar,
  Award,
  Zap,
  Eye,
  CheckCircle,
  XCircle,
  Timer,
} from "lucide-react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter } from "next/navigation";

interface Trade {
  id: string;
  type: "buy" | "sell";
  token: string;
  tokenName: string;
  tokenSymbol: string;
  blockNumber: number;
  tokenAmount: string;
  ethAmount: string;
  fee: string;
  pricePerToken: string;
  timestamp: string;
  transactionHash: string;
  success: boolean;
}

interface TradingStats {
  totalTrades: number;
  totalVolume: string;
  totalPnL: number;
  winRate: number;
  avgTradeSize: string;
  totalFees: string;
  topPerformingToken: {
    symbol: string;
    pnl: number;
  } | null;
}

interface ActivitySummary {
  today: number;
  week: number;
  month: number;
  profitableTrades: number;
  totalTrades: number;
}

export function UserTradingActivity() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "all">(
    "7d"
  );
  const [tradingStats, setTradingStats] = useState<TradingStats>({
    totalTrades: 0,
    totalVolume: "0",
    totalPnL: 0,
    winRate: 0,
    avgTradeSize: "0",
    totalFees: "0",
    topPerformingToken: null,
  });

  // Fetch user trades
  useEffect(() => {
    const fetchTrades = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        const tradesRef = collection(db, "trades");
        const q = query(
          tradesRef,
          where("trader", "==", address.toLowerCase()),
          orderBy("timestamp", "desc"),
          limit(100)
        );

        const querySnapshot = await getDocs(q);
        const tradeData = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data();

            // Get token details
            const tokenDoc = await getDocs(
              query(
                collection(db, "tokens"),
                where("address", "==", data.token)
              )
            );
            const tokenData = tokenDoc.docs[0]?.data();
            const tokenName = tokenData?.name || "Unknown Token";
            const tokenSymbol = tokenData?.symbol || "TOKEN";

            return {
              id: doc.id,
              type: data.type as "buy" | "sell",
              token: data.token,
              tokenName,
              tokenSymbol,
              blockNumber: data.blockNumber,
              tokenAmount: data.tokenAmount,
              ethAmount: data.ethAmount,
              fee: data.fee,
              pricePerToken: data.pricePerToken,
              timestamp: data.timestamp,
              transactionHash: data.transactionHash,
              success: data.success !== false, // Default to true if not specified
            };
          })
        );

        // Filter by timeframe
        const now = new Date();
        const filteredTrades = tradeData.filter((trade) => {
          const tradeDate = new Date(trade.timestamp);
          const daysDiff =
            (now.getTime() - tradeDate.getTime()) / (1000 * 60 * 60 * 24);

          switch (timeframe) {
            case "24h":
              return daysDiff <= 1;
            case "7d":
              return daysDiff <= 7;
            case "30d":
              return daysDiff <= 30;
            default:
              return true;
          }
        });

        setTrades(filteredTrades);

        // Calculate trading stats
        const stats = calculateTradingStats(filteredTrades);
        setTradingStats(stats);
      } catch (error) {
        console.error("Error fetching trades:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, [address, timeframe]);

  const calculateTradingStats = (trades: Trade[]): TradingStats => {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        totalVolume: "0",
        totalPnL: 0,
        winRate: 0,
        avgTradeSize: "0",
        totalFees: "0",
        topPerformingToken: null,
      };
    }

    const totalVolume = trades.reduce(
      (sum, trade) => sum + Number(formatEther(BigInt(trade.ethAmount))),
      0
    );

    const totalFees = trades.reduce(
      (sum, trade) => sum + Number(formatEther(BigInt(trade.fee))),
      0
    );

    const avgTradeSize = totalVolume / trades.length;

    // Calculate PnL (simplified - would need more complex logic for real PnL)
    const buys = trades.filter((t) => t.type === "buy");
    const sells = trades.filter((t) => t.type === "sell");
    const totalBuyVolume = buys.reduce(
      (sum, trade) => sum + Number(formatEther(BigInt(trade.ethAmount))),
      0
    );
    const totalSellVolume = sells.reduce(
      (sum, trade) => sum + Number(formatEther(BigInt(trade.ethAmount))),
      0
    );
    const estimatedPnL = totalSellVolume - totalBuyVolume - totalFees;

    // Calculate win rate (simplified)
    const profitableTrades = Math.floor(trades.length * 0.6); // Mock calculation
    const winRate =
      trades.length > 0 ? (profitableTrades / trades.length) * 100 : 0;

    // Find top performing token
    const tokenPerformance: Record<string, number> = {};
    trades.forEach((trade) => {
      if (!tokenPerformance[trade.tokenSymbol]) {
        tokenPerformance[trade.tokenSymbol] = 0;
      }
      tokenPerformance[trade.tokenSymbol] += trade.type === "sell" ? 1 : -0.5; // Mock score
    });

    const topToken = Object.entries(tokenPerformance).sort(
      ([, a], [, b]) => b - a
    )[0];

    return {
      totalTrades: trades.length,
      totalVolume: totalVolume.toFixed(4),
      totalPnL: estimatedPnL,
      winRate,
      avgTradeSize: avgTradeSize.toFixed(4),
      totalFees: totalFees.toFixed(6),
      topPerformingToken: topToken
        ? {
            symbol: topToken[0],
            pnl: topToken[1],
          }
        : null,
    };
  };

  // Generate mock performance chart data
  const performanceData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(
      Date.now() - (29 - i) * 24 * 60 * 60 * 1000
    ).toLocaleDateString(),
    pnl: Math.random() * 100 - 50,
    volume: Math.random() * 10,
  }));

  const activitySummary: ActivitySummary = {
    today: trades.filter((t) => {
      const tradeDate = new Date(t.timestamp);
      const today = new Date();
      return tradeDate.toDateString() === today.toDateString();
    }).length,
    week: trades.filter((t) => {
      const tradeDate = new Date(t.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return tradeDate >= weekAgo;
    }).length,
    month: trades.filter((t) => {
      const tradeDate = new Date(t.timestamp);
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return tradeDate >= monthAgo;
    }).length,
    profitableTrades: Math.floor(trades.length * 0.6),
    totalTrades: trades.length,
  };

  if (!isConnected) {
    return (
      <Card className="unified-card border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <Activity className="h-12 w-12 text-muted-foreground opacity-50" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Connect Wallet
            </h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to view your trading activity
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="unified-card border-primary/20">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-primary" />
                Trading Activity
              </CardTitle>
              <CardDescription>
                Track your trading performance and history
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {["24h", "7d", "30d", "all"].map((period) => (
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
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/20"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="unified-card border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">
                  Total Trades
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {tradingStats.totalTrades}
              </p>
              <p className="text-xs text-blue-400">This {timeframe}</p>
            </div>

            <div className="unified-card border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Volume</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {tradingStats.totalVolume}
              </p>
              <p className="text-xs text-green-400">AVAX</p>
            </div>

            <div className="unified-card border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">Win Rate</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {tradingStats.winRate.toFixed(1)}%
              </p>
              <Progress value={tradingStats.winRate} className="h-2 mt-1" />
            </div>

            <div className="unified-card border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp
                  className={`h-4 w-4 ${
                    tradingStats.totalPnL >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                />
                <span className="text-xs text-muted-foreground">P&L</span>
              </div>
              <p
                className={`text-2xl font-bold ${
                  tradingStats.totalPnL >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {tradingStats.totalPnL >= 0 ? "+" : ""}
                {tradingStats.totalPnL.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground">AVAX</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart & Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="unified-card border-primary/20 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
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
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pnl"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card className="unified-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Today</span>
                <span className="font-semibold text-foreground">
                  {activitySummary.today} trades
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="font-semibold text-foreground">
                  {activitySummary.week} trades
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  This Month
                </span>
                <span className="font-semibold text-foreground">
                  {activitySummary.month} trades
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Success Rate
                  </span>
                  <span className="text-sm font-semibold text-green-400">
                    {activitySummary.totalTrades > 0
                      ? (
                          (activitySummary.profitableTrades /
                            activitySummary.totalTrades) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    activitySummary.totalTrades > 0
                      ? (activitySummary.profitableTrades /
                          activitySummary.totalTrades) *
                        100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Top Performer
              </h4>
              {tradingStats.topPerformingToken ? (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">
                    {tradingStats.topPerformingToken.symbol}
                  </span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
                    Best
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No trades yet</p>
              )}
            </div>

            <div className="pt-4 border-t border-border/50">
              <Button
                variant="outline"
                className="w-full bg-primary/10 hover:bg-primary/20 border-primary/30"
                onClick={() => router.push("/dex")}
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Start Trading
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades Table */}
      <Card className="unified-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5 text-primary" />
              Recent Trades
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard?tab=portfolio")}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">
                No Trades Found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start trading to see your activity here
              </p>
              <Button onClick={() => router.push("/dex")}>
                <Zap className="h-4 w-4 mr-2" />
                Start Trading
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.slice(0, 10).map((trade, index) => (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-primary/5"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {trade.type === "buy" ? (
                            <ArrowUpRight className="h-4 w-4 text-green-400" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4 text-red-400" />
                          )}
                          <span
                            className={`font-semibold ${
                              trade.type === "buy"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {trade.type.toUpperCase()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">
                            {trade.tokenSymbol}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {trade.tokenName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {Number(
                          formatEther(BigInt(trade.tokenAmount))
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        {Number(trade.pricePerToken).toLocaleString(undefined, {
                          minimumFractionDigits: 8,
                          maximumFractionDigits: 8,
                        })}
                      </TableCell>
                      <TableCell>
                        {Number(
                          formatEther(BigInt(trade.ethAmount))
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 4,
                          maximumFractionDigits: 4,
                        })}{" "}
                        AVAX
                      </TableCell>
                      <TableCell>
                        {trade.success ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-green-400 text-sm">
                              Success
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <XCircle className="h-4 w-4 text-red-400" />
                            <span className="text-red-400 text-sm">Failed</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-foreground">
                            {new Date(trade.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(trade.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
