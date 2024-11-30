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
import { tokenEventEmitter } from "./EventWatcher";

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

  // State
  const [tradeEstimation, setTradeEstimation] = useState<TradeEstimation>({
    priceImpact: 0,
    slippage: 10,
  });
  const [currentAmount, setCurrentAmount] = useState("0");
  const [shouldRefresh, setShouldRefresh] = useState(0);

  // AVAX Balance
  const { data: avaxBalance, refetch: refetchAvaxBalance } = useBalance({
    address: address,
  });

  // Token Balance
  const { data: tokenBalance, refetch: refetchTokenBalance } = useBalance({
    address: address,
    token: tokenData?.address as `0x${string}`,
    // enabled: !!tokenData?.address && !!address,
  });

  // Set up event listener for this specific token
  useEffect(() => {
    if (!tokenData?.address) return;

    const handleTokenEvent = (event: any) => {
      if (
        event.eventName === "TokensPurchased" ||
        event.eventName === "TokensSold"
      ) {
        // Trigger a refresh of balances
        setShouldRefresh((prev) => prev + 1);
      }
    };

    tokenEventEmitter.addEventListener(
      tokenData.address.toLowerCase(),
      handleTokenEvent
    );

    return () => {
      tokenEventEmitter.removeEventListener(
        tokenData.address.toLowerCase(),
        handleTokenEvent
      );
    };
  }, [tokenData?.address]);

  // Refresh balances when events occur
  useEffect(() => {
    if (shouldRefresh > 0) {
      refetchAvaxBalance();
      refetchTokenBalance();
    }
  }, [shouldRefresh, refetchAvaxBalance, refetchTokenBalance]);

  const slippageValues = [1, 5, 10, 20];

  // const handleAmountChange = (amount: string, isBuy: boolean) => {
  //   setCurrentAmount(amount);
  //   const impact = calculatePriceImpact(amount, isBuy);
  //   setTradeEstimation(prev => ({
  //     ...prev,
  //     priceImpact: impact,
  //   }));
  // };

  // Effect to update price impact when token data changes
  useEffect(() => {
    if (currentAmount && currentAmount !== "0") {
      const impact = calculatePriceImpact(currentAmount);
      setTradeEstimation((prev) => ({
        ...prev,
        priceImpact: impact,
      }));
    }
  }, [tokenData, currentAmount]);

  const handleSlippageChange = (value: number[]) => {
    const index = Math.round((value[0] / 100) * (slippageValues.length - 1));
    setTradeEstimation((prev) => ({
      ...prev,
      slippage: slippageValues[index] || prev.slippage,
    }));
  };

  const calculatePriceImpact = (amount: string, isBuy: boolean = true) => {
    if (!amount || !tokenData) return 0;
    try {
      const tradeSize = parseFloat(amount);
      if (isNaN(tradeSize)) return 0;

      const liquidity = tokenData.liquidity || 1000000;
      const impact = (tradeSize / liquidity) * 100;
      return Math.min(impact, 100);
    } catch (error) {
      console.error("Error calculating price impact:", error);
      return 0;
    }
  };

  const handleAmountChange = (amount: string, isBuy: boolean) => {
    setCurrentAmount(amount);
    const impact = calculatePriceImpact(amount, isBuy);
    setTradeEstimation((prev) => ({
      ...prev,
      priceImpact: impact,
    }));
  };

  const formatNumber = (num: number | string, decimals: number = 2): string => {
    try {
      const value = typeof num === "string" ? parseFloat(num) : num;
      if (isNaN(value)) return "0.00";

      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    } catch (error) {
      console.error("Error formatting number:", error);
      return "0.00";
    }
  };

  const formatBalance = (
    balance: any,
    price: number = 0
  ): { amount: string; value: string } => {
    if (!balance) return { amount: "0.00", value: "0.00" };
    try {
      const amount = formatNumber(balance.formatted || "0");
      const value = formatNumber(parseFloat(balance.formatted || "0") * price);
      return { amount, value };
    } catch (error) {
      console.error("Error formatting balance:", error);
      return { amount: "0.00", value: "0.00" };
    }
  };

  const avaxFormatted = formatBalance(avaxBalance, tokenData?.price || 0);
  const tokenFormatted = formatBalance(tokenBalance, tokenData?.price || 0);

  return (
    <Card className="w-full p-6">
      <CardHeader className="text-center pb-2 text-lg p-4">
        <CardTitle>
          Trade {tokenData?.symbol} ({tokenData?.name})
        </CardTitle>
      </CardHeader>
      <AddressComponent hash={tokenData?.address || ""} type="address" />

      <CardContent className="mt-4">
        {isConnected ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Balance Card */}
            <div className="p-4 bg-background rounded-lg border">
              <h3 className="font-medium mb-4 text-center">Your Balance</h3>
              <div className="space-y-4">
                <div className="p-3 bg-secondary rounded-lg text-center">
                  <p className="text-lg font-bold">
                    {avaxFormatted.amount} AVAX
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ≈ ${avaxFormatted.value}
                  </p>
                </div>
                <div className="p-3 bg-secondary rounded-lg text-center">
                  <p className="text-lg font-bold">
                    {tokenFormatted.amount} {tokenData?.symbol}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ≈ ${tokenFormatted.value}
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
                      defaultValue={[50]}
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
                    onAmountChange={(amount: any) =>
                      handleAmountChange(amount, true)
                    }
                  />
                </TabsContent>
                <TabsContent value="sell">
                  <SellTokenForm
                  // maxAmount={tokenBalance?.formatted || "0"}
                  // onAmountChange={(amount: any) =>
                  // handleAmountChange(amount, false)
                  // }
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
