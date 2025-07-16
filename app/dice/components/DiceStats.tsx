"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Coins,
  Trophy,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  Users,
  DollarSign,
  Percent,
  RefreshCw,
} from "lucide-react";

// Contract ABI for stats functions
const DICE_ABI = [
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalRolls",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

const DICE_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "green" | "red" | "blue";
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = "neutral",
  color = "primary",
}: StatCardProps) {
  const colorClasses = {
    primary: "text-primary bg-primary/10 border-primary/30",
    green: "text-green-500 bg-green-500/10 border-green-500/30",
    red: "text-red-500 bg-red-500/10 border-red-500/30",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/30",
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Activity,
  };

  const TrendIcon = trendIcons[trend];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card
        className={`border-2 ${colorClasses[color].split(" ")[2]} ${
          colorClasses[color].split(" ")[1]
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {title}
                </p>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <TrendIcon
                className={`h-4 w-4 ${
                  trend === "up"
                    ? "text-green-500"
                    : trend === "down"
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DiceStats() {
  const { address, isConnected } = useAccount();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Contract reads
  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: DICE_CONTRACT_ADDRESS,
    abi: DICE_ABI,
    functionName: "getUserBalance",
    args: [address],
    query: { enabled: !!address },
  });

  const { data: totalRolls, refetch: refetchRolls } = useReadContract({
    address: DICE_CONTRACT_ADDRESS,
    abi: DICE_ABI,
    functionName: "totalRolls",
  });

  const { data: contractBalance, refetch: refetchContract } = useReadContract({
    address: DICE_CONTRACT_ADDRESS,
    abi: DICE_ABI,
    functionName: "getContractBalance",
  });

  // Mock data for demo - replace with real data from your backend/events
  const [userStats, setUserStats] = useState({
    totalBets: 0,
    totalWins: 0,
    totalLosses: 0,
    totalWagered: "0",
    totalWon: "0",
    winRate: 0,
    averageBet: "0",
    biggestWin: "0",
    longestStreak: 0,
  });

  const [globalStats, setGlobalStats] = useState({
    totalPlayers: 156,
    totalVolume: "1,234.56",
    averageWinRate: 45.2,
    totalPayout: "987.34",
  });

  // Refresh all data
  const refreshData = async () => {
    await Promise.all([refetchBalance(), refetchRolls(), refetchContract()]);
    setLastUpdate(Date.now());
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchBalance, refetchRolls, refetchContract]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const userStatCards = [
    {
      title: "Your Balance",
      value: userBalance ? formatEther(userBalance as bigint).slice(0, 8) : "0",
      subtitle: "DICE Points",
      icon: Coins,
      color: "primary" as const,
    },
    {
      title: "Total Bets",
      value: userStats.totalBets.toString(),
      subtitle: "Rolls made",
      icon: Target,
      color: "blue" as const,
    },
    {
      title: "Win Rate",
      value: `${userStats.winRate.toFixed(1)}%`,
      subtitle: `${userStats.totalWins}W / ${userStats.totalLosses}L`,
      icon: Trophy,
      trend:
        userStats.winRate > 50
          ? ("up" as const)
          : userStats.winRate < 50
          ? ("down" as const)
          : ("neutral" as const),
      color:
        userStats.winRate > 50
          ? ("green" as const)
          : userStats.winRate < 50
          ? ("red" as const)
          : ("primary" as const),
    },
    {
      title: "Total Wagered",
      value: userStats.totalWagered,
      subtitle: "DICE Points",
      icon: DollarSign,
      color: "blue" as const,
    },
    {
      title: "Total Won",
      value: userStats.totalWon,
      subtitle: "DICE Points",
      icon: TrendingUp,
      color: "green" as const,
    },
    {
      title: "Biggest Win",
      value: userStats.biggestWin,
      subtitle: "DICE Points",
      icon: Zap,
      color: "green" as const,
    },
  ];

  const globalStatCards = [
    {
      title: "Total Rolls",
      value: totalRolls ? formatNumber(Number(totalRolls)) : "0",
      subtitle: "All time",
      icon: Activity,
      color: "primary" as const,
    },
    {
      title: "Total Players",
      value: formatNumber(globalStats.totalPlayers),
      subtitle: "Unique wallets",
      icon: Users,
      color: "blue" as const,
    },
    {
      title: "Contract Balance",
      value: contractBalance
        ? formatEther(contractBalance as bigint).slice(0, 8)
        : "0",
      subtitle: "DICE Points",
      icon: Coins,
      color: "primary" as const,
    },
    {
      title: "Global Win Rate",
      value: `${globalStats.averageWinRate}%`,
      subtitle: "Average across all players",
      icon: Percent,
      color: "green" as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Statistics</h2>
          <p className="text-muted-foreground">
            Your performance and global game stats
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
          <Button
            onClick={refreshData}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Personal Stats */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">Your Stats</h3>
          {!isConnected && (
            <Badge variant="outline" className="text-muted-foreground">
              Connect wallet to view
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userStatCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>

      {/* Global Stats */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">
            Global Stats
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {globalStatCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">
            Achievements
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: "First Roll",
              description: "Made your first dice roll",
              unlocked: userStats.totalBets > 0,
            },
            {
              title: "Lucky Streak",
              description: "Win 5 rolls in a row",
              unlocked: userStats.longestStreak >= 5,
            },
            {
              title: "High Roller",
              description: "Bet over 1 DICE in a single roll",
              unlocked: parseFloat(userStats.averageBet) > 1,
            },
            {
              title: "Risk Taker",
              description: "Win with a range smaller than 20",
              unlocked: false,
            },
            {
              title: "Consistent Player",
              description: "Make 100 total rolls",
              unlocked: userStats.totalBets >= 100,
            },
            {
              title: "Big Winner",
              description: "Win over 10 DICE in a single roll",
              unlocked: parseFloat(userStats.biggestWin) > 10,
            },
          ].map((achievement, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`${
                  achievement.unlocked
                    ? "border-green-500/50 bg-green-500/10"
                    : "border-border/50 bg-secondary/30"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        achievement.unlocked
                          ? "bg-green-500/20 text-green-500"
                          : "bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <h4
                        className={`font-semibold ${
                          achievement.unlocked
                            ? "text-green-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {achievement.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.unlocked && (
                      <Badge className="ml-auto bg-green-500 text-white">
                        Unlocked
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
