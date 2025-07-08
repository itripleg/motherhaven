// pet/components/PetStatusCard.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Skull,
  Activity,
  Timer,
  TrendingUp,
  Zap,
  RefreshCw,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { PetStatusCardProps, getHealthStatus } from "../types";

export const PetStatusCard: React.FC<PetStatusCardProps> = ({
  petStatus,
  userStats,
  onRevive,
  isConnected,
  isWritePending,
  revivalCost = "0.1",
  onUpdateHealth,
  currentHealth,
  timeSinceLastFed,
  formatTimeSince,
}) => {
  // Use current health if available, otherwise fall back to pet status health
  const displayHealth =
    currentHealth !== null && currentHealth !== undefined
      ? currentHealth
      : petStatus.health;
  const healthStatus = getHealthStatus(displayHealth || 0);

  // Format time since last fed
  const getTimeSinceLastFedDisplay = () => {
    if (timeSinceLastFed && formatTimeSince) {
      return formatTimeSince(timeSinceLastFed);
    }
    if (petStatus.lastFed) {
      const now = Date.now() / 1000;
      const diffSeconds = now - petStatus.lastFed;
      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      return hours > 0 ? `${hours}h ${minutes}m ago` : `${minutes}m ago`;
    }
    return "Unknown";
  };

  // Get urgency level for feeding
  const getFeedingUrgency = () => {
    const health = displayHealth || 0;
    if (!petStatus.isAlive) return "critical";
    if (health < 20) return "urgent";
    if (health < 50) return "moderate";
    return "low";
  };

  const urgency = getFeedingUrgency();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.6 }}
    >
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className={healthStatus.color} />
              Pet Status
            </div>
            {onUpdateHealth && petStatus.isAlive && (
              <Button
                onClick={onUpdateHealth}
                variant="outline"
                size="sm"
                disabled={isWritePending}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Update Health
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Health Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className={`h-5 w-5 ${healthStatus.color}`} />
                <span className="font-semibold">Health</span>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${healthStatus.color}`}>
                  {displayHealth || 0}/100
                </div>
                <Badge
                  variant={
                    healthStatus.status === "critical"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {healthStatus.status}
                </Badge>
              </div>
            </div>

            <Progress
              value={Math.max(0, Math.min(100, displayHealth || 0))}
              className="h-3"
            />

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <Separator />

          {/* Status Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Alive Status */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                {petStatus.isAlive ? (
                  <Heart className="h-4 w-4 text-green-500" />
                ) : (
                  <Skull className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">Status</span>
              </div>
              <Badge variant={petStatus.isAlive ? "default" : "destructive"}>
                {petStatus.isAlive ? "Alive" : "Dead"}
              </Badge>
            </div>

            {/* Last Fed */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Last Fed</span>
              </div>
              <span className="text-sm font-mono">
                {getTimeSinceLastFedDisplay()}
              </span>
            </div>

            {/* Total Feedings */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Total Feedings</span>
              </div>
              <span className="text-lg font-bold">
                {petStatus.totalFeedings || 0}
              </span>
            </div>

            {/* User Feedings (if connected) */}
            {isConnected && userStats && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Your Feedings</span>
                </div>
                <span className="text-lg font-bold">
                  {userStats.feedingCount}
                </span>
              </div>
            )}
          </div>

          {/* Action Section */}
          {!petStatus.isAlive ? (
            // Revival Section
            <>
              <Separator />
              <div className="space-y-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-red-700 dark:text-red-300">
                      💀 {petStatus.name} has died!
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      The pet&apos;s health reached zero and it has passed away.
                      You can revive it to bring it back to life!
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
                      <div className="text-sm">
                        <span className="font-medium">Revival Cost: </span>
                        <span className="font-mono text-lg">
                          {revivalCost} AVAX
                        </span>
                      </div>

                      <Button
                        onClick={onRevive}
                        disabled={!isConnected || isWritePending}
                        className="w-full sm:w-auto"
                        size="sm"
                      >
                        {isWritePending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Reviving...
                          </>
                        ) : (
                          <>
                            <Heart className="h-4 w-4 mr-2" />
                            Revive {petStatus.name}
                          </>
                        )}
                      </Button>
                    </div>

                    {!isConnected && (
                      <p className="text-xs text-muted-foreground">
                        Connect your wallet to revive the pet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Alive Section
            <>
              <Separator />
              <div
                className={`space-y-3 p-4 rounded-lg border ${
                  urgency === "urgent"
                    ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                    : urgency === "moderate"
                    ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
                    : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {urgency === "urgent"
                      ? "😰"
                      : urgency === "moderate"
                      ? "😊"
                      : "🥰"}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-semibold ${
                        urgency === "urgent"
                          ? "text-red-700 dark:text-red-300"
                          : urgency === "moderate"
                          ? "text-yellow-700 dark:text-yellow-300"
                          : "text-green-700 dark:text-green-300"
                      }`}
                    >
                      {urgency === "urgent"
                        ? `🆘 ${petStatus.name} needs food urgently!`
                        : urgency === "moderate"
                        ? `🍖 ${petStatus.name} is getting hungry`
                        : `✨ ${petStatus.name} is healthy and happy!`}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {urgency === "urgent"
                        ? "Health is critically low! Feed immediately or the pet will die."
                        : urgency === "moderate"
                        ? "Health is declining. Consider feeding soon to keep the pet healthy."
                        : "The pet is doing well! Regular feeding helps maintain good health."}
                    </p>

                    <div className="mt-3 text-xs text-muted-foreground">
                      <p>
                        💡 <strong>How to feed:</strong> Burn supported tokens
                        to increase health by 10 points.
                      </p>
                      <p>
                        ⏰ <strong>Health decay:</strong> Decreases by 1 point
                        every hour automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
