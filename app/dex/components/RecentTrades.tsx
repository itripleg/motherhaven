import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase";

interface Trade {
  pricePerToken: string;
  timestamp: number;
  type: "buy" | "sell";
  ethAmount: string;
  tokenAmount: string;
  token: string;
}

interface RecentTradesProps {
  tokenAddress: string;
}

export default function RecentTrades({ tokenAddress }: RecentTradesProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buySellPressure, setBuySellPressure] = useState({
    buyAmount: 0,
    sellAmount: 0,
  });

  useEffect(() => {
    if (!tokenAddress) return;

    setLoading(true);
    setError(null);

    // Create query for specific token's trades
    const tradesRef = collection(db, "trades");
    const q = query(
      tradesRef,
      where("token", "==", tokenAddress.toLowerCase()),
      orderBy("timestamp", "desc"),
      limit(8)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tradeData: Trade[] = [];
        let buyPressure = 0;
        let sellPressure = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as Trade;
          tradeData.push(data);

          // Calculate buy/sell pressure
          const ethAmount = parseFloat(data.ethAmount) / 1e18;
          if (data.type === "buy") {
            buyPressure += ethAmount;
          } else {
            sellPressure += ethAmount;
          }
        });

        setTrades(tradeData);
        setBuySellPressure({
          buyAmount: buyPressure,
          sellAmount: sellPressure,
        });
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching trades:", err);
        setError("Failed to fetch trade data");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tokenAddress]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatEthAmount = (amount: string | number) => {
    const ethValue = Number(amount) / 1e18;
    if (ethValue < 0.000001) return "0";
    if (ethValue < 0.001) return ethValue.toFixed(6);
    if (ethValue < 1) return ethValue.toFixed(4);
    return ethValue.toFixed(2);
  };

  const formatTokenAmount = (amount: string | number) => {
    const value = Number(amount) / 1e18;
    if (value < 0.000001) return "0";
    if (value < 0.001) return value.toFixed(6);
    if (value < 1) return value.toFixed(4);
    return value.toFixed(2);
  };

  if (loading) {
    return (
      <Card className="w-full hidden md:block max-w-md h-[420px]">
        <CardHeader className="py-3">
          <CardTitle className="text-lg">Loading trades...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full hidden md:block max-w-md h-[420px]">
        <CardHeader className="py-3">
          <CardTitle className="text-lg text-red-500">{error}</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full hidden md:block max-w-md h-[420px]">
      <CardHeader className="py-3">
        <CardTitle className="text-lg flex items-center gap-2">
          Recent Trades
          <InfoIcon className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 overflow-auto max-h-[360px]">
        <div className="bg-card rounded-lg p-3 border">
          <h4 className="text-sm font-medium mb-2">Buy/Sell Volume (ETH)</h4>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Buy: {formatEthAmount(buySellPressure.buyAmount)} ETH</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span>
                Sell: {formatEthAmount(buySellPressure.sellAmount)} ETH
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {trades.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No trades yet
            </div>
          ) : (
            trades.map((trade, index) => (
              <div
                key={`${trade.timestamp}-${index}`}
                className="bg-card rounded-lg p-2 border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      trade.type === "buy" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {trade.type === "buy" ? (
                      <ArrowUpIcon className="h-3 w-3 inline mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 inline mr-1" />
                    )}
                    {trade.type === "buy" ? "Bought" : "Sold"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(trade.timestamp)}
                  </span>
                </div>
                <div className="text-xs grid grid-cols-2 gap-1 mt-1">
                  <div>
                    <span className="text-muted-foreground">Amount:</span>{" "}
                    {formatTokenAmount(trade.tokenAmount)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price:</span>{" "}
                    {formatEthAmount(trade.ethAmount)} ETH
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
