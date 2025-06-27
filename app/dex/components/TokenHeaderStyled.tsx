import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AddressComponent } from "@/components/AddressComponent";
import { Progress } from "@/components/ui/progress";
import { useToken } from "@/contexts/TokenContext";
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import { Address, formatEther } from "viem";

interface TokenHeaderProps {
  address: string;
}

interface StateDisplay {
  text: string;
  color: string;
}

export const TokenHeaderStyled: React.FC<TokenHeaderProps> = ({ address }) => {
  const [progress, setProgress] = useState(0);

  // Get token metadata (name, symbol, image, etc.) from the TokenContext
  const { token, loading } = useToken(address);

  // Get real-time contract data from our centralized hook
  const { useTokenState, useCollateral, useCurrentPrice } =
    useFactoryContract();
  const { data: state } = useTokenState(address as Address);

  // Get raw bigint values for accurate calculations
  const { data: rawCollateral } = useCollateral(address as Address);
  const { data: rawCurrentPrice } = useCurrentPrice(address as Address);

  // Format the values using our unified formatting system
  const formattedCollateral = rawCollateral
    ? formatTokenPrice(formatEther(rawCollateral))
    : "0.000000";

  const formattedCurrentPrice = rawCurrentPrice
    ? formatTokenPrice(formatEther(rawCurrentPrice))
    : "0.000000";

  // Update progress bar animation when collateral changes
  useEffect(() => {
    // Use the raw bigint collateral for accurate percentage calculation
    if (token?.fundingGoal && rawCollateral) {
      const goalAmount = parseFloat(token.fundingGoal);
      const collateralAmount = parseFloat(formatEther(rawCollateral)); // Convert bigint to number
      const percentage =
        goalAmount > 0 ? (collateralAmount / goalAmount) * 100 : 0;

      // Animation logic
      const animateProgress = (
        start: number,
        end: number,
        duration: number
      ) => {
        const startTime = performance.now();
        const update = (currentTime: number) => {
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          setProgress(start + progress * (end - start));
          if (progress < 1) {
            requestAnimationFrame(update);
          }
        };
        requestAnimationFrame(update);
      };

      animateProgress(progress, Math.min(percentage, 100), 1000);
    }
  }, [token?.fundingGoal, rawCollateral, progress]); // Dependency on the raw value

  // Loading state while fetching initial token metadata
  if (loading || !token) {
    return (
      <Card className="min-h-[300px] flex items-center justify-center">
        <div className="p-8 text-gray-400">Loading token data...</div>
      </Card>
    );
  }

  const getStateDisplay = (state: number | undefined): StateDisplay => {
    const stateValue = state ?? 0;
    const stateMap: Record<number, StateDisplay> = {
      0: { text: "Not Created", color: "bg-red-500/80" },
      1: { text: "Trading", color: "bg-green-600/70" },
      2: { text: "Goal Reached", color: "bg-yellow-500/80" },
      3: { text: "Halted", color: "bg-red-500/80" },
      4: { text: "Resumed", color: "bg-green-600/70" },
    };
    return stateMap[stateValue] || { text: "Unknown", color: "bg-gray-500/80" };
  };

  const stateDisplay = getStateDisplay(state as number | undefined);

  // Format the funding goal with the same precision for consistency
  const formattedFundingGoal = token.fundingGoal
    ? formatTokenPrice(token.fundingGoal)
    : "0.000000";

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
          <AddressComponent hash={address} type="address" />
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
            {token.symbol && (
              <span className="text-2xl text-gray-300">({token.symbol})</span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                <Label className="text-gray-200">Current Price</Label>
                {/* Now using unified formatting for consistent precision */}
                <p className="text-white text-lg font-semibold">
                  {formattedCurrentPrice}{" "}
                  <span className="text-gray-300">AVAX</span>
                </p>
              </div>
            </div>
          </div>

          {/* Funding Progress */}
          {token.fundingGoal && token.fundingGoal !== "0" && (
            <div className="mt-6 backdrop-blur-sm bg-white/10 p-4 rounded-lg">
              <Label className="text-gray-200 mb-2 block">
                Funding Progress
              </Label>
              <Progress value={progress} className="h-2 mb-2" />
              <p className="text-white text-sm font-semibold">
                {progress.toFixed(2)}% - {formattedCollateral} /{" "}
                {formattedFundingGoal} AVAX
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
