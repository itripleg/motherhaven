// app/bots/components/BotSelector.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  User,
  ArrowRight,
} from "lucide-react";

interface BotSelectorBot {
  name: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeen: string;
  totalActions: number;
  isDevMode?: boolean;
}

interface BotSelectorProps {
  currentBotName: string;
  onBotChange?: (botName: string) => void;
}

const BotSelector: React.FC<BotSelectorProps> = ({
  currentBotName,
  onBotChange,
}) => {
  const router = useRouter();
  const [bots, setBots] = useState<BotSelectorBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentBot, setCurrentBot] = useState<BotSelectorBot | null>(null);

  // Fetch bot list
  useEffect(() => {
    const fetchBots = async () => {
      try {
        const response = await fetch("/api/tvb/webhook");
        if (!response.ok) throw new Error("Failed to fetch bots");

        const data = await response.json();
        if (data.success && Array.isArray(data.bots)) {
          setBots(data.bots);

          // Find current bot
          const current = data.bots.find(
            (bot: any) => bot.name === currentBotName
          );
          setCurrentBot(current || null);
        }
      } catch (error) {
        console.error("Error fetching bots:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBots();

    // Refresh bot list every 30 seconds
    const interval = setInterval(fetchBots, 30000);
    return () => clearInterval(interval);
  }, [currentBotName]);

  const handleBotSelect = (botName: string) => {
    if (botName === currentBotName) return;

    setIsExpanded(false);

    if (onBotChange) {
      onBotChange(botName);
    } else {
      router.push(`/bots/${botName}`);
    }
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    bot: BotSelectorBot
  ) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/32x32/9333ea/ffffff?text=${
      bot.displayName?.charAt(0) || "B"
    }`;
  };

  const getStatusColor = (isOnline: boolean) =>
    isOnline ? "bg-green-500" : "bg-red-500";

  const otherBots = bots.filter((bot) => bot.name !== currentBotName);
  const onlineBots = otherBots.filter((bot) => bot.isOnline);
  const offlineBots = otherBots.filter((bot) => !bot.isOnline);

  if (loading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Loading bots...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentBot || bots.length <= 1) {
    return null; // Don't show if no bots or only one bot
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm mb-4">
      <CardContent className="p-4">
        {/* Current Bot Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={currentBot.avatarUrl}
                  alt={currentBot.displayName}
                  className="w-8 h-8 rounded-full border border-primary/30 object-cover"
                  onError={(e) => handleImageError(e, currentBot)}
                />
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(
                    currentBot.isOnline
                  )} rounded-full border border-gray-800`}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {currentBot.displayName}
                  </span>
                  {currentBot.isDevMode && (
                    <Badge
                      variant="outline"
                      className="text-xs px-1 py-0 h-4 border-orange-500/50 text-orange-400"
                    >
                      DEV
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {currentBot.isOnline ? (
                    <Wifi className="h-3 w-3 text-green-400" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-400" />
                  )}
                  <span>{currentBot.totalActions} actions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Switch Bot Button */}
          {otherBots.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="border-border text-foreground hover:bg-secondary flex items-center gap-2"
            >
              <span className="text-sm">Switch Bot</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <Badge variant="secondary" className="text-xs">
                {otherBots.length}
              </Badge>
            </Button>
          )}
        </div>

        {/* Expanded Bot List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {/* Online Bots */}
                  {onlineBots.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Wifi className="h-3 w-3 text-green-400" />
                        <span className="text-xs font-medium text-green-400">
                          Online ({onlineBots.length})
                        </span>
                      </div>
                      {onlineBots.map((bot) => (
                        <motion.div
                          key={bot.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 cursor-pointer transition-colors border border-gray-600/30"
                          onClick={() => handleBotSelect(bot.name)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={bot.avatarUrl}
                                alt={bot.displayName}
                                className="w-6 h-6 rounded-full border border-primary/30 object-cover"
                                onError={(e) => handleImageError(e, bot)}
                              />
                              <div
                                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 ${getStatusColor(
                                  bot.isOnline
                                )} rounded-full border border-gray-800`}
                              />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {bot.displayName}
                                </span>
                                {bot.isDevMode && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-1 py-0 h-3 border-orange-500/50 text-orange-400"
                                  >
                                    DEV
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {bot.totalActions} actions
                              </span>
                            </div>
                          </div>

                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Offline Bots */}
                  {offlineBots.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <WifiOff className="h-3 w-3 text-red-400" />
                        <span className="text-xs font-medium text-red-400">
                          Offline ({offlineBots.length})
                        </span>
                      </div>
                      {offlineBots.map((bot) => (
                        <motion.div
                          key={bot.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-700/20 hover:bg-gray-700/40 cursor-pointer transition-colors border border-gray-600/20 opacity-75"
                          onClick={() => handleBotSelect(bot.name)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={bot.avatarUrl}
                                alt={bot.displayName}
                                className="w-6 h-6 rounded-full border border-primary/30 object-cover grayscale"
                                onError={(e) => handleImageError(e, bot)}
                              />
                              <div
                                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 ${getStatusColor(
                                  bot.isOnline
                                )} rounded-full border border-gray-800`}
                              />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {bot.displayName}
                                </span>
                                {bot.isDevMode && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-1 py-0 h-3 border-orange-500/30 text-orange-400/70"
                                  >
                                    DEV
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground/70">
                                Last seen:{" "}
                                {new Date(bot.lastSeen).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>

                          <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default BotSelector;
