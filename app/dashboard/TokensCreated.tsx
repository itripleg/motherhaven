"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTokenList } from "@/hooks/token/useTokenList";
import { Token } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

interface TokenProgressData {
  address: string;
  name: string;
  symbol: string;
  collateral: number;
  fundingGoal: number;
  progress: number;
  imageUrl?: string;
}

const TokenProgressItem = ({ token }: { token: TokenProgressData }) => {
  const progress =
    token.fundingGoal > 0 ? (token.collateral / token.fundingGoal) * 100 : 0;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {token.imageUrl && (
            <img
              src={token.imageUrl}
              alt={token.name}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="text-sm font-medium">
            {token.name} ({token.symbol})
          </span>
        </div>
        <span className="text-sm font-medium">
          {Math.min(progress, 100).toFixed(1)}%
        </span>
      </div>
      <Progress value={Math.min(progress, 100)} className="w-full" />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Raised: {token.collateral.toFixed(4)} ETH</span>
        <span>Goal: {token.fundingGoal.toFixed(4)} ETH</span>
      </div>
    </div>
  );
};

export function TokensCreated() {
  const { tokens, isLoading, error } = useTokenList({
    orderByField: "createdAt",
    orderDirection: "desc",
    limitCount: 5,
  });

  const [processedTokens, setProcessedTokens] = useState<TokenProgressData[]>(
    []
  );
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    async function fetchTokenDetails() {
      if (!tokens.length) return;

      setLoadingDetails(true);
      try {
        const tokenDetails = await Promise.all(
          tokens.map(async (token) => {
            // Fetch additional details from Firestore
            const tokenDoc = await getDoc(doc(db, "tokens", token.address));
            const tokenData = tokenDoc.data();

            return {
              address: token.address,
              name: token.name,
              symbol: token.symbol,
              collateral: parseFloat(tokenData?.collateral || "0"),
              fundingGoal: parseFloat(tokenData?.fundingGoal || "0"),
              progress: tokenData?.fundingGoal
                ? (parseFloat(tokenData.collateral || "0") /
                    parseFloat(tokenData.fundingGoal)) *
                  100
                : 0,
              imageUrl: token.imageUrl,
            };
          })
        );

        setProcessedTokens(tokenDetails);
      } catch (err) {
        console.error("Error fetching token details:", err);
      } finally {
        setLoadingDetails(false);
      }
    }

    if (tokens && tokens.length > 0) {
      fetchTokenDetails();
    }
  }, [tokens]);

  if (isLoading || loadingDetails) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tokens Created</CardTitle>
          <CardDescription>Loading token data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tokens Created</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
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
        {processedTokens.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No tokens created yet
          </div>
        ) : (
          processedTokens.map((token) => (
            <TokenProgressItem key={token.address} token={token} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default TokensCreated;
