"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AddressComponent } from "@/components/AddressComponent";
import { BuyTokenForm } from "./BuyTokenForm";
import { SellTokenForm } from "./SellTokenForm";
import { Token, TokenState } from "@/types";
import { useConnect, useBalance, useAccount } from "wagmi";
import { tokenEventEmitter } from "@/components/EventWatcher";
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice";
import { useFactoryContract } from "@/final-hooks/useFactoryContract";
import { SlippageTolerance } from "./SlippageTolerance";
import {
  getPriceImpactColor,
  getPriceImpactWarning,
} from "@/utils/priceImpactCalculator";
import { Address, parseEther, formatEther } from "viem";

interface TokenTradeCardProps {
  address: string;
  tokenData: Token;
  isConnected: boolean;
}

interface TradeEstimation {
  priceImpact: number;
  slippage: number;
}

export function TokenTradeCard({
  address,
  tokenData,
  isConnected: isConnectedProp,
}: TokenTradeCardProps) {
  const { connect, connectors } = useConnect();
  const { address: userAddress, isConnected } = useAccount();

  // FINAL-HOOKS: Get live price data and contract calculation functions
  const { formatted: currentPrice, isLoading: priceLoading } =
    useUnifiedTokenPrice(tokenData?.address as Address);

  const { useCalculateTokens, useCalculateBuyPrice, useCalculateSellPrice } =
    useFactoryContract();

  const effectivelyConnected = isConnected || isConnectedProp;

  // State
  const [tradeEstimation, setTradeEstimation] = useState<TradeEstimation>({
    priceImpact: 0,
    slippage: 0.5, // Default to 0.5%
  });

  // State for trade calculations
  const [currentAmount, setCurrentAmount] = useState("0");
  const [currentTradeType, setCurrentTradeType] = useState<"buy" | "sell">(
    "buy"
  );
  const [shouldRefresh, setShouldRefresh] = useState(0);

  // Get contract calculations for current trade
  const { tokenAmount: calculatedTokens, isLoading: buyCalculationLoading } =
    useCalculateTokens(
      tokenData?.address as Address,
      currentTradeType === "buy" && currentAmount !== "0"
        ? currentAmount
        : undefined
    );

  const { ethAmount: calculatedBuyPrice, isLoading: buyPriceLoading } =
    useCalculateBuyPrice(
      tokenData?.address as Address,
      currentTradeType === "buy" && currentAmount !== "0"
        ? currentAmount
        : undefined
    );

  const { ethAmount: calculatedEth, isLoading: sellCalculationLoading } =
    useCalculateSellPrice(
      tokenData?.address as Address,
      currentTradeType === "sell" && currentAmount !== "0"
        ? currentAmount
        : undefined
    );

  // AVAX Balance
  const { data: avaxBalance, refetch: refetchAvaxBalance } = useBalance({
    address: userAddress,
  });

  // Token Balance
  const { data: tokenBalance, refetch: refetchTokenBalance } = useBalance({
    address: userAddress,
    token: tokenData?.address as `0x${string}`,
  });

  // Calculate price impact using actual contract functions
  const calculateRealPriceImpact = (amount: string, isBuy: boolean): number => {
    if (!amount || amount === "0" || !tokenData) return 0;

    try {
      const tradeAmount = parseFloat(amount);
      if (isNaN(tradeAmount) || tradeAmount <= 0) return 0;
      const currentPriceNum = parseFloat(currentPrice || "0");
      if (currentPriceNum === 0) return 0;

      if (isBuy) {
        // For buys: use calculateBuyPrice to get exact ETH cost for the token amount
        if (!calculatedBuyPrice) return 0;

        const ethCostFromContract = parseFloat(formatEther(calculatedBuyPrice));

        // What user SHOULD pay at current price vs what they ACTUALLY pay
        const expectedEthCost = tradeAmount * currentPriceNum;
        const priceImpact =
          ((ethCostFromContract - expectedEthCost) / expectedEthCost) * 100;

        console.log("Buy Price Impact (Contract calculateBuyPrice):", {
          tokenAmount: `${tradeAmount} tokens`,
          currentPrice: currentPriceNum,
          expectedEthCost: `${expectedEthCost.toFixed(6)} AVAX`,
          actualEthCost: `${ethCostFromContract} AVAX`,
          priceImpact: `${priceImpact.toFixed(3)}%`,
        });

        return Math.max(0, Math.min(95, priceImpact));
      } else {
        // For sells: use calculateSellPrice to get exact ETH received
        if (!calculatedEth) return 0;

        const ethFromContract = parseFloat(formatEther(calculatedEth));

        // What user SHOULD get at current price vs what they ACTUALLY get
        const expectedEthReceived = tradeAmount * currentPriceNum;
        const priceImpact =
          ((expectedEthReceived - ethFromContract) / expectedEthReceived) * 100;

        console.log("Sell Price Impact (Contract calculateSellPrice):", {
          tradeAmount: `${tradeAmount} tokens`,
          currentPrice: currentPriceNum,
          expectedEthReceived: `${expectedEthReceived.toFixed(6)} AVAX`,
          actualEthReceived: `${ethFromContract} AVAX`,
          priceImpact: `${priceImpact.toFixed(3)}%`,
        });

        return Math.max(0, Math.min(95, priceImpact));
      }
    } catch (error) {
      console.error("Error calculating real price impact:", error);
      return 0;
    }
  };

  useEffect(() => {
    if (!tokenData?.address) return;

    const handleTokenEvent = (event: any) => {
      if (
        event.eventName === "TokensPurchased" ||
        event.eventName === "TokensSold"
      ) {
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

  useEffect(() => {
    if (shouldRefresh > 0) {
      refetchAvaxBalance();
      refetchTokenBalance();
    }
  }, [shouldRefresh, refetchAvaxBalance, refetchTokenBalance]);

  useEffect(() => {
    if (currentAmount && currentAmount !== "0") {
      const impact = calculateRealPriceImpact(
        currentAmount,
        currentTradeType === "buy"
      );
      setTradeEstimation((prev) => ({
        ...prev,
        priceImpact: impact,
      }));
    }
  }, [
    tokenData,
    currentAmount,
    currentTradeType,
    calculatedTokens,
    calculatedBuyPrice,
    calculatedEth,
    currentPrice,
  ]);

  const handleSlippageChange = (value: number) => {
    setTradeEstimation((prev) => ({
      ...prev,
      slippage: value,
    }));
  };

  const handleAmountChange = (amount: string, isBuy: boolean) => {
    setCurrentAmount(amount);
    setCurrentTradeType(isBuy ? "buy" : "sell");
    const impact = calculateRealPriceImpact(amount, isBuy);
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
    if (!balance?.formatted) return { amount: "0.00", value: "0.00" };
    try {
      const amount = formatNumber(balance.formatted);
      const value = formatNumber(parseFloat(balance.formatted) * price);
      return { amount, value };
    } catch (error) {
      console.error("Error formatting balance:", error);
      return { amount: "0.00", value: "0.00" };
    }
  };

  // Safe price parsing with fallbacks
  const safePrice = (() => {
    try {
      if (priceLoading) return 0;
      if (currentPrice && currentPrice !== "0.000000") {
        return parseFloat(currentPrice);
      }
      if (tokenData.lastPrice && tokenData.lastPrice !== "0") {
        return parseFloat(tokenData.lastPrice);
      }
      return 0;
    } catch {
      return 0;
    }
  })();

  const avaxFormatted = formatBalance(avaxBalance, 1); // AVAX = 1 AVAX
  const tokenFormatted = formatBalance(tokenBalance, safePrice);

  const renderHaltedState = () => (
    <div className="text-center space-y-6">
      <div className="p-6 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <h3 className="text-xl font-semibold text-blue-500 mb-2">
          🎉 Funding Goal Reached!
        </h3>
        <p className="text-muted-foreground mb-4">
          This token has successfully reached its funding goal of{" "}
          {formatNumber(tokenData.fundingGoal || "0")} AVAX. Trading is now
          moved to Uniswap.
        </p>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            You can now trade this token on Uniswap:
          </p>
          <a
            href="https://app.uniswap.org/#/swap"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600"
          >
            <Button variant="outline" className="gap-2">
              <span>View on Uniswap</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </svg>
            </Button>
          </a>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-background rounded-lg border">
          <h3 className="font-medium mb-4 text-center">Final Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Collateral Raised:</span>
              <span className="font-medium">
                {formatNumber(tokenData.collateral || "0")} AVAX
              </span>
            </div>
            <div className="flex justify-between">
              <span>Final Price:</span>
              <span className="font-medium">
                {priceLoading
                  ? "Loading..."
                  : `${currentPrice || "0.000000"} AVAX`}
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 bg-background rounded-lg border">
          <h3 className="font-medium mb-4 text-center">Your Holdings</h3>
          <div className="space-y-4">
            <div className="p-3 bg-secondary rounded-lg text-center">
              <p className="text-lg font-bold">
                {tokenFormatted.amount} {tokenData?.symbol || "TOKEN"}
              </p>
              <p className="text-sm text-muted-foreground">
                ≈ {tokenFormatted.value} AVAX
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTradingInterface = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-background rounded-lg border">
        <h3 className="font-medium mb-4 text-center">Your Balance</h3>
        <div className="space-y-4">
          <div className="p-3 bg-secondary rounded-lg text-center">
            <p className="text-lg font-bold">{avaxFormatted.amount} AVAX</p>
            <p className="text-sm text-muted-foreground">
              Balance: {avaxFormatted.amount} AVAX
            </p>
          </div>
          <div className="p-3 bg-secondary rounded-lg text-center">
            <p className="text-lg font-bold">
              {tokenFormatted.amount} {tokenData?.symbol || "TOKEN"}
            </p>
            <p className="text-sm text-muted-foreground">
              ≈ {tokenFormatted.value} AVAX
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-background rounded-lg border">
        <h3 className="font-medium mb-4 text-center">Trade Information</h3>
        <div className="space-y-4">
          <div className="p-3 bg-secondary rounded-lg">
            <div className="flex justify-between items-center">
              <span>Current Price:</span>
              <span className="font-medium">
                {priceLoading
                  ? "Loading..."
                  : `${currentPrice || "0.000000"} AVAX`}
              </span>
            </div>
          </div>

          {/* Debug info */}
          <div className="p-2 bg-muted rounded text-xs space-y-1">
            <div>Collateral: {tokenData.collateral || "0"} AVAX</div>
            <div>Virtual Supply: {tokenData.virtualSupply || "0"}</div>
            <div>State: {tokenData.state}</div>
          </div>

          <div className="p-3 bg-secondary rounded-lg">
            <div className="flex justify-between items-center">
              <span>Price Impact:</span>
              <span
                className={getPriceImpactColor(tradeEstimation.priceImpact)}
              >
                {formatNumber(tradeEstimation.priceImpact)}%
              </span>
            </div>
            {getPriceImpactWarning(tradeEstimation.priceImpact) && (
              <div className="text-xs text-yellow-500 mt-1">
                {getPriceImpactWarning(tradeEstimation.priceImpact)}
              </div>
            )}
          </div>
          <div className="p-3 bg-secondary rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span>Slippage Tolerance:</span>
              <SlippageTolerance
                value={tradeEstimation.slippage}
                onChange={handleSlippageChange}
                disabled={!effectivelyConnected}
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-yellow-600">
              <span>⚠️</span>
              <span>UI only - contract protection not yet implemented</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-secondary rounded-lg border">
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
          <TabsContent value="buy">
            <BuyTokenForm
              maxAmount={avaxBalance?.formatted || "0"}
              onAmountChange={(amount: any) => handleAmountChange(amount, true)}
            />
          </TabsContent>
          <TabsContent value="sell">
            <SellTokenForm
              maxAmount={tokenBalance?.formatted || "0"}
              onAmountChange={(amount: any) =>
                handleAmountChange(amount, false)
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  const renderConnectWallet = () => (
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
  );

  // Safe state checking
  const isHalted =
    tokenData?.state === TokenState.GOAL_REACHED ||
    tokenData?.state === TokenState.HALTED;

  return (
    <Card className="w-full p-6">
      <CardHeader className="text-center pb-2 text-lg p-4">
        <CardTitle>
          Trade {tokenData?.symbol || "TOKEN"} (
          {tokenData?.name || "Unknown Token"})
        </CardTitle>
      </CardHeader>
      <AddressComponent hash={tokenData?.address || address} type="address" />

      <CardContent className="mt-4">
        {isHalted
          ? renderHaltedState()
          : effectivelyConnected
          ? renderTradingInterface()
          : renderConnectWallet()}
      </CardContent>
    </Card>
  );
}
