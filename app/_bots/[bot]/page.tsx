// app/bots/[bot]/page.tsx - SIMPLIFIED with direct API calls, no Firebase

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Activity, Clock } from "lucide-react";

// Import simplified components
import BotHeader from "../components/BotHeader";
import PerformanceStats from "../components/PerformanceStats";
import BotConfiguration from "../components/BotConfiguration";
import ActivityLog from "../components/ActivityLog";
import InlineBotSelector from "../components/InlineBotSelector";

// SIMPLIFIED: Direct interfaces matching our API
interface SimpleBotActivity {
  id: string;
  botName: string;
  actionType: string;
  message: string;
  timestamp: string;
  details: any;
}

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

// SIMPLIFIED: Convert API activities to component format
interface ActivityLogEntry {
  id: string;
  action: string;
  message: string;
  timestamp: Date;
  tokenSymbol?: string;
  amount?: string;
}

const REFRESH_INTERVAL = 5000; // 5 seconds
const MAX_CONSECUTIVE_FAILURES = 3;

const BotDetailPage = () => {
  const [bot, setBot] = useState<SimpleBot | null>(null);
  const [activities, setActivities] = useState<SimpleBotActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  const params = useParams();
  const botName = params.bot as string;

  // Generate fixed star positions that won't change on re-renders
  const fixedStars = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: 2 + Math.random() * 3,
    }));
  }, []);

  // SIMPLIFIED: Direct API fetch for specific bot
  const fetchBotDetails = useCallback(async () => {
    if (!botName) return;

    try {
      console.log(`🤖 TVB: Fetching details for bot ${botName}...`);

      // Fetch bot status and activities in one call
      const url = new URL("/api/tvb/webhook", window.location.origin);
      url.searchParams.set("bot", botName);
      url.searchParams.set("history", "true");
      url.searchParams.set("limit", "50");

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "API returned unsuccessful response");
      }

      console.log("🤖 TVB: Bot detail response:", {
        botsFound: data.bots?.length || 0,
        activitiesFound: data.activities?.length || 0,
      });

      // Find the specific bot
      const specificBot = data.bots?.find((b: SimpleBot) => b.name === botName);

      if (specificBot) {
        setBot(specificBot);
        setActivities(data.activities || []);
        setLastUpdate(new Date());
        setError(null);
        setConsecutiveFailures(0);

        console.log(`🤖 TVB: Successfully loaded ${specificBot.displayName}`);
      } else {
        console.warn(`🤖 TVB: Bot ${botName} not found in response`);
        setBot(null);
        setError(`Bot "${botName}" not found`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch bot details";
      console.error(`🤖 TVB: Error fetching bot ${botName}:`, errorMessage);

      setConsecutiveFailures((prev) => prev + 1);
      setError(errorMessage);

      // Don't clear bot data on error - keep showing cached data
    } finally {
      setIsLoading(false);
    }
  }, [botName]);

  // Initial load
  useEffect(() => {
    fetchBotDetails();
  }, [fetchBotDetails]);

  // SIMPLIFIED: Regular refresh interval
  useEffect(() => {
    // Don't set up interval if we have too many consecutive failures
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log("🤖 TVB: Too many failures, pausing auto-refresh");
      return;
    }

    const interval = setInterval(() => {
      fetchBotDetails();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchBotDetails, consecutiveFailures]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    console.log(`🤖 TVB: Manual refresh triggered for ${botName}`);
    setConsecutiveFailures(0);
    setIsLoading(true);
    fetchBotDetails();
  }, [fetchBotDetails, botName]);

  // SIMPLIFIED: Convert activities to ActivityLog format
  const activityLog = useMemo((): ActivityLogEntry[] => {
    return activities.map((activity) => ({
      id: activity.id,
      action: activity.actionType,
      message: activity.message,
      timestamp: new Date(activity.timestamp),
      tokenSymbol: activity.details?.tokenSymbol,
      amount: activity.details?.amountAvax
        ? `${activity.details.amountAvax} AVAX`
        : activity.details?.readableAmount
        ? `${activity.details.readableAmount} ${activity.details.tokenSymbol}`
        : undefined,
    }));
  }, [activities]);

  // SIMPLIFIED: Show loading only on initial load
  if (isLoading && !bot) {
    return (
      <div className="min-h-screen animated-bg floating-particles flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">
            Loading bot details for &ldquo;{botName}&rdquo;...
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Fetching from simplified API...
          </p>
        </div>
      </div>
    );
  }

  // SIMPLIFIED: Bot not found state
  if (!bot && !isLoading) {
    return (
      <div className="min-h-screen animated-bg floating-particles flex items-center justify-center text-center">
        <div className="px-4">
          <h1 className="text-2xl text-foreground mb-4">Bot Not Found</h1>
          <p className="text-muted-foreground mb-4">
            Could not find bot &ldquo;{botName}&rdquo; in the active fleet.
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <p className="text-red-400 text-sm">{error}</p>
              {consecutiveFailures > 0 && (
                <p className="text-red-400/70 text-xs mt-1">
                  Connection failures: {consecutiveFailures}
                </p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Button onClick={handleRefresh} variant="outline" className="mr-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Link
              href="/bots"
              className="text-primary hover:underline inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Bot Fleet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg floating-particles">
      {/* Fixed Background Stars Effect */}
      <div className="fixed inset-0 z-0">
        {fixedStars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: star.animationDuration,
              repeat: Infinity,
              delay: star.animationDelay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto p-4 md:p-6 pt-20 md:pt-24 space-y-6 md:space-y-8">
        {/* Header Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <Link
            href="/bots"
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Bot Fleet</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* SIMPLIFIED: Status indicators */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {lastUpdate && (
                <div className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  <span className="hidden sm:inline">Updated:</span>
                  {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              {activities.length > 0 && (
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span className="hidden sm:inline">Activities:</span>
                  {activities.length}
                </div>
              )}
            </div>

            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-secondary w-full sm:w-auto"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* SIMPLIFIED: Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-orange-400 font-medium">Connection Issue</p>
                <p className="text-orange-400/80 text-sm">{error}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Showing cached data. Auto-refresh every{" "}
                  {REFRESH_INTERVAL / 1000}s.
                  {consecutiveFailures > 0 &&
                    ` (${consecutiveFailures} failures)`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SIMPLIFIED: Development status */}
        {process.env.NODE_ENV === "development" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary/20 rounded-lg p-3 border border-border/30"
          >
            <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
              🚀 Simplified Bot Detail Status
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
              <div>
                <p className="font-medium">Data Source</p>
                <p className="text-green-400">Direct API</p>
              </div>
              <div>
                <p className="font-medium">Activities</p>
                <p className="text-blue-400">{activities.length} loaded</p>
              </div>
              <div>
                <p className="font-medium">Refresh Rate</p>
                <p className="text-blue-400">{REFRESH_INTERVAL / 1000}s</p>
              </div>
              <div>
                <p className="font-medium">Firebase</p>
                <p className="text-green-400">Eliminated</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Inline Bot Selector Component */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <InlineBotSelector currentBotName={botName} />
        </motion.div>

        {/* Bot Header */}
        {bot && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden"
          >
            <BotHeader
              bot={bot}
              showConfig={showConfig}
              onToggleConfig={() => setShowConfig(!showConfig)}
            />
          </motion.div>
        )}

        {/* Performance Stats */}
        {bot && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PerformanceStats bot={bot} />
          </motion.div>
        )}

        {/* Bot Configuration */}
        {bot && bot.config && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <BotConfiguration showConfig={showConfig} config={bot.config} />
          </motion.div>
        )}

        {/* Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="overflow-hidden"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Activity Log ({activityLog.length} events)
            </h3>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>
                {isLoading
                  ? "Updating..."
                  : lastUpdate
                  ? `Updated ${Math.floor(
                      (Date.now() - lastUpdate.getTime()) / 1000
                    )}s ago`
                  : "Never updated"}
              </span>
            </div>
          </div>
          <ActivityLog logs={activityLog} />
        </motion.div>

        {/* SIMPLIFIED: Performance footer for development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-secondary/20 rounded-lg border border-border/30">
            <h4 className="text-sm font-medium text-foreground mb-2">
              📊 Simplified Detail Page Stats
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="font-medium">Architecture</p>
                <p>Bot-specific API → Direct state → UI</p>
              </div>
              <div>
                <p className="font-medium">Eliminated</p>
                <p>useBotActivities hook, Firebase queries, Complex caching</p>
              </div>
              <div>
                <p className="font-medium">Real-time Updates</p>
                <p>5s refresh, instant webhook → API → UI</p>
              </div>
              <div>
                <p className="font-medium">Data Flow</p>
                <p>1 API call → Bot + Activities</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border/30">
              <p>
                Bot: {bot?.displayName || "Not loaded"} | Activities:{" "}
                {activities.length} | Last Update:{" "}
                {lastUpdate?.toLocaleTimeString() || "Never"} | Failures:{" "}
                {consecutiveFailures}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BotDetailPage;
