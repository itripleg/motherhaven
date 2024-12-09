// components/TokenHeader.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AddressComponent } from "@/components/AddressComponent";
import { useToken } from "@/contexts/TokenContext";

interface TokenHeaderProps {
  metadata: {
    address: `0x${string}`;
    name: string;
    symbol: string;
    imageUrl?: string | null; // Made optional and nullable
  };
}

export function TokenHeader({ metadata }: TokenHeaderProps) {
  const { price, collateral } = useToken();

  // Safely handle the image URL
  const backgroundImageStyle = metadata?.imageUrl
    ? {
        backgroundImage: `url(${metadata.imageUrl})`,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        height: "100%",
        width: "100%",
      }
    : {
        height: "100%",
        width: "100%",
      };

  // Safely handle all metadata properties
  if (!metadata?.address || !metadata?.name || !metadata?.symbol) {
    return (
      <Card className="relative overflow-hidden min-h-[300px]">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
        <div className="relative z-10 p-4">
          <p className="text-white">Loading token metadata...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden min-h-[300px]">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 z-0 bg-no-repeat"
        style={backgroundImageStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        <div className="p-4">
          <AddressComponent hash={metadata.address} type="address" />
        </div>
        <CardHeader>
          <CardTitle className="text-white text-3xl font-bold flex items-center gap-4">
            {metadata.name}
            <span className="text-2xl text-gray-300">({metadata.symbol})</span>
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
            </div>
            <div className="space-y-4">
              <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                <Label className="text-gray-200">Collateral</Label>
                <p className="text-white text-lg font-semibold">
                  {collateral}
                  <span className="text-gray-300"> AVAX</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Fallback Background */}
      {!metadata.imageUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
      )}
    </Card>
  );
}
