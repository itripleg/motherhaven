"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { formatEther } from "viem";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types";

interface Trade {
  id: string;
  type: "buy" | "sell";
  tokenAddress: string;
  tokenName: string;
  tokenAmount: string;
  ethAmount: string;
  timestamp: number;
  pricePerToken: string;
}

interface ProcessedTrade extends Trade {
  currentPrice?: string;
  pnl?: number;
}

export function CoinTransactions() {
  const { address } = useAccount();
  const [trades, setTrades] = useState<ProcessedTrade[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch trades from Firestore
  useEffect(() => {
    const fetchTrades = async () => {
      if (!address) return;

      try {
        const tradesRef = collection(db, "trades");
        const q = query(
          tradesRef,
          where("userAddress", "==", address.toLowerCase()),
          orderBy("timestamp", "desc")
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
            const tokenName = tokenDoc.docs[0]?.data()?.name || "Unknown Token";

            return {
              id: doc.id,
              type: data.type,
              tokenAddress: data.token,
              tokenName,
              tokenAmount: data.tokenAmount,
              ethAmount: data.ethAmount,
              timestamp: data.timestamp,
              pricePerToken: data.pricePerToken,
            };
          })
        );

        setTrades(tradeData);
      } catch (error) {
        console.error("Error fetching trades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [address]);

  // Get current prices for tokens
  const { data: currentPrices } = useReadContracts({
    contracts: [...new Set(trades.map((trade) => trade.tokenAddress))].map(
      (tokenAddress) => ({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "getCurrentPrice",
        args: [tokenAddress],
      })
    ),
  });

  // Calculate PnL for trades
  useEffect(() => {
    if (!currentPrices) return;

    const uniqueTokens = [
      ...new Set(trades.map((trade) => trade.tokenAddress)),
    ];
    const priceMap = new Map();

    uniqueTokens.forEach((tokenAddress, index) => {
      const price = currentPrices[index]?.result;
      if (price) {
        priceMap.set(tokenAddress, formatEther(BigInt(price.toString())));
      }
    });

    const tradesWithPnL = trades.map((trade) => {
      const currentPrice = priceMap.get(trade.tokenAddress);
      if (!currentPrice) return trade;

      let pnl = 0;
      if (trade.type === "buy") {
        // For buys, calculate unrealized PnL if token wasn't sold
        const soldAmount = trades
          .filter(
            (t) =>
              t.type === "sell" &&
              t.tokenAddress === trade.tokenAddress &&
              t.timestamp > trade.timestamp
          )
          .reduce((acc, t) => acc + Number(t.tokenAmount), 0);

        const remainingAmount = Number(trade.tokenAmount) - soldAmount;
        if (remainingAmount > 0) {
          const buyPrice = Number(trade.pricePerToken);
          const currentPriceNum = Number(currentPrice);
          pnl = remainingAmount * (currentPriceNum - buyPrice);
        }
      } else {
        // For sells, calculate realized PnL
        const buyTrade = trades.find(
          (t) =>
            t.type === "buy" &&
            t.tokenAddress === trade.tokenAddress &&
            t.timestamp < trade.timestamp
        );

        if (buyTrade) {
          const buyPrice = Number(buyTrade.pricePerToken);
          const sellPrice = Number(trade.pricePerToken);
          pnl = Number(trade.tokenAmount) * (sellPrice - buyPrice);
        }
      }

      return {
        ...trade,
        currentPrice,
        pnl,
      };
    });

    setTrades(tradesWithPnL);
  }, [currentPrices, trades]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coin Transactions</CardTitle>
          <CardDescription>Loading your transactions...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coin Transactions</CardTitle>
          <CardDescription>No transactions found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coin Transactions</CardTitle>
        <CardDescription>Recent buys and sells with PnL</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>PnL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell
                  className={
                    tx.type === "buy" ? "text-green-600" : "text-red-600"
                  }
                >
                  {tx.type === "buy" ? "Buy" : "Sell"}
                </TableCell>
                <TableCell>{tx.tokenName}</TableCell>
                <TableCell>
                  {Number(formatEther(BigInt(tx.tokenAmount))).toFixed(4)}
                </TableCell>
                <TableCell>{Number(tx.pricePerToken).toFixed(6)} ETH</TableCell>
                <TableCell>
                  {tx.currentPrice
                    ? `${Number(tx.currentPrice).toFixed(6)} ETH`
                    : "-"}
                </TableCell>
                <TableCell
                  className={
                    tx.pnl && tx.pnl >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {tx.pnl ? `${tx.pnl.toFixed(6)} ETH` : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
