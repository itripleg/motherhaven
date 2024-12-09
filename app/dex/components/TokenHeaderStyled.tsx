import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AddressComponent } from "@/components/AddressComponent";
import { Progress } from "@/components/ui/progress";
import { useToken } from '@/contexts/TokenContext';
import { useFactoryContract } from '@/new-hooks/useFactoryContract';

interface TokenHeaderProps {
  address: string;
}

interface StateDisplay {
  text: string;
  color: string;
}

export const TokenHeaderStyled: React.FC<TokenHeaderProps> = ({ address }) => {
  const { token, loading, error } = useToken(address);
  const [progress, setProgress] = useState(0);
  const { useCurrentPrice, formatPriceDecimals } = useFactoryContract();
  const { data: currentPrice } = useCurrentPrice(token?.address);

  // Progress animation effect
  useEffect(() => {
    if (token?.fundingGoal && token?.collateral) {
      const goalAmount = parseFloat(token.fundingGoal);
      const collateralAmount = parseFloat(token.collateral);
      const percentage = (collateralAmount / goalAmount) * 100;
      
      const start = 0;
      const end = Math.min(percentage, 100);
      const duration = 1500;
      const startTime = performance.now();

      const animateProgress = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        setProgress(start + progress * (end - start));

        if (progress < 1) {
          requestAnimationFrame(animateProgress);
        }
      };

      requestAnimationFrame(animateProgress);
    }
  }, [token?.fundingGoal, token?.collateral]);

  if (loading) {
    return (
      <Card className="min-h-[300px]">
        <div className="p-8">Loading token data...</div>
      </Card>
    );
  }

  if (error || !token) {
    return (
      <Card className="min-h-[300px]">
        <div className="p-8 text-red-500">{error || 'Token data not available'}</div>
      </Card>
    );
  }

  const getStateDisplay = (state: number): StateDisplay => {
    const stateMap: Record<number, StateDisplay> = {
      0: { text: "Not Created", color: "bg-red-500/80" },
      1: { text: "Trading", color: "bg-green-600/70" },
      2: { text: "Goal Reached", color: "bg-yellow-500/80" },
      3: { text: "Halted", color: "bg-red-500/80" },
      4: { text: "Resumed", color: "bg-green-600/70" }
    };

    return stateMap[state] || { text: "Unknown", color: "bg-gray-500/80" };
  };

  const stateDisplay = getStateDisplay(token.state);
  const formattedPrice = currentPrice ? formatPriceDecimals(currentPrice) : "0";
  const stats = token.stats || {};

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
      <div className="relative z-10">
        <div className="p-4 flex justify-between items-center">
          <AddressComponent hash={token.address} type="address" />
          <Badge className={`${stateDisplay.color} text-white px-3 py-1`} variant="outline">
            {stateDisplay.text}
          </Badge>
        </div>

        <CardHeader>
          <CardTitle className="text-white text-3xl font-bold flex items-center gap-4">
            {token.name}
            {token.symbol && (
              <span className="text-2xl text-gray-300">({token.symbol})</span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {formattedPrice !== "0" && (
                <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                  <Label className="text-gray-200">Current Price</Label>
                  <p className="text-white text-lg font-semibold">
                    {formattedPrice} <span className="text-gray-300">AVAX</span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {stats.volumeETH24h !== "0" && (
                <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                  <Label className="text-gray-200">24h Volume</Label>
                  <p className="text-white text-lg font-semibold">
                    {stats.volumeETH24h}
                    <span className="text-gray-300"> AVAX</span>
                  </p>
                </div>
              )}
              {stats.uniqueHolders > 0 && (
                <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                  <Label className="text-gray-200">Unique Holders</Label>
                  <p className="text-white text-lg font-semibold">
                    {stats.uniqueHolders}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Funding Progress */}
          {token.fundingGoal !== "0" && token.collateral && (
            <div className="mt-6 backdrop-blur-sm bg-white/10 p-4 rounded-lg">
              <Label className="text-gray-200 mb-2 block">Funding Progress</Label>
              <Progress value={progress} className="h-2 mb-2" />
              <p className="text-white text-sm font-semibold">
                {progress.toFixed(2)}% - {token.collateral} / {token.fundingGoal} AVAX
              </p>
            </div>
          )}
        </CardContent>
      </div>

      {/* Fallback Background */}
      {!token.imageUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
      )}
    </Card>
  );
};

export default TokenHeaderStyled;