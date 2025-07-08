// pet/components/CommunityStats.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Zap,
  Skull,
  Heart,
  TrendingUp,
  Calendar,
  Crown,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CommunityStatsProps } from "../types";

export const CommunityStats: React.FC<CommunityStatsProps> = ({
  petStats,
  userStats,
}) => {
  if (!petStats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            Loading community stats...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate user participation percentage
  const getUserParticipation = () => {
    if (!userStats || !petStats || petStats.totalFeedings === 0) return 0;
    return Math.round((userStats.feedingCount / petStats.totalFeedings) * 100);
  };

  const userParticipation = getUserParticipation();

  // Get user contribution level based on feeding count
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
              {value}
              {suffix}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Community Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Community Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              icon={Zap}
              label="Total Community Feedings"
              value={petStats.totalFeedings}
              color="text-purple-500"
              description="Meals provided by all community members"
              highlight={true}
            />

            <StatCard
              icon={Skull}
              label="Pet Deaths"
              value={petStats.deathCount}
              color="text-red-500"
              description="Times the pet has died and been revived"
            />
          </div>
        </CardContent>
      </Card>

      {/* Your Contribution (if user has participated) */}
      {userStats && userStats.hasEverFed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Your Community Contribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contribution Level */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border">
              <div className="flex items-center gap-3">
                <Crown className={`h-6 w-6 ${contributionLevel.color}`} />
                <div>
                  <div className="font-semibold">Community Status</div>
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
                description="Meals you've provided to the pet"
                highlight={true}
              />

              <StatCard
                icon={TrendingUp}
                label="Community Share"
                value={userParticipation}
                suffix="%"
                color="text-indigo-500"
                description="Your percentage of total feedings"
              />
            </div>

            {/* Participation Progress */}
            {petStats.totalFeedings > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your contribution to community care</span>
                  <span className="font-mono">{userParticipation}%</span>
                </div>
                <Progress value={userParticipation} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {userStats.feedingCount} out of {petStats.totalFeedings} total
                  community feedings
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Community Leaderboard Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Community Recognition Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <div
                className={`text-center p-2 rounded transition-all ${
                  contributionLevel.level === "Newcomer"
                    ? "bg-primary/20 ring-2 ring-primary/50"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <div className="font-medium">Newcomer</div>
                <div className="text-muted-foreground">1-4 feeds</div>
              </div>
              <div
                className={`text-center p-2 rounded transition-all ${
                  contributionLevel.level === "Friend"
                    ? "bg-primary/20 ring-2 ring-primary/50"
                    : "bg-blue-100 dark:bg-blue-900/30"
                }`}
              >
                <div className="font-medium">Friend</div>
                <div className="text-muted-foreground">5-9 feeds</div>
              </div>
              <div
                className={`text-center p-2 rounded transition-all ${
                  contributionLevel.level === "Helper"
                    ? "bg-primary/20 ring-2 ring-primary/50"
                    : "bg-green-100 dark:bg-green-900/30"
                }`}
              >
                <div className="font-medium">Helper</div>
                <div className="text-muted-foreground">10-19 feeds</div>
              </div>
              <div
                className={`text-center p-2 rounded transition-all ${
                  contributionLevel.level === "Hero"
                    ? "bg-primary/20 ring-2 ring-primary/50"
                    : "bg-yellow-100 dark:bg-yellow-900/30"
                }`}
              >
                <div className="font-medium">Hero</div>
                <div className="text-muted-foreground">20-49 feeds</div>
              </div>
              <div
                className={`text-center p-2 rounded transition-all ${
                  contributionLevel.level === "Champion"
                    ? "bg-primary/20 ring-2 ring-primary/50"
                    : "bg-purple-100 dark:bg-purple-900/30"
                }`}
              >
                <div className="font-medium">Champion</div>
                <div className="text-muted-foreground">50+ feeds</div>
              </div>
              <div
                className={`text-center p-2 rounded transition-all ${
                  contributionLevel.level === "New"
                    ? "bg-primary/20 ring-2 ring-primary/50"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <div className="font-medium">New</div>
                <div className="text-muted-foreground">0 feeds</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How Community Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
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
                <p>• Health decays automatically at 1 point per hour</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">👑 Ownership & Revival</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Current caretaker can rename the pet</p>
                <p>• When pet dies, anyone can revive it</p>
                <p>• Reviver becomes the new caretaker/owner</p>
                <p>• Revival cost doubles with each death</p>
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
