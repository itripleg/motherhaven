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
  Crown,
  Activity,
  Award,
  Star,
  Target,
  BarChart3,
  Calendar,
  Trophy,
  Flame,
  Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CommunityStatsProps } from "../types";

export const CommunityStats: React.FC<CommunityStatsProps> = ({
  petStats,
  userStats,
}) => {
  if (!petStats) {
    return (
      <Card className="unified-card">
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
      return {
        level: "New",
        color: "text-muted-foreground",
        bgColor: "bg-muted/30",
        icon: "🆕",
        description: "Just getting started",
        nextLevel: "Newcomer",
        nextRequirement: 1,
      };
    if (userStats.feedingCount >= 50)
      return {
        level: "Champion",
        color: "text-purple-400",
        bgColor: "bg-purple-500/20 border-purple-500/30",
        icon: "👑",
        description: "Community hero - max level!",
        nextLevel: null,
        nextRequirement: null,
      };
    if (userStats.feedingCount >= 20)
      return {
        level: "Hero",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20 border-yellow-500/30",
        icon: "⭐",
        description: "Dedicated caretaker",
        nextLevel: "Champion",
        nextRequirement: 50,
      };
    if (userStats.feedingCount >= 10)
      return {
        level: "Helper",
        color: "text-green-400",
        bgColor: "bg-green-500/20 border-green-500/30",
        icon: "🤝",
        description: "Regular contributor",
        nextLevel: "Hero",
        nextRequirement: 20,
      };
    if (userStats.feedingCount >= 5)
      return {
        level: "Friend",
        color: "text-blue-400",
        bgColor: "bg-blue-500/20 border-blue-500/30",
        icon: "💙",
        description: "Caring member",
        nextLevel: "Helper",
        nextRequirement: 10,
      };
    return {
      level: "Newcomer",
      color: "text-gray-400",
      bgColor: "bg-gray-500/20 border-gray-500/30",
      icon: "🌱",
      description: "Learning the ropes",
      nextLevel: "Friend",
      nextRequirement: 5,
    };
  };

  const contributionLevel = getContributionLevel();

  // Calculate estimated community size (rough estimate based on total feedings)
  const estimatedCommunitySize = Math.max(
    1,
    Math.ceil(petStats.totalFeedings / 3)
  );

  // Calculate average feedings per community member
  const avgFeedingsPerMember =
    petStats.totalFeedings > 0
      ? (petStats.totalFeedings / estimatedCommunitySize).toFixed(1)
      : "0";

  // Calculate survival rate
  const survivalRate =
    petStats.deathCount > 0
      ? Math.round(
          (1 -
            petStats.deathCount /
              (petStats.totalFeedings + petStats.deathCount)) *
            100
        )
      : 100;

  return (
    <div className="space-y-6">
      {/* Your Community Recognition - Featured at Top */}
      {userStats && userStats.hasEverFed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            className={`unified-card border-2 ${contributionLevel.bgColor}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Your Community Recognition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recognition Level Display */}
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{contributionLevel.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {contributionLevel.level}
                    </h3>
                    <p className="text-muted-foreground">
                      {contributionLevel.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {userStats.feedingCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Feedings
                  </div>
                </div>
              </div>

              {/* Progress to Next Level */}
              {contributionLevel.nextLevel && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      Progress to {contributionLevel.nextLevel}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {userStats.feedingCount}/
                      {contributionLevel.nextRequirement}
                    </span>
                  </div>
                  <Progress
                    value={
                      (userStats.feedingCount /
                        contributionLevel.nextRequirement!) *
                      100
                    }
                    className="h-3"
                  />
                  <div className="text-sm text-muted-foreground">
                    {contributionLevel.nextRequirement! -
                      userStats.feedingCount}{" "}
                    more feedings to reach {contributionLevel.nextLevel}
                  </div>
                </div>
              )}

              {/* Personal Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">
                    {userParticipation}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Community Share
                  </div>
                </div>

                <div className="text-center p-4 bg-secondary/20 rounded-lg border border-border/50">
                  <Target className="h-5 w-5 text-secondary-foreground mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">
                    #
                    {Math.max(
                      1,
                      Math.ceil(
                        (petStats.totalFeedings - userStats.feedingCount) / 10
                      ) + 1
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Est. Rank</div>
                </div>

                <div className="text-center p-4 bg-accent/20 rounded-lg border border-border/50">
                  <Star className="h-5 w-5 text-accent-foreground mx-auto mb-2" />
                  <div className="text-2xl font-bold text-accent-foreground">
                    {userStats.feedingCount > 0
                      ? Math.round(
                          (userStats.feedingCount / petStats.totalFeedings) *
                            1000
                        ) / 10
                      : 0}
                    x
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Above Average
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Community Overview & Statistics */}
      <Card className="unified-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Community Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-b from-primary/20 to-primary/10 rounded-lg border border-primary/30">
              <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">
                {petStats.totalFeedings}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Feedings
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-b from-green-500/20 to-green-500/10 rounded-lg border border-green-500/30">
              <Users className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-500">
                ~{estimatedCommunitySize}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Members
              </div>
            </div>

            <div className="text-center p-4 bg-gradient-to-b from-red-500/20 to-red-500/10 rounded-lg border border-red-500/30">
              <Skull className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-500">
                {petStats.deathCount}
              </div>
              <div className="text-sm text-muted-foreground">Total Deaths</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-b from-blue-500/20 to-blue-500/10 rounded-lg border border-blue-500/30">
              <Heart className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-500">
                {survivalRate}%
              </div>
              <div className="text-sm text-muted-foreground">Survival Rate</div>
            </div>
          </div>

          {/* Community Health Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Community Activity
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm">Average feedings per member</span>
                  <Badge variant="outline" className="font-mono">
                    {avgFeedingsPerMember}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm">Feedings per death</span>
                  <Badge variant="outline" className="font-mono">
                    {petStats.deathCount > 0
                      ? Math.round(petStats.totalFeedings / petStats.deathCount)
                      : "∞"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm">Community engagement</span>
                  <Badge
                    variant="outline"
                    className={
                      petStats.totalFeedings > 100
                        ? "text-green-500 border-green-500/30"
                        : petStats.totalFeedings > 50
                        ? "text-yellow-500 border-yellow-500/30"
                        : "text-gray-500 border-gray-500/30"
                    }
                  >
                    {petStats.totalFeedings > 100
                      ? "High"
                      : petStats.totalFeedings > 50
                      ? "Medium"
                      : "Growing"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Community Achievements
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      petStats.totalFeedings >= 100
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <span className="text-sm flex-1">
                    100+ Community Feedings
                  </span>
                  {petStats.totalFeedings >= 100 && (
                    <Badge className="text-xs bg-green-500/20 text-green-500">
                      ✓
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      survivalRate >= 90 ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <span className="text-sm flex-1">90%+ Survival Rate</span>
                  {survivalRate >= 90 && (
                    <Badge className="text-xs bg-green-500/20 text-green-500">
                      ✓
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      estimatedCommunitySize >= 20
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <span className="text-sm flex-1">20+ Active Members</span>
                  {estimatedCommunitySize >= 20 && (
                    <Badge className="text-xs bg-green-500/20 text-green-500">
                      ✓
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How Community Works & Recognition */}
      <Card className="unified-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            How Community Pet Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Core Mechanics - 3 columns on large screens */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  🤝 Shared Responsibility
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <Flame className="h-4 w-4 text-primary mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Anyone can feed</div>
                      <div className="text-muted-foreground">
                        Burn CHOW tokens to feed the pet
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-secondary/20 rounded-lg border border-border/50">
                    <Heart className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Shared health</div>
                      <div className="text-muted-foreground">
                        Pet health affects everyone equally
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-accent/20 rounded-lg border border-border/50">
                    <Timer className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Automatic decay</div>
                      <div className="text-muted-foreground">
                        Health decreases by 1 every hour
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  👑 Ownership & Revival
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <Crown className="h-4 w-4 text-primary mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Caretaker privileges</div>
                      <div className="text-muted-foreground">
                        Current owner can rename the pet
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-secondary/20 rounded-lg border border-border/50">
                    <Skull className="h-4 w-4 text-red-500 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Revival system</div>
                      <div className="text-muted-foreground">
                        Anyone can revive and become owner
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-accent/20 rounded-lg border border-border/50">
                    <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Rising costs</div>
                      <div className="text-muted-foreground">
                        Revival cost doubles each death
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recognition Levels - 2 columns, more compact */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Recognition Levels
              </h4>

              <div className="space-y-1.5">
                {[
                  { level: "New", icon: "🆕", range: "0" },
                  { level: "Newcomer", icon: "🌱", range: "1-4" },
                  { level: "Friend", icon: "💙", range: "5-9" },
                  { level: "Helper", icon: "🤝", range: "10-19" },
                  { level: "Hero", icon: "⭐", range: "20-49" },
                  { level: "Champion", icon: "👑", range: "50+" },
                ].map((levelInfo) => (
                  <div
                    key={levelInfo.level}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-all ${
                      contributionLevel.level === levelInfo.level
                        ? "bg-primary/20 border-primary/50 ring-1 ring-primary/30"
                        : "bg-muted/30 border-border/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="text-base">{levelInfo.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {levelInfo.level}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {levelInfo.range} feeds
                      </div>
                    </div>
                    {contributionLevel.level === levelInfo.level && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-1.5 py-0">
                        You
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded-lg text-center">
                🏆 Earn levels through feeding contributions
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Message */}
      <Card className="unified-card">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="text-5xl">🤝</div>
            <h3 className="text-2xl font-bold text-gradient">
              Stronger Together
            </h3>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
              This pet belongs to everyone in the community. Every CHOW token
              you burn helps keep our shared digital companion alive and
              healthy. Your contributions matter and are recognized by the
              entire community!
            </p>
            <Separator className="my-6" />
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                🔗 <span>On-chain pet care</span>
              </span>
              <span className="flex items-center gap-2">
                🍖 <span>CHOW token fuel</span>
              </span>
              <span className="flex items-center gap-2">
                ❤️ <span>Community driven</span>
              </span>
              <span className="flex items-center gap-2">
                🏆 <span>Recognition system</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
