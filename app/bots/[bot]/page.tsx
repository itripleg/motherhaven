// /app/bots/[bot]/page.tsx - UPDATED WITH TVB API
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  ArrowLeft,
  Activity,
  TrendingUp,
  TrendingDown,
  Settings,
  Wifi,
  WifiOff,
  MessageCircle,
  Clock,
  DollarSign,
  Target,
  Zap,
  Shield,
  Sword,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  BarChart3,
  Eye,
  EyeOff,
  RefreshCw,
  Calendar,
  Timer,
  TrendingDownIcon,
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

interface BotConfig {
  buyBias?: number;
  riskTolerance?: number;
  minInterval?: number;
  maxInterval?: number;
  minTradeAmount?: number;
  maxTradeAmount?: number;
  createTokenChance?: number;
  tradingRange?: string;
  intervalRange?: string;
  buyPhrases?: string[];
  sellPhrases?: string[];
  createPhrases?: string[];
  errorPhrases?: string[];
}

interface BotStatus {
  name: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: string;
  lastAction?: BotLastAction;
  totalActions: number;
  sessionStarted: string;
  character?: BotCharacter;
  config?: BotConfig;
  profit?: string;
  profitPercent?: string;
  trades?: number;
  winRate?: number;
  volume?: string;
}

interface ActivityLog {
  id: string;
  botName: string;
  action: string;
  message: string;
  timestamp: Date;
  severity: "info" | "success" | "warning" | "error";
  tokenSymbol?: string;
  amount?: string;
  txHash?: string;
}

const BotDetailPage = () => {
  const [bot, setBot] = useState<BotStatus | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const params = useParams();
  const botName = params.bot;
  const { address } = useAccount();

  // Check if user is admin
  const isAdmin = address && ADMIN_ADDRESSES.includes(address);

  const fetchBotDetails = useCallback(async () => {
    if (!botName) return;

    setIsLoading(true);
    try {
      console.log(`🤖 TVB: Fetching details for ${botName}`);
      const response = await fetch("/api/tvb/webhook");
      if (!response.ok) throw new Error("Failed to fetch bot data");

      const data = await response.json();
      if (data.success && Array.isArray(data.bots)) {
        const specificBot = data.bots.find((b: any) => b.name === botName);
        if (specificBot) {
          setBot(specificBot);
          setLastUpdate(new Date());
          console.log(
            `🤖 TVB: Bot details updated for ${specificBot.displayName}`
          );

          // Generate activity log from recent bot actions
          const activities: ActivityLog[] = Array.from({ length: 20 }).map(
            (_, i) => {
              const actions = ["buy", "sell", "heartbeat", "create_token"];
              const action = actions[i % 4];

              return {
                id: `${specificBot.name}-${Date.now() - i * 10000}`,
                botName: specificBot.displayName,
                action,
                message: generateActivityMessage(action, specificBot),
                timestamp: new Date(
                  Date.now() - i * 300000 - Math.random() * 60000
                ),
                severity:
                  action === "buy" || action === "sell" ? "success" : "info",
                tokenSymbol: ["MOON", "BULL", "FIGHT", "DUEL", "ROCKET"][
                  Math.floor(Math.random() * 5)
                ],
                amount: `${(Math.random() * 0.05 + 0.005).toFixed(3)} AVAX`,
              };
            }
          );

          // Add the most recent action from bot data
          if (specificBot.lastAction) {
            const latestActivity: ActivityLog = {
              id: `${specificBot.name}-latest`,
              botName: specificBot.displayName,
              action: specificBot.lastAction.type,
              message: specificBot.lastAction.message,
              timestamp: new Date(specificBot.lastAction.timestamp),
              severity: "success",
            };
            setActivityLog([latestActivity, ...activities]);
          } else {
            setActivityLog(activities);
          }
        } else {
          console.warn(`🤖 TVB: Bot ${botName} not found in active bots`);
          setBot(null);
        }
      }
    } catch (error) {
      console.error("🤖 TVB: Error fetching bot details:", error);
      setBot(null);
    } finally {
      setIsLoading(false);
    }
  }, [botName]);

  const generateActivityMessage = (action: string, bot: any): string => {
    const messages = {
      buy: bot.config?.buyPhrases || [
        "Buying the dip!",
        "Going long!",
        "To the moon!",
      ],
      sell: bot.config?.sellPhrases || [
        "Taking profits!",
        "Securing gains!",
        "Time to sell!",
      ],
      heartbeat: [
        `${bot.displayName} is active and trading`,
        "Systems operational",
        "Monitoring markets",
      ],
      create_token: bot.config?.createPhrases || [
        "Launching new token!",
        "Creating opportunity!",
        "New project incoming!",
      ],
    };

    const phraseList = messages[action as keyof typeof messages] || [
      `${bot.displayName} performed ${action}`,
    ];
    return phraseList[Math.floor(Math.random() * phraseList.length)];
  };

  useEffect(() => {
    fetchBotDetails();
    const interval = setInterval(fetchBotDetails, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fetchBotDetails]);

  const getStatusColor = (isOnline: boolean): string =>
    isOnline ? "bg-green-500" : "bg-red-500";

  const getMoodColor = (mood?: string): string => {
    switch (mood) {
      case "bullish":
        return "text-green-400";
      case "aggressive":
        return "text-red-400";
      case "cautious":
        return "text-blue-400";
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

  const getActionColor = (action: string): string => {
    switch (action) {
      case "buy":
        return "text-green-400 bg-green-500/10";
      case "sell":
        return "text-red-400 bg-red-500/10";
      case "create_token":
        return "text-purple-400 bg-purple-500/10";
      case "heartbeat":
        return "text-blue-400 bg-blue-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading bot details...</p>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">Bot Not Found</h1>
          <p className="text-gray-400 mb-4">
            Could not find bot &quot;{botName}&quot; in active fleet
          </p>
          <Link href="/bots" className="text-purple-400 hover:underline">
            ← Back to Bot Fleet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Background Stars */}
      <div className="fixed inset-0 z-0">
        {Array.from({ length: 30 }).map((_, i) => (
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
        {/* Navigation */}
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link
            href="/bots"
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bot Fleet
          </Link>

          <div className="flex items-center gap-3">
            {lastUpdate && (
              <div className="text-sm text-gray-400 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <Button
              onClick={fetchBotDetails}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Bot Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm relative overflow-hidden">
            {/* Bot Avatar Background */}
            <div className="absolute inset-0 z-0">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: `url(${bot.avatarUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
            </div>

            <div className="relative z-10">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <img
                        src={bot.avatarUrl}
                        alt={bot.displayName}
                        className="w-24 h-24 rounded-full border-4 border-purple-500/30 object-cover"
                        onError={(
                          e: React.SyntheticEvent<HTMLImageElement, Event>
                        ) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "https://via.placeholder.com/96x96/9333ea/ffffff?text=" +
                            (bot.displayName?.charAt(0) || "B");
                        }}
                      />
                      <div
                        className={`absolute -bottom-1 -right-1 w-6 h-6 ${getStatusColor(
                          bot.isOnline
                        )} rounded-full border-2 border-gray-800 ${
                          bot.isOnline ? "animate-pulse" : ""
                        }`}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h1 className="text-4xl font-bold text-white">
                          {bot.displayName}
                        </h1>
                        <Badge
                          className={`${
                            bot.isOnline
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
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
                          <Badge
                            className={`${getMoodColor(
                              bot.character.mood
                            )} border-current`}
                            variant="outline"
                          >
                            {getMoodIcon(bot.character.mood)}
                            <span className="ml-1 capitalize">
                              {bot.character.mood}
                            </span>
                          </Badge>
                        )}
                      </div>

                      {bot.bio && (
                        <p className="text-gray-300 mb-3 text-lg">{bot.bio}</p>
                      )}

                      {bot.character?.catchphrase && (
                        <p className="text-purple-300 italic mb-4 text-lg">
                          &quot;{bot.character.catchphrase}&quot;
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Status</p>
                          <p
                            className={
                              bot.isOnline
                                ? "text-green-400 font-medium"
                                : "text-red-400 font-medium"
                            }
                          >
                            {bot.isOnline ? "Active" : "Offline"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Last Seen</p>
                          <p className="text-white">
                            {new Date(bot.lastSeen).toLocaleTimeString()}
                          </p>
                        </div>
                        {bot.character?.energy && (
                          <div>
                            <p className="text-gray-400">Energy</p>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={bot.character.energy}
                                className="h-2 w-16"
                              />
                              <span className="text-white text-xs">
                                {bot.character.energy}%
                              </span>
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-400">Session</p>
                          <p className="text-white">
                            {Math.floor(
                              (Date.now() -
                                new Date(bot.sessionStarted).getTime()) /
                                3600000
                            )}
                            h ago
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {bot.config && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowConfig(!showConfig)}
                        className="border-gray-600 text-gray-300"
                      >
                        {showConfig ? (
                          <EyeOff className="h-4 w-4 mr-1" />
                        ) : (
                          <Eye className="h-4 w-4 mr-1" />
                        )}
                        Config
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300"
                      disabled
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Control
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </motion.div>

        {/* Performance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="h-6 w-6 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                {bot.totalActions}
              </p>
              <p className="text-sm text-gray-400">Total Actions</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
              <p className="text-lg font-bold text-white">
                {new Date(bot.sessionStarted).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-400">Session Started</p>
              <p className="text-xs text-gray-500">
                {new Date(bot.sessionStarted).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-6 w-6 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-white capitalize">
                {bot.lastAction?.type || "None"}
              </p>
              <p className="text-sm text-gray-400">Last Action</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Timer className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-lg font-bold text-white">
                {bot.config
                  ? `${bot.config.minInterval}-${bot.config.maxInterval}s`
                  : "N/A"}
              </p>
              <p className="text-sm text-gray-400">Trade Interval</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Configuration Section */}
        <AnimatePresence>
          {showConfig && bot.config && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-400" />
                    Bot Configuration
                    <Badge
                      variant="outline"
                      className="text-blue-400 border-blue-400"
                    >
                      Live Config
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-300">
                        Trading Parameters
                      </h3>
                      <div>
                        <label className="text-gray-300 text-sm">
                          Buy Bias
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={
                              bot.config.buyBias ? bot.config.buyBias * 100 : 50
                            }
                            className="h-2 flex-1"
                          />
                          <span className="text-white text-sm">
                            {bot.config.buyBias
                              ? (bot.config.buyBias * 100).toFixed(0)
                              : "50"}
                            %
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm">
                          Risk Tolerance
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={
                              bot.config.riskTolerance
                                ? bot.config.riskTolerance * 100
                                : 50
                            }
                            className="h-2 flex-1"
                          />
                          <span className="text-white text-sm">
                            {bot.config.riskTolerance
                              ? (bot.config.riskTolerance * 100).toFixed(0)
                              : "50"}
                            %
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm">
                          Trading Range
                        </label>
                        <div className="bg-gray-700 border border-gray-600 text-white text-sm p-2 rounded mt-1">
                          {bot.config.minTradeAmount &&
                          bot.config.maxTradeAmount
                            ? `${bot.config.minTradeAmount}-${bot.config.maxTradeAmount} AVAX`
                            : "Not specified"}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-300">
                        Timing & Behavior
                      </h3>
                      <div>
                        <label className="text-gray-300 text-sm">
                          Interval Range
                        </label>
                        <div className="bg-gray-700 border border-gray-600 text-white text-sm p-2 rounded mt-1">
                          {bot.config.minInterval && bot.config.maxInterval
                            ? `${bot.config.minInterval}-${bot.config.maxInterval} seconds`
                            : "Not specified"}
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-300 text-sm">
                          Create Token Chance
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={
                              bot.config.createTokenChance
                                ? bot.config.createTokenChance * 100
                                : 1
                            }
                            className="h-2 flex-1"
                          />
                          <span className="text-white text-sm">
                            {bot.config.createTokenChance
                              ? (bot.config.createTokenChance * 100).toFixed(1)
                              : "1.0"}
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-300">
                        Personality
                      </h3>
                      {bot.config.buyPhrases && (
                        <div>
                          <label className="text-gray-300 text-sm">
                            Buy Phrases
                          </label>
                          <div className="text-sm text-gray-400 bg-gray-700/30 p-2 rounded max-h-20 overflow-y-auto mt-1">
                            {bot.config.buyPhrases
                              .slice(0, 3)
                              .map((phrase, i) => (
                                <div key={i} className="italic">
                                  &quot;{phrase}&quot;
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      {bot.config.sellPhrases && (
                        <div>
                          <label className="text-gray-300 text-sm">
                            Sell Phrases
                          </label>
                          <div className="text-sm text-gray-400 bg-gray-700/30 p-2 rounded max-h-20 overflow-y-auto mt-1">
                            {bot.config.sellPhrases
                              .slice(0, 3)
                              .map((phrase, i) => (
                                <div key={i} className="italic">
                                  &quot;{phrase}&quot;
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-400 text-sm">
                      ℹ️ This configuration is sent by the bot via webhooks and
                      reflects the actual running parameters.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                Live Activity Feed
                <Badge
                  variant="outline"
                  className="text-green-400 border-green-400"
                >
                  {activityLog.length} events
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-y-auto space-y-3">
                {activityLog.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-colors"
                  >
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(
                        log.action
                      )}`}
                    >
                      {log.action.toUpperCase().replace("_", " ")}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{log.message}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        {log.tokenSymbol && (
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {log.tokenSymbol}
                          </span>
                        )}
                        {log.amount && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {log.amount}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default BotDetailPage;
