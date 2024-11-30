import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AddressComponent } from "@/components/AddressComponent";
import { TokenData } from "@/types";

interface TokenHeaderProps {
  tokenData: TokenData;
  price: number;
  tokenState: number;
}

export function TokenHeader({
  tokenData,
  price,
  tokenState,
}: TokenHeaderProps) {
  const getTokenStateText = (state: number) => {
    switch (state) {
      case 0:
        return "Not Created";
      case 1:
        return "Platform Trading";
      case 2:
        return "Goal Reached";
      default:
        return "Unknown";
    }
  };

  return (
    <Card className="relative overflow-hidden min-h-[300px]">
      <div
        className="absolute inset-0 z-0 bg-no-repeat"
        style={{
          backgroundImage: tokenData.imageUrl
            ? `url(${tokenData.imageUrl})`
            : "none",
          backgroundSize: "100% 100%", // Changed from cover
          backgroundPosition: "center",
          height: "100%",
          width: "100%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>

      <div className="relative z-10">
        <div className="p-4">
          <AddressComponent hash={tokenData.address} type="address" />
        </div>
        <CardHeader>
          <CardTitle className="text-white text-3xl font-bold">
            {tokenData.name} ({tokenData.symbol})
          </CardTitle>
          <CardDescription className="text-gray-200 text-lg">
            <p className="text-white text-lg font-semibold">
              {getTokenStateText(tokenState)}
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                <Label className="text-gray-200">Current Price</Label>
                <p className="text-white text-lg font-semibold">
                  {price} <span className="text-xs">AVAX</span>
                </p>
              </div>
            </div>
          </div>
          {tokenData.description && (
            <div className="mt-6 backdrop-blur-sm bg-white/10 p-4 rounded-lg">
              <Label className="text-gray-200">Description</Label>
              <p className="text-white mt-2">{tokenData.description}</p>
            </div>
          )}
        </CardContent>
      </div>

      {!tokenData.imageUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
      )}
    </Card>
  );
}
