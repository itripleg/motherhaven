// pet/components/PetHeader.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Skull,
  Activity,
  Zap,
  TrendingDown,
  Clock,
  Crown,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAccount } from "wagmi";
import { PetHeaderProps } from "../types";

export const PetHeader: React.FC<PetHeaderProps> = ({
  petName,
  isAlive,
  currentHealth,
  currentCaretaker,
  deathCount = 0,
  revivalCost = "0",
  isUserCaretaker = false,
  timeSinceLastFed,
}) => {
  const { address } = useAccount();

  // Always show dog emoji since contract only supports dogs
  const petEmoji = "🐕";

  const getHealthStatus = (health?: number) => {
    if (!health)
      return {
        color: "text-gray-500",
        status: "Unknown",
        urgency: "none",
        bgColor: "bg-gray-500",
      };
    if (health >= 80)
      return {
        color: "text-green-500",
        status: "Excellent",
        urgency: "none",
        bgColor: "bg-green-500",
      };
    if (health >= 60)
      return {
        color: "text-lime-500",
        status: "Good",
        urgency: "none",
        bgColor: "bg-lime-500",
      };
    if (health >= 40)
      return {
        color: "text-yellow-500",
        status: "Fair",
        urgency: "low",
        bgColor: "bg-yellow-500",
      };
    if (health >= 20)
      return {
        color: "text-orange-500",
        status: "Poor",
        urgency: "medium",
        bgColor: "bg-orange-500",
      };
    return {
      color: "text-red-500",
      status: "Critical",
      urgency: "high",
      bgColor: "bg-red-500",
    };
  };

  const healthStatus = getHealthStatus(currentHealth);

  const getPetMessage = () => {
    if (!isAlive) {
      if (deathCount === 0) {
        return "I died for the first time... someone please revive me! 💔";
      } else if (deathCount <= 3) {
        return `I've died ${deathCount} times now... getting expensive to revive! 😢`;
      } else {
        return `I'm a veteran of ${deathCount} deaths... revival is very costly now! 👻`;
      }
    }

    if (currentHealth !== undefined) {
      if (currentHealth > 80)
        return "I'm feeling amazing! Thanks for all the CHOW! 🐕✨";
      if (currentHealth > 60)
        return "I'm doing great! Keep the CHOW coming! 😊";
      if (currentHealth > 40)
        return "I could use some more CHOW... getting a bit hungry! 🍖";
      if (currentHealth > 20)
        return "I'm getting pretty hungry... please burn some CHOW soon! 😟";
      return "I'm very weak... I need CHOW urgently or I'll die! 😰";
    }

    return "Woof! I'm doing great thanks to the community! 🐕";
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getCaretakerDisplay = () => {
    if (!currentCaretaker) return "Unknown";
    if (address && currentCaretaker.toLowerCase() === address.toLowerCase()) {
      return "You";
    }
    return formatAddress(currentCaretaker);
  };

  const formatTimeSince = (seconds?: number) => {
    if (!seconds) return "Unknown";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 shadow-lg overflow-hidden">
        {/* Critical health warning bar */}
        {isAlive && healthStatus.urgency === "high" && (
          <div className="h-1 bg-red-500 animate-pulse" />
        )}

        {/* Death warning bar */}
        {!isAlive && (
          <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
        )}

        <CardContent className="p-6 lg:p-8">
          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Pet Avatar & Identity */}
            <div className="lg:col-span-4 flex items-center gap-4">
              <div className="relative">
                <div
                  className={`text-7xl lg:text-8xl transition-all duration-300 ${
                    isAlive
                      ? healthStatus.urgency === "high"
                        ? "animate-bounce"
                        : ""
                      : "grayscale opacity-60"
                  }`}
                >
                  {petEmoji}
                </div>

                {/* Status indicator */}
                <div
                  className={`absolute -bottom-1 -right-1 w-6 h-6 lg:w-8 lg:h-8 rounded-full border-4 border-background flex items-center justify-center ${
                    isAlive ? "bg-green-500" : "bg-red-500"
                  } ${
                    isAlive && healthStatus.urgency === "high"
                      ? "animate-pulse"
                      : ""
                  }`}
                >
                  {isAlive ? "❤️" : "💀"}
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                  {petName}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Badge variant="outline" className="text-sm w-fit">
                    Community Dog
                  </Badge>
                  <Badge
                    variant={isAlive ? "default" : "destructive"}
                    className="text-sm w-fit"
                  >
                    {isAlive ? (
                      <>
                        <Heart className="h-3 w-3 mr-1" />
                        Alive
                      </>
                    ) : (
                      <>
                        <Skull className="h-3 w-3 mr-1" />
                        Dead
                      </>
                    )}
                  </Badge>
                  {deathCount > 0 && (
                    <Badge variant="outline" className="text-sm w-fit">
                      <Clock className="h-3 w-3 mr-1" />
                      Deaths: {deathCount}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  On Fuji Testnet
                </div>
              </div>
            </div>

            {/* Center: Health Status */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className={`h-5 w-5 ${healthStatus.color}`} />
                  <span className="text-lg font-semibold">Health Status</span>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl lg:text-3xl font-bold ${healthStatus.color}`}
                  >
                    {currentHealth !== undefined ? currentHealth : "?"}/100
                  </div>
                  <Badge
                    variant={
                      healthStatus.urgency === "high"
                        ? "destructive"
                        : "secondary"
                    }
                    className={`text-xs ${
                      healthStatus.urgency === "high" ? "animate-pulse" : ""
                    }`}
                  >
                    {healthStatus.status}
                  </Badge>
                </div>
              </div>

              {currentHealth !== undefined && (
                <div className="space-y-2">
                  <Progress
                    value={currentHealth}
                    className={`h-4 ${
                      healthStatus.urgency === "high" ? "animate-pulse" : ""
                    }`}
                  />
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      <span>-1 health per hour</span>
                    </div>
                    <span className="font-mono">0 ←→ 100</span>
                  </div>
                </div>
              )}

              {/* Last Fed Info */}
              {timeSinceLastFed !== null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Last fed: {formatTimeSince(timeSinceLastFed)}</span>
                </div>
              )}
            </div>

            {/* Right: Caretaker & Revival Info */}
            <div className="lg:col-span-3 space-y-3">
              {/* Caretaker Info */}
              <div className="text-center p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Crown
                    className={`h-4 w-4 ${
                      isUserCaretaker ? "text-yellow-500" : "text-blue-500"
                    }`}
                  />
                  <span className="text-sm font-medium">Current Caretaker</span>
                </div>
                <div
                  className={`text-sm ${
                    isUserCaretaker
                      ? "text-yellow-600 dark:text-yellow-400 font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {getCaretakerDisplay()}
                </div>
                {isUserCaretaker && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    <Crown className="h-2 w-2 mr-1" />
                    You own this pet
                  </Badge>
                )}
              </div>

              {/* Revival Cost (if dead) */}
              {!isAlive && (
                <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      Revival Cost
                    </span>
                  </div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    {revivalCost} AVAX
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {deathCount > 0 && `2^${deathCount} × base cost`}
                  </div>
                </div>
              )}

              {/* Live Status (if alive) */}
              {isAlive && (
                <div
                  className={`text-center p-3 rounded-lg border ${
                    healthStatus.urgency === "high"
                      ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                      : healthStatus.urgency === "medium"
                      ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800"
                      : "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                  }`}
                >
                  <div className="text-sm font-medium">
                    {healthStatus.urgency === "high"
                      ? "🚨 Feed Immediately!"
                      : healthStatus.urgency === "medium"
                      ? "⚠️ Getting Hungry"
                      : "✅ Healthy & Happy"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pet message footer */}
          <div className="mt-6 pt-4 border-t border-border/30">
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border">
              <div className="text-2xl flex-shrink-0">
                {isAlive
                  ? healthStatus.urgency === "high"
                    ? "😰"
                    : healthStatus.urgency === "medium"
                    ? "😊"
                    : "🥰"
                  : deathCount === 0
                  ? "😢"
                  : deathCount <= 3
                  ? "💸"
                  : "👻"}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-base lg:text-lg font-medium mb-2 ${
                    isAlive
                      ? healthStatus.urgency === "high"
                        ? "text-red-700 dark:text-red-300"
                        : "text-foreground"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {getPetMessage()}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>Burn CHOW tokens to feed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>+10 health per feed</span>
                  </div>
                  {!isAlive && (
                    <div className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      <span>Reviver becomes new caretaker</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Health decays automatically</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
