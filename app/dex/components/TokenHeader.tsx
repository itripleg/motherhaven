import React from "react";
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
  console.log("Token data, is there state?", tokenData);
  return (
    <Card className="relative overflow-hidden min-h-[300px]">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 z-0 bg-no-repeat"
        style={{
          backgroundImage: tokenData.imageUrl
            ? `url(${tokenData.imageUrl})`
            : "none",
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
          <AddressComponent hash={tokenData.address} type="address" />
          <Badge
            className={`${stateDisplay.color} text-white px-3 py-1`}
            variant="outline"
          >
            {stateDisplay.text}
          </Badge>
        </div>
        <CardHeader>
          <CardTitle className="text-white text-3xl font-bold flex items-center gap-4">
            {tokenData.name}
            <span className="text-2xl text-gray-300">({tokenData.symbol})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                <Label className="text-gray-200">Current Price</Label>
                <p className="text-white text-lg font-semibold">
                  {price} <span className="text-gray-300">AVAX</span>
                </p>
              </div>
              {tokenData.fundingGoal && (
                <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                  <Label className="text-gray-200">Funding Goal</Label>
                  <p className="text-white text-lg font-semibold">
                    {tokenData.fundingGoal}{" "}
                    <span className="text-gray-300">AVAX</span>
                  </p>
                </div>
              )}
            </div>
            {tokenData.statistics && (
              <div className="space-y-4">
                <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                  <Label className="text-gray-200">Trading Volume</Label>
                  <p className="text-white text-lg font-semibold">
                    {tokenData.statistics.volumeETH}
                    <span className="text-gray-300">AVAX</span>
                  </p>
                </div>
              </div>
            )}
          </div>
          {tokenData.description && (
            <div className="mt-6 backdrop-blur-sm bg-white/10 p-4 rounded-lg">
              <Label className="text-gray-200">Description</Label>
              <p className="text-white mt-2">{tokenData.description}</p>
            </div>
          )}
        </CardContent>
      </div>

      {/* Fallback Background */}
      {!tokenData.imageUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
      )}
    </Card>
  );
}
