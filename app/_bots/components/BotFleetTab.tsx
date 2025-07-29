// app/bots/components/BotFleetTab.tsx - SIMPLIFIED with direct props

"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, BarChart3 } from "lucide-react";
import BotCard from "./BotCard";

// SIMPLIFIED: Direct interfaces matching the new API
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
  character?: any;
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

interface FleetStats {
  totalActions: number;
  activeBots: number;
  totalBots: number;
}

interface BotFleetTabProps {
  bots: SimpleBot[];
  fleetStats: FleetStats;
}

const BotFleetTab: React.FC<BotFleetTabProps> = ({ bots, fleetStats }) => {
  // SIMPLIFIED: No bots state
  if (bots.length === 0) {
    return (
      <Card className="unified-card border-border/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            No Bots Online
          </h3>
          <p className="text-muted-foreground mb-4">
            No TVB instances are currently running or connected.
          </p>
          <div className="text-muted-foreground/70 text-sm space-y-2">
            <p>💡 To start bots:</p>
            <div className="bg-secondary/30 rounded-lg p-3 text-left max-w-md mx-auto">
              <p>
                <strong>Single bot:</strong>
              </p>
              <code className="text-xs">
                python main.py --config configs/bullish_billy.json --auto
              </code>

              <p className="mt-2">
                <strong>Multiple bots:</strong>
              </p>
              <code className="text-xs">python launch_all.py --auto</code>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // SIMPLIFIED: Separate bots by online status and dev mode for better organization
  const onlineBots = bots.filter((bot) => bot.isOnline);
  const offlineBots = bots.filter((bot) => !bot.isOnline);
  const devBots = bots.filter((bot) => bot.isDevMode);
  const prodBots = bots.filter((bot) => !bot.isDevMode);

  return (
    <div className="space-y-6">
      {/* SIMPLIFIED: Enhanced bot grid with status sections */}
      {onlineBots.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-semibold text-foreground">
              Online Bots ({onlineBots.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {onlineBots.map((bot, index) => (
              <BotCard key={bot.name} bot={bot} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Offline bots section (collapsed by default) */}
      {offlineBots.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-red-500/50 rounded-full"></div>
            <h2 className="text-lg font-semibold text-muted-foreground">
              Offline Bots ({offlineBots.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 opacity-60">
            {offlineBots.map((bot, index) => (
              <BotCard
                key={bot.name}
                bot={bot}
                index={index + onlineBots.length}
              />
            ))}
          </div>
        </div>
      )}

      {/* SIMPLIFIED: Enhanced fleet performance summary */}
      <Card className="unified-card border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Fleet Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Actions */}
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-primary text-2xl font-bold">
                {fleetStats.totalActions.toLocaleString()}
              </p>
              <p className="text-primary/80 text-sm">Total Actions</p>
            </div>

            {/* Active Bots */}
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-green-400 text-2xl font-bold">
                {fleetStats.activeBots}
              </p>
              <p className="text-green-400/80 text-sm">Active Bots</p>
            </div>

            {/* Total Bots */}
            <div className="text-center p-4 bg-secondary/50 rounded-lg border border-border/30">
              <p className="text-foreground text-2xl font-bold">
                {fleetStats.totalBots}
              </p>
              <p className="text-muted-foreground text-sm">Total Bots</p>
            </div>

            {/* Success Rate */}
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-blue-400 text-2xl font-bold">
                {fleetStats.totalBots > 0
                  ? Math.round(
                      (fleetStats.activeBots / fleetStats.totalBots) * 100
                    )
                  : 0}
                %
              </p>
              <p className="text-blue-400/80 text-sm">Online Rate</p>
            </div>
          </div>

          {/* SIMPLIFIED: Additional fleet insights */}
          {bots.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/30">
              {/* Environment Distribution */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">
                  Environment Distribution
                </h4>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-foreground">
                      Production: {prodBots.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-foreground">
                      Development: {devBots.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Session Metrics */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">
                  Session Overview
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {onlineBots.length > 0 && (
                    <>
                      <p>
                        💰 Total Current Balance:{" "}
                        {onlineBots
                          .reduce(
                            (sum, bot) => sum + (bot.currentBalance || 0),
                            0
                          )
                          .toFixed(4)}{" "}
                        AVAX
                      </p>
                      <p>
                        📊 Combined P&L:{" "}
                        {onlineBots
                          .reduce((sum, bot) => sum + (bot.pnlAmount || 0), 0)
                          .toFixed(6)}{" "}
                        AVAX
                      </p>
                    </>
                  )}
                  <p>
                    ⏱️ Longest Session:{" "}
                    {Math.max(
                      ...bots.map((bot) => bot.sessionDurationMinutes || 0),
                      0
                    )}{" "}
                    minutes
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SIMPLIFIED: Quick actions for development */}
      {process.env.NODE_ENV === "development" && (
        <Card className="unified-card border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground text-sm">
              🔧 Development Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-foreground mb-1">
                  Start New Bot:
                </p>
                <code className="block bg-secondary/30 p-2 rounded">
                  python main.py --config configs/[bot].json --local --auto
                </code>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">
                  Fleet Management:
                </p>
                <code className="block bg-secondary/30 p-2 rounded">
                  python launch_all.py --local --auto
                </code>
              </div>
            </div>
            <div className="pt-2 border-t border-border/30">
              <p>
                💡 All bots will appear here automatically when they start
                posting to the webhook
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BotFleetTab;
