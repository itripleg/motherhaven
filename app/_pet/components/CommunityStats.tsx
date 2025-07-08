// pet/components/CommunityStats.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Zap,
  Trophy,
  Clock,
  TrendingUp,
  Heart,
  Info,
  Coins,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CommunityStatsProps } from "../types";

export const CommunityStats: React.FC<CommunityStatsProps> = ({
  petStats,
  userStats,
  isSimplified = false,
}) => {
  // Calculate user participation percentage
  const getUserParticipation = () => {
    if (!userStats || !petStats || petStats.totalFeedings === 0) return 0;
    return Math.round((userStats.feedingCount / petStats.totalFeedings) * 100);
  };

  const userParticipation = getUserParticipation();

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    suffix = "",
    color = "text-blue-500",
    description,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    suffix?: string;
    color?: string;
    description?: string;
  }) => (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color}`} />
        <div>
          <div className="font-medium text-sm">{label}</div>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold">
          {typeof value === "number" ? formatNumber(value) : value}
          {suffix}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Community Stats
            {isSimplified && (
              <Badge variant="outline" className="ml-2">
                Simplified
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Simplified Mode Notice */}
          {isSimplified && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Running in simplified mode. Some advanced statistics are not
                tracked in this version but will be available in the full
                implementation.
              </AlertDescription>
            </Alert>
          )}

          {/* Global Statistics */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Global Statistics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Total Feedings */}
              <StatCard
                icon={Zap}
                label="Total Feedings"
                value={petStats?.totalFeedings || 0}
                color="text-purple-500"
                description="Community meals provided"
              />

              {/* Total Feeders */}
              {!isSimplified ? (
                <StatCard
                  icon={Users}
                  label="Total Feeders"
                  value={petStats?.totalFeeders || 0}
                  color="text-blue-500"
                  description="Unique community members"
                />
              ) : (
                <StatCard
                  icon={Users}
                  label="Community Feeders"
                  value="Coming Soon"
                  color="text-gray-500"
                  description="Tracking in development"
                />
              )}

              {/* Total Tokens Burned */}
              {!isSimplified ? (
                <StatCard
                  icon={Coins}
                  label="Tokens Burned"
                  value={
                    petStats?.totalBurnedTokens
                      ? parseFloat(petStats.totalBurnedTokens).toFixed(2)
                      : "0"
                  }
                  color="text-orange-500"
                  description="Total tokens sacrificed"
                />
              ) : (
                <StatCard
                  icon={Coins}
                  label="Tokens Burned"
                  value="Coming Soon"
                  color="text-gray-500"
                  description="Tracking in development"
                />
              )}

              {/* Current Age */}
              {!isSimplified ? (
                <StatCard
                  icon={Clock}
                  label="Pet Age"
                  value={petStats?.currentAge || 0}
                  suffix="h"
                  color="text-green-500"
                  description="Hours since creation"
                />
              ) : (
                <StatCard
                  icon={Clock}
                  label="Pet Age"
                  value="∞"
                  color="text-green-500"
                  description="Eternal companion"
                />
              )}
            </div>
          </div>

          {/* Personal Statistics (if user connected) */}
          {userStats && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Your Contribution
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* User Feeding Count */}
                  <StatCard
                    icon={Heart}
                    label="Your Feedings"
                    value={userStats.feedingCount}
                    color="text-pink-500"
                    description="Meals you provided"
                  />

                  {/* Participation Percentage */}
                  <StatCard
                    icon={TrendingUp}
                    label="Participation"
                    value={userParticipation}
                    suffix="%"
                    color="text-indigo-500"
                    description="Of total community feedings"
                  />
                </div>

                {/* User Status Badge */}
                <div className="flex justify-center pt-2">
                  <Badge
                    variant={userStats.hasEverFed ? "default" : "secondary"}
                    className="px-4 py-2"
                  >
                    {userStats.hasEverFed ? (
                      <>
                        <Heart className="h-3 w-3 mr-1" />
                        Community Contributor
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3 mr-1" />
                        New Community Member
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </>
          )}

          {/* Historical Records (simplified version) */}
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Records
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {!isSimplified ? (
                <>
                  {/* Longest Survival */}
                  <StatCard
                    icon={Trophy}
                    label="Longest Survival"
                    value={petStats?.longestSurvival || 0}
                    suffix="h"
                    color="text-yellow-500"
                    description="Best community care record"
                  />

                  {/* Death Count */}
                  <StatCard
                    icon={Clock}
                    label="Deaths"
                    value={petStats?.deathCount || 0}
                    color="text-red-500"
                    description="Times pet needed revival"
                  />
                </>
              ) : (
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="font-medium text-sm">Community Goal</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Keep the pet alive through collective care! Historical
                    records will be tracked in the full version.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Community Message */}
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border">
            <Heart className="h-6 w-6 text-pink-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              Every feeding matters!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This pet belongs to everyone. By burning tokens, you&apos;re
              contributing to a shared digital companion that lives on the
              blockchain.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
