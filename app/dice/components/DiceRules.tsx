"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Target,
  Coins,
  TrendingUp,
  Zap,
  Shield,
  Info,
  Dice1,
  Calculator,
  AlertTriangle,
  CheckCircle,
  DollarSign,
} from "lucide-react";

interface DiceRulesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiceRules({ isOpen, onClose }: DiceRulesProps) {
  const rules = [
    {
      icon: Target,
      title: "Choose Your Range",
      description:
        "Select a number range between 11-100. The narrower your range, the higher your potential payout!",
      example: "Range 45-55 = 11% win chance",
    },
    {
      icon: Coins,
      title: "Place Your Bet",
      description:
        "Use your DICE points to place a bet. Minimum bet is 0.001 DICE points.",
      example: "Bet 0.1 DICE points",
    },
    {
      icon: Zap,
      title: "Roll the Dice",
      description:
        "Click 'Roll Dice' and wait for Chainlink VRF to generate a truly random number between 1-100.",
      example: "Random number: 48",
    },
    {
      icon: TrendingUp,
      title: "Win or Lose",
      description:
        "If the random number falls within your chosen range, you win! Otherwise, you lose your bet.",
      example: "48 is in range 45-55 = WIN!",
    },
  ];

  const payoutExamples = [
    { range: "90-100", chance: "11%", multiplier: "9.09x" },
    { range: "40-60", chance: "21%", multiplier: "4.76x" },
    { range: "25-75", chance: "51%", multiplier: "1.96x" },
    { range: "11-100", chance: "90%", multiplier: "1.11x" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Dice1 className="h-6 w-6 text-primary" />
            How to Play Magic Dice
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Game Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <rule.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">
                          {index + 1}. {rule.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rule.description}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {rule.example}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Payout Examples */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Payout Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {payoutExamples.map((example, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="p-4 bg-secondary/30 rounded-lg border border-border/50"
                  >
                    <div className="text-center space-y-2">
                      <div className="text-lg font-bold text-primary">
                        {example.range}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {example.chance} chance
                      </div>
                      <div className="text-xl font-semibold text-foreground">
                        {example.multiplier}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        payout multiplier
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-center text-muted-foreground">
                  <Calculator className="h-4 w-4 inline mr-1" />
                  Formula: Payout = (100 ÷ Range Size) × Bet Amount
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-500/30 bg-green-500/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-500 mb-2">
                      Provably Fair
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Uses Chainlink VRF for true randomness</li>
                      <li>• All rolls are verifiable on-chain</li>
                      <li>• No house manipulation possible</li>
                      <li>• Transparent smart contract</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/30 bg-yellow-500/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-500 mb-2">
                      Important Notes
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Minimum bet range is 11-100</li>
                      <li>• Each roll costs LINK for VRF</li>
                      <li>• Results may take 10-60 seconds</li>
                      <li>• Only one roll at a time per user</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">
                    Getting Started
                  </h3>
                </div>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  First, you'll need to buy DICE points using AVAX. The exchange
                  rate is 1:1 (1 AVAX = 1 DICE Point). Then choose your range,
                  place your bet, and roll!
                </p>
                <div className="flex justify-center gap-4 pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <span>Buy DICE Points</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <span>Choose Range</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <span>Roll & Win!</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={onClose}
              className="btn-primary px-8 py-3 text-lg font-semibold"
            >
              Start Playing!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
