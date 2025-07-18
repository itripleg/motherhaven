// app/VanityNameManager/components/VanityNameLeaderboard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Crown,
  Award,
  Star,
  TrendingUp,
  Flame,
  Clock,
  Users,
  Coins,
  Calendar,
  Medal,
  Target,
  Zap,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Address } from "viem";
import { type VanityNameLeaderboardEntry } from "@/types/vanity";

interface LeaderboardEntry {
  rank: number;
  user: Address;
  vanityName: string;
  displayName: string;
  totalChanges: number;
  totalBurned: string;
  lastChanged: string;
  claimedAt: string;
  badges: string[];
  isCurrentUser?: boolean;
}

type LeaderboardCategory = "changes" | "burned" | "loyal" | "recent";

const MOCK_LEADERBOARD_DATA: Record<LeaderboardCategory, LeaderboardEntry[]> = {
  changes: [
    {
      rank: 1,
      user: "0x1234567890123456789012345678901234567890" as Address,
      vanityName: "degen",
      displayName: "DeGen",
      totalChanges: 12,
      totalBurned: "12000",
      lastChanged: "2024-12-15T10:30:00Z",
      claimedAt: "2024-01-15T10:00:00Z",
      badges: ["Power User", "Trendsetter", "Early Adopter"],
    },
    {
      rank: 2,
      user: "0x0987654321098765432109876543210987654321" as Address,
      vanityName: "cryptoking",
      displayName: "CryptoKing",
      totalChanges: 8,
      totalBurned: "8000",
      lastChanged: "2024-12-10T15:45:00Z",
      claimedAt: "2024-02-01T14:20:00Z",
      badges: ["Trendsetter", "Creative"],
    },
    {
      rank: 3,
      user: "0xabcdef1234567890abcdef1234567890abcdef12" as Address,
      vanityName: "moonwalker",
      displayName: "MoonWalker",
      totalChanges: 6,
      totalBurned: "6000",
      lastChanged: "2024-11-25T09:15:00Z",
      claimedAt: "2024-01-20T11:30:00Z",
      badges: ["Creative", "Active"],
    },
  ],
  burned: [
    {
      rank: 1,
      user: "0x1111222233334444555566667777888899990000" as Address,
      vanityName: "whalemode",
      displayName: "WhaleMode",
      totalChanges: 5,
      totalBurned: "25000",
      lastChanged: "2024-12-01T12:00:00Z",
      claimedAt: "2024-03-15T16:45:00Z",
      badges: ["Whale", "High Roller"],
    },
    {
      rank: 2,
      user: "0x1234567890123456789012345678901234567890" as Address,
      vanityName: "degen",
      displayName: "DeGen",
      totalChanges: 12,
      totalBurned: "12000",
      lastChanged: "2024-12-15T10:30:00Z",
      claimedAt: "2024-01-15T10:00:00Z",
      badges: ["Power User", "Trendsetter"],
    },
    {
      rank: 3,
      user: "0x2222333344445555666677778888999900001111" as Address,
      vanityName: "bigspender",
      displayName: "BigSpender",
      totalChanges: 4,
      totalBurned: "10000",
      lastChanged: "2024-11-20T14:30:00Z",
      claimedAt: "2024-04-10T09:20:00Z",
      badges: ["High Roller"],
    },
  ],
  loyal: [
    {
      rank: 1,
      user: "0x3333444455556666777788889999000011112222" as Address,
      vanityName: "diamondhands",
      displayName: "DiamondHands",
      totalChanges: 1,
      totalBurned: "1000",
      lastChanged: "2024-01-15T08:00:00Z",
      claimedAt: "2024-01-15T08:00:00Z",
      badges: ["Loyal", "Diamond Hands", "Early Adopter"],
    },
    {
      rank: 2,
      user: "0x4444555566667777888899990000111122223333" as Address,
      vanityName: "hodler",
      displayName: "HODLer",
      totalChanges: 1,
      totalBurned: "1000",
      lastChanged: "2024-02-01T10:00:00Z",
      claimedAt: "2024-02-01T10:00:00Z",
      badges: ["Loyal", "HODL Master"],
    },
    {
      rank: 3,
      user: "0x5555666677778888999900001111222233334444" as Address,
      vanityName: "steadyeddie",
      displayName: "SteadyEddie",
      totalChanges: 2,
      totalBurned: "2000",
      lastChanged: "2024-03-01T12:00:00Z",
      claimedAt: "2024-02-15T14:00:00Z",
      badges: ["Loyal", "Consistent"],
    },
  ],
  recent: [
    {
      rank: 1,
      user: "0x6666777788889999000011112222333344445555" as Address,
      vanityName: "newbie",
      displayName: "NewBie",
      totalChanges: 3,
      totalBurned: "3000",
      lastChanged: "2024-12-15T16:00:00Z",
      claimedAt: "2024-12-10T10:00:00Z",
      badges: ["Newcomer", "Active"],
    },
    {
      rank: 2,
      user: "0x7777888899990000111122223333444455556666" as Address,
      vanityName: "freshstart",
      displayName: "FreshStart",
      totalChanges: 2,
      totalBurned: "2000",
      lastChanged: "2024-12-14T14:30:00Z",
      claimedAt: "2024-12-01T09:00:00Z",
      badges: ["Newcomer"],
    },
    {
      rank: 3,
      user: "0x8888999900001111222233334444555566667777" as Address,
      vanityName: "rookie",
      displayName: "Rookie",
      totalChanges: 1,
      totalBurned: "1000",
      lastChanged: "2024-12-13T11:45:00Z",
      claimedAt: "2024-12-13T11:45:00Z",
      badges: ["Newcomer"],
    },
  ],
};

export function VanityNameLeaderboard() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] =
    useState<LeaderboardCategory>("changes");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRanks, setExpandedRanks] = useState<Set<number>>(new Set());

  const currentData = MOCK_LEADERBOARD_DATA[activeCategory];

  const refreshLeaderboard = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    toast({
      title: "Leaderboard Updated! 🏆",
      description: "Latest rankings have been loaded.",
    });
  };

  const toggleExpanded = (rank: number) => {
    const newExpanded = new Set(expandedRanks);
    if (newExpanded.has(rank)) {
      newExpanded.delete(rank);
    } else {
      newExpanded.add(rank);
    }
    setExpandedRanks(newExpanded);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied! 📋",
      description: "Wallet address has been copied to clipboard.",
    });
  };

  const viewOnExplorer = (address: string) => {
    window.open(`https://testnet.snowtrace.io/address/${address}`, "_blank");
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground">
              #{rank}
            </span>
          </div>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-yellow-400/30 bg-yellow-500/5";
      case 2:
        return "border-gray-400/30 bg-gray-500/5";
      case 3:
        return "border-amber-600/30 bg-amber-500/5";
      default:
        return "border-primary/20";
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Power User":
        return "bg-red-500/20 text-red-400 border-red-400/30";
      case "Trendsetter":
        return "bg-pink-500/20 text-pink-400 border-pink-400/30";
      case "Early Adopter":
        return "bg-purple-500/20 text-purple-400 border-purple-400/30";
      case "Creative":
        return "bg-blue-500/20 text-blue-400 border-blue-400/30";
      case "Loyal":
        return "bg-green-500/20 text-green-400 border-green-400/30";
      case "Whale":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-400/30";
      case "High Roller":
        return "bg-orange-500/20 text-orange-400 border-orange-400/30";
      case "Diamond Hands":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-400/30";
      case "HODL Master":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-400/30";
      case "Newcomer":
        return "bg-lime-500/20 text-lime-400 border-lime-400/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-400/30";
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  };

  const getCategoryInfo = (category: LeaderboardCategory) => {
    switch (category) {
      case "changes":
        return {
          title: "Most Changes",
          description: "Users who've changed their names the most",
          icon: RefreshCw,
          color: "text-blue-400",
        };
      case "burned":
        return {
          title: "Biggest Burners",
          description: "Users who've burned the most tokens",
          icon: Flame,
          color: "text-orange-400",
        };
      case "loyal":
        return {
          title: "Most Loyal",
          description: "Users who keep their names longest",
          icon: Star,
          color: "text-green-400",
        };
      case "recent":
        return {
          title: "New Adopters",
          description: "Recently joined users making waves",
          icon: Sparkles,
          color: "text-purple-400",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Leaderboard</h2>
            <p className="text-muted-foreground">
              Top users in the vanity name community
            </p>
          </div>
        </div>

        <Button
          onClick={refreshLeaderboard}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="bg-primary/10 hover:bg-primary/20 border-primary/30"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs
          value={activeCategory}
          onValueChange={(value) =>
            setActiveCategory(value as LeaderboardCategory)
          }
        >
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="changes" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Changes</span>
            </TabsTrigger>
            <TabsTrigger value="burned" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">Burned</span>
            </TabsTrigger>
            <TabsTrigger value="loyal" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Loyal</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Recent</span>
            </TabsTrigger>
          </TabsList>

          {/* Category Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value={activeCategory} className="mt-0">
                {/* Category Header */}
                <Card className="unified-card border-primary/20 mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg bg-primary/20 border border-primary/30`}
                      >
                        {React.createElement(
                          getCategoryInfo(activeCategory).icon,
                          {
                            className: `h-5 w-5 ${
                              getCategoryInfo(activeCategory).color
                            }`,
                          }
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {getCategoryInfo(activeCategory).title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {getCategoryInfo(activeCategory).description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Leaderboard List */}
                <div className="space-y-4">
                  {currentData.map((entry, index) => (
                    <motion.div
                      key={entry.user}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className={`unified-card ${getRankColor(entry.rank)} ${
                          entry.isCurrentUser ? "ring-2 ring-primary/50" : ""
                        } hover:border-primary/40 transition-all group`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Rank */}
                            <div className="flex-shrink-0">
                              {getRankIcon(entry.rank)}
                            </div>

                            {/* Avatar */}
                            <Avatar className="h-12 w-12 border-2 border-primary/20">
                              <AvatarImage
                                src={`https://avatar.vercel.sh/${entry.user}`}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {entry.displayName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-lg font-bold text-foreground">
                                      {entry.displayName}
                                    </h4>
                                    <Crown className="h-4 w-4 text-primary" />
                                    {entry.isCurrentUser && (
                                      <Badge className="bg-primary/20 text-primary border-primary/30">
                                        You
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {entry.user.slice(0, 6)}...
                                    {entry.user.slice(-4)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyAddress(entry.user)}
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => viewOnExplorer(entry.user)}
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpanded(entry.rank)}
                                    className="h-8 w-8 p-0"
                                  >
                                    {expandedRanks.has(entry.rank) ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Primary Stats */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-foreground">
                                    {entry.totalChanges} changes
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Coins className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-foreground">
                                    {entry.totalBurned} tokens
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-foreground">
                                    {getTimeAgo(entry.lastChanged)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-foreground">
                                    {getTimeAgo(entry.claimedAt)}
                                  </span>
                                </div>
                              </div>

                              {/* Badges */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                {entry.badges.map((badge) => (
                                  <Badge
                                    key={badge}
                                    className={`text-xs ${getBadgeColor(
                                      badge
                                    )}`}
                                  >
                                    {badge}
                                  </Badge>
                                ))}
                              </div>

                              {/* Expanded Details */}
                              <AnimatePresence>
                                {expandedRanks.has(entry.rank) && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="pt-4 border-t border-border"
                                  >
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                              Activity Score
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Progress
                                              value={Math.min(
                                                entry.totalChanges * 10,
                                                100
                                              )}
                                              className="h-2 flex-1"
                                            />
                                            <span className="text-sm font-medium text-foreground">
                                              {Math.min(
                                                entry.totalChanges * 10,
                                                100
                                              )}
                                              %
                                            </span>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                              Community Impact
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Progress
                                              value={Math.min(
                                                entry.badges.length * 25,
                                                100
                                              )}
                                              className="h-2 flex-1"
                                            />
                                            <span className="text-sm font-medium text-foreground">
                                              {entry.badges.length} badges
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-xs text-muted-foreground">
                                        Member since{" "}
                                        {new Date(
                                          entry.claimedAt
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>

      {/* Footer Info */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Rankings update every hour • Last updated:{" "}
          {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
