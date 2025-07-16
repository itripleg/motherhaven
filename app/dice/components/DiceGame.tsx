"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { useToast } from "@/hooks/use-toast";
import {
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Coins,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

// Contract ABI (you'll need to add this)
const DICE_ABI = [
  {
    inputs: [
      { internalType: "uint32", name: "_lowBet", type: "uint32" },
      { internalType: "uint32", name: "_highBet", type: "uint32" },
      { internalType: "uint256", name: "_betAmount", type: "uint256" },
    ],
    name: "roll",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentRoll",
    outputs: [
      { internalType: "uint32", name: "_lowBet", type: "uint32" },
      { internalType: "uint32", name: "_highBet", type: "uint32" },
      { internalType: "uint256", name: "_betAmount", type: "uint256" },
      { internalType: "uint256", name: "_rollResult", type: "uint256" },
      { internalType: "uint256", name: "_payout", type: "uint256" },
      { internalType: "bool", name: "_winner", type: "bool" },
      { internalType: "bool", name: "_rollInProgress", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint32", name: "_lowBet", type: "uint32" },
      { internalType: "uint32", name: "_highBet", type: "uint32" },
    ],
    name: "getWinProbability",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint32", name: "_lowBet", type: "uint32" },
      { internalType: "uint32", name: "_highBet", type: "uint32" },
      { internalType: "uint256", name: "_betAmount", type: "uint256" },
    ],
    name: "calculatePayout",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "totalRolls",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// You'll need to replace this with your actual contract address
const DICE_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export function DiceGame() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  // Game state
  const [betRange, setBetRange] = useState<[number, number]>([45, 55]);
  const [betAmount, setBetAmount] = useState("0.001");
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [animatedDice, setAnimatedDice] = useState(0);

  // Contract reads
  const { data: userBalance } = useReadContract({
    address: DICE_CONTRACT_ADDRESS,
    abi: DICE_ABI,
    functionName: "getUserBalance",
    args: [address],
    query: { enabled: !!address },
  });

  const { data: currentRoll } = useReadContract({
    address: DICE_CONTRACT_ADDRESS,
    abi: DICE_ABI,
    functionName: "getCurrentRoll",
    query: { refetchInterval: 2000 },
  });

  const { data: winProbability } = useReadContract({
    address: DICE_CONTRACT_ADDRESS,
    abi: DICE_ABI,
    functionName: "getWinProbability",
    args: [betRange[0], betRange[1]],
  });

  const { data: estimatedPayout } = useReadContract({
    address: DICE_CONTRACT_ADDRESS,
    abi: DICE_ABI,
    functionName: "calculatePayout",
    args: [betRange[0], betRange[1], parseEther(betAmount)],
  });

  const { data: totalRolls } = useReadContract({
    address: DICE_CONTRACT_ADDRESS,
    abi: DICE_ABI,
    functionName: "totalRolls",
  });

  // Contract writes
  const {
    writeContract,
    data: rollHash,
    error: rollError,
    isPending: isRollPending,
  } = useWriteContract();

  const { isLoading: isRollConfirming, data: rollReceipt } =
    useWaitForTransactionReceipt({
      hash: rollHash,
    });

  // Animated dice during roll
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRolling) {
      interval = setInterval(() => {
        setAnimatedDice((prev) => (prev + 1) % DICE_ICONS.length);
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isRolling]);

  // Monitor roll status
  useEffect(() => {
    if (currentRoll && Array.isArray(currentRoll) && currentRoll.length === 7) {
      const [
        lowBet,
        highBet,
        betAmount,
        rollResult,
        payout,
        winner,
        rollInProgress,
      ] = currentRoll;

      if (rollInProgress) {
        setIsRolling(true);
        setRollResult(null);
      } else if (rollResult !== 777n && rollResult !== 0n) {
        setIsRolling(false);
        setRollResult(Number(rollResult));

        if (winner) {
          toast({
            title: "🎉 You Won!",
            description: `Rolled ${rollResult}! You won ${formatEther(
              payout
            )} DICE points!`,
            duration: 5000,
          });
        } else {
          toast({
            title: "💸 You Lost",
            description: `Rolled ${rollResult}. Better luck next time!`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    }
  }, [currentRoll, toast]);

  // Handle roll errors
  useEffect(() => {
    if (rollError) {
      console.error("Roll error:", rollError);
      setIsRolling(false);
      toast({
        title: "Roll Failed",
        description: "Failed to roll dice. Please try again.",
        variant: "destructive",
      });
    }
  }, [rollError, toast]);

  // Handle successful roll transaction
  useEffect(() => {
    if (rollReceipt) {
      toast({
        title: "Roll Submitted!",
        description: "Waiting for Chainlink VRF to generate random number...",
      });
    }
  }, [rollReceipt, toast]);

  const handleRoll = useCallback(async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to play.",
        variant: "destructive",
      });
      return;
    }

    if (
      !userBalance ||
      (typeof userBalance === "bigint" && userBalance < parseEther(betAmount))
    ) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough DICE points to place this bet.",
        variant: "destructive",
      });
      return;
    }

    if (betRange[0] <= 10 || betRange[1] > 100) {
      toast({
        title: "Invalid Bet Range",
        description: "Bet range must be between 11-100.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRolling(true);
      setRollResult(null);

      writeContract({
        address: DICE_CONTRACT_ADDRESS,
        abi: DICE_ABI,
        functionName: "roll",
        args: [betRange[0], betRange[1], parseEther(betAmount)],
      });
    } catch (error) {
      console.error("Roll error:", error);
      setIsRolling(false);
      toast({
        title: "Roll Failed",
        description: "Failed to initiate roll. Please try again.",
        variant: "destructive",
      });
    }
  }, [isConnected, userBalance, betAmount, betRange, writeContract, toast]);

  const handleRangeChange = (values: number[]) => {
    setBetRange([values[0], values[1]]);
  };

  const resetGame = () => {
    setBetRange([45, 55]);
    setBetAmount("0.001");
    setRollResult(null);
    setIsRolling(false);
  };

  const getDiceIcon = (result: number) => {
    if (result <= 16) return Dice1;
    if (result <= 33) return Dice2;
    if (result <= 50) return Dice3;
    if (result <= 66) return Dice4;
    if (result <= 83) return Dice5;
    return Dice6;
  };

  const CurrentDiceIcon = isRolling
    ? DICE_ICONS[animatedDice]
    : rollResult
    ? getDiceIcon(rollResult)
    : Dice3;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Game Controls */}
      <Card className="unified-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Game Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bet Range */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              Bet Range: {betRange[0]} - {betRange[1]}
            </Label>
            <Slider
              value={betRange}
              onValueChange={handleRangeChange}
              max={100}
              min={11}
              step={1}
              className="w-full"
              disabled={isRolling}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Min: 11</span>
              <span>Max: 100</span>
            </div>
          </div>

          {/* Bet Amount */}
          <div className="space-y-2">
            <Label htmlFor="betAmount" className="text-base font-semibold">
              Bet Amount (DICE Points)
            </Label>
            <Input
              id="betAmount"
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              step="0.001"
              min="0.001"
              disabled={isRolling}
              className="text-center"
            />
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">
                {winProbability ? Number(winProbability) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Win Chance</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">
                {estimatedPayout
                  ? formatEther(estimatedPayout as bigint).slice(0, 6)
                  : "0"}
              </div>
              <div className="text-sm text-muted-foreground">Est. Payout</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleRoll}
              disabled={isRolling || isRollPending || isRollConfirming}
              className="flex-1 btn-primary py-6 text-lg font-semibold"
            >
              {isRolling || isRollPending || isRollConfirming ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Rolling...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Roll Dice
                </>
              )}
            </Button>
            <Button
              onClick={resetGame}
              variant="outline"
              disabled={isRolling}
              className="px-4"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Balance Display */}
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Your Balance:
              </span>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="font-semibold">
                  {userBalance
                    ? formatEther(userBalance as bigint).slice(0, 8)
                    : "0"}{" "}
                  DICE
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dice Display */}
      <Card className="unified-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Dice Roll
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            {/* Animated Dice */}
            <motion.div
              key={isRolling ? animatedDice : rollResult}
              initial={{ scale: 0.8, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 0.5,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
              className={`p-8 rounded-2xl border-2 ${
                isRolling
                  ? "bg-primary/20 border-primary/50 shadow-lg shadow-primary/20"
                  : rollResult !== null
                  ? rollResult >= betRange[0] && rollResult <= betRange[1]
                    ? "bg-green-500/20 border-green-500/50 shadow-lg shadow-green-500/20"
                    : "bg-red-500/20 border-red-500/50 shadow-lg shadow-red-500/20"
                  : "bg-secondary/30 border-border/50"
              }`}
            >
              <CurrentDiceIcon className="h-24 w-24 text-current" />
            </motion.div>

            {/* Roll Result */}
            <AnimatePresence mode="wait">
              {isRolling && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <div className="text-2xl font-bold text-primary mb-2">
                    Rolling...
                  </div>
                  <div className="text-muted-foreground">
                    Waiting for Chainlink VRF
                  </div>
                </motion.div>
              )}

              {rollResult !== null && !isRolling && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="text-4xl font-bold mb-2">{rollResult}</div>
                  <Badge
                    variant={
                      rollResult >= betRange[0] && rollResult <= betRange[1]
                        ? "default"
                        : "destructive"
                    }
                    className="text-lg px-4 py-2"
                  >
                    {rollResult >= betRange[0] && rollResult <= betRange[1] ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Winner!
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Try Again
                      </>
                    )}
                  </Badge>
                </motion.div>
              )}

              {rollResult === null && !isRolling && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="text-2xl font-bold text-muted-foreground mb-2">
                    Ready to Roll
                  </div>
                  <div className="text-muted-foreground">
                    Choose your range and bet amount
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Stats */}
            <div className="w-full max-w-md">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Total Rolls
                  </div>
                  <div className="text-lg font-semibold">
                    {totalRolls ? Number(totalRolls).toLocaleString() : "0"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Your Range
                  </div>
                  <div className="text-lg font-semibold">
                    {betRange[0]} - {betRange[1]}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
