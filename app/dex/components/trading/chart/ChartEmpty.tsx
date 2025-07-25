// components/trading/chart/ChartEmpty.tsx
"use client";
import React from "react";
import { Token } from "@/types";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import { FACTORY_CONSTANTS } from "@/types";
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice";
import { Address } from "viem";

interface ChartEmptyProps {
  token: Token;
  height?: string;
}

export function ChartEmpty({
  token,
  height = "h-80 lg:h-96",
}: ChartEmptyProps) {
  const { formatted: currentPrice, isLoading: priceLoading } =
    useUnifiedTokenPrice(token.address as Address);

  // Get current price for display
  const getCurrentPrice = () => {
    if (!priceLoading && currentPrice && currentPrice !== "0.000000") {
      return currentPrice;
    }
    // Fallback to token's lastPrice
    if (token.lastPrice && parseFloat(token.lastPrice) > 0) {
      return formatTokenPrice(token.lastPrice);
    }
    // Final fallback to initial price
    return formatTokenPrice(FACTORY_CONSTANTS.INITIAL_PRICE);
  };

  const displayPrice = getCurrentPrice();

  return (
    <div
      className={`flex flex-col items-center justify-center ${height} space-y-4`}
    >
      <div className="text-center space-y-2">
        <div className="text-6xl opacity-20">📈</div>
        <p className="text-lg font-medium text-primary">
          Current Price: {displayPrice} AVAX
        </p>
        <p className="text-sm text-muted-foreground">
          Chart will show price history starting from{" "}
          {formatTokenPrice(FACTORY_CONSTANTS.INITIAL_PRICE)} AVAX
        </p>
      </div>
    </div>
  );
}
