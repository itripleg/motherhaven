// pet/components/PetStatusCard.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Skull,
  Timer,
  Zap,
  RefreshCw,
  Wallet,
  AlertTriangle,
  Clock,
  Calendar,
  TrendingDown,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    <div className="space-y-6">
      {/* Status Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Last Fed */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium">Last Fed</div>
                <div className="text-sm text-muted-foreground">
                  {getTimeSinceLastFedDisplay()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Feedings */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium">Total Feedings</div>
                <div className="text-sm text-muted-foreground">
                  {petStatus.totalFeedings || 0} times
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Stats (if connected) */}
        {isConnected && userStats && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium">Your Feedings</div>
                    <div className="text-sm text-muted-foreground">
                      {userStats.feedingCount} times
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Heart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="font-medium">Status</div>
                    <div className="text-sm text-muted-foreground">
                      {userStats.hasEverFed ? "Community Helper" : "New Member"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Action Section */}
      {!petStatus.isAlive ? (
        // Revival Section
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <Skull className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      💀 {petStatus.name} has died!
                    </h3>
                    <p className="text-sm">
                      The pet&apos;s health reached zero and it has passed away.
                      You can revive it to bring it back to life!
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Revival Cost:</span>
                      <Badge
                        variant="outline"
                        className="font-mono text-lg px-3 py-1"
                      >
                        {revivalCost} AVAX
                      </Badge>
                    </div>

                    <Button
                      onClick={onRevive}
                      disabled={!isConnected || isWritePending}
                      className="sm:ml-auto"
                      size="lg"
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
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        // Health Status Section
        <Card>
          <CardContent className="p-6">
            <div
              className={`space-y-4 p-4 rounded-lg border ${
                urgency === "urgent"
                  ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                  : urgency === "moderate"
                  ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
                  : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">
                  {urgency === "urgent"
                    ? "😰"
                    : urgency === "moderate"
                    ? "😊"
                    : "🥰"}
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-semibold text-lg mb-2 ${
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
                  <p className="text-sm text-muted-foreground mb-4">
                    {urgency === "urgent"
                      ? "Health is critically low! Feed immediately or the pet will die."
                      : urgency === "moderate"
                      ? "Health is declining. Consider feeding soon to keep the pet healthy."
                      : "The pet is doing well! Regular feeding helps maintain good health."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Health Update */}
      {onUpdateHealth && petStatus.isAlive && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Manual Health Update</div>
                <div className="text-sm text-muted-foreground">
                  Force refresh health from blockchain
                </div>
              </div>
              <Button
                onClick={onUpdateHealth}
                variant="outline"
                size="sm"
                disabled={isWritePending}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isWritePending ? "animate-spin" : ""
                  }`}
                />
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 Pet Care Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="font-medium mb-1">🕐 Check Regularly</div>
              <div className="text-muted-foreground">
                Health decreases automatically every hour
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="font-medium mb-1">🍖 Feed Early</div>
              <div className="text-muted-foreground">
                Don't wait until health is critical
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="font-medium mb-1">💰 Revival Costs</div>
              <div className="text-muted-foreground">
                {revivalCost} AVAX to bring pet back to life
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="font-medium mb-1">🤝 Community Pet</div>
              <div className="text-muted-foreground">
                Everyone can help care for {petStatus.name}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
