"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import {
  Bot,
  TrendingUp,
  Play,
  Pause,
  Activity,
  BarChart3,
  DollarSign,
  Sparkles,
  Target,
  Shield,
  Sword,
  MessageCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// Admin addresses
const ADMIN_ADDRESSES = ["0xd85327505Ab915AB0C1aa5bC6768bF4002732258"];

// TypeScript interfaces
interface BotCharacter {
  mood?: string;
  energy?: number;
  personality?: string;
  catchphrase?: string;
  attackMessages?: string[];
  tauntMessages?: string[];
}

interface BotLastAction {
  type: string;
  message: string;
  timestamp: string;
  details?: any;
}

interface TVBBot {
  name: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: string;
  lastAction?: BotLastAction;
  totalActions?: number;
  sessionStarted: string;
  character?: BotCharacter;
  profit?: string;
  winRate?: number;
}

interface FleetStats {
  totalProfit: number;
  totalTrades: number;
  avgWinRate: number;
  activeBots: number;
}

const TVBPage = () => {
  const [bots, setBots] = useState<TVBBot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("fleet");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { address } = useAccount();
  const router = useRouter();
  const isAdmin = address && ADMIN_ADDRESSES.includes(address);

  // Fetch bot data from TVB API
  const fetchBots = useCallback(async () => {
    try {
      console.log("🤖 TVB: Fetching bot fleet data...");
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/tvb/webhook");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.bots)) {
        setBots(data.bots);
        setLastUpdate(new Date());
        console.log(`🤖 TVB: Loaded ${data.bots.length} bots`);
      } else {
        console.warn("🤖 TVB: Invalid response format:", data);
        setBots([]);
      }
    } catch (err) {
      console.error("🤖 TVB: Error fetching bots:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch bots");
      setBots([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    fetchBots();
    const interval = setInterval(fetchBots, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchBots]);

  // Utility functions
  const getStatusColor = (isOnline: boolean): string => {
    return isOnline
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const getMoodColor = (mood?: string): string => {
    switch (mood) {
      case "bullish":
        return "text-green-400";
      case "aggressive":
        return "text-red-400";
      case "cautious":
        return "text-blue-400";
      case "neutral":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getMoodIcon = (mood?: string): React.ReactElement => {
    switch (mood) {
      case "bullish":
        return <TrendingUp className="h-4 w-4" />;
      case "aggressive":
        return <Sword className="h-4 w-4" />;
      case "cautious":
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action?: string): string => {
    switch (action?.toLowerCase()) {
      case "buy":
        return "text-green-400";
      case "sell":
        return "text-red-400";
      case "hold":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  // Calculate fleet totals
  const fleetStats: FleetStats = {
    totalProfit: bots.reduce(
      (sum, bot) => sum + parseFloat(bot.profit?.replace(/[$,+]/g, "") || "0"),
      0
    ),
    totalTrades: bots.reduce((sum, bot) => sum + (bot.totalActions || 0), 0),
    avgWinRate:
      bots.length > 0
        ? bots.reduce((sum, bot) => sum + (bot.winRate || 0), 0) / bots.length
        : 0,
    activeBots: bots.filter((bot) => bot.isOnline).length,
  };

  if (isLoading && bots.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading TVB Fleet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
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
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                  <Bot className="h-8 w-8 text-purple-400" />
                </div>
                Transparent Volume Bots
                <Badge
                  className="bg-blue-500/20 text-blue-400 border-blue-500/30"
                  variant="outline"
                >
                  TVB Fleet
                </Badge>
              </h1>
              <p className="text-gray-400 text-lg">
                Personality-driven trading bots creating authentic volume
              </p>
            </div>

            <div className="flex items-center gap-3">
              {lastUpdate && (
                <div className="text-sm text-gray-400 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Updated {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              <Button
                onClick={fetchBots}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-red-900/20 border-red-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div>
                    <h3 className="text-red-400 font-medium">
                      Connection Error
                    </h3>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-1">
            <TabsTrigger value="fleet" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Bot Fleet ({bots.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Activity
            </TabsTrigger>
          </TabsList>

          {/* Bot Fleet Tab */}
          <TabsContent value="fleet" className="space-y-6">
            {bots.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Bot className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    No Bots Online
                  </h3>
                  <p className="text-gray-400 mb-4">
                    No TVB instances are currently running or connected.
                  </p>
                  <p className="text-gray-500 text-sm">
                    Start a bot with:{" "}
                    <code className="bg-gray-700 px-2 py-1 rounded">
                      python SimpleVolumeBot.py --config bullish_billy.json
                      --auto
                    </code>
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {bots.map((bot, index) => (
                  <motion.div
                    key={bot.name || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                      onClick={() => router.push(`/bots/${bot.name}`)}
                    >
                      {/* Bot Avatar Background */}
                      <div className="absolute inset-0 z-0">
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                          style={{ backgroundImage: `url(${bot.avatarUrl})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
                      </div>

                      <div className="relative z-10">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-4">
                            <Badge
                              className={getStatusColor(bot.isOnline)}
                              variant="outline"
                            >
                              {bot.isOnline ? (
                                <Wifi className="h-3 w-3 mr-1" />
                              ) : (
                                <WifiOff className="h-3 w-3 mr-1" />
                              )}
                              {bot.isOnline ? "Online" : "Offline"}
                            </Badge>
                            {bot.character?.mood && (
                              <div className="flex items-center gap-2">
                                {getMoodIcon(bot.character.mood)}
                                <span
                                  className={`text-sm font-medium ${getMoodColor(
                                    bot.character.mood
                                  )}`}
                                >
                                  {bot.character.mood}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img
                                src={bot.avatarUrl}
                                alt={bot.displayName}
                                className="w-16 h-16 rounded-full border-2 border-purple-500/30 object-cover"
                                onError={(
                                  e: React.SyntheticEvent<
                                    HTMLImageElement,
                                    Event
                                  >
                                ) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src =
                                    "https://via.placeholder.com/64x64/9333ea/ffffff?text=" +
                                    (bot.displayName?.charAt(0) || "B");
                                }}
                              />
                              {bot.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse" />
                              )}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-white text-lg">
                                {bot.displayName}
                              </CardTitle>
                              <p className="text-gray-400 text-sm">
                                {bot.character?.personality?.replace(
                                  /_/g,
                                  " "
                                ) || "Trading Bot"}
                              </p>
                              {bot.character?.energy && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500">
                                    Energy:
                                  </span>
                                  <Progress
                                    value={bot.character.energy}
                                    className="h-1 w-16"
                                  />
                                  <span className="text-xs text-gray-400">
                                    {bot.character.energy}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {bot.bio && (
                            <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                              <p className="text-gray-300 text-sm italic">
                                "{bot.bio}"
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                              <p className="text-white font-bold text-lg">
                                {bot.totalActions || 0}
                              </p>
                              <p className="text-gray-400 text-xs">Actions</p>
                            </div>
                            <div className="text-center p-2 bg-purple-500/10 rounded-lg">
                              <p className="text-white font-bold text-lg">
                                {Math.floor(
                                  (Date.now() -
                                    new Date(bot.sessionStarted).getTime()) /
                                    3600000
                                ) || 0}
                                h
                              </p>
                              <p className="text-gray-400 text-xs">Uptime</p>
                            </div>
                          </div>

                          {bot.lastAction && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">
                                  Last Action:
                                </span>
                                <span
                                  className={getActionColor(
                                    bot.lastAction.type
                                  )}
                                >
                                  {bot.lastAction.type?.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Session:</span>
                                <span className="text-white">
                                  {new Date(
                                    bot.sessionStarted
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          )}

                          {bot.lastAction?.message && (
                            <div className="p-2 bg-gray-700/40 rounded-lg">
                              <div className="flex items-start gap-2">
                                <MessageCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                <p className="text-gray-300 text-sm italic">
                                  "{bot.lastAction.message}"
                                </p>
                              </div>
                            </div>
                          )}

                          {bot.character?.catchphrase && (
                            <div className="text-center p-2 bg-purple-500/10 rounded-lg">
                              <p className="text-purple-300 text-sm italic">
                                "{bot.character.catchphrase}"
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Fleet Summary */}
            {bots.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    Fleet Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-500/10 rounded-lg">
                      <p className="text-green-400 text-2xl font-bold">
                        ${fleetStats.totalProfit.toFixed(2)}
                      </p>
                      <p className="text-green-400 text-sm">
                        Total Fleet Profit
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                      <p className="text-blue-400 text-2xl font-bold">
                        {fleetStats.totalTrades}
                      </p>
                      <p className="text-blue-400 text-sm">Total Actions</p>
                    </div>
                    <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                      <p className="text-purple-400 text-2xl font-bold">
                        {fleetStats.avgWinRate.toFixed(1)}%
                      </p>
                      <p className="text-purple-400 text-sm">Avg Performance</p>
                    </div>
                    <div className="text-center p-4 bg-orange-500/10 rounded-lg">
                      <p className="text-orange-400 text-2xl font-bold">
                        {fleetStats.activeBots}
                      </p>
                      <p className="text-orange-400 text-sm">Active Bots</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">
                    Bot Performance Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bots.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No bots available for analysis
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bots.map((bot) => (
                        <div
                          key={bot.name}
                          className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                          onClick={() => router.push(`/bots/${bot.name}`)}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={bot.avatarUrl}
                              alt={bot.displayName}
                              className="w-8 h-8 rounded-full"
                              onError={(
                                e: React.SyntheticEvent<HTMLImageElement, Event>
                              ) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  "https://via.placeholder.com/32x32/9333ea/ffffff?text=" +
                                  (bot.displayName?.charAt(0) || "B");
                              }}
                            />
                            <div>
                              <p className="text-white font-medium">
                                {bot.displayName}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {bot.totalActions || 0} actions
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`flex items-center gap-1 ${
                                bot.isOnline ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {bot.isOnline ? (
                                <Wifi className="h-3 w-3" />
                              ) : (
                                <WifiOff className="h-3 w-3" />
                              )}
                              <span className="text-sm">
                                {bot.isOnline ? "Online" : "Offline"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Fleet Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <span className="text-gray-300">Total Bots</span>
                      <span className="text-white font-bold">
                        {bots.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <span className="text-gray-300">Online</span>
                      <span className="text-green-400 font-bold">
                        {fleetStats.activeBots}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <span className="text-gray-300">Offline</span>
                      <span className="text-red-400 font-bold">
                        {bots.length - fleetStats.activeBots}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <span className="text-gray-300">Total Actions</span>
                      <span className="text-white font-bold">
                        {fleetStats.totalTrades}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-400" />
                  Live Bot Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bots.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No bot activity to display
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bots
                      .filter((bot) => bot.lastAction)
                      .sort((a, b) => {
                        if (!a.lastAction || !b.lastAction) return 0;
                        return (
                          new Date(b.lastAction.timestamp).getTime() -
                          new Date(a.lastAction.timestamp).getTime()
                        );
                      })
                      .slice(0, 10)
                      .map((bot, index) => (
                        <motion.div
                          key={`${bot.name}-${index}`}
                          className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 cursor-pointer hover:bg-gray-700/50 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => router.push(`/bots/${bot.name}`)}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={bot.avatarUrl}
                              alt={bot.displayName}
                              className="w-10 h-10 rounded-full border border-purple-500/30"
                              onError={(
                                e: React.SyntheticEvent<HTMLImageElement, Event>
                              ) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  "https://via.placeholder.com/40x40/9333ea/ffffff?text=" +
                                  (bot.displayName?.charAt(0) || "B");
                              }}
                            />
                            <div>
                              <p className="text-white font-medium">
                                {bot.displayName}
                              </p>
                              <p className="text-gray-400 text-sm">
                                <span
                                  className={getActionColor(
                                    bot.lastAction?.type
                                  )}
                                >
                                  {bot.lastAction?.type?.toUpperCase()}
                                </span>
                                {bot.lastAction?.message &&
                                  ` • ${bot.lastAction.message.slice(
                                    0,
                                    30
                                  )}...`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 text-sm">
                              {bot.lastAction
                                ? new Date(
                                    bot.lastAction.timestamp
                                  ).toLocaleTimeString()
                                : "N/A"}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TVBPage;
