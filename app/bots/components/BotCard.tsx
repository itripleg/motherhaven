// app/bots/components/BotCard.tsx - SIMPLIFIED with proper bio display

"use client";
import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wifi,
  WifiOff,
  MessageCircle,
  ExternalLink,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { AddressComponent } from "@/components/AddressComponent";

// SIMPLIFIED: Direct bot interface matching our API
interface SimpleBot {
  name: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: string;
  lastAction?: {
    type: string;
    message: string;
    details: any;
    timestamp: string;
  };
  totalActions: number;
  sessionStarted: string;
  character?: {
    mood?: string;
    personality?: string;
  };
  config?: any;
  isDevMode?: boolean;
  walletAddress?: string;

  // Session metrics
  startingBalance?: number;
  currentBalance?: number;
  pnlAmount?: number;
  pnlPercentage?: number;
  sessionDurationMinutes?: number;
}

interface BotCardProps {
  bot: SimpleBot;
  index: number;
}

// SIMPLIFIED: Helper functions
const getMoodIcon = (mood?: string): React.ReactElement => {
  switch (mood?.toLowerCase()) {
    case "bullish":
      return <TrendingUp className="h-4 w-4" />;
    case "aggressive":
      return <TrendingUp className="h-4 w-4 text-red-400" />;
    case "cautious":
      return <TrendingDown className="h-4 w-4 text-blue-400" />;
    case "bearish":
      return <TrendingDown className="h-4 w-4" />;
    case "neutral":
      return <DollarSign className="h-4 w-4" />;
    default:
      return <DollarSign className="h-4 w-4" />;
  }
};

const getMoodColor = (mood?: string): string => {
  switch (mood?.toLowerCase()) {
    case "bullish":
      return "text-green-400";
    case "aggressive":
      return "text-red-400";
    case "cautious":
      return "text-blue-400";
    case "bearish":
      return "text-orange-400";
    case "neutral":
      return "text-gray-400";
    default:
      return "text-gray-400";
  }
};

const getActionColor = (action?: string): string => {
  switch (action?.toLowerCase()) {
    case "buy":
      return "text-green-400 bg-green-500/10";
    case "sell":
      return "text-red-400 bg-red-500/10";
    case "hold":
      return "text-yellow-400 bg-yellow-500/10";
    case "create_token":
      return "text-purple-400 bg-purple-500/10";
    case "heartbeat":
      return "text-blue-400 bg-blue-500/10";
    case "startup":
      return "text-orange-400 bg-orange-500/10";
    case "error":
      return "text-red-400 bg-red-500/10";
    case "insufficient_funds":
      return "text-red-400 bg-red-500/20";
    default:
      return "text-gray-400 bg-gray-500/10";
  }
};

const getActionIcon = (action?: string): string => {
  switch (action?.toLowerCase()) {
    case "buy":
      return "📈";
    case "sell":
      return "📉";
    case "hold":
      return "⏸️";
    case "create_token":
      return "🎨";
    case "startup":
      return "🚀";
    case "heartbeat":
      return "💓";
    case "error":
      return "⚠️";
    case "insufficient_funds":
      return "💸";
    default:
      return "🔄";
  }
};

const formatActionType = (action?: string): string => {
  if (!action) return "No Action";

  switch (action.toLowerCase()) {
    case "insufficient_funds":
      return "Low Funds";
    case "create_token":
      return "Create Token";
    default:
      return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
};

const BotCard: React.FC<BotCardProps> = ({ bot, index }) => {
  const router = useRouter();

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/64x64/hsl(var(--primary))/ffffff?text=${
      bot.displayName?.charAt(0) || "B"
    }`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on a link or address component
    if (
      (e.target as HTMLElement).closest("a") ||
      (e.target as HTMLElement).closest(".address-component")
    ) {
      return;
    }
    router.push(`/bots/${bot.name}`);
  };

  // SIMPLIFIED: Session uptime calculation
  const getSessionUptime = (): string => {
    if (bot.sessionDurationMinutes !== undefined) {
      const hours = Math.floor(bot.sessionDurationMinutes / 60);
      const minutes = bot.sessionDurationMinutes % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    // Fallback calculation
    const sessionHours = Math.floor(
      (Date.now() - new Date(bot.sessionStarted).getTime()) / 3600000
    );
    return `${sessionHours}h`;
  };

  // SIMPLIFIED: Extract token info from last action
  const getTokenInfo = () => {
    if (!bot.lastAction?.details) return null;

    const { details } = bot.lastAction;
    const tokenSymbol = details.tokenSymbol;
    const tokenAddress = details.tokenAddress || details.contractAddress;

    return tokenSymbol
      ? {
          address: tokenAddress || "unknown",
          symbol: tokenSymbol,
        }
      : null;
  };

  // SIMPLIFIED: P&L display
  const getPnLDisplay = () => {
    if (bot.pnlAmount === undefined || bot.pnlPercentage === undefined) {
      return null;
    }

    const isPositive = bot.pnlAmount >= 0;
    const color = isPositive ? "text-green-400" : "text-red-400";
    const icon = isPositive ? "📈" : "📉";

    return {
      amount: bot.pnlAmount,
      percentage: bot.pnlPercentage,
      color,
      icon,
    };
  };

  const tokenInfo = getTokenInfo();
  const pnlInfo = getPnLDisplay();
  const uptimeDisplay = getSessionUptime();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Card
        className="unified-card border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        onClick={handleCardClick}
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-300"
            style={{ backgroundImage: `url(${bot.avatarUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <CardHeader className="pb-3 flex-shrink-0">
            {/* Status and Mood Row */}
            <div className="flex items-center justify-between mb-4">
              {/* Online/Offline Status */}
              <div className="flex items-center gap-2">
                {bot.isOnline ? (
                  <Wifi className="h-4 w-4 text-green-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-400" />
                )}
                <Badge
                  className={`${
                    bot.isOnline
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}
                  variant="outline"
                >
                  {bot.isOnline ? "Online" : "Offline"}
                </Badge>
              </div>

              {/* Dev Mode + Mood */}
              <div className="flex items-center gap-2">
                {bot.isDevMode && (
                  <Badge
                    variant="outline"
                    className="text-xs px-1 py-0 h-5 border-orange-500/50 text-orange-400"
                  >
                    DEV
                  </Badge>
                )}
                {bot.character?.mood && (
                  <div className="flex items-center gap-1">
                    {getMoodIcon(bot.character.mood)}
                    <span
                      className={`text-xs font-medium ${getMoodColor(
                        bot.character.mood
                      )}`}
                    >
                      {bot.character.mood}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bot Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Image
                  src={bot.avatarUrl}
                  alt={bot.displayName}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full border-2 border-primary/30 object-cover"
                  onError={handleImageError}
                />
                {bot.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-foreground text-lg truncate">
                  {bot.displayName}
                </CardTitle>
                <p className="text-muted-foreground text-sm truncate">
                  {bot.character?.personality?.replace(/_/g, " ") ||
                    "Trading Bot"}
                </p>
              </div>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="flex-1 flex flex-col space-y-4 pb-4">
            {/* FIXED: Bot Wallet Address Section */}
            {bot.walletAddress && (
              <div className="address-component flex-shrink-0">
                <div className="p-2 bg-secondary/30 rounded-lg border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Bot Wallet:
                    </span>
                  </div>
                  <AddressComponent hash={bot.walletAddress} type="address" />
                </div>
              </div>
            )}

            {/* FIXED: Bio Section - Always show, with better handling */}
            <div className="h-[80px] flex-shrink-0">
              {bot.bio ? (
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/30 h-full overflow-hidden">
                  <p className="text-muted-foreground text-sm italic leading-tight overflow-hidden text-ellipsis">
                    &ldquo;
                    {bot.bio.length > 125
                      ? `${bot.bio.substring(0, 175)}...`
                      : bot.bio}
                    &rdquo;
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-secondary/20 rounded-lg border border-border/20 h-full flex items-center justify-center">
                  <p className="text-muted-foreground/70 text-sm italic">
                    No personality description available
                  </p>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
              <div className="text-center p-3 bg-primary/10 rounded-lg flex flex-col justify-center border border-primary/20">
                <p className="text-foreground font-bold text-xl">
                  {bot.totalActions || 0}
                </p>
                <p className="text-muted-foreground text-xs">Actions</p>
              </div>
              <div className="text-center p-3 bg-secondary/30 rounded-lg flex flex-col justify-center border border-border/30">
                <p className="text-foreground font-bold text-xl">
                  {uptimeDisplay}
                </p>
                <p className="text-muted-foreground text-xs">Uptime</p>
              </div>
            </div>

            {/* SIMPLIFIED: Balance & P&L Section */}
            {(bot.currentBalance !== undefined || pnlInfo) && (
              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                {/* Current Balance */}
                {bot.currentBalance !== undefined && (
                  <div className="text-center p-3 bg-blue-500/10 rounded-lg flex flex-col justify-center border border-blue-500/20">
                    <p className="text-blue-400 font-bold text-lg">
                      {bot.currentBalance.toFixed(4)}
                    </p>
                    <p className="text-blue-400/80 text-xs">AVAX</p>
                  </div>
                )}

                {/* P&L */}
                {pnlInfo && (
                  <div
                    className={`text-center p-3 rounded-lg flex flex-col justify-center border ${
                      pnlInfo.amount >= 0
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-red-500/10 border-red-500/20"
                    }`}
                  >
                    <p className={`font-bold text-lg ${pnlInfo.color}`}>
                      {pnlInfo.amount >= 0 ? "+" : ""}
                      {pnlInfo.amount.toFixed(6)}
                    </p>
                    <p className={`text-xs ${pnlInfo.color}/80`}>
                      {pnlInfo.percentage >= 0 ? "+" : ""}
                      {pnlInfo.percentage.toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Last Action Section */}
            <div className="flex-shrink-0 space-y-2">
              {bot.lastAction ? (
                <div className="space-y-2">
                  {/* Action Type and Time */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Action:</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getActionColor(
                          bot.lastAction.type
                        )}`}
                      >
                        <span>{getActionIcon(bot.lastAction.type)}</span>
                        <span>{formatActionType(bot.lastAction.type)}</span>
                      </div>
                      {/* Show ticker for buy/sell actions */}
                      {tokenInfo &&
                        (bot.lastAction.type === "buy" ||
                          bot.lastAction.type === "sell") && (
                          <Link
                            href={`/dex/${tokenInfo.address}`}
                            className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary hover:text-primary/80 rounded-full transition-colors border border-primary/30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs font-medium">
                              {tokenInfo.symbol}
                            </span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">When:</span>
                    <span className="text-foreground text-xs">
                      {new Date(bot.lastAction.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground/70 text-sm italic">
                    No recent actions
                  </p>
                </div>
              )}
            </div>

            {/* SIMPLIFIED: Message Section */}
            <div className="flex-shrink-0">
              {bot.lastAction?.message ? (
                <div className="p-3 bg-secondary/40 rounded-lg overflow-hidden border border-border/30">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground text-sm leading-tight overflow-hidden">
                      &ldquo;
                      {bot.lastAction.message.length > 80
                        ? `${bot.lastAction.message.substring(0, 80)}...`
                        : bot.lastAction.message}
                      &rdquo;
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-secondary/20 rounded-lg h-full flex items-center justify-center border border-border/20">
                  <p className="text-muted-foreground/70 text-sm italic">
                    No recent message
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};

export default BotCard;
