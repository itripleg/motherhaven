// app/dashboard/components/UserTradingActivity.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  BarChart3,
  RefreshCw,
  Zap,
  CheckCircle,
  XCircle,
  ExternalLink,
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
  success?: boolean;
}

interface TradingStats {
  totalTrades: number;
  totalVolume: string;
  totalFees: string;
  buyCount: number;
  sellCount: number;
  avgTradeSize: string;
}

export function UserTradingActivity() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "all">(
    "7d"
  );

  // Fetch user trades
  useEffect(() => {
    const fetchTrades = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

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
            const tokensQuery = query(
              collection(db, "tokens"),
              where("address", "==", data.token)
            );
            const tokenSnapshot = await getDocs(tokensQuery);
            const tokenData = tokenSnapshot.docs[0]?.data();
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
              success: data.success !== false,
            };
          })
        );

        // Filter by timeframe
        const now = new Date();
        const filteredTrades = tradeData.filter((trade) => {
          if (timeframe === "all") return true;

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
      } catch (error) {
        console.error("Error fetching trades:", error);
        setError("Failed to load trading history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, [address, timeframe]);

  // Calculate trading stats
  const tradingStats: TradingStats = useMemo(() => {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        totalVolume: "0",
        totalFees: "0",
        buyCount: 0,
        sellCount: 0,
        avgTradeSize: "0",
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

    const buyCount = trades.filter((t) => t.type === "buy").length;
    const sellCount = trades.filter((t) => t.type === "sell").length;
    const avgTradeSize = totalVolume / trades.length;

    return {
      totalTrades: trades.length,
      totalVolume: totalVolume.toFixed(4),
      totalFees: totalFees.toFixed(6),
      buyCount,
      sellCount,
      avgTradeSize: avgTradeSize.toFixed(4),
    };
  }, [trades]);

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
                onClick={() => window.location.reload()}
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
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Buys</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {tradingStats.buyCount}
              </p>
              <p className="text-xs text-green-400">Purchases</p>
            </div>

            <div className="unified-card border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-xs text-muted-foreground">Sells</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {tradingStats.sellCount}
              </p>
              <p className="text-xs text-red-400">Sales</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Trades Table */}
      <Card className="unified-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Recent Trades
            </CardTitle>
            {trades.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Showing {trades.length} trades
              </p>
            )}
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.slice(0, 20).map((trade, index) => (
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dex/${trade.token}`)}
                            className="h-7 px-3 text-xs hover:bg-primary/20"
                          >
                            View Token
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `https://testnet.snowtrace.io/tx/${trade.transactionHash}`,
                                "_blank"
                              )
                            }
                            className="h-7 px-3 text-xs hover:bg-primary/20"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
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
