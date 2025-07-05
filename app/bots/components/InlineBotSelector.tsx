// app/bots/components/InlineBotSelector.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { User, Users } from "lucide-react";

interface InlineBotSelectorBot {
  name: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeen: string;
  totalActions: number;
  isDevMode?: boolean;
}

interface InlineBotSelectorProps {
  currentBotName: string;
  onBotChange?: (botName: string) => void;
}

const InlineBotSelector: React.FC<InlineBotSelectorProps> = ({
  currentBotName,
  onBotChange,
}) => {
  const router = useRouter();
  const [bots, setBots] = useState<InlineBotSelectorBot[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bot list
  useEffect(() => {
    const fetchBots = async () => {
      try {
        const response = await fetch("/api/tvb/webhook");
        if (!response.ok) throw new Error("Failed to fetch bots");

        const data = await response.json();
        if (data.success && Array.isArray(data.bots)) {
          setBots(data.bots);
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

    if (onBotChange) {
      onBotChange(botName);
    } else {
      router.push(`/bots/${botName}`);
    }
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    bot: InlineBotSelectorBot
  ) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/40x40/9333ea/ffffff?text=${
      bot.displayName?.charAt(0) || "B"
    }`;
  };

  const getStatusIndicatorColor = (isOnline: boolean) =>
    isOnline ? "bg-green-500" : "bg-red-500";

  // Filter out current bot and get other bots
  const otherBots = bots.filter((bot) => bot.name !== currentBotName);
  const currentBot = bots.find((bot) => bot.name === currentBotName);

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-muted-foreground text-sm">Loading bots...</span>
      </div>
    );
  }

  // Don't show if no other bots
  if (otherBots.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 py-2">
      {/* Current Bot Info */}
      <div className="flex items-center gap-3">
        <User className="h-4 w-4 text-primary" />
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={currentBot?.avatarUrl}
              alt={currentBot?.displayName}
              className="w-8 h-8 rounded-full border-2 border-primary/30 object-cover"
              onError={(e) => currentBot && handleImageError(e, currentBot)}
            />
            {currentBot && (
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${getStatusIndicatorColor(
                  currentBot.isOnline
                )} rounded-full border border-gray-800`}
              />
            )}
          </div>

          <span className="font-medium text-foreground text-sm">
            {currentBot?.displayName}
          </span>
          {currentBot?.isDevMode && (
            <Badge
              variant="outline"
              className="text-xs px-1 py-0 h-4 border-orange-500/50 text-orange-400"
            >
              DEV
            </Badge>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-border/50" />

      {/* Other Bots Row */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          {otherBots.map((bot, index) => (
            <Tooltip key={bot.name}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative cursor-pointer group"
                  onClick={() => handleBotSelect(bot.name)}
                >
                  <div className="relative">
                    <img
                      src={bot.avatarUrl}
                      alt={bot.displayName}
                      className={`w-10 h-10 rounded-full border-2 object-cover transition-all duration-200 ${
                        bot.isOnline
                          ? "border-green-500/50 hover:border-green-500 hover:scale-110"
                          : "border-red-500/30 hover:border-red-500/50 hover:scale-110 grayscale hover:grayscale-0"
                      }`}
                      onError={(e) => handleImageError(e, bot)}
                    />

                    {/* Status Indicator */}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusIndicatorColor(
                        bot.isOnline
                      )} rounded-full border-2 border-gray-800 ${
                        bot.isOnline ? "animate-pulse" : ""
                      }`}
                    />

                    {/* Dev Mode Badge */}
                    {bot.isDevMode && (
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-orange-500 rounded-full border border-gray-800 flex items-center justify-center">
                        <span className="text-xs text-white font-bold leading-none">
                          D
                        </span>
                      </div>
                    )}

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">{bot.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {bot.isOnline ? (
                      <>Online • {bot.totalActions} actions</>
                    ) : (
                      <>
                        Offline • Last seen{" "}
                        {new Date(bot.lastSeen).toLocaleTimeString()}
                      </>
                    )}
                  </p>
                  {bot.isDevMode && (
                    <p className="text-xs text-orange-400 mt-1">
                      Development Mode
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default InlineBotSelector;
