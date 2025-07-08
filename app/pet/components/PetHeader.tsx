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
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PetHeaderProps, PET_TYPE_EMOJIS, PET_TYPE_NAMES } from "../types";

export const PetHeader: React.FC<PetHeaderProps> = ({
  petName,
  petType,
  isAlive,
  currentHealth,
}) => {
  const petEmoji = PET_TYPE_EMOJIS[petType] || "🐕";
  const petTypeName = PET_TYPE_NAMES[petType] || "Dog";

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
    if (!isAlive) return "I need to be revived... please help me! 💔";

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
                      : "grayscale"
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
                    Community {petTypeName}
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
                </div>
                <div className="text-sm text-muted-foreground">
                  On Fuji Testnet • Auto-updates every 30s
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
            </div>

            {/* Right: Quick Stats */}
            <div className="lg:col-span-3 space-y-3">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <div className="text-center p-3 bg-muted/30 rounded-lg border">
                  <Users className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-bold">Live</div>
                  <div className="text-xs text-muted-foreground">Contract</div>
                </div>

                <div className="text-center p-3 bg-muted/30 rounded-lg border">
                  <Zap className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <div className="text-lg font-bold">+10</div>
                  <div className="text-xs text-muted-foreground">Per Feed</div>
                </div>
              </div>

              {/* Urgency indicator */}
              {isAlive && (
                <div
                  className={`text-center p-2 rounded-lg border text-xs font-medium ${
                    healthStatus.urgency === "high"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800 animate-pulse"
                      : healthStatus.urgency === "medium"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800"
                  }`}
                >
                  {healthStatus.urgency === "high"
                    ? "🚨 Feed Immediately!"
                    : healthStatus.urgency === "medium"
                    ? "⚠️ Getting Hungry"
                    : "✅ Healthy & Happy"}
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
                  : "☠️"}
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
                    <span>Each feed adds +10 health</span>
                  </div>
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
