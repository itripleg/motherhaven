// pet/components/PetStatusCard.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  AlertTriangle,
  Heart,
  Skull,
  DollarSign,
  Clock,
  Zap,
  ArrowUp,
  ArrowDown,
  Info,
  Timer,
  Flame,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { PetStatusCardProps } from "../types";

export const PetStatusCard: React.FC<PetStatusCardProps> = ({
  extendedPetInfo,
  revivalInfo,
  onRevive,
  onUpdateHealth,
  isConnected,
  isWritePending,
  timeSinceLastFed,
  formatTimeSince,
}) => {
  if (!extendedPetInfo) {
    return (
      <Card className="unified-card">
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            Loading pet information...
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatAvax = (wei: bigint) => {
    return parseFloat((Number(wei) / 1e18).toFixed(4));
  };

  // Calculate time until next health decay
  const getTimeUntilNextDecay = () => {
    if (!timeSinceLastFed) return null;
    const secondsInHour = 3600;
    const timeSinceLastDecay = timeSinceLastFed % secondsInHour;
    const timeUntilNext = secondsInHour - timeSinceLastDecay;
    return timeUntilNext;
  };

  const timeUntilDecay = getTimeUntilNextDecay();

  return (
    <Card className="unified-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Pet Status & Mechanics
          </CardTitle>

          {/* Manual Refresh Button - Top Right */}
          {/* {extendedPetInfo.isAlive && onUpdateHealth && (
            <Button
              onClick={onUpdateHealth}
              disabled={isWritePending}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <RefreshCw
                className={`h-4 w-4 ${isWritePending ? "animate-spin" : ""}`}
              />
            </Button>
          )} */}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dynamic Status Information */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Current Status</h4>

          {/* Time-based Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">Last Fed</span>
              </div>
              <div className="text-xl font-bold">
                {timeSinceLastFed && formatTimeSince
                  ? formatTimeSince(timeSinceLastFed)
                  : "Unknown"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Health decays every hour
              </div>
            </div>

            {extendedPetInfo.isAlive && timeUntilDecay && (
              <div className="p-4 bg-secondary/20 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Next Health Decay</span>
                </div>
                <div className="text-xl font-bold">
                  {Math.floor(timeUntilDecay / 60)}m {timeUntilDecay % 60}s
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  -1 health point
                </div>
              </div>
            )}
          </div>

          {/* Pet Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Zap className="h-4 w-4 text-primary mx-auto mb-1" />
              <div className="text-lg font-bold">
                {extendedPetInfo.totalFeedings}
              </div>
              <div className="text-xs text-muted-foreground">Total Feeds</div>
            </div>

            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Skull className="h-4 w-4 text-red-500 mx-auto mb-1" />
              <div className="text-lg font-bold">
                {extendedPetInfo.deathCount}
              </div>
              <div className="text-xs text-muted-foreground">Deaths</div>
            </div>

            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Heart className="h-4 w-4 text-pink-500 mx-auto mb-1" />
              <div className="text-lg font-bold">
                {extendedPetInfo.isAlive ? "Alive" : "Dead"}
              </div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>

            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Activity className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <div className="text-lg font-bold">
                {extendedPetInfo.isAlive ? "Active" : "Inactive"}
              </div>
              <div className="text-xs text-muted-foreground">State</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Revival Section (if dead) */}
        {!extendedPetInfo.isAlive && revivalInfo && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    💀 {extendedPetInfo.name} has died and needs revival!
                  </p>
                  <p className="text-sm">
                    Anyone can revive the pet by paying the revival cost. The
                    reviver becomes the new caretaker and gains ownership.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Revival Cost Breakdown */}
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-destructive">
                  Revival Cost
                </span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-destructive">
                    {formatAvax(revivalInfo.currentCost)} AVAX
                  </div>
                  {revivalInfo.deathCount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Death #{revivalInfo.deathCount + 1} • Cost doubles each
                      death
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Progression */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Base cost: 0.1 AVAX</div>
                <div>
                  Current multiplier: 2^{revivalInfo.deathCount} ={" "}
                  {Math.pow(2, revivalInfo.deathCount)}x
                </div>
                <div>Maximum cost: {formatAvax(revivalInfo.maxCost)} AVAX</div>
              </div>
            </div>

            {/* Revival Effects */}
            <div className="space-y-2">
              <h4 className="font-medium">What happens when you revive:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 bg-green-100 dark:bg-green-900/30 rounded">
                  <Heart className="h-3 w-3 text-green-500" />
                  <span className="text-sm">Pet comes back to life</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                  <Activity className="h-3 w-3 text-blue-500" />
                  <span className="text-sm">Health restored to 50</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                  <Zap className="h-3 w-3 text-purple-500" />
                  <span className="text-sm">You become caretaker</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded">
                  <DollarSign className="h-3 w-3 text-orange-500" />
                  <span className="text-sm">Payment to previous owner</span>
                </div>
              </div>
            </div>

            {/* Revival Button */}
            <Button
              onClick={onRevive}
              disabled={!isConnected || isWritePending}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              size="lg"
            >
              {isWritePending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reviving Pet...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Revive for {formatAvax(revivalInfo.currentCost)} AVAX & Become
                  Caretaker
                </>
              )}
            </Button>

            {!isConnected && (
              <p className="text-xs text-center text-muted-foreground">
                Connect your wallet to revive the pet and become the new
                caretaker
              </p>
            )}

            <Separator />
          </div>
        )}

        {/* How Pet Mechanics Work */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            How Pet Mechanics Work
          </h4>

          {/* Core Mechanics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h5 className="font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Health System
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="flex items-center gap-2">
                    <ArrowUp className="h-3 w-3 text-green-500" />
                    Feeding gives health
                  </span>
                  <Badge
                    variant="outline"
                    className="text-green-500 border-green-500/30 text-xs"
                  >
                    +1 to +50 HP
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="flex items-center gap-2">
                    <ArrowDown className="h-3 w-3 text-red-500" />
                    Time causes decay
                  </span>
                  <Badge
                    variant="outline"
                    className="text-red-500 border-red-500/30 text-xs"
                  >
                    -1 HP/hour
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span className="flex items-center gap-2">
                    <Skull className="h-3 w-3 text-gray-500" />
                    Death at 0 health
                  </span>
                  <Badge
                    variant="outline"
                    className="text-gray-500 border-gray-500/30 text-xs"
                  >
                    Revival needed
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="font-medium flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Feeding Process
              </h5>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-primary/10 rounded border border-primary/20">
                  <div className="font-medium text-primary text-xs">
                    Burn CHOW Tokens
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tokens are permanently destroyed
                  </div>
                </div>
                <div className="p-2 bg-secondary/20 rounded border border-border/50">
                  <div className="font-medium text-xs">Scaled Health Gain</div>
                  <div className="text-xs text-muted-foreground">
                    More tokens = more health
                  </div>
                </div>
                <div className="p-2 bg-accent/20 rounded border border-border/50">
                  <div className="font-medium text-xs">Community Effect</div>
                  <div className="text-xs text-muted-foreground">
                    Helps everyone&apos;s shared pet
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Reference Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded">
              <div className="text-sm font-bold text-green-600 dark:text-green-400">
                100
              </div>
              <div className="text-xs text-muted-foreground">Max Health</div>
            </div>
            <div className="text-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                1-50
              </div>
              <div className="text-xs text-muted-foreground">Health/Feed</div>
            </div>
            <div className="text-center p-2 bg-red-100 dark:bg-red-900/30 rounded">
              <div className="text-sm font-bold text-red-600 dark:text-red-400">
                -1
              </div>
              <div className="text-xs text-muted-foreground">Health/Hour</div>
            </div>
            <div className="text-center p-2 bg-orange-100 dark:bg-orange-900/30 rounded">
              <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
                0
              </div>
              <div className="text-xs text-muted-foreground">Death Point</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
