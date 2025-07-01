// app/debug/trade/components/StreamlinedTradingComponent.tsx

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { parseEther, formatEther, Address } from "viem";
import { useBalance, useReadContract, useWriteContract } from "wagmi";
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { FACTORY_ADDRESS, FACTORY_ABI, TOKEN_ABI } from "@/types";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";

interface StreamlinedTradingComponentProps {
  token: string;
  tokenExists: boolean;
  userAddress?: string;
  isConnected: boolean;
  refreshKey: number;
}

export function StreamlinedTradingComponent({
  token,
  tokenExists,
  userAddress,
  isConnected,
  refreshKey,
}: StreamlinedTradingComponentProps) {
  const [buyAmount, setBuyAmount] = useState("1.0");
  const [sellAmount, setSellAmount] = useState("1000");

  const { useCurrentPrice, buyTokens, sellTokens, isWritePending } =
    useFactoryContract();
  const tokenAddress = token as Address;

  // Balances
  const { data: avaxBalance } = useBalance({
    address: userAddress as Address,
  });
  const { data: tokenBalance } = useBalance({
    address: userAddress as Address,
    token: tokenAddress,
  });

  // Current price for reference
  const { data: currentPrice } = useCurrentPrice(tokenAddress);

  // Buy calculations - tokens you'll receive
  const { data: tokensForEthData } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "calculateTokenAmount",
    args:
      tokenAddress && buyAmount
        ? [tokenAddress, parseEther(buyAmount)]
        : undefined,
    query: {
      enabled: Boolean(tokenAddress && buyAmount && Number(buyAmount) > 0),
      refetchInterval: 5000,
    },
  });

  // Sell calculations - AVAX you'll receive
  const { data: sellPriceData } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "calculateSellPrice",
    args:
      tokenAddress && sellAmount
        ? [tokenAddress, parseEther(sellAmount)]
        : undefined,
    query: {
      enabled: Boolean(tokenAddress && sellAmount && Number(sellAmount) > 0),
      refetchInterval: 5000,
    },
  });

  // Approval logic
  const { writeContract: approve, isPending: isApproving } = useWriteContract();
  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: TOKEN_ABI,
    functionName: "allowance",
    args: [userAddress as Address, FACTORY_ADDRESS],
    query: { enabled: !!userAddress && !!token },
  });

  const needsApproval = useMemo(() => {
    if (!sellAmount || !allowance) return false;
    try {
      return parseEther(sellAmount) > allowance;
    } catch {
      return false;
    }
  }, [sellAmount, allowance]);

  // Trading functions
  const handleBuy = () => buyTokens(tokenAddress, buyAmount);
  const handleSell = () => sellTokens(tokenAddress, sellAmount);
  const handleApprove = () => {
    approve({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: "approve",
      args: [FACTORY_ADDRESS, parseEther(sellAmount)],
    });
  };

  if (!isConnected || !tokenExists) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Connect Wallet & Select Token
          </h3>
          <p className="text-muted-foreground">
            Connect your wallet and provide a valid token address to start
            trading.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-500" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded">
              <div className="text-sm text-muted-foreground">Current Price</div>
              <div className="text-lg font-mono">
                {typeof currentPrice === "bigint"
                  ? formatTokenPrice(formatEther(currentPrice))
                  : "Loading..."}{" "}
                AVAX
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded">
              <div className="text-sm text-muted-foreground">Your AVAX</div>
              <div className="text-lg font-mono">
                {formatEther(avaxBalance?.value ?? 0n)}
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded">
              <div className="text-sm text-muted-foreground">Your Tokens</div>
              <div className="text-lg font-mono">
                {formatEther(tokenBalance?.value ?? 0n)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Interface */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BUY SIDE */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Buy Tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input */}
            <div>
              <Label htmlFor="buy-amount">AVAX Amount</Label>
              <Input
                id="buy-amount"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0"
                placeholder="1.0"
              />
            </div>

            {/* Calculation Results */}
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded border">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>You pay:</span>
                  <span className="font-mono">{buyAmount} AVAX</span>
                </div>
                <div className="flex justify-between">
                  <span>You receive:</span>
                  <span className="font-mono font-bold text-green-600">
                    {typeof tokensForEthData === "bigint"
                      ? Number(formatEther(tokensForEthData)).toLocaleString()
                      : "Calculating..."}{" "}
                    tokens
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Effective price:</span>
                  <span className="font-mono">
                    {typeof tokensForEthData === "bigint" &&
                    Number(formatEther(tokensForEthData)) > 0
                      ? formatTokenPrice(
                          (
                            Number(buyAmount) /
                            Number(formatEther(tokensForEthData))
                          ).toString()
                        )
                      : "..."}{" "}
                    AVAX/token
                  </span>
                </div>
              </div>
            </div>

            {/* Buy Button */}
            <Button
              onClick={handleBuy}
              disabled={isWritePending || !buyAmount || Number(buyAmount) <= 0}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isWritePending ? (
                "Buying..."
              ) : (
                <div className="flex items-center gap-2">
                  Buy Tokens
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* SELL SIDE */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              Sell Tokens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input */}
            <div>
              <Label htmlFor="sell-amount">Token Amount</Label>
              <Input
                id="sell-amount"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                type="number"
                step="1"
                min="0"
                placeholder="1000"
              />
            </div>

            {/* Calculation Results */}
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded border">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>You sell:</span>
                  <span className="font-mono">
                    {Number(sellAmount).toLocaleString()} tokens
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>You receive:</span>
                  <span className="font-mono font-bold text-red-600">
                    {typeof sellPriceData === "bigint"
                      ? Number(formatEther(sellPriceData)).toFixed(6)
                      : "Calculating..."}{" "}
                    AVAX
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Effective price:</span>
                  <span className="font-mono">
                    {typeof sellPriceData === "bigint"
                      ? formatTokenPrice(
                          (
                            Number(formatEther(sellPriceData)) /
                            Number(sellAmount)
                          ).toString()
                        )
                      : "..."}{" "}
                    AVAX/token
                  </span>
                </div>
              </div>
            </div>

            {/* Approval Status */}
            {needsApproval && (
              <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Approval required to sell tokens</span>
                </div>
              </div>
            )}

            {/* Sell/Approve Button */}
            {needsApproval ? (
              <Button
                onClick={handleApprove}
                disabled={isApproving || !sellAmount || Number(sellAmount) <= 0}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isApproving ? "Approving..." : "Approve Tokens"}
              </Button>
            ) : (
              <Button
                onClick={handleSell}
                disabled={
                  isWritePending || !sellAmount || Number(sellAmount) <= 0
                }
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isWritePending ? (
                  "Selling..."
                ) : (
                  <div className="flex items-center gap-2">
                    Sell Tokens
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Status */}
      {(isWritePending || isApproving) && (
        <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>
                {isApproving
                  ? "Approving tokens..."
                  : "Transaction in progress..."}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
