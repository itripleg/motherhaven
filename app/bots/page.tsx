// app/bots/page.tsx - OPTIMIZED with reduced API calls and smart caching
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

// Import the modular components
import PageHeader from "./components/PageHeader";
import BotFleetTab from "./components/BotFleetTab";
import LiveActivityFeed from "./components/LiveActivityFeed";
import { TVBBot, FleetStats } from "./components/helpers";

// OPTIMIZATION: Smart caching and request management
interface CachedData {
  bots: TVBBot[];
  timestamp: number;
  isValid: boolean;
}

const CACHE_DURATION = 15000; // 15 seconds cache (reduced from 30s)
const REFRESH_INTERVAL = 10000; // 10 seconds refresh (reduced from 30s)
const OFFLINE_THRESHOLD = 4 * 60 * 1000; // 4 minutes offline threshold
const MAX_CONSECUTIVE_FAILURES = 3;

const TVBPage = () => {
  const [bots, setBots] = useState<TVBBot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("fleet");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // OPTIMIZATION: Advanced caching and request management
  const cacheRef = useRef<CachedData>({
    bots: [],
    timestamp: 0,
    isValid: false,
  });
  const requestInFlightRef = useRef<boolean>(false);
  const consecutiveFailuresRef = useRef<number>(0);
  const lastSuccessfulFetchRef = useRef<number>(0);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisibleRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // OPTIMIZATION: Request deduplication to prevent duplicate API calls
  const requestCacheRef = useRef<Map<string, Promise<any>>>(new Map());

  // OPTIMIZATION: Request deduplication helper
  const fetchWithDeduplication = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const cacheKey = `${url}_${JSON.stringify(options.headers || {})}`;

      // Return existing promise if request is already in flight
      if (requestCacheRef.current.has(cacheKey)) {
        console.log("🤖 TVB: Using deduplicated request for", url);
        return requestCacheRef.current.get(cacheKey);
      }

      // Create new request
      const promise = fetch(url, options)
        .then((response) => response.json())
        .finally(() => {
          // Clean up cache entry when request completes
          requestCacheRef.current.delete(cacheKey);
        });

      // Cache the promise
      requestCacheRef.current.set(cacheKey, promise);
      console.log("🤖 TVB: Starting new request for", url);

      return promise;
    },
    []
  );
  const fixedStars = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: 2 + Math.random() * 3,
    }));
  }, []);

  // OPTIMIZATION: Page visibility detection to pause updates when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;

      if (isPageVisibleRef.current) {
        console.log("🤖 TVB: Page visible - resuming updates");
        // Immediately fetch when page becomes visible if cache is stale
        const now = Date.now();
        if (now - cacheRef.current.timestamp > CACHE_DURATION) {
          fetchBots();
        }
      } else {
        console.log("🤖 TVB: Page hidden - pausing updates");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // OPTIMIZATION: Smart cache management
  const isCacheValid = useCallback(() => {
    const now = Date.now();
    return (
      cacheRef.current.isValid &&
      now - cacheRef.current.timestamp < CACHE_DURATION
    );
  }, []);

  const updateCache = useCallback((newBots: TVBBot[]) => {
    cacheRef.current = {
      bots: newBots,
      timestamp: Date.now(),
      isValid: true,
    };
  }, []);

  // OPTIMIZATION: Generate fixed star positions that won't change on re-renders
  const processBotsData = useCallback((rawBots: any[]): TVBBot[] => {
    const currentTime = Date.now();

    return rawBots.map((bot) => {
      const lastSeenTime = new Date(bot.lastSeen).getTime();
      const timeSinceLastSeen = currentTime - lastSeenTime;

      // OPTIMIZATION: More sophisticated online detection
      let isOnline = timeSinceLastSeen < OFFLINE_THRESHOLD;

      // Additional check: if bot hasn't sent heartbeat recently, consider offline
      if (bot.lastAction?.type === "heartbeat") {
        const lastActionTime = new Date(bot.lastAction.timestamp).getTime();
        const timeSinceLastAction = currentTime - lastActionTime;
        isOnline = isOnline && timeSinceLastAction < OFFLINE_THRESHOLD;
      }

      return {
        ...bot,
        isOnline,
        lastSeenFormatted: new Date(bot.lastSeen).toLocaleTimeString(),
        timeSinceLastSeen: Math.floor(timeSinceLastSeen / 1000), // seconds
      };
    });
  }, []);

  // OPTIMIZATION: Enhanced bot data processing with offline detection
  const fetchBots = useCallback(
    async (force: boolean = false) => {
      // Don't fetch if page is hidden and not forced
      if (!isPageVisibleRef.current && !force) {
        console.log("🤖 TVB: Skipping fetch - page hidden");
        return;
      }

      // Use cache if valid and not forced
      if (!force && isCacheValid()) {
        console.log("🤖 TVB: Using cached data");
        setBots(cacheRef.current.bots);
        setLastUpdate(new Date(cacheRef.current.timestamp));
        setIsLoading(false);
        return;
      }

      // Prevent concurrent requests
      if (requestInFlightRef.current) {
        console.log("🤖 TVB: Request already in flight, skipping");
        return;
      }

      // Check for backoff after consecutive failures
      if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
        const timeSinceLastSuccess =
          Date.now() - lastSuccessfulFetchRef.current;
        const backoffTime = Math.min(
          60000,
          Math.pow(2, consecutiveFailuresRef.current) * 1000
        ); // Exponential backoff, max 1 minute

        if (timeSinceLastSuccess < backoffTime) {
          console.log(
            `🤖 TVB: In backoff period (${Math.ceil(
              (backoffTime - timeSinceLastSuccess) / 1000
            )}s remaining)`
          );
          return;
        }
      }

      requestInFlightRef.current = true;

      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        console.log(
          "🤖 TVB: Fetching bot fleet data...",
          force ? "(forced)" : ""
        );
        setError(null);

        if (bots.length === 0) {
          setIsLoading(true);
        }

        const response = await fetchWithDeduplication("/api/tvb/webhook", {
          method: "GET",
          headers: {
            "X-Request-Source": "bots-page-optimized",
            "X-Cache-Control": force ? "no-cache" : "use-cache",
          },
          signal: abortControllerRef.current.signal,
        });

        if (!response.success) {
          throw new Error(`API Error: ${response.error || "Unknown error"}`);
        }

        const data = response;
        console.log("🤖 TVB: API Response:", {
          success: data.success,
          totalBots: data.totalBots,
          onlineBots: data.onlineBots,
          devBots: data.devBots,
          prodBots: data.prodBots,
        });

        if (data.success && Array.isArray(data.bots)) {
          const processedBots = processBotsData(data.bots);

          // Update cache
          updateCache(processedBots);

          setBots(processedBots);
          setLastUpdate(new Date());
          lastSuccessfulFetchRef.current = Date.now();
          consecutiveFailuresRef.current = 0; // Reset failure count on success

          console.log(
            `🤖 TVB: Successfully loaded ${processedBots.length} bots`
          );
        } else {
          console.warn("🤖 TVB: Invalid response format:", data);
          setBots([]);
        }
      } catch (err) {
        // Don't log errors for aborted requests
        if (err instanceof Error && err.name === "AbortError") {
          console.log("🤖 TVB: Request aborted");
          return;
        }

        console.error("🤖 TVB: Error fetching bots:", err);
        consecutiveFailuresRef.current += 1;

        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch bots";
        setError(errorMessage);

        // Use cached data if available during errors
        if (cacheRef.current.isValid) {
          console.log("🤖 TVB: Using cached data due to error");
          setBots(cacheRef.current.bots);
          setLastUpdate(new Date(cacheRef.current.timestamp));
        } else {
          setBots([]);
        }
      } finally {
        setIsLoading(false);
        requestInFlightRef.current = false;
      }
    },
    [isCacheValid, updateCache, processBotsData, bots.length]
  );

  // OPTIMIZATION: Smart refresh interval management
  useEffect(() => {
    // Initial fetch
    fetchBots(true);

    // Set up interval with adaptive timing
    const setupInterval = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      refreshIntervalRef.current = setInterval(() => {
        // Only fetch if page is visible
        if (isPageVisibleRef.current) {
          fetchBots();
        }
      }, REFRESH_INTERVAL);
    };

    setupInterval();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear request cache on unmount
      requestCacheRef.current.clear();
    };
  }, [fetchBots]);

  // OPTIMIZATION: Manual refresh with force flag
  const handleRefresh = useCallback(() => {
    console.log("🤖 TVB: Manual refresh triggered");
    fetchBots(true);
  }, [fetchBots]);

  // OPTIMIZATION: Memoized fleet stats calculation
  const fleetStats: FleetStats = useMemo(() => {
    return {
      totalActions: bots.reduce((sum, bot) => sum + (bot.totalActions || 0), 0),
      activeBots: bots.filter((bot) => bot.isOnline).length,
      totalBots: bots.length,
    };
  }, [bots]);

  // OPTIMIZATION: Show loading only on initial load
  if (isLoading && bots.length === 0 && !cacheRef.current.isValid) {
    return (
      <div className="min-h-screen animated-bg floating-particles flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading TVB Fleet...</p>
          <p className="text-muted-foreground text-sm mt-2">
            Fetching bot status from optimized API...
          </p>
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

      <div className="relative z-10 container mx-auto p-6 pt-24">
        {/* Page Header */}
        <PageHeader
          lastUpdate={lastUpdate}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />

        {/* OPTIMIZATION: Enhanced error state with cache info */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="unified-card border-destructive/30 bg-destructive/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div className="flex-1">
                    <h3 className="text-destructive font-medium">
                      Connection Error
                    </h3>
                    <p className="text-destructive/80 text-sm">{error}</p>
                    {cacheRef.current.isValid && (
                      <p className="text-muted-foreground text-xs mt-1">
                        Showing cached data from{" "}
                        {new Date(
                          cacheRef.current.timestamp
                        ).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Failures: {consecutiveFailuresRef.current}</p>
                    <p>
                      Cache: {cacheRef.current.isValid ? "Valid" : "Invalid"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* OPTIMIZATION: Cache status indicator for debugging */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 text-xs text-muted-foreground">
            Cache: {isCacheValid() ? "Valid" : "Stale"} | Age:{" "}
            {Math.floor((Date.now() - cacheRef.current.timestamp) / 1000)}s |
            Failures: {consecutiveFailuresRef.current} | Page Visible:{" "}
            {isPageVisibleRef.current ? "Yes" : "No"}
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-background/80 border border-border/50 backdrop-blur-sm">
            <TabsTrigger
              value="fleet"
              className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-foreground"
            >
              🤖 Bot Fleet ({bots.length})
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-foreground"
            >
              📊 Live Activity ({fleetStats.activeBots} active)
            </TabsTrigger>
          </TabsList>

          {/* Bot Fleet Tab */}
          <TabsContent value="fleet" className="space-y-6">
            <BotFleetTab bots={bots} fleetStats={fleetStats} />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <LiveActivityFeed bots={bots} />
          </TabsContent>
        </Tabs>

        {/* OPTIMIZATION: Performance info footer for development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-secondary/20 rounded-lg border border-border/30">
            <h4 className="text-sm font-medium text-foreground mb-2">
              🚀 Optimization Stats
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="font-medium">Refresh Interval</p>
                <p>{REFRESH_INTERVAL / 1000}s (faster for trading)</p>
              </div>
              <div>
                <p className="font-medium">Cache Duration</p>
                <p>{CACHE_DURATION / 1000}s</p>
              </div>
              <div>
                <p className="font-medium">Offline Threshold</p>
                <p>{OFFLINE_THRESHOLD / 60000}min</p>
              </div>
              <div>
                <p className="font-medium">Request Management</p>
                <p>Smart caching + visibility detection + deduplication</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TVBPage;
