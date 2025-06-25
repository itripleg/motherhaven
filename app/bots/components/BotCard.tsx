"use client";
import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, MessageCircle, ExternalLink } from "lucide-react";
import { TVBBot } from "./helpers";
import {
  getStatusColor,
  getMoodIcon,
  getMoodColor,
  getActionIcon,
  getActionColor,
  formatActionType,
} from "./helpers";

interface BotCardProps {
  bot: TVBBot;
  index: number;
}

const BotCard: React.FC<BotCardProps> = ({ bot, index }) => {
  const router = useRouter();
  const [isNewAction, setIsNewAction] = React.useState(false);
  const [lastActionKey, setLastActionKey] = React.useState("");

  // Track when last action changes to trigger animation
  React.useEffect(() => {
    if (bot.lastAction) {
      const newKey = `${bot.lastAction.type}-${bot.lastAction.timestamp}`;
      if (newKey !== lastActionKey) {
        setLastActionKey(newKey);
        setIsNewAction(true);
        const timer = setTimeout(() => setIsNewAction(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [bot.lastAction?.timestamp, bot.lastAction?.type, lastActionKey]);

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/64x64/9333ea/ffffff?text=${
      bot.displayName?.charAt(0) || "B"
    }`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on a link
    if ((e.target as HTMLElement).closest("a")) {
      return;
    }
    router.push(`/bots/${bot.name}`);
  };

  const uptimeHours =
    Math.floor(
      (Date.now() - new Date(bot.sessionStarted).getTime()) / 3600000
    ) || 0;

  // Extract token info from last action details
  const getTokenInfo = () => {
    if (!bot.lastAction?.details) return null;

    const { tokenAddress, tokenSymbol } = bot.lastAction.details;
    if (tokenAddress && tokenSymbol) {
      return { address: tokenAddress, symbol: tokenSymbol };
    }
    return null;
  };

  const tokenInfo = getTokenInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full" // Ensure motion.div takes full height
    >
      <Card
        className={`bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-500 cursor-pointer group relative overflow-hidden h-[580px] flex flex-col ${
          isNewAction
            ? "ring-2 ring-purple-400/50 shadow-lg shadow-purple-400/20 animate-pulse"
            : ""
        }`}
        onClick={handleCardClick}
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-300"
            style={{ backgroundImage: `url(${bot.avatarUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header - Fixed Height */}
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <Badge className={getStatusColor(bot.isOnline)} variant="outline">
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

            {/* Bot Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={bot.avatarUrl}
                  alt={bot.displayName}
                  className="w-16 h-16 rounded-full border-2 border-purple-500/30 object-cover"
                  onError={handleImageError}
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
                  {bot.character?.personality?.replace(/_/g, " ") ||
                    "Trading Bot"}
                </p>
              </div>
            </div>
          </CardHeader>

          {/* Content - Flexible Height */}
          <CardContent className="flex-1 flex flex-col justify-between space-y-4">
            {/* Bio Section - Fixed Height */}
            <div className="h-20 flex-shrink-0">
              {bot.bio && (
                <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 h-full overflow-hidden">
                  <p className="text-gray-300 text-sm italic leading-relaxed overflow-hidden text-ellipsis">
                    "
                    {bot.bio.length > 100
                      ? `${bot.bio.substring(0, 100)}...`
                      : bot.bio}
                    "
                  </p>
                </div>
              )}
            </div>

            {/* Stats Grid - Fixed Height */}
            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
              <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                <p className="text-white font-bold text-lg">
                  {bot.totalActions || 0}
                </p>
                <p className="text-gray-400 text-xs">Actions</p>
              </div>
              <div className="text-center p-2 bg-purple-500/10 rounded-lg">
                <p className="text-white font-bold text-lg">{uptimeHours}h</p>
                <p className="text-gray-400 text-xs">Uptime</p>
              </div>
            </div>

            {/* Last Action Info - Fixed Height */}
            <div className="flex-shrink-0 space-y-2">
              {bot.lastAction && (
                <div className="space-y-2">
                  {/* Action Type and Time */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Last Action:</span>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getActionColor(
                        bot.lastAction.type
                      )}`}
                    >
                      {getActionIcon(bot.lastAction.type)}
                      <span>{formatActionType(bot.lastAction.type)}</span>
                    </div>
                  </div>

                  {/* Time and Token Link */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">When:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white">
                        {new Date(
                          bot.lastAction.timestamp
                        ).toLocaleTimeString()}
                      </span>
                      {/* Token Link */}
                      {tokenInfo &&
                        (bot.lastAction.type === "buy" ||
                          bot.lastAction.type === "sell") && (
                          <Link
                            href={`/dex/${tokenInfo.address}`}
                            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs">{tokenInfo.symbol}</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Section - Fixed Height */}
            <div className="h-16 flex-shrink-0">
              {bot.lastAction?.message && (
                <div className="p-2 bg-gray-700/40 rounded-lg h-full overflow-hidden">
                  <motion.div
                    className="flex items-start gap-2 h-full"
                    key={`${bot.lastAction.type}-${bot.lastAction.timestamp}`}
                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{
                      duration: 0.5,
                      type: "spring",
                      stiffness: 100,
                    }}
                  >
                    <MessageCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm overflow-hidden text-ellipsis">
                      "
                      {bot.lastAction.message.length > 70
                        ? `${bot.lastAction.message.substring(0, 70)}...`
                        : bot.lastAction.message}
                      "
                    </p>
                  </motion.div>
                </div>
              )}
            </div>

            {/* No Action State */}
            {!bot.lastAction && (
              <div className="h-16 flex-shrink-0 flex items-center justify-center">
                <div className="p-2 bg-gray-700/30 rounded-lg w-full text-center">
                  <p className="text-gray-400 text-sm italic">
                    No recent actions recorded
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};

export default BotCard;
