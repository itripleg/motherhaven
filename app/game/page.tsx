"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Wallet,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

// Import your game components
import GameDashboard from "./components/GameDashboard";
import GameTypeBattle from "./components/GameTypeBattle";
import ActiveGamesList from "./components/ActiveGamesList";
import GameHistoryLog from "./components/GameHistoryLog";

// Real Web3 hooks
import { useAccount, useConnect } from "wagmi";
import {
  useGameContract,
  GameType,
  GameOutcome,
} from "@/new-hooks/useGameContract";

// Types
interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  activeGames: number;
  totalBurned: string;
  totalRewards: string;
}

interface ActiveGame {
  gameId: number;
  gameType: "QUICK_BATTLE" | "ARENA_FIGHT" | "BOSS_BATTLE";
  burnedAmount: string;
  startTime: number;
  expectedReward: string;
  status: "WAITING_AI" | "PROCESSING" | "ALMOST_READY";
}

interface CompletedGame {
  gameId: number;
  gameType: "QUICK_BATTLE" | "ARENA_FIGHT" | "BOSS_BATTLE";
  outcome: "PLAYER_VICTORY" | "AI_VICTORY" | "DRAW" | "EPIC_VICTORY";
  burnedAmount: string;
  rewardAmount: string;
  aiMessage: string;
  startTime: number;
  endTime: number;
  duration: number;
}

const GamePage: React.FC = () => {
  // Wallet connection
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { toast } = useToast();

  // Game contract integration
  const {
    bbtBalance,
    gameStats: contractGameStats,
    playerGameIds,
    activeGameIds,
    isBalanceLoading,
    isGameStatsLoading,
    isPlayerGamesLoading,
    isActiveGamesLoading,
    burnTokens,
    isWritePending,
    useGame,
    useGameConfig,
    getGameTypeName,
    getOutcomeName,
    refreshAllData,
    lastEventUpdate,
  } = useGameContract();

  // Component state
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Memoize stable game stats to prevent unnecessary rerenders
  const gameStats = useMemo(
    () => ({
      totalGames: contractGameStats.totalGames,
      wins: 0, // TODO: Calculate from completed games
      losses: 0, // TODO: Calculate from completed games
      draws: 0, // TODO: Calculate from completed games
      activeGames: contractGameStats.activeGames,
      totalBurned: "0", // TODO: Calculate from game history
      totalRewards: "0", // TODO: Calculate from game history
    }),
    [contractGameStats.totalGames, contractGameStats.activeGames]
  );

  // Memoize active games to prevent recreating array on every render
  const activeGames = useMemo(() => {
    if (!activeGameIds.length) return [];

    // For now, return mock data but with stable references
    return activeGameIds.map((gameId) => ({
      gameId,
      gameType: "QUICK_BATTLE" as const,
      burnedAmount: "1000",
      startTime: Date.now() - 60000,
      expectedReward: "1500",
      status: "WAITING_AI" as const,
    }));
  }, [activeGameIds]);

  // Memoize completed games to prevent recreating array on every render
  const completedGames = useMemo(() => {
    const completedGameIds = playerGameIds.filter(
      (id) => !activeGameIds.includes(id)
    );

    if (completedGameIds.length === 0) return [];

    return completedGameIds.slice(0, 10).map((gameId) => ({
      gameId,
      gameType: "QUICK_BATTLE" as const,
      outcome: "PLAYER_VICTORY" as const,
      burnedAmount: "1000",
      rewardAmount: "1500",
      aiMessage: "Well played! Your quick thinking secured this victory.",
      startTime: Date.now() - 86400000,
      endTime: Date.now() - 86340000,
      duration: 45,
    }));
  }, [playerGameIds, activeGameIds]);

  // Update last update timestamp when relevant data changes
  useEffect(() => {
    if (isConnected && address) {
      setLastUpdate(new Date());
    }
  }, [isConnected, address, lastEventUpdate]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!isConnected) return;

    try {
      await refreshAllData();
      setLastUpdate(new Date());

      toast({
        title: "Data Refreshed",
        description: "Game data has been updated successfully",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Refresh Failed",
        description: "Failed to update game data. Please try again.",
        variant: "destructive",
      });
    }
  }, [isConnected, refreshAllData, toast]);

  // Start new battle
  const handleStartBattle = useCallback(
    async (gameType: string, burnAmount: string) => {
      if (!isConnected || !address) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to start a battle",
          variant: "destructive",
        });
        return;
      }

      try {
        // Convert game type string to enum
        const gameTypeMap: Record<string, number> = {
          QUICK_BATTLE: GameType.QUICK_BATTLE,
          ARENA_FIGHT: GameType.ARENA_FIGHT,
          BOSS_BATTLE: GameType.BOSS_BATTLE,
        };

        const selectedGameType = gameTypeMap[gameType];
        if (selectedGameType === undefined) {
          throw new Error("Invalid game type");
        }

        // Burn tokens to start the game
        const tx = await burnTokens(burnAmount);

        toast({
          title: "Transaction Submitted ⏳",
          description: `Burning ${parseFloat(
            burnAmount
          ).toLocaleString()} BBT tokens...`,
        });

        // The contract events will automatically update our state
        // Switch to active games tab to see the new game
        setActiveTab("active");

        toast({
          title: "Battle Started! ⚔️",
          description: `Burned ${parseFloat(
            burnAmount
          ).toLocaleString()} BBT. The AI is preparing to respond...`,
        });
      } catch (error: any) {
        console.error("Error starting battle:", error);

        let errorMessage = "Failed to start battle. Please try again.";
        if (error.message?.includes("insufficient")) {
          errorMessage = "Insufficient BBT balance or gas.";
        } else if (error.message?.includes("rejected")) {
          errorMessage = "Transaction was rejected.";
        }

        toast({
          title: "Battle Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [isConnected, address, burnTokens, toast]
  );

  // Connect wallet handler
  const handleConnect = async () => {
    try {
      if (connectors.length > 0) {
        await connect({ connector: connectors[0] });
      }
    } catch (error) {
      console.error("Connection failed:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Auto-refresh much less frequently (events handle most updates)
  useEffect(() => {
    if (!isConnected || activeGames.length === 0) return;

    // Only poll as backup every 2 minutes (events should handle real-time updates)
    const interval = setInterval(refreshAllData, 120000);
    return () => clearInterval(interval);
  }, [isConnected, activeGames.length, refreshAllData]);

  // Memoize loading state to prevent unnecessary recalculations
  const isLoading = useMemo(
    () =>
      isBalanceLoading ||
      isGameStatsLoading ||
      isPlayerGamesLoading ||
      isWritePending,
    [isBalanceLoading, isGameStatsLoading, isPlayerGamesLoading, isWritePending]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Animated background stars */}
      <div className="fixed inset-0 z-0">
        {Array.from({ length: 50 }, (_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i % 5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto p-6 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                <Brain className="h-8 w-8 text-purple-400" />
              </div>
              BigBrain Battle Arena
              <Badge
                className="bg-orange-500/20 text-orange-400 border-orange-500/30"
                variant="outline"
              >
                🔥 LIVE
              </Badge>
            </h1>
            <p className="text-gray-400 text-lg">
              Burn BBT tokens to challenge the AI and prove your intelligence
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <Wifi className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-sm">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <WifiOff className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 text-sm">Disconnected</span>
                </div>
              )}
            </div>

            {/* Last Update */}
            {lastUpdate && (
              <div className="text-sm text-gray-400 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            )}

            {/* Refresh Button */}
            <Button
              onClick={refreshData}
              variant="outline"
              size="sm"
              disabled={!isConnected || isLoading}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            {/* Connect/Address */}
            {isConnected ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <Wallet className="h-4 w-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="p-1 h-auto"
                >
                  <a
                    href={`https://testnet.snowtrace.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleConnect}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </motion.div>

        {/* Connection Warning */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-orange-900/20 border-orange-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-orange-400 font-medium">
                      Wallet Connection Required
                    </h3>
                    <p className="text-orange-300 text-sm">
                      Connect your wallet to view your BBT balance and start
                      battles. Make sure you&apos;re on Avalanche Fuji testnet.
                    </p>
                  </div>
                  <Button
                    onClick={handleConnect}
                    variant="outline"
                    className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 ml-auto"
                  >
                    Connect Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="battle" className="flex items-center gap-2">
              ⚔️ New Battle
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="flex items-center gap-2 relative"
            >
              ⏳ Active Games
              {activeGames.length > 0 && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs ml-1">
                  {activeGames.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              📜 History
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GameDashboard
                bbtBalance={bbtBalance}
                gameStats={gameStats}
                isLoading={isLoading}
              />
            </motion.div>
          </TabsContent>

          {/* New Battle Tab */}
          <TabsContent value="battle" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GameTypeBattle
                bbtBalance={bbtBalance}
                onStartBattle={handleStartBattle}
                isLoading={isLoading}
                isConnected={isConnected}
              />
            </motion.div>
          </TabsContent>

          {/* Active Games Tab */}
          <TabsContent value="active" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ActiveGamesList
                activeGames={activeGames}
                onRefresh={refreshData}
                isLoading={isLoading}
              />
            </motion.div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GameHistoryLog
                completedGames={completedGames}
                hasMore={false}
                isLoading={isLoading}
              />
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 text-sm">
            BigBrain Battle Arena • Powered by BBT Token • Built on Avalanche
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default GamePage;
