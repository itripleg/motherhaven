// app/bots/components/BotCard.tsx
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
} from "lucide-react";
import { AddressComponent } from "@/components/AddressComponent";
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
  const [lastActionKey, setLastActionKey] = React.useState("");
  const [lastMessageKey, setLastMessageKey] = React.useState("");

  const { lastAction } = bot;

  // Track action changes for subtle animations
  React.useEffect(() => {
    if (lastAction) {
      const actionKey = `${lastAction.type}-${lastAction.timestamp}`;
      const messageKey = `${lastAction.message}-${lastAction.timestamp}`;

      if (actionKey !== lastActionKey) {
        setLastActionKey(actionKey);
      }
      if (messageKey !== lastMessageKey) {
        setLastMessageKey(messageKey);
      }
    }
  }, [lastAction, lastActionKey, lastMessageKey]);

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

  // Use bot's calculated session duration instead of frontend calculation
  const getSessionUptime = (): string => {
    const sessionMinutes = lastAction?.details?.sessionDurationMinutes;

    if (sessionMinutes !== undefined) {
      const hours = Math.floor(sessionMinutes / 60);
      const minutes = sessionMinutes % 60;
      return hours > 0 ? `${hours}h` : `${minutes}m`;
    }

    // Fallback to frontend calculation
    const fallbackHours =
      Math.floor(
        (Date.now() - new Date(bot.sessionStarted).getTime()) / 3600000
      ) || 0;
    return `${fallbackHours}h`;
  };

  // Extract token info from last action details
  const getTokenInfo = () => {
    if (!lastAction?.details) return null;

    const { details } = lastAction;
    const tokenSymbol = details.tokenSymbol;
    const tokenAddress = details.tokenAddress || details.contractAddress;

    return tokenSymbol
      ? {
          address: tokenAddress || "unknown",
          symbol: tokenSymbol,
        }
      : null;
  };

  // Extract bot wallet address from bot details
  const getBotWalletAddress = (): string | null => {
    return (
      lastAction?.details?.walletAddress ||
      lastAction?.details?.address ||
      (bot as any).walletAddress ||
      (bot as any).address ||
      null
    );
  };

  const uptimeDisplay = getSessionUptime();
  const tokenInfo = getTokenInfo();
  const botWalletAddress = getBotWalletAddress();

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
          {/* Header - Fixed Height */}
          <CardHeader className="pb-3 flex-shrink-0 h-[140px]">
            <div className="flex items-center justify-between mb-4">
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

          {/* Content - Flexible Height */}
          <CardContent className="flex-1 flex flex-col space-y-4 pb-4">
            {/* Bot Wallet Address Section */}
            {botWalletAddress && (
              <div className="address-component flex-shrink-0">
                <div className="p-2 bg-secondary/30 rounded-lg border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Bot Wallet:
                    </span>
                  </div>
                  <AddressComponent hash={botWalletAddress} type="address" />
                </div>
              </div>
            )}

            {/* Bio Section - Fixed Height */}
            <div className="h-[60px] flex-shrink-0">
              {bot.bio ? (
                <div className="p-3 bg-secondary/30 rounded-lg border border-border/30 h-full overflow-hidden">
                  <p className="text-muted-foreground text-sm italic leading-tight overflow-hidden text-ellipsis">
                    &ldquo;
                    {bot.bio.length > 80
                      ? `${bot.bio.substring(0, 80)}...`
                      : bot.bio}
                    &rdquo;
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-secondary/20 rounded-lg border border-border/20 h-full flex items-center justify-center">
                  <p className="text-muted-foreground/70 text-sm italic">
                    No bio available
                  </p>
                </div>
              )}
            </div>

            {/* Stats Grid - Fixed Height */}
            <div className="grid grid-cols-2 gap-3 flex-shrink-0 h-[60px]">
              <div className="text-center p-2 bg-primary/10 rounded-lg flex flex-col justify-center border border-primary/20">
                <p className="text-foreground font-bold text-lg">
                  {bot.totalActions || 0}
                </p>
                <p className="text-muted-foreground text-xs">Actions</p>
              </div>
              <div className="text-center p-2 bg-secondary/30 rounded-lg flex flex-col justify-center border border-border/30">
                <p className="text-foreground font-bold text-lg">
                  {uptimeDisplay}
                </p>
                <p className="text-muted-foreground text-xs">Uptime</p>
              </div>
            </div>

            {/* Last Action Info - Fixed Height */}
            <div className="flex-shrink-0 space-y-2 h-[80px]">
              {lastAction ? (
                <div className="space-y-2">
                  {/* Action Type and Time */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Action:</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getActionColor(
                          lastAction.type
                        )}`}
                      >
                        {getActionIcon(lastAction.type)}
                        <span>{formatActionType(lastAction.type)}</span>
                      </div>
                      {/* Show ticker for buy/sell actions */}
                      {tokenInfo &&
                        (lastAction.type === "buy" ||
                          lastAction.type === "sell") && (
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
                      {/* Fallback ticker display */}
                      {!tokenInfo &&
                        (lastAction.type === "buy" ||
                          lastAction.type === "sell") && (
                          <div className="px-2 py-1 bg-muted/30 text-muted-foreground rounded-full border border-border/30">
                            <span className="text-xs">TOKEN</span>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">When:</span>
                    <span className="text-foreground text-xs">
                      {new Date(lastAction.timestamp).toLocaleTimeString()}
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

            {/* Message Section - Fixed Height with Subtle Animation */}
            <div className="flex-shrink-0">
              {lastAction?.message ? (
                <div className="p-3 bg-secondary/40 rounded-lg h-full overflow-hidden border border-border/30">
                  <motion.div
                    key={lastMessageKey}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex items-start gap-2 h-full"
                  >
                    <MessageCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground text-sm leading-tight overflow-hidden">
                      &ldquo;
                      {lastAction.message.length > 60
                        ? `${lastAction.message.substring(0, 60)}...`
                        : lastAction.message}
                      &rdquo;
                    </p>
                  </motion.div>
                </div>
              ) : (
                <div className="p-3 bg-secondary/20 rounded-lg h-full flex items-center justify-center border border-border/20">
                  <p className="text-muted-foreground/70 text-sm italic">
                    No message
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
