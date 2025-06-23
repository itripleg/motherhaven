"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AddressComponent } from "@/components/AddressComponent";
import { Progress } from "@/components/ui/progress";
import { useToken } from "@/contexts/TokenContext";
import { Address } from "viem";
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { TokenState } from "@/types";

interface TokenHeaderProps {
  address: string;
}

interface StateDisplay {
  text: string;
  color: string;
}

export const TokenHeaderStyled: React.FC<TokenHeaderProps> = ({ address }) => {
  const [progress, setProgress] = useState(0);

  // 1. Get static/cached token data from our TokenContext
  const { token, loading: tokenLoading } = useToken(address as Address);

  // 2. Get the specific data-fetching hooks from our central factory hook
  const { useTokenState, useCollateral, useCurrentPrice, formatPriceDecimals } =
    useFactoryContract();

  // 3. Call each hook to get live, real-time data that updates automatically
  const { data: state } = useTokenState(address as Address);
  const { data: collateral } = useCollateral(address as Address);
  const { data: priceWei } = useCurrentPrice(address as Address);

  // 4. Use the centralized formatter for a consistent display
  const currentPriceDisplay = useMemo(() => {
    return formatPriceDecimals(priceWei as bigint);
  }, [priceWei, formatPriceDecimals]);

  // Update progress animation when collateral changes
  useEffect(() => {
    if (token?.fundingGoal && collateral) {
      const goalAmount = parseFloat(token.fundingGoal);
      const collateralAmount = parseFloat(collateral);
      const percentage =
        goalAmount > 0 ? (collateralAmount / goalAmount) * 100 : 0;
      setProgress(Math.min(percentage, 100));
    }
  }, [token?.fundingGoal, collateral]);

  // Main loading state is tied to fetching the core token info
  if (tokenLoading || !token) {
    return (
      <Card className="min-h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">Loading Token...</p>
      </Card>
    );
  }

  const getStateDisplay = (stateValue?: number): StateDisplay => {
    const stateMap: Record<number, StateDisplay> = {
      [TokenState.NOT_CREATED]: { text: "Not Created", color: "bg-red-500/80" },
      [TokenState.TRADING]: { text: "Trading", color: "bg-green-600/70" },
      [TokenState.GOAL_REACHED]: {
        text: "Goal Reached",
        color: "bg-yellow-500/80",
      },
      [TokenState.HALTED]: { text: "Halted", color: "bg-red-500/80" },
      [TokenState.RESUMED]: { text: "Resumed", color: "bg-green-600/70" },
    };
    return (
      stateMap[stateValue ?? -1] || {
        text: "Loading State...",
        color: "bg-gray-500/80",
      }
    );
  };

  // const stateDisplay = getStateDisplay(state);

  return (
    <Card className="relative overflow-hidden min-h-[300px]">
      {/* Background Image Layer */}
      {token.imageUrl && (
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-no-repeat"
            style={{
              backgroundImage: `url(${token.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          <div className="p-4 flex justify-between items-center">
            <AddressComponent hash={address} type="address" />
            <Badge
              // className={`${stateDisplay.color} text-white px-3 py-1`}
              variant="outline"
            >
              {/* {stateDisplay.text} */}
              {/* Some state display text */}❓
            </Badge>
          </div>
          <CardHeader className="pt-0">
            <CardTitle className="text-white text-3xl font-bold flex items-center gap-4">
              {token.name}
              {token.symbol && (
                <span className="text-2xl text-gray-300">({token.symbol})</span>
              )}
            </CardTitle>
          </CardHeader>
        </div>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
              <Label className="text-gray-200">Current Price</Label>
              <p className="text-white text-lg font-semibold truncate">
                {currentPriceDisplay}{" "}
                <span className="text-gray-300">AVAX</span>
              </p>
            </div>

            {token.fundingGoal && parseFloat(token.fundingGoal) > 0 && (
              <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                <Label className="text-gray-200">Funding Progress</Label>
                <Progress value={progress} className="h-2 my-2" />
                <p className="text-white text-sm font-semibold truncate">
                  {parseFloat(collateral || "0").toFixed(3)} /{" "}
                  {token.fundingGoal} AVAX
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};
