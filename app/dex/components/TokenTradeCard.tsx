import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AddressComponent } from "@/components/AddressComponent";
import { BuyTokenForm } from "./BuyTokenForm";
import { SellTokenForm } from "./SellTokenForm";
import { TokenData } from "@/types";
import { useConnect, useBalance, useAccount } from "wagmi";

interface TokenTradeCardProps {
  tokenData: TokenData;
  isConnected: boolean;
}

interface TradeEstimation {
  priceImpact: number;
  slippage: number;
}

export function TokenTradeCard({
  tokenData,
  isConnected,
}: TokenTradeCardProps) {
  const { connect, connectors } = useConnect();
  const { address } = useAccount();
  const [tradeEstimation, setTradeEstimation] = useState<TradeEstimation>({
    priceImpact: 0,
    slippage: 10, //
  });

  const { data: avaxBalance } = useBalance({
    address: address,
    watch: true,
  });

  const { data: tokenBalance } = useBalance({
    address: address,
    token: tokenData.address as `0x${string}`,
    watch: true,
  });

  const slippageValues = [1, 5, 10, 20];

  const handleSlippageChange = (value: number[]) => {
    const index = Math.round((value[0] / 100) * (slippageValues.length - 1));
    setTradeEstimation((prev) => ({
      ...prev,
      slippage: slippageValues[index],
    }));
  };

  const calculatePriceImpact = (amount: string, isBuy: boolean) => {
    if (!amount) return 0;
    const tradeSize = parseFloat(amount);
    const liquidity = tokenData.liquidity || 1000000;
    const impact = (tradeSize / liquidity) * 100;
    return Math.min(impact, 100);
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  return (
    <Card className="w-full p-6">
      <CardHeader className="text-center pb-2 text-lg p-4">
        <CardTitle>
          Trade {tokenData.symbol} ({tokenData.name})
        </CardTitle>
      </CardHeader>
      <AddressComponent hash={tokenData.address} type="address" />

      <CardContent className="mt-4">
        {isConnected ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Balance Card */}
            <div className="p-4 bg-background rounded-lg border">
              <h3 className="font-medium mb-4 text-center">Your Balance</h3>
              <div className="space-y-4">
                <div className="p-3 bg-secondary rounded-lg text-center">
                  <p className="text-lg font-bold">
                    {avaxBalance
                      ? formatNumber(parseFloat(avaxBalance.formatted))
                      : "0"}{" "}
                    AVAX
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ≈ $
                    {avaxBalance
                      ? formatNumber(
                          parseFloat(avaxBalance.formatted) *
                            (tokenData.price || 0)
                        )
                      : "0"}
                  </p>
                </div>
                <div className="p-3 bg-secondary rounded-lg text-center">
                  <p className="text-lg font-bold">
                    {tokenBalance
                      ? formatNumber(parseFloat(tokenBalance.formatted))
                      : "0"}{" "}
                    {tokenData.symbol}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ≈ $
                    {tokenBalance
                      ? formatNumber(
                          parseFloat(tokenBalance.formatted) *
                            (tokenData.price || 0)
                        )
                      : "0"}
                  </p>
                </div>
              </div>
            </div>

            {/* Trade Information Card */}
            <div className="p-4 bg-background rounded-lg border">
              <h3 className="font-medium mb-4 text-center">
                Trade Information
              </h3>
              <div className="space-y-4">
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Price Impact:</span>
                    <span
                      className={
                        tradeEstimation.priceImpact > 5
                          ? "text-red-500"
                          : "text-green-500"
                      }
                    >
                      {formatNumber(tradeEstimation.priceImpact)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span>Slippage Tolerance:</span>
                    <span>{formatNumber(tradeEstimation.slippage)}%</span>
                  </div>
                  <div className="pt-2">
                    <Slider
                      defaultValue={[0]}
                      max={100}
                      step={1}
                      onValueChange={handleSlippageChange}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      {slippageValues.map((value) => (
                        <span key={value}>{value}%</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trading Interface */}
            <div className="p-4 bg-secondary rounded-lg border">
              <Tabs defaultValue="buy" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="buy">Buy</TabsTrigger>
                  <TabsTrigger value="sell">Sell</TabsTrigger>
                </TabsList>
                <TabsContent value="buy">
                  <BuyTokenForm
                    maxAmount={avaxBalance?.formatted || "0"}
                    onAmountChange={(amount) => {
                      const impact = calculatePriceImpact(amount, true);
                      setTradeEstimation((prev) => ({
                        ...prev,
                        priceImpact: impact,
                      }));
                    }}
                  />
                </TabsContent>
                <TabsContent value="sell">
                  <SellTokenForm
                    maxAmount={tokenBalance?.formatted || "0"}
                    onAmountChange={(amount) => {
                      const impact = calculatePriceImpact(amount, false);
                      setTradeEstimation((prev) => ({
                        ...prev,
                        priceImpact: impact,
                      }));
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="mb-4">Connect your wallet to trade tokens</p>
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                onClick={() => connect({ connector })}
                className="mx-2"
              >
                Connect {connector.name}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
