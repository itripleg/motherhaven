import React from "react";
<<<<<<< Updated upstream
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AddressComponent } from "@/components/AddressComponent";
import { TokenData, TokenState } from "@/types";

interface TokenHeaderProps {
  tokenData: TokenData;
  price: number;
  tokenState: TokenState;
}

export function TokenHeader({
  tokenData,
  price,
  tokenState,
}: TokenHeaderProps) {
  const getTokenStateDisplay = (state: TokenState) => {
    switch (state) {
      case TokenState.NOT_CREATED:
        return {
          text: "Not Created",
          color: "bg-red-500/80",
        };
      case TokenState.TRADING:
        return {
          text: "Trading",
          color: "bg-green-600/70",
        };
      case TokenState.HALTED:
        return {
          text: "Goal Reached", // Using "Goal Reached" as the display text since that's currently the only way to halt
          color: "bg-blue-500/80",
        };
      default:
        return {
          text: "Unknown",
          color: "bg-gray-500/80",
        };
    }
  };

  const stateDisplay = getTokenStateDisplay(tokenState);
  // console.log("Token data, is there state?", tokenData);
=======
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AddressComponent } from "@/components/AddressComponent";
import { TokenState } from "@/types";
import {
  useToken,
  useTokenStats,
  useTokenMetadata,
} from "@/contexts/TokenContext";

export function TokenHeader() {
  const { token, loading, error } = useToken();
  const stats = useTokenStats();
  const metadata = useTokenMetadata();

  if (loading) {
    return (
      <Card className="min-h-[300px] animate-pulse">
        <div className="p-8 flex flex-col gap-4">
          <div className="h-8 bg-gray-200/20 rounded w-1/3" />
          <div className="h-6 bg-gray-200/20 rounded w-1/4" />
        </div>
      </Card>
    );
  }

  if (error || !token) {
    return (
      <Card className="min-h-[300px]">
        <div className="p-8 text-red-500">
          {error || "Token data not available"}
        </div>
      </Card>
    );
  }

  const getStateDisplay = (state: TokenState) => {
    const stateMap = {
      [TokenState.TRADING]: {
        text: "Trading",
        color: "bg-green-600/70",
      },
      [TokenState.HALTED]: {
        text: "Halted",
        color: "bg-yellow-500/80",
      },
      [TokenState.NOT_CREATED]: {
        text: "Not Created",
        color: "bg-red-500/80",
      },
      [TokenState.RESUMED]: {
        text: "Resumed",
        color: "bg-blue-500/80",
      },
    };

    return (
      stateMap[state] || {
        text: "Unknown",
        color: "bg-gray-500/80",
      }
    );
  };

  const stateDisplay = getStateDisplay(token.state);

>>>>>>> Stashed changes
  return (
    <Card className="relative overflow-hidden min-h-[300px]">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 z-0 bg-no-repeat"
        style={{
          backgroundImage: token.imageUrl ? `url(${token.imageUrl})` : "none",
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          height: "100%",
          width: "100%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        <div className="p-4 flex justify-between items-center">
          <AddressComponent hash={token.address} type="address" />
          <Badge
            className={`${stateDisplay.color} text-white px-3 py-1`}
            variant="outline"
          >
            {stateDisplay.text}
          </Badge>
        </div>

        <CardHeader>
          <CardTitle className="text-white text-3xl font-bold flex items-center gap-4">
            {token.name}
            <span className="text-2xl text-gray-300">({token.symbol})</span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                <Label className="text-gray-200">Current Price</Label>
                <p className="text-white text-lg font-semibold">
<<<<<<< Updated upstream
                  {price} <span className="text-gray-300">AVAX</span>
=======
                  {stats?.currentPrice || "0"}{" "}
                  <span className="text-gray-300">AVAX</span>
>>>>>>> Stashed changes
                </p>
              </div>
              {token.fundingGoal !== "0" && (
                <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                  <Label className="text-gray-200">Funding Goal</Label>
                  <p className="text-white text-lg font-semibold">
                    {token.fundingGoal}{" "}
                    <span className="text-gray-300">AVAX</span>
                  </p>
                </div>
              )}
            </div>
<<<<<<< Updated upstream
            {tokenData.statistics && (
              <div className="space-y-4">
                <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                  <Label className="text-gray-200">Trading Volume</Label>
                  <p className="text-white text-lg font-semibold">
                    {tokenData.statistics.volumeETH}
                    <span className="text-gray-300">AVAX</span>
                  </p>
                </div>
=======

            <div className="space-y-4">
              <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                <Label className="text-gray-200">24h Volume</Label>
                <p className="text-white text-lg font-semibold">
                  {stats?.volumeETH || "0"}
                  <span className="text-gray-300"> AVAX</span>
                </p>
              </div>
              <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                <Label className="text-gray-200">Unique Holders</Label>
                <p className="text-white text-lg font-semibold">
                  {stats?.uniqueHolders || 0}
                </p>
>>>>>>> Stashed changes
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Fallback Background */}
      {!token.imageUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
      )}
    </Card>
  );
}
