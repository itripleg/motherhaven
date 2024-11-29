import React from "react";
import { Card } from "@/components/ui/card";
import { TokenPriceChart } from "./charts/TokenPriceChart";
import { RechartsChart } from "./charts/RechartsChart";
import { TokenData } from "@/types";

interface TokenPriceChartsProps {
  tokenData: TokenData;
  price: number;
}

export function TokenPriceCharts({ tokenData, price }: TokenPriceChartsProps) {
  return (
    <>
      <Card className="h-[400px] p-2">
        <TokenPriceChart
          tokenAddress={tokenData.address}
          currentPrice={String(price)}
          tokenSymbol={tokenData.symbol}
        />
      </Card>
      <Card className="h-[400px] p-2">
        <RechartsChart
          tokenAddress={tokenData.address}
          currentPrice={String(price)}
          tokenSymbol={tokenData.symbol}
        />
      </Card>
    </>
  );
}
