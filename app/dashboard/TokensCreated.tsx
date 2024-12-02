"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

interface TokenData {
  name: string;
  totalSupply: string;
  token: string; // token address
  ethAmount: string;
  tokenAmount: string;
}

export function TokensCreated() {
  const [tokens, setTokens] = useState<{
    [key: string]: {
      name: string;
      totalRaised: number;
      totalSupply: number;
      address: string;
    };
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setLoading(true);
        const tokenMap = new Map();

        // Fetch trades to calculate total raised
        const tradesRef = collection(db, "trades");
        const tradesQuery = query(tradesRef, orderBy("timestamp", "desc"));
        const tradesSnapshot = await getDocs(tradesQuery);

        tradesSnapshot.forEach((doc) => {
          const trade = doc.data();
          const tokenAddress = trade.token.toLowerCase();

          if (!tokenMap.has(tokenAddress)) {
            tokenMap.set(tokenAddress, {
              totalRaised: 0,
              trades: 0,
              name: "Token " + tokenAddress.slice(0, 6), // Default name, you can fetch real names if available
              address: tokenAddress,
              totalSupply: parseFloat(trade.tokenAmount) / 1e18, // Convert from wei
            });
          }

          const tokenData = tokenMap.get(tokenAddress);
          tokenData.totalRaised += parseFloat(trade.ethAmount) / 1e18; // Convert from wei to ETH
          tokenData.trades += 1;
        });

        setTokens(Object.fromEntries(tokenMap));
      } catch (error) {
        console.error("Error fetching token data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tokens Created</CardTitle>
          <CardDescription>Loading token data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tokens Created</CardTitle>
        <CardDescription>Progress towards funding goals</CardDescription>
      </CardHeader>
      <CardContent>
        {Object.values(tokens).map((token) => {
          // Calculate progress as percentage of total supply sold
          const progressPercentage = Math.min(
            (token.totalRaised / token.totalSupply) * 100,
            100
          );

          return (
            <div key={token.address} className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{token.name}</span>
                <span className="text-sm font-medium">
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Raised: {token.totalRaised.toFixed(4)} ETH</span>
                <span>Goal: {token.totalSupply.toFixed(0)} Tokens</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
