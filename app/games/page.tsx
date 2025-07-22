// app/games/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAccount } from "wagmi";
import {
  Gamepad2,
  Brain,
  Target,
  ArrowRight,
  Play,
  Clock,
  Users,
  Star,
  Construction,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface Game {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  status: "live" | "development" | "coming-soon";
  difficulty: "easy" | "medium" | "hard";
  avgDuration: string;
  icon: React.ReactNode;
  gradient: string;
  route: string;
  features: string[];
}

const GamesPortal: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Available games
  const games: Game[] = useMemo(
    () => [
      {
        id: "bigbrain-battle",
        title: "BigBrain Battle Arena",
        description:
          "Challenge the AI in strategic battles of wit and intelligence. A proof-of-concept game implementing our burn manager system. Currently in development as we work on creating more engaging gameplay mechanics.",
        shortDescription:
          "AI-powered strategy battles with token burning mechanics",
        status: "development",
        difficulty: "easy",
        avgDuration: "2-5 minutes",
        icon: <Brain className="h-6 w-6" />,
        gradient: "from-purple-600 to-blue-600",
        route: "/games/big-brain-battle",
        features: [
          "AI-powered opponents",
          "Token burn mechanics",
          "Strategic gameplay",
          "Proof of concept design",
        ],
      },
    ],
    []
  );

  // Background stars with memoization
  const backgroundStars = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: Math.random() * 5,
        animationDuration: 2 + Math.random() * 3,
      })),
    []
  );

  const getStatusColor = (status: Game["status"]) => {
    switch (status) {
      case "live":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "development":
        return "text-orange-400 bg-orange-500/20 border-orange-500/30";
      case "coming-soon":
        return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      default:
        return "text-muted-foreground bg-secondary/20 border-border/30";
    }
  };

  const getStatusIcon = (status: Game["status"]) => {
    switch (status) {
      case "live":
        return (
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        );
      case "development":
        return <Construction className="h-3 w-3" />;
      case "coming-soon":
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen animated-bg floating-particles flex items-center justify-center">
        <div className="text-center">
          <Gamepad2 className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-foreground text-lg">Loading Games Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg floating-particles">
      {/* Background Stars Effect */}
      <div className="fixed inset-0 z-0">
        {backgroundStars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: star.animationDuration,
              repeat: Infinity,
              delay: star.animationDelay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto p-4 md:p-6 pt-20 md:pt-24">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <div className="p-4 bg-primary/20 rounded-2xl border border-primary/30">
              <Gamepad2 className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              Games Portal
            </h1>
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-sm md:text-lg px-3 md:px-4 py-1 md:py-2">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              In Development
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto">
            BigBrain Battle is our first game prototype. More engaging games are
            in active development!
          </p>
        </motion.div>

        {/* Current Game Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          {games.map((game) => (
            <Card
              key={game.id}
              className="unified-card group hover:scale-[1.01] transition-all duration-300 overflow-hidden max-w-4xl mx-auto"
            >
              <div className={`h-3 bg-gradient-to-r ${game.gradient}`} />

              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-4 bg-gradient-to-r ${game.gradient} rounded-2xl text-white`}
                    >
                      {game.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors">
                        {game.title}
                      </CardTitle>
                      <p className="text-muted-foreground text-base md:text-lg">
                        {game.shortDescription}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={getStatusColor(game.status)}
                  >
                    {getStatusIcon(game.status)}
                    <span className="ml-2 capitalize">
                      {game.status.replace("-", " ")}
                    </span>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  {game.description}
                </p>

                {/* Game Features */}
                <div className="space-y-3">
                  <h4 className="text-foreground font-semibold">
                    Key Features:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {game.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Star className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Game Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <Target className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-muted-foreground text-sm">Difficulty</p>
                    <p className="text-foreground font-bold capitalize">
                      {game.difficulty}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-muted-foreground text-sm">Duration</p>
                    <p className="text-foreground font-bold">
                      {game.avgDuration}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20 col-span-2 md:col-span-1">
                    <Users className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-muted-foreground text-sm">Mode</p>
                    <p className="text-foreground font-bold">Single Player</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    asChild
                    size="lg"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-base md:text-lg py-6"
                    disabled={game.status === "development"}
                  >
                    <Link
                      href={game.route}
                      className="flex items-center justify-center gap-2"
                    >
                      {game.status === "development" ? (
                        <>
                          <Construction className="h-5 w-5" />
                          In Development
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5" />
                          Try Game
                          <ChevronRight className="h-5 w-5" />
                        </>
                      )}
                    </Link>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 text-base md:text-lg py-6"
                    asChild
                  >
                    <Link
                      href="/dashboard"
                      className="flex items-center justify-center gap-2"
                    >
                      <Target className="h-5 w-5" />
                      Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Card className="unified-card max-w-2xl mx-auto">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <Construction className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                    More Games Coming
                  </h3>
                </div>
                <p className="text-muted-foreground text-base md:text-lg">
                  We&apos;re actively developing new and exciting games. Stay
                  tuned for updates!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="btn-secondary"
                  asChild
                >
                  <Link href="/dashboard">
                    <Target className="h-5 w-5 mr-2" />
                    View Dashboard
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="btn-secondary"
                  asChild
                >
                  <Link href="/dex">
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Explore DEX
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default GamesPortal;
