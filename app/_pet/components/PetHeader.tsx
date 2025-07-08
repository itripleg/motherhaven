// pet/components/PetHeader.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { RefreshCw, Heart, Skull, Timer, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PetHeaderProps, PET_TYPE_EMOJIS, PET_TYPE_NAMES } from "../types";

export const PetHeader: React.FC<PetHeaderProps> = ({
  petName,
  petType,
  isAlive,
  lastUpdate,
  onRefresh,
  isRefreshing,
  currentHealth,
  timeSinceLastFed,
}) => {
  const petEmoji = PET_TYPE_EMOJIS[petType] || "🐕";
  const petTypeName = PET_TYPE_NAMES[petType] || "Dog";

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  const getHealthColor = (health?: number) => {
    if (!health) return "text-gray-500";
    if (health >= 70) return "text-green-500";
    if (health >= 40) return "text-yellow-500";
    if (health >= 20) return "text-orange-500";
    return "text-red-500";
  };

  const getHealthBadgeVariant = (health?: number) => {
    if (!health) return "secondary";
    if (health >= 70) return "default"; // green
    if (health >= 40) return "secondary"; // yellow
    return "destructive"; // red
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 shadow-lg">
        <CardContent className="p-6">
          {/* Main Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Pet Info */}
            <div className="flex items-center gap-4">
              <div className="text-6xl">{petEmoji}</div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">{petName}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    {petTypeName}
                  </Badge>
                  <Badge
                    variant={isAlive ? "default" : "destructive"}
                    className="text-sm"
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
              </div>
            </div>

            {/* Quick Stats & Refresh */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Quick Stats */}
              <div className="flex flex-col sm:flex-row gap-3 text-sm">
                {/* Health */}
                {currentHealth !== undefined && (
                  <div className="flex items-center gap-2">
                    <Activity
                      className={`h-4 w-4 ${getHealthColor(currentHealth)}`}
                    />
                    <span className="text-muted-foreground">Health:</span>
                    <Badge
                      variant={getHealthBadgeVariant(currentHealth)}
                      className="font-mono"
                    >
                      {currentHealth}/100
                    </Badge>
                  </div>
                )}

                {/* Time Since Fed */}
                {timeSinceLastFed && (
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Last fed:</span>
                    <span className="font-medium">{timeSinceLastFed}</span>
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <div className="flex flex-col items-end gap-2">
                <Button
                  onClick={onRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                  className="min-w-[100px]"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  {isRefreshing ? "Updating..." : "Refresh"}
                </Button>

                {/* Last Update */}
                <span className="text-xs text-muted-foreground">
                  Updated: {formatLastUpdate(lastUpdate)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{isAlive ? "💭" : "☠️"}</div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    isAlive
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {isAlive
                    ? currentHealth !== undefined
                      ? currentHealth > 70
                        ? "I'm feeling great! Thanks for taking care of me! 🐕"
                        : currentHealth > 40
                        ? "I could use some food... but I'm hanging in there! 😊"
                        : currentHealth > 20
                        ? "I'm getting pretty hungry... please feed me soon! 😟"
                        : "I'm very weak... I need food urgently! 😰"
                      : "Woof! I'm doing great thanks to the community! 🐕"
                    : "I need to be revived... please help me! 💔"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This is a community pet that lives on the blockchain. Keep me
                  healthy by burning tokens!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
