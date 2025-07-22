// pet/components/PetStatusCard.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  AlertTriangle,
  Heart,
  DollarSign,
  Clock,
  Timer,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PetStatusCardProps } from "../types";

export const PetStatusCard: React.FC<PetStatusCardProps> = ({
  extendedPetInfo,
  revivalInfo,
  onRevive,
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
    <div className="space-y-6">
      {/* Revival Section (if dead) - Large prominent card */}
      {!extendedPetInfo.isAlive && revivalInfo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="unified-card border-2 border-destructive/50 bg-destructive/5">
            <CardHeader className="text-center pb-4">
              <div className="text-6xl mb-4">😢</div>
              <CardTitle className="text-2xl text-destructive">
                Pet Needs Revival
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-lg">
                  💀 {extendedPetInfo.name} has died and needs revival! Anyone can revive the pet by paying the revival cost.
                </AlertDescription>
              </Alert>

              {/* Revival Cost - Large display */}
              <div className="text-center p-8 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <DollarSign className="h-6 w-6 text-destructive" />
                  <span className="text-xl font-medium text-destructive">
                    Revival Cost
                  </span>
                </div>
                <div className="text-4xl font-bold text-destructive mb-2">
                  {formatAvax(revivalInfo.currentCost)} AVAX
                </div>
                {revivalInfo.deathCount > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Death #{revivalInfo.deathCount + 1} • Cost doubles each death
                  </div>
                )}
              </div>

              {/* Revival Button - Large and prominent */}
              <Button
                onClick={onRevive}
                disabled={!isConnected || isWritePending}
                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground h-14 text-lg"
                size="lg"
              >
                {isWritePending ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Reviving Pet...
                  </>
                ) : (
                  <>
                    <Heart className="h-5 w-5 mr-2" />
                    Revive & Become Caretaker
                  </>
                )}
              </Button>

              {!isConnected && (
                <p className="text-center text-sm text-muted-foreground">
                  Connect your wallet to revive the pet and become the new caretaker
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
      {/* Simple Pet Stats - Large, clean layout */}
      <Card className="unified-card">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Activity className="h-6 w-6 text-primary" />
            Pet Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-3xl font-bold text-primary mb-2">
                {extendedPetInfo.totalFeedings}
              </div>
              <div className="text-lg text-muted-foreground">Total Feeds</div>
            </div>

            <div className="text-center p-6 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                {extendedPetInfo.deathCount}
              </div>
              <div className="text-lg text-muted-foreground">Deaths</div>
            </div>

            <div className="text-center p-6 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                {extendedPetInfo.isAlive ? "Alive" : "Dead"}
              </div>
              <div className="text-lg text-muted-foreground">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Time-based Info Cards */}
      {extendedPetInfo.isAlive && timeUntilDecay ? (
        // When alive with decay timer - show both cards side by side
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="unified-card">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <Timer className="h-6 w-6 text-orange-500" />
                Next Health Decay
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-4xl font-bold text-orange-500">
                {Math.floor(timeUntilDecay / 60)}m {timeUntilDecay % 60}s
              </div>
              <div className="text-lg text-muted-foreground">
                Health will decrease by 1 point
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  💡 Feed before timer runs out!
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="unified-card">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <Clock className="h-6 w-6 text-blue-500" />
                Last Fed
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-4xl font-bold text-blue-500">
                {timeSinceLastFed && formatTimeSince
                  ? formatTimeSince(timeSinceLastFed)
                  : "Unknown"}
              </div>
              <div className="text-lg text-muted-foreground">
                Time since last feeding
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  ⏱️ Health decreases by 1 every hour
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // When dead or no decay timer - show last fed as single full-width card
        <Card className="unified-card">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Clock className="h-6 w-6 text-blue-500" />
              Last Fed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl font-bold text-blue-500">
              {timeSinceLastFed && formatTimeSince
                ? formatTimeSince(timeSinceLastFed)
                : "Unknown"}
            </div>
            {/* <div className="text-lg text-muted-foreground">
              Time since last feeding
            </div> */}
            {/* <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                ⏱️ Health decreases by 1 every hour
              </div>
            </div> */}
          </CardContent>
        </Card>
      )}



      {/* How It Works - Simple explanation */}
      <Card className="unified-card">
        <CardHeader>
          <CardTitle className="text-xl">How Pet Care Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="font-medium text-green-700 dark:text-green-300 mb-2">
                🍖 Feeding
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                Burn CHOW tokens to give your pet +1 to +50 health points
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="font-medium text-red-700 dark:text-red-300 mb-2">
                ⏱️ Health Decay
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">
                Pet health automatically decreases by 1 point every hour
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                💀 Death
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Pet dies when health reaches 0 - anyone can revive them
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="font-medium text-purple-700 dark:text-purple-300 mb-2">
                👑 Ownership
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                Reviver becomes new caretaker and can rename the pet
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};