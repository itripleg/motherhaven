// app/bots/[bot]/page.tsx - OPTIMIZED with reduced Firebase calls and smart caching
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Activity, Database, Clock } from "lucide-react";

import {
  BotStatus,
  ActivityLog as ActivityLogType,
} from "../components/detailHelpers";
import BotHeader from "../components/BotHeader";
import PerformanceStats from "../components/PerformanceStats";
import BotConfiguration from "../components/BotConfiguration";
import ActivityLog from "../components/ActivityLog";
import InlineBotSelector from "../components/InlineBotSelector";

// OPTIMIZATION: Use the new optimized hook
import { useBotActivity } from "@/hooks/useBotActivities";

// OPTIMIZATION: Enhanced caching for bot status data
interface CachedBotStatus {
  bot: BotStatus | null;
  timestamp: number;
  isValid: boolean;
}

const BOT_STATUS_CACHE_DURATION = 45000; // 45 seconds
const BOT_STATUS_REFRESH_INTERVAL = 60000; // 1 minute
const MAX_REFRESH_FAILURES = 3;

const BotDetailPage = () => {
  const [bot, setBot] = useState<BotStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshFailures, setRefreshFailures] = useState<number>(0);

  const params = useParams();
  const botName = params.bot as string;

  // OPTIMIZATION: Enhanced caching for bot status
  const botCacheRef = useRef<CachedBotStatus>({
    bot: null,
    timestamp: 0,
    isValid: false,
  });
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisibleRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // OPTIMIZATION: Use optimized hook with polling instead of realtime
  const {
    activities: persistentActivities,
    loading: activitiesLoading,
    error: activitiesError,
    statistics: activityStats,
    refresh: refreshActivities,
    lastFetch: activitiesLastFetch,
    cacheAge: activitiesCacheAge,
    getCacheStats,
  } = useBotActivity(botName, {
    limitCount: 50,
    realTime: false, // OPTIMIZATION: Use polling instead of realtime
    cacheDuration: 60000, // 1 minute cache
    pollingInterval: 90000, // 90 seconds polling
    enableSharedCache: true,
  });

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

  // OPTIMIZATION: Smart cache management for bot status
  const isBotCacheValid = useCallback(() => {
    const now = Date.now();
    return (
      botCacheRef.current.isValid &&
      now - botCacheRef.current.timestamp < BOT_STATUS_CACHE_DURATION
    );
  }, []);

  const updateBotCache = useCallback((newBot: BotStatus | null) => {
    botCacheRef.current = {
      bot: newBot,
      timestamp: Date.now(),
      isValid: true,
    };
  }, []);

  // OPTIMIZATION: Enhanced bot details fetching with smart caching
  const fetchBotDetails = useCallback(
    async (force: boolean = false) => {
      if (!botName) return;

      // Don't fetch if page is hidden and not forced
      if (!isPageVisibleRef.current && !force) {
        console.log(`🤖 TVB: Skipping bot fetch for ${botName} - page hidden`);
        return;
      }

      // Use cache if valid and not forced
      if (!force && isBotCacheValid()) {
        console.log(`🤖 TVB: Using cached bot data for ${botName}`);
        setBot(botCacheRef.current.bot);
        setLastUpdate(new Date(botCacheRef.current.timestamp));
        setIsLoading(false);
        return;
      }

      // Check for backoff after consecutive failures
      if (refreshFailures >= MAX_REFRESH_FAILURES) {
        const backoffTime = Math.min(
          300000,
          Math.pow(2, refreshFailures) * 1000
        ); // Max 5 minutes
        console.log(
          `🤖 TVB: In backoff period for ${botName} (${refreshFailures} failures)`
        );
        return;
      }

      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        console.log(
          `🤖 TVB: Fetching bot details for ${botName}...`,
          force ? "(forced)" : ""
        );

        const response = await fetch("/api/tvb/webhook", {
          method: "GET",
          headers: {
            "X-Request-Source": "bot-detail-page",
            "X-Bot-Name": botName,
            "X-Cache-Control": force ? "no-cache" : "use-cache",
          },
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const data = await response.json();

        if (data.success && Array.isArray(data.bots)) {
          const specificBot = data.bots.find((b: any) => b.name === botName);

          if (specificBot) {
            updateBotCache(specificBot);
            setBot(specificBot);
            setLastUpdate(new Date());
            setRefreshFailures(0); // Reset on success

            console.log(
              `🤖 TVB: Successfully loaded bot details for ${botName}`
            );
          } else {
            console.warn(`🤖 TVB: Bot ${botName} not found in response`);
            setBot(null);
          }
        } else {
          console.warn("🤖 TVB: Invalid response format:", data);
          setBot(null);
        }
      } catch (err) {
        // Don't log errors for aborted requests
        if (err instanceof Error && err.name === "AbortError") {
          console.log(`🤖 TVB: Bot fetch aborted for ${botName}`);
          return;
        }

        console.error(
          `🤖 TVB: Error fetching bot details for ${botName}:`,
          err
        );
        setRefreshFailures((prev) => prev + 1);

        // Use cached data if available during errors
        if (botCacheRef.current.isValid) {
          console.log(
            `🤖 TVB: Using cached bot data for ${botName} due to error`
          );
          setBot(botCacheRef.current.bot);
          setLastUpdate(new Date(botCacheRef.current.timestamp));
        } else {
          setBot(null);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [botName, isBotCacheValid, updateBotCache, refreshFailures]
  );

  // Convert persistent activities to the format expected by ActivityLog component
  const activityLog = useMemo((): ActivityLogType[] => {
    return persistentActivities.map((activity) => ({
      id: activity.id || `${activity.botName}-${activity.timestamp}`,
      action: activity.actionType,
      message: activity.message,
      timestamp: new Date(activity.timestamp),
      tokenSymbol: activity.tokenSymbol,
      amount: activity.tradeAmount
        ? `${activity.tradeAmount} AVAX`
        : activity.details?.readableAmount
        ? `${activity.details.readableAmount} ${activity.tokenSymbol}`
        : undefined,
    }));
  }, [persistentActivities]);

  // OPTIMIZATION: Page visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;

      if (isPageVisibleRef.current) {
        console.log(`🤖 TVB: Bot page ${botName} visible - resuming updates`);
        // Check if we need to refresh immediately
        const now = Date.now();
        if (now - botCacheRef.current.timestamp > BOT_STATUS_CACHE_DURATION) {
          fetchBotDetails();
        }
      } else {
        console.log(`🤖 TVB: Bot page ${botName} hidden - pausing updates`);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [botName, fetchBotDetails]);

  // OPTIMIZATION: Smart refresh interval management
  useEffect(() => {
    // Initial fetch
    fetchBotDetails(true);

    // Set up interval
    const setupInterval = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      const scheduleNext = () => {
        refreshTimeoutRef.current = setTimeout(() => {
          if (isPageVisibleRef.current) {
            fetchBotDetails();
          }
          scheduleNext(); // Schedule next update
        }, BOT_STATUS_REFRESH_INTERVAL);
      };

      scheduleNext();
    };

    setupInterval();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchBotDetails]);

  // Handle refresh for both bot details and activities
  const handleRefresh = useCallback(() => {
    console.log(`🤖 TVB: Manual refresh triggered for ${botName}`);
    setRefreshFailures(0); // Reset failures on manual refresh
    fetchBotDetails(true);
    refreshActivities();
  }, [fetchBotDetails, refreshActivities, botName]);

  // OPTIMIZATION: Smart loading states
  if (isLoading && !bot && !botCacheRef.current.isValid) {
    return (
      <div className="min-h-screen animated-bg floating-particles flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">
            Loading bot details for &ldquo;{botName}&rdquo;...
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Fetching from optimized API with smart caching...
          </p>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen animated-bg floating-particles flex items-center justify-center text-center">
        <div className="px-4">
          <h1 className="text-2xl text-foreground mb-4">Bot Not Found</h1>
          <p className="text-muted-foreground mb-4">
            Could not find bot &ldquo;{botName}&rdquo; in the active fleet.
          </p>
          {refreshFailures > 0 && (
            <div className="mb-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
              <p className="text-orange-400 text-sm">
                Connection issues detected ({refreshFailures} failures). The bot
                may be offline or experiencing connectivity problems.
              </p>
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
            {/* OPTIMIZATION: Enhanced status indicators */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {lastUpdate && (
                <div className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  <span className="hidden sm:inline">Bot data:</span>
                  {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              {activitiesLastFetch > 0 && (
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span className="hidden sm:inline">Activities:</span>
                  {new Date(activitiesLastFetch).toLocaleTimeString()}
                </div>
              )}
            </div>

            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-secondary w-full sm:w-auto"
              disabled={isLoading || activitiesLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${
                  isLoading || activitiesLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* OPTIMIZATION: Cache status for debugging (development only) */}
        {process.env.NODE_ENV === "development" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary/20 rounded-lg p-3 border border-border/30"
          >
            <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
              <Database className="h-3 w-3" />
              🚀 Optimization Status
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
              <div>
                <p className="font-medium">Bot Cache</p>
                <p
                  className={
                    isBotCacheValid() ? "text-green-400" : "text-orange-400"
                  }
                >
                  {isBotCacheValid() ? "Valid" : "Stale"}
                  {botCacheRef.current.timestamp > 0 && (
                    <span className="block">
                      {Math.floor(
                        (Date.now() - botCacheRef.current.timestamp) / 1000
                      )}
                      s old
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium">Activities Cache</p>
                <p className="text-blue-400">
                  {Math.floor(activitiesCacheAge / 1000)}s old
                </p>
              </div>
              <div>
                <p className="font-medium">Refresh Failures</p>
                <p
                  className={
                    refreshFailures > 0 ? "text-red-400" : "text-green-400"
                  }
                >
                  {refreshFailures}
                </p>
              </div>
              <div>
                <p className="font-medium">Data Source</p>
                <p className="text-blue-400">Polling (90s)</p>
              </div>
            </div>
            {getCacheStats && (
              <div className="mt-2 pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground">
                  Global cache: {JSON.stringify(getCacheStats(), null, 2)}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Error states for activities */}
        {activitiesError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30"
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-orange-400 font-medium">
                  Activity Feed Issue
                </p>
                <p className="text-orange-400/80 text-sm">{activitiesError}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Bot status is still updating normally. Activities may be
                  cached.
                </p>
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

        {/* Bot Header - Mobile Optimized */}
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

        {/* Performance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PerformanceStats bot={bot} />
        </motion.div>

        {/* Bot Configuration */}
        {bot.config && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <BotConfiguration showConfig={showConfig} config={bot.config} />
          </motion.div>
        )}

        {/* Activity Log with optimization info */}
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
            {/* OPTIMIZATION: Show data freshness */}
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>
                {activitiesLoading
                  ? "Updating..."
                  : `Updated ${Math.floor(activitiesCacheAge / 1000)}s ago`}
              </span>
              {activityStats && (
                <span className="hidden sm:inline">
                  • {activityStats.personalityActions} personality actions
                </span>
              )}
            </div>
          </div>
          <ActivityLog logs={activityLog} />
        </motion.div>
      </div>
    </div>
  );
};

export default BotDetailPage;
