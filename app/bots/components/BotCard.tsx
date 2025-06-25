"use client";
import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, MessageCircle } from "lucide-react";
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

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/64x64/9333ea/ffffff?text=${
      bot.displayName?.charAt(0) || "B"
    }`;
  };

  const uptimeHours =
    Math.floor(
      (Date.now() - new Date(bot.sessionStarted).getTime()) / 3600000
    ) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-300 cursor-pointer group relative overflow-hidden h-full"
        onClick={() => router.push(`/bots/${bot.name}`)}
      >
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-300"
            style={{ backgroundImage: `url(${bot.avatarUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <CardHeader className="pb-3">
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

          <CardContent className="space-y-4 flex-grow">
            {bot.bio && (
              <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                <p className="text-gray-300 text-sm italic">"{bot.bio}"</p>
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
                <p className="text-white font-bold text-lg">{uptimeHours}h</p>
                <p className="text-gray-400 text-xs">Uptime</p>
              </div>
            </div>

            {bot.lastAction && (
              <div className="space-y-2 pt-2">
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">When:</span>
                  <span className="text-white">
                    {new Date(bot.lastAction.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}

            {bot.lastAction?.message && (
              <div className="p-2 bg-gray-700/40 rounded-lg mt-4">
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">
                    "{bot.lastAction.message}"
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
