// pet/components/CommunityStats.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Trophy,
  TrendingUp,
  Crown,
  Award,
  Star,
  BarChart3,
  Heart,
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
    <div className="space-y-8">
            {/* Community Overview */}
      <Card className="unified-card">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <BarChart3 className="h-6 w-6 text-primary" />
            Community Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-b from-blue-500/20 to-blue-500/10 rounded-lg border border-blue-500/30">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-blue-500 mb-2">
                ~{estimatedCommunitySize}
              </div>
              <div className="text-lg text-muted-foreground">
                Estimated Active Members
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Based on feeding patterns
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-b from-green-500/20 to-green-500/10 rounded-lg border border-green-500/30">
              <Heart className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-500 mb-2">
                {survivalRate}%
              </div>
              <div className="text-lg text-muted-foreground">Survival Rate</div>
              <div className="text-sm text-muted-foreground mt-2">
                Community care effectiveness
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-b from-orange-500/20 to-orange-500/10 rounded-lg border border-orange-500/30">
              <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-orange-500 mb-2">
                {petStats.totalFeedings > 100
                  ? "High"
                  : petStats.totalFeedings > 50
                  ? "Medium"
                  : "Growing"}
              </div>
              <div className="text-lg text-muted-foreground">
                Community Activity
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Based on total engagement
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
            <CardHeader className="text-center">
              <div className="text-6xl mb-4">{contributionLevel.icon}</div>
              <CardTitle className="text-3xl">
                {contributionLevel.level} Member
              </CardTitle>
              <p className="text-xl text-muted-foreground">
                {contributionLevel.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                <div className="text-4xl font-bold text-primary mb-2">
                  {userStats.feedingCount}
                </div>
                <div className="text-lg text-muted-foreground">
                  Your Total Contributions
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {userParticipation}% of all community feedings
                </div>
              </div>

              {/* Progress to Next Level */}
              {contributionLevel.nextLevel && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">
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
                    className="h-4"
                  />
                  <div className="text-center text-lg font-medium text-primary">
                    {contributionLevel.nextRequirement! -
                      userStats.feedingCount}{" "}
                    more feedings to reach {contributionLevel.nextLevel}!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}



      {/* Recognition Levels */}
      <Card className="unified-card">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Award className="h-6 w-6 text-primary" />
            Community Recognition Levels
          </CardTitle>
          <p className="text-muted-foreground">
            Earn recognition through your feeding contributions
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { level: "New", icon: "🆕", range: "0", color: "gray" },
              { level: "Newcomer", icon: "🌱", range: "1-4", color: "gray" },
              { level: "Friend", icon: "💙", range: "5-9", color: "blue" },
              { level: "Helper", icon: "🤝", range: "10-19", color: "green" },
              { level: "Hero", icon: "⭐", range: "20-49", color: "yellow" },
              { level: "Champion", icon: "👑", range: "50+", color: "purple" },
            ].map((levelInfo) => (
              <div
                key={levelInfo.level}
                className={`p-4 rounded-lg border transition-all ${
                  contributionLevel.level === levelInfo.level
                    ? "bg-primary/20 border-primary/50 ring-2 ring-primary/30 scale-105"
                    : "bg-muted/30 border-border/50 hover:bg-muted/50"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{levelInfo.icon}</div>
                  <div className="font-bold text-lg">{levelInfo.level}</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {levelInfo.range} feedings
                  </div>
                  {contributionLevel.level === levelInfo.level && (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Star className="h-3 w-3 mr-1" />
                      Your Level
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Community Achievements */}
      <Card className="unified-card">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Community Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-lg border ${
                petStats.totalFeedings >= 100
                  ? "bg-green-100 dark:bg-green-900/30 border-green-500/50"
                  : "bg-muted/30 border-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <div className="font-medium">Century Club</div>
                  <div className="text-sm text-muted-foreground">
                    100+ Community Feedings
                  </div>
                </div>
                {petStats.totalFeedings >= 100 && (
                  <Badge className="ml-auto bg-green-500/20 text-green-500">
                    ✓ Unlocked
                  </Badge>
                )}
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                survivalRate >= 90
                  ? "bg-green-100 dark:bg-green-900/30 border-green-500/50"
                  : "bg-muted/30 border-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">💚</div>
                <div>
                  <div className="font-medium">Life Savers</div>
                  <div className="text-sm text-muted-foreground">
                    90%+ Survival Rate
                  </div>
                </div>
                {survivalRate >= 90 && (
                  <Badge className="ml-auto bg-green-500/20 text-green-500">
                    ✓ Unlocked
                  </Badge>
                )}
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                estimatedCommunitySize >= 20
                  ? "bg-green-100 dark:bg-green-900/30 border-green-500/50"
                  : "bg-muted/30 border-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">👥</div>
                <div>
                  <div className="font-medium">Growing Community</div>
                  <div className="text-sm text-muted-foreground">
                    20+ Active Members
                  </div>
                </div>
                {estimatedCommunitySize >= 20 && (
                  <Badge className="ml-auto bg-green-500/20 text-green-500">
                    ✓ Unlocked
                  </Badge>
                )}
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                petStats.deathCount === 0
                  ? "bg-green-100 dark:bg-green-900/30 border-green-500/50"
                  : "bg-muted/30 border-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🛡️</div>
                <div>
                  <div className="font-medium">Guardian Angels</div>
                  <div className="text-sm text-muted-foreground">
                    Zero Deaths
                  </div>
                </div>
                {petStats.deathCount === 0 && (
                  <Badge className="ml-auto bg-green-500/20 text-green-500">
                    ✓ Unlocked
                  </Badge>
                )}
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
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground pt-4">
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