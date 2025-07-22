"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccount } from "wagmi";
import {
  Gamepad2,
  Brain,
  Sword,
  Trophy,
  Users,
  Clock,
  Star,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Crown,
  Dice1,
  Puzzle,
  Flame,
  ChevronRight,
  TrendingUp,
  Play,
} from "lucide-react";
import Link from "next/link";

// Game interfaces
interface Game {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  category: "strategy" | "action" | "puzzle" | "casino" | "arcade";
  status: "live" | "beta" | "coming-soon" | "development";
  difficulty: "easy" | "medium" | "hard";
  players: "single" | "multi" | "both";
  minStake?: string;
  maxReward?: string;
  avgDuration: string;
  totalPlayers: number;
  activeGames: number;
  icon: React.ReactNode;
  gradient: string;
  route: string;
  features: string[];
  screenshots?: string[];
}

interface GameStats {
  totalGames: number;
  totalPlayers: number;
  totalRewards: string;
  topGame: string;
}

const GamesPortal: React.FC = () => {
  // Hydration fix
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [featuredGame, setFeaturedGame] = useState<string>("bigbrain-battle");

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Current available game
  const bigBrainGame: Game = {
    id: "bigbrain-battle",
    title: "BigBrain Battle Arena",
    description:
      "Challenge the AI in strategic battles of wit and intelligence. Burn BBT tokens to enter battles with varying difficulty levels. This game isn't currently running as we work on better games.",
    shortDescription: "Proof of concept implementing a burn manager game",
    category: "strategy",
    // status: "live",
    status: "development",
    difficulty: "easy",
    players: "single",
    minStake: "1,000 BBT",
    maxReward: "3x stake",
    avgDuration: "2-5 minutes",
    totalPlayers: 0,
    activeGames: 0,
    icon: <Brain className="h-6 w-6" />,
    gradient: "from-purple-600 to-blue-600",
    route: "/games/big-brain-battle",
    features: [
      "AI-powered opponents",
      "Multiple difficulty levels",
      "AVAX reward system",
      "Real-time battles",
      "Strategic gameplay",
    ],
  };

  const games: Game[] = [bigBrainGame];

  // Game stats based on our single game
  const gameStats: GameStats = {
    totalGames: bigBrainGame.totalPlayers,
    totalPlayers: bigBrainGame.totalPlayers,
    totalRewards: "127,450",
    topGame: "BigBrain Battle Arena",
  };

  // Category filters
  const categories = [
    { id: "all", label: "All Games", icon: <Gamepad2 className="h-4 w-4" /> },
    { id: "strategy", label: "Strategy", icon: <Brain className="h-4 w-4" /> },
    { id: "action", label: "Action", icon: <Sword className="h-4 w-4" /> },
    { id: "casino", label: "Casino", icon: <Dice1 className="h-4 w-4" /> },
    { id: "puzzle", label: "Puzzle", icon: <Puzzle className="h-4 w-4" /> },
    { id: "arcade", label: "Arcade", icon: <Zap className="h-4 w-4" /> },
  ];

  // Filter games by category
  const filteredGames =
    selectedCategory === "all"
      ? games
      : games.filter((game) => game.category === selectedCategory);

  const getStatusColor = (status: Game["status"]) => {
    switch (status) {
      case "live":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "beta":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "coming-soon":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "development":
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  const getDifficultyColor = (difficulty: Game["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "text-green-400";
      case "medium":
        return "text-yellow-400";
      case "hard":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  // Handle hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen animated-bg floating-particles">
        <div className="fixed inset-0 z-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 container mx-auto p-6 pt-24">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Gamepad2 className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-white text-lg">Loading Games Portal...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg floating-particles">
      {/* Background Stars Effect */}
      <div className="fixed inset-0 z-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto p-6 pt-24">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-4">
            <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30">
              <Gamepad2 className="h-10 w-10 text-primary" />
            </div>
            Games Portal
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-lg px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              Live Now
            </Badge>
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto">
            Big Brain Battle is the only game at the moment and it's not fun.
            More games are already in development though so stay tuned!
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 hidden"
        >
          <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {gameStats.totalGames.toLocaleString()}
              </p>
              <p className="text-sm text-purple-300">Total Games</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {gameStats.totalPlayers.toLocaleString()}
              </p>
              <p className="text-sm text-blue-300">Active Players</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Flame className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {gameStats.totalRewards}
              </p>
              <p className="text-sm text-green-300">BBT Rewards</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {gameStats.topGame}
              </p>
              <p className="text-sm text-orange-300">Most Popular</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Featured Game Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <Card className="unified-card group hover:scale-[1.01] transition-all duration-300 overflow-hidden max-w-4xl mx-auto">
            <div className={`h-3 bg-gradient-to-r ${bigBrainGame.gradient}`} />

            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-4 bg-gradient-to-r ${bigBrainGame.gradient} rounded-2xl text-white`}
                  >
                    {bigBrainGame.icon}
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white group-hover:text-primary transition-colors">
                      {bigBrainGame.title}
                    </CardTitle>
                    <p className="text-gray-400 text-lg">
                      {bigBrainGame.shortDescription}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={getStatusColor(bigBrainGame.status)}
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                  {bigBrainGame.status.replace("-", " ")}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <p className="text-gray-300 text-lg leading-relaxed">
                {bigBrainGame.description}
              </p>

              {/* Game Features */}
              <div className="space-y-3">
                <h4 className="text-white font-semibold">Game Features:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {bigBrainGame.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Star className="h-3 w-3 text-primary" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Game Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ">
                <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-gray-400 text-sm">Difficulty</p>
                  <p
                    className={`font-bold text-lg capitalize ${getDifficultyColor(
                      bigBrainGame.difficulty
                    )}`}
                  >
                    {bigBrainGame.difficulty}
                  </p>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="text-white font-bold text-lg">
                    {bigBrainGame.avgDuration}
                  </p>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-gray-400 text-sm">Total Players</p>
                  <p className="text-white font-bold text-lg">
                    {bigBrainGame.totalPlayers.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-gray-400 text-sm">Active Now</p>
                  <p className="text-white font-bold text-lg">
                    {bigBrainGame.activeGames}
                  </p>
                </div>
              </div>

              {/* Rewards Info */}
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/30">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Min Stake</p>
                  <p className="text-lg font-bold text-white">
                    {bigBrainGame.minStake}
                  </p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <p className="text-sm text-gray-400">Max Reward</p>
                  <p className="text-lg font-bold text-primary">
                    {bigBrainGame.maxReward}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6"
                >
                  <Link
                    href={bigBrainGame.route}
                    className="flex items-center justify-center gap-2"
                  >
                    <Play className="h-5 w-5" />
                    Start Battle
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 text-lg py-6"
                  asChild
                >
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="h-5 w-5" />
                    View Stats
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center py-12"
        >
          <Card className="unified-card max-w-3xl mx-auto">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-3">
                <h3 className="text-3xl font-bold text-gradient flex items-center justify-center gap-3">
                  <Target className="h-8 w-8 text-primary" />
                  Ready to Dominate?
                </h3>
                <p className="text-muted-foreground text-lg">
                  Challenge the AI in strategic battles and prove your
                  intelligence dominance
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="btn-primary group" asChild>
                  <Link
                    href="/games/big-brain-battle"
                    className="flex items-center gap-2"
                  >
                    <Brain className="h-5 w-5 group-hover:animate-pulse" />
                    Start Battle Arena
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="btn-secondary"
                  asChild
                >
                  <Link href="/dashboard">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    View Your Stats
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/50">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">1</p>
                  <p className="text-sm text-muted-foreground">Game Live</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">1.2K+</p>
                  <p className="text-sm text-muted-foreground">
                    Active Players
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">127K</p>
                  <p className="text-sm text-muted-foreground">BBT Rewards</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default GamesPortal;
