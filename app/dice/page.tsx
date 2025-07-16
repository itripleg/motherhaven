"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/craft";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  TrendingUp,
  Coins,
  Zap,
  Trophy,
  Target,
  History,
} from "lucide-react";

// Import dice components
import { DiceGame } from "./components/DiceGame";
import { DiceStats } from "./components/DiceStats";
import { DiceHistory } from "./components/DiceHistory";
import { BuyInModal } from "./components/BuyInModal";
import { DiceRules } from "./components/DiceRules";

// Dice icons array for random animation
const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export default function DicePage() {
  const [activeSection, setActiveSection] = useState<
    "game" | "stats" | "history"
  >("game");
  const [showBuyIn, setShowBuyIn] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [animatedDice, setAnimatedDice] = useState(0);

  // Animated dice icon rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedDice((prev) => (prev + 1) % DICE_ICONS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const AnimatedDiceIcon = DICE_ICONS[animatedDice];

  return (
    <div className="min-h-screen animated-bg floating-particles">
      <div className="container mx-auto pt-20 p-4">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              key={animatedDice}
              initial={{ scale: 0.8, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="p-3 bg-primary/20 rounded-xl border border-primary/30"
            >
              <AnimatedDiceIcon className="h-8 w-8 text-primary" />
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-bold text-gradient bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Magic Dice
            </h1>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-3 bg-primary/20 rounded-xl border border-primary/30"
            >
              <Zap className="h-8 w-8 text-primary" />
            </motion.div>
          </div>

          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Roll the dice and test your luck! Choose your range, place your bet,
            and watch the magic happen.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto mb-6">
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="p-3 text-center">
                <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-sm font-medium">Win Rate</div>
                <div className="text-xs text-muted-foreground">
                  Based on range
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="p-3 text-center">
                <Coins className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-sm font-medium">Dice Points</div>
                <div className="text-xs text-muted-foreground">
                  Your balance
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="p-3 text-center">
                <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-sm font-medium">Total Rolls</div>
                <div className="text-xs text-muted-foreground">All time</div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => setShowBuyIn(true)}
              className="btn-primary px-6 py-3 font-semibold"
            >
              <Coins className="h-4 w-4 mr-2" />
              Buy Dice Points
            </Button>
            <Button
              onClick={() => setShowRules(true)}
              variant="outline"
              className="px-6 py-3 font-semibold"
            >
              <Target className="h-4 w-4 mr-2" />
              How to Play
            </Button>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="flex bg-secondary/30 p-1 rounded-lg">
            {[
              { id: "game", label: "Play Game", icon: Dice1 },
              { id: "stats", label: "Statistics", icon: TrendingUp },
              { id: "history", label: "History", icon: History },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                variant={activeSection === tab.id ? "default" : "ghost"}
                className={`px-4 py-2 transition-all duration-200 ${
                  activeSection === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AnimatePresence mode="wait">
            {activeSection === "game" && (
              <motion.div
                key="game"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DiceGame />
              </motion.div>
            )}

            {activeSection === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DiceStats />
              </motion.div>
            )}

            {activeSection === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DiceHistory />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Modals */}
        <BuyInModal isOpen={showBuyIn} onClose={() => setShowBuyIn(false)} />

        <DiceRules isOpen={showRules} onClose={() => setShowRules(false)} />
      </div>
    </div>
  );
}
