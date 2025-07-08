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
  Star,
  Activity,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
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

  // Get user contribution level
  const getContributionLevel = () => {
    if (!userStats || userStats.feedingCount === 0)
      return { level: "New", color: "text-gray-500", badge: "secondary" };
    if (userStats.feedingCount >= 50)
      return { level: "Champion", color: "text-purple-500", badge: "default" };
    if (userStats.feedingCount >= 20)
      return { level: "Hero", color: "text-yellow-500", badge: "default" };
    if (userStats.feedingCount >= 10)
      return { level: "Helper", color: "text-green-500", badge: "default" };
    if (userStats.feedingCount >= 5)
      return { level: "Friend", color: "text-blue-500", badge: "secondary" };
    return { level: "Newcomer", color: "text-gray-500", badge: "secondary" };
  };

  const contributionLevel = getContributionLevel();

  const StatCard = ({
    icon: Icon,
    label,
    value,
    suffix = "",
    color = "text-blue-500",
    description,
    highlight = false,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    suffix?: string;
    color?: string;
    description?: string;
    highlight?: boolean;
  }) => (
    <Card className={highlight ? "ring-2 ring-primary/50 bg-primary/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              highlight ? "bg-primary/20" : "bg-muted/50"
            }`}
          >
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">{label}</div>
            {description && (
              <div className="text-xs text-muted-foreground">{description}</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">
              {typeof value === "number" ? formatNumber(value) : value}
              {suffix}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Simplified Mode Notice */}
      {isSimplified && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Running in simplified mode. Advanced community analytics will be
            available in the full implementation.
          </AlertDescription>
        </Alert>
      )}

      {/* Community Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Community Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Zap}
              label="Total Feedings"
              value={petStats?.totalFeedings || 0}
              color="text-purple-500"
              description="Community meals provided"
              highlight={true}
            />

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
                description="Total CHOW sacrificed"
              />
            ) : (
              <StatCard
                icon={Coins}
                label="CHOW Burned"
                value="Live Tracking"
                color="text-orange-500"
                description="View on blockchain"
              />
            )}

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
                icon={Activity}
                label="Pet Status"
                value="Live"
                color="text-green-500"
                description="Real-time on chain"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Contribution (if user connected) */}
      {userStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Your Contribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contribution Level */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border">
              <div className="flex items-center gap-3">
                <Star className={`h-6 w-6 ${contributionLevel.color}`} />
                <div>
                  <div className="font-semibold">Contribution Level</div>
                  <div className="text-sm text-muted-foreground">
                    Based on your feeding activity
                  </div>
                </div>
              </div>
              <Badge
                variant={contributionLevel.badge as any}
                className="text-lg px-4 py-2"
              >
                {contributionLevel.level}
              </Badge>
            </div>

            {/* Personal Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                icon={Heart}
                label="Your Feedings"
                value={userStats.feedingCount}
                color="text-pink-500"
                description="Meals you provided"
                highlight={true}
              />

              <StatCard
                icon={TrendingUp}
                label="Participation"
                value={userParticipation}
                suffix="%"
                color="text-indigo-500"
                description="Of total community feedings"
              />
            </div>

            {/* Participation Progress */}
            {petStats && petStats.totalFeedings > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your contribution to community care</span>
                  <span className="font-mono">{userParticipation}%</span>
                </div>
                <Progress value={userParticipation} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {userStats.feedingCount} out of {petStats.totalFeedings} total
                  feedings
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Community Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Community Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isSimplified ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                icon={Trophy}
                label="Longest Survival"
                value={petStats?.longestSurvival || 0}
                suffix="h"
                color="text-yellow-500"
                description="Best community care record"
              />

              <StatCard
                icon={Calendar}
                label="Times Revived"
                value={petStats?.deathCount || 0}
                color="text-red-500"
                description="Pet revival count"
              />
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/20 rounded-lg">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <div className="font-medium text-lg mb-2">Community Goal</div>
              <div className="text-sm text-muted-foreground max-w-md mx-auto">
                Keep the pet alive through collective care! Historical records
                and leaderboards will be tracked in the full version.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How Community Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            How Community Pet Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">🤝 Shared Responsibility</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Anyone can feed the pet by burning CHOW tokens</p>
                <p>• Pet health is shared across all community members</p>
                <p>• Every feeding helps keep the pet alive for everyone</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">🏆 Recognition System</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Track your personal feeding contributions</p>
                <p>• Earn community status based on participation</p>
                <p>• Help build the longest survival record</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Contribution Levels */}
          <div className="space-y-3">
            <h4 className="font-medium">📈 Contribution Levels</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <div className="font-medium">Newcomer</div>
                <div className="text-muted-foreground">1-4 feeds</div>
              </div>
              <div className="text-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                <div className="font-medium">Friend</div>
                <div className="text-muted-foreground">5-9 feeds</div>
              </div>
              <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded">
                <div className="font-medium">Helper</div>
                <div className="text-muted-foreground">10-19 feeds</div>
              </div>
              <div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                <div className="font-medium">Hero</div>
                <div className="text-muted-foreground">20-49 feeds</div>
              </div>
              <div className="text-center p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                <div className="font-medium">Champion</div>
                <div className="text-muted-foreground">50+ feeds</div>
              </div>
              <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <div className="font-medium">New</div>
                <div className="text-muted-foreground">0 feeds</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Message */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div className="text-4xl">🤝</div>
            <h3 className="text-lg font-semibold">Stronger Together</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              This pet belongs to everyone in the community. Every CHOW token
              you burn helps keep our shared digital companion alive and
              healthy. Thank you for being part of this collective caring
              experience!
            </p>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              <span>🔗 On-chain pet care</span>
              <span>•</span>
              <span>🍖 CHOW token fuel</span>
              <span>•</span>
              <span>❤️ Community driven</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
