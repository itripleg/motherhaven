// app/bots/components/BotHeader.tsx
"use client";
import React, { useMemo } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wifi, WifiOff, Eye, EyeOff, Wallet } from "lucide-react";
import { BotStatus, getMoodColor, getMoodIcon } from "./detailHelpers";
import { AddressComponent } from "@/components/AddressComponent";

interface BotHeaderProps {
  bot: BotStatus;
  showConfig: boolean;
  onToggleConfig: () => void;
}

const BotHeader: React.FC<BotHeaderProps> = ({
  bot,
  showConfig,
  onToggleConfig,
}) => {
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/96x96/hsl(var(--primary))/ffffff?text=${
      bot.displayName?.charAt(0) || "B"
    }`;
  };

  // Memoize wallet address extraction to avoid recalculation
  const botWalletAddress = useMemo((): string | null => {
    return (
      bot.lastAction?.details?.walletAddress ||
      bot.lastAction?.details?.address ||
      (bot as any).walletAddress ||
      (bot as any).address ||
      null
    );
  }, [bot]);

  // Memoize session uptime calculation
  const sessionUptime = useMemo(() => {
    const hours = Math.floor(
      (Date.now() - new Date(bot.sessionStarted).getTime()) / 3600000
    );
    return `${hours}h`;
  }, [bot.sessionStarted]);

  return (
    <Card className="unified-card border-primary/30 bg-background/50 backdrop-blur-sm relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${bot.avatarUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      </div>

      <div className="relative z-10">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            {/* Main Bot Info Section */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 w-full lg:w-auto">
              {/* Avatar Section */}
              <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                <Image
                  src={bot.avatarUrl}
                  alt={bot.displayName}
                  width={96}
                  height={96}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-primary/30 object-cover"
                  onError={handleImageError}
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-background ${
                    bot.isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                />
              </div>

              {/* Bot Details */}
              <div className="flex-1 text-center sm:text-left w-full">
                {/* Name and Status Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2 sm:gap-4 mb-3">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                    {bot.displayName}
                  </h1>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
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
                        )} border-current bg-transparent`}
                        variant="outline"
                      >
                        {getMoodIcon(bot.character.mood)}
                        <span className="ml-1 capitalize">
                          {bot.character.mood}
                        </span>
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bio and Catchphrase */}
                {bot.bio && (
                  <p className="text-muted-foreground mb-3 text-base lg:text-lg">
                    {bot.bio}
                  </p>
                )}
                {bot.character?.catchphrase && (
                  <p className="text-primary italic mb-4 text-base lg:text-lg">
                    &ldquo;{bot.character.catchphrase}&rdquo;
                  </p>
                )}

                {/* Wallet Address Section */}
                {botWalletAddress ? (
                  <div className="mb-4 p-3 bg-secondary/40 rounded-lg border border-border/40">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        Bot Wallet Address:
                      </span>
                    </div>
                    <AddressComponent hash={botWalletAddress} type="address" />
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-orange-400" />
                      <span className="text-sm text-orange-400">
                        Wallet address not available
                      </span>
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
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
                    <p className="text-muted-foreground">Last Seen</p>
                    <p className="text-foreground">
                      {new Date(bot.lastSeen).toLocaleTimeString()}
                    </p>
                  </div>
                  {bot.character?.energy !== undefined && (
                    <div>
                      <p className="text-muted-foreground">Energy</p>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={bot.character.energy}
                          className="h-2 w-12 sm:w-16"
                        />
                        <span className="text-foreground text-xs">
                          {bot.character.energy}%
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Session Uptime</p>
                    <p className="text-foreground">{sessionUptime}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto flex-shrink-0">
              {bot.config && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleConfig}
                  className="border-border text-foreground hover:bg-secondary flex-1 lg:flex-none"
                >
                  {showConfig ? (
                    <EyeOff className="h-4 w-4 mr-1" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1" />
                  )}
                  <span className="hidden sm:inline">Config</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default BotHeader;
