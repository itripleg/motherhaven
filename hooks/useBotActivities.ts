// hooks/useBotActivities.ts - OPTIMIZED version with massive Firebase usage reduction

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/firebase";

// Types for bot activities
export interface BotActivity {
  id?: string;
  botName: string;
  displayName: string;
  avatarUrl: string;
  actionType: string;
  message: string;
  details: any;
  timestamp: string;
  isPersonalityAction: boolean;
  sessionId: string;

  // Financial metrics
  currentBalance?: number;
  pnlAmount?: number;
  pnlPercentage?: number;

  // Token info
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenName?: string;

  // Trade details
  tradeAmount?: number;
  txHash?: string;

  // Firestore timestamp
  createdAt: any;
}

// Filter options for activities
export interface ActivityFilters {
  botName?: string;
  actionTypes?: string[];
  personalityActionsOnly?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sessionId?: string;
}

// Hook options with optimization controls
interface UseBotActivitiesOptions {
  filters?: ActivityFilters;
  limitCount?: number;
  realTime?: boolean;
  cacheDuration?: number; // How long to cache data (ms)
  pollingInterval?: number; // Polling interval for non-realtime (ms)
  enableSharedCache?: boolean; // Use shared cache across components
}

// Activity statistics
interface ActivityStats {
  totalActivities: number;
  personalityActions: number;
  systemActions: number;
  uniqueBots: number;
  actionTypeCounts: Record<string, number>;
  botActivityCounts: Record<string, number>;
}

// OPTIMIZATION: Shared cache across all hook instances
interface CacheEntry {
  data: BotActivity[];
  timestamp: number;
  queryKey: string;
  isValid: boolean;
}

class SharedActivityCache {
  private cache = new Map<string, CacheEntry>();
  private activeListeners = new Map<string, Set<string>>();
  private realtimeSubscriptions = new Map<string, Unsubscribe>();

  private readonly DEFAULT_CACHE_DURATION = 30000; // 30 seconds
  private readonly MAX_CACHE_SIZE = 50;
  private readonly MAX_REALTIME_LISTENERS = 3; // Limit concurrent realtime listeners

  generateQueryKey(filters: ActivityFilters, limitCount: number): string {
    return JSON.stringify({
      botName: filters.botName,
      actionTypes: filters.actionTypes?.sort(),
      personalityActionsOnly: filters.personalityActionsOnly,
      sessionId: filters.sessionId,
      limitCount,
      // Exclude dateRange from cache key for now as it's rarely used
    });
  }

  isCacheValid(queryKey: string, cacheDuration: number): boolean {
    const entry = this.cache.get(queryKey);
    if (!entry || !entry.isValid) return false;

    const age = Date.now() - entry.timestamp;
    return age < cacheDuration;
  }

  getCachedData(queryKey: string): BotActivity[] | null {
    const entry = this.cache.get(queryKey);
    return entry?.isValid ? entry.data : null;
  }

  setCachedData(queryKey: string, data: BotActivity[]): void {
    // Cleanup old cache entries if we're at the limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      )[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(queryKey, {
      data,
      timestamp: Date.now(),
      queryKey,
      isValid: true,
    });

    console.log(
      `📚 Cached ${data.length} activities for query: ${queryKey.substring(
        0,
        50
      )}...`
    );
  }

  invalidateCache(botName?: string): void {
    if (botName) {
      // Invalidate cache entries that might contain this bot's data
      for (const [key, entry] of this.cache.entries()) {
        if (
          key.includes(`"botName":"${botName}"`) ||
          !key.includes('"botName"')
        ) {
          entry.isValid = false;
        }
      }
      console.log(`🧹 Invalidated cache for bot: ${botName}`);
    } else {
      // Invalidate all cache
      for (const entry of this.cache.values()) {
        entry.isValid = false;
      }
      console.log(`🧹 Invalidated all activity cache`);
    }
  }

  registerListener(queryKey: string, instanceId: string): void {
    if (!this.activeListeners.has(queryKey)) {
      this.activeListeners.set(queryKey, new Set());
    }
    this.activeListeners.get(queryKey)!.add(instanceId);
  }

  unregisterListener(queryKey: string, instanceId: string): void {
    const listeners = this.activeListeners.get(queryKey);
    if (listeners) {
      listeners.delete(instanceId);
      if (listeners.size === 0) {
        this.activeListeners.delete(queryKey);

        // Cleanup realtime subscription if no more listeners
        const subscription = this.realtimeSubscriptions.get(queryKey);
        if (subscription) {
          subscription();
          this.realtimeSubscriptions.delete(queryKey);
          console.log(
            `🔌 Cleaned up realtime subscription for: ${queryKey.substring(
              0,
              50
            )}...`
          );
        }
      }
    }
  }

  canUseRealtime(queryKey: string): boolean {
    return this.realtimeSubscriptions.size < this.MAX_REALTIME_LISTENERS;
  }

  setRealtimeSubscription(queryKey: string, unsubscribe: Unsubscribe): void {
    this.realtimeSubscriptions.set(queryKey, unsubscribe);
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      activeQueries: this.activeListeners.size,
      realtimeSubscriptions: this.realtimeSubscriptions.size,
      cachedQueries: Array.from(this.cache.keys()).map(
        (k) => k.substring(0, 50) + "..."
      ),
    };
  }
}

// Global shared cache instance
const sharedCache = new SharedActivityCache();

/**
 * OPTIMIZED Hook for fetching and managing bot activities from Firestore
 * Major reductions in Firebase usage through smart caching and listener management
 */
export function useBotActivities(options: UseBotActivitiesOptions = {}) {
  const {
    filters = {},
    limitCount = 50,
    realTime = false, // CHANGED: Default to false for less Firebase usage
    cacheDuration = 30000, // 30 seconds default cache
    pollingInterval = 60000, // 1 minute polling for non-realtime
    enableSharedCache = true,
  } = options;

  const [activities, setActivities] = useState<BotActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Generate unique instance ID
  const instanceId = useRef(Math.random().toString(36).substring(7)).current;
  const mountedRef = useRef(true);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  // Stable reference to filters to prevent re-render loops
  const stableFilters = useMemo(
    () => filters,
    [
      filters.botName,
      filters.actionTypes?.join(","),
      filters.personalityActionsOnly,
      filters.sessionId,
      filters.dateRange?.start?.getTime(),
      filters.dateRange?.end?.getTime(),
    ]
  );

  // Generate query key for caching
  const queryKey = useMemo(() => {
    return sharedCache.generateQueryKey(stableFilters, limitCount);
  }, [stableFilters, limitCount]);

  // Build Firestore query based on filters
  const buildQuery = useCallback(() => {
    const activitiesRef = collection(db, "bot_activities");
    const constraints: any[] = [];

    // Add filters
    if (stableFilters.botName) {
      constraints.push(where("botName", "==", stableFilters.botName));
    }

    if (stableFilters.actionTypes && stableFilters.actionTypes.length > 0) {
      const actionTypes = stableFilters.actionTypes.slice(0, 10);
      constraints.push(where("actionType", "in", actionTypes));
    }

    if (stableFilters.personalityActionsOnly) {
      constraints.push(where("isPersonalityAction", "==", true));
    }

    if (stableFilters.sessionId) {
      constraints.push(where("sessionId", "==", stableFilters.sessionId));
    }

    // Always order by creation time (newest first) and limit
    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(limitCount));

    return query(activitiesRef, ...constraints);
  }, [stableFilters, limitCount]);

  // OPTIMIZATION: Fetch data with caching
  const fetchData = useCallback(
    async (force: boolean = false) => {
      if (!mountedRef.current) return;

      // Check cache first (unless forced)
      if (
        !force &&
        enableSharedCache &&
        sharedCache.isCacheValid(queryKey, cacheDuration)
      ) {
        const cachedData = sharedCache.getCachedData(queryKey);
        if (cachedData) {
          console.log(
            `📚 Using cached activities for ${
              stableFilters.botName || "all bots"
            } (${cachedData.length} items)`
          );
          setActivities(cachedData);
          setLoading(false);
          setLastFetch(Date.now());
          return;
        }
      }

      try {
        setError(null);
        if (activities.length === 0) {
          setLoading(true);
        }

        console.log(
          `🔥 Fetching activities from Firebase for ${
            stableFilters.botName || "all bots"
          }...`
        );

        const q = buildQuery();
        const snapshot = await getDocs(q);

        if (!mountedRef.current) return;

        const newActivities: BotActivity[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          newActivities.push({
            id: doc.id,
            ...data,
          } as BotActivity);
        });

        setActivities(newActivities);
        setLoading(false);
        setLastFetch(Date.now());

        // Cache the results
        if (enableSharedCache) {
          sharedCache.setCachedData(queryKey, newActivities);
        }

        console.log(
          `✅ Fetched ${newActivities.length} activities for ${
            stableFilters.botName || "all bots"
          }`
        );
      } catch (err) {
        if (!mountedRef.current) return;

        console.error("Error fetching bot activities:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch activities"
        );
        setLoading(false);
      }
    },
    [
      queryKey,
      cacheDuration,
      enableSharedCache,
      buildQuery,
      stableFilters.botName,
      activities.length,
    ]
  );

  // OPTIMIZATION: Setup realtime listener only when needed and when slots are available
  const setupRealtimeListener = useCallback(() => {
    if (!realTime || !mountedRef.current) return;

    // Check if we can use realtime (limited slots)
    if (!sharedCache.canUseRealtime(queryKey)) {
      console.log(
        `⚠️ Realtime listener limit reached, falling back to polling for ${
          stableFilters.botName || "all bots"
        }`
      );
      return;
    }

    // Cleanup previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    try {
      const q = buildQuery();

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!mountedRef.current) return;

          const newActivities: BotActivity[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            newActivities.push({
              id: doc.id,
              ...data,
            } as BotActivity);
          });

          setActivities(newActivities);
          setLoading(false);
          setLastFetch(Date.now());

          // Update cache
          if (enableSharedCache) {
            sharedCache.setCachedData(queryKey, newActivities);
          }

          console.log(
            `📡 Realtime update: ${newActivities.length} activities for ${
              stableFilters.botName || "all bots"
            }`
          );
        },
        (err) => {
          if (!mountedRef.current) return;
          console.error("Realtime listener error:", err);
          setError(err.message || "Realtime listener failed");
        }
      );

      unsubscribeRef.current = unsubscribe;
      sharedCache.setRealtimeSubscription(queryKey, unsubscribe);

      console.log(
        `📡 Setup realtime listener for ${stableFilters.botName || "all bots"}`
      );
    } catch (err) {
      console.error("Error setting up realtime listener:", err);
      setError(err instanceof Error ? err.message : "Failed to setup listener");
    }
  }, [
    realTime,
    queryKey,
    buildQuery,
    stableFilters.botName,
    enableSharedCache,
  ]);

  // OPTIMIZATION: Setup polling for non-realtime updates
  const setupPolling = useCallback(() => {
    if (realTime || !mountedRef.current) return;

    const poll = () => {
      if (!mountedRef.current) return;

      // Only poll if cache is expired
      if (
        enableSharedCache &&
        sharedCache.isCacheValid(queryKey, cacheDuration)
      ) {
        // Schedule next poll
        pollingTimeoutRef.current = setTimeout(poll, pollingInterval);
        return;
      }

      fetchData().finally(() => {
        if (mountedRef.current) {
          pollingTimeoutRef.current = setTimeout(poll, pollingInterval);
        }
      });
    };

    // Start polling
    pollingTimeoutRef.current = setTimeout(poll, pollingInterval);
    console.log(
      `⏰ Setup polling every ${pollingInterval / 1000}s for ${
        stableFilters.botName || "all bots"
      }`
    );
  }, [
    realTime,
    pollingInterval,
    queryKey,
    cacheDuration,
    enableSharedCache,
    fetchData,
    stableFilters.botName,
  ]);

  // Main effect to setup data fetching
  useEffect(() => {
    if (enableSharedCache) {
      sharedCache.registerListener(queryKey, instanceId);
    }

    // Initial fetch
    fetchData();

    // Setup either realtime listener or polling
    if (realTime) {
      setupRealtimeListener();
    } else {
      setupPolling();
    }

    return () => {
      // Cleanup
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }

      if (enableSharedCache) {
        sharedCache.unregisterListener(queryKey, instanceId);
      }
    };
  }, [
    queryKey,
    instanceId,
    enableSharedCache,
    fetchData,
    setupRealtimeListener,
    setupPolling,
    realTime,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Calculate statistics - memoized to prevent recalculation on every render
  const statistics = useMemo((): ActivityStats => {
    const stats: ActivityStats = {
      totalActivities: activities.length,
      personalityActions: 0,
      systemActions: 0,
      uniqueBots: 0,
      actionTypeCounts: {},
      botActivityCounts: {},
    };

    const uniqueBotNames = new Set<string>();

    activities.forEach((activity) => {
      if (activity.isPersonalityAction) {
        stats.personalityActions++;
      } else {
        stats.systemActions++;
      }

      stats.actionTypeCounts[activity.actionType] =
        (stats.actionTypeCounts[activity.actionType] || 0) + 1;

      stats.botActivityCounts[activity.botName] =
        (stats.botActivityCounts[activity.botName] || 0) + 1;

      uniqueBotNames.add(activity.botName);
    });

    stats.uniqueBots = uniqueBotNames.size;
    return stats;
  }, [activities]);

  // Memoized helper functions
  const getActivitiesForBot = useCallback(
    (botName: string) => {
      return activities.filter((activity) => activity.botName === botName);
    },
    [activities]
  );

  const getActivitiesByType = useCallback(
    (actionType: string) => {
      return activities.filter(
        (activity) => activity.actionType === actionType
      );
    },
    [activities]
  );

  const getPersonalityActions = useMemo(() => {
    return activities.filter((activity) => activity.isPersonalityAction);
  }, [activities]);

  const getTradeActivities = useMemo(() => {
    return activities.filter((activity) =>
      ["buy", "sell"].includes(activity.actionType)
    );
  }, [activities]);

  const getRecentActivities = useCallback(
    (count: number = 10) => {
      return activities.slice(0, count);
    },
    [activities]
  );

  // OPTIMIZATION: Refresh function with cache invalidation
  const refresh = useCallback(() => {
    console.log(
      `🔄 Manual refresh requested for ${stableFilters.botName || "all bots"}`
    );
    if (enableSharedCache) {
      sharedCache.invalidateCache(stableFilters.botName);
    }
    fetchData(true);
  }, [enableSharedCache, stableFilters.botName, fetchData]);

  // Cache management functions
  const invalidateCache = useCallback(() => {
    if (enableSharedCache) {
      sharedCache.invalidateCache(stableFilters.botName);
    }
  }, [enableSharedCache, stableFilters.botName]);

  const getCacheStats = useCallback(() => {
    return sharedCache.getStats();
  }, []);

  return {
    // Core data
    activities,
    loading,
    error,
    statistics,

    // Helper functions
    getActivitiesForBot,
    getActivitiesByType,
    getRecentActivities,
    refresh,
    invalidateCache,
    getCacheStats,

    // Convenience getters (memoized)
    hasActivities: activities.length > 0,
    isEmpty: activities.length === 0,
    personalityActions: getPersonalityActions,
    tradeActivities: getTradeActivities,
    recentActivities: getRecentActivities(),

    // Optimization info
    lastFetch,
    isRealtime: realTime,
    cacheAge: enableSharedCache ? Date.now() - lastFetch : 0,
  };
}

/**
 * OPTIMIZED Hook specifically for a single bot's activities
 */
export function useBotActivity(
  botName: string,
  options: Omit<UseBotActivitiesOptions, "filters"> = {}
) {
  const stableOptions = useMemo(
    () => ({
      ...options,
      filters: { botName },
      // OPTIMIZATION: Use polling for individual bot pages to reduce Firebase load
      realTime: options.realTime ?? false,
      cacheDuration: options.cacheDuration ?? 45000, // 45 seconds cache for individual bots
      pollingInterval: options.pollingInterval ?? 90000, // 90 seconds polling
    }),
    [
      botName,
      options.realTime,
      options.cacheDuration,
      options.pollingInterval,
      options.limitCount,
      options.enableSharedCache,
    ]
  );

  return useBotActivities(stableOptions);
}

/**
 * OPTIMIZED Hook for live activity feed across all bots
 */
export function useLiveActivityFeed(limitCount: number = 20) {
  const stableOptions = useMemo(
    () => ({
      filters: { personalityActionsOnly: true },
      limitCount,
      realTime: false, // OPTIMIZATION: Use polling instead of realtime
      cacheDuration: 30000, // 30 seconds
      pollingInterval: 45000, // 45 seconds polling
    }),
    [limitCount]
  );

  return useBotActivities(stableOptions);
}

/**
 * OPTIMIZED Hook for trade activities only
 */
export function useTradeActivities(botName?: string, limitCount: number = 50) {
  const stableOptions = useMemo(
    () => ({
      filters: {
        botName,
        actionTypes: ["buy", "sell"],
      },
      limitCount,
      realTime: false, // OPTIMIZATION: Use polling
      cacheDuration: 60000, // 1 minute cache for trades
      pollingInterval: 120000, // 2 minutes polling
    }),
    [botName, limitCount]
  );

  return useBotActivities(stableOptions);
}

/**
 * OPTIMIZED Hook for getting activity statistics
 */
export function useActivityStatistics(filters?: ActivityFilters) {
  const stableOptions = useMemo(
    () => ({
      filters,
      limitCount: 500, // Reduced from 1000
      realTime: false, // OPTIMIZATION: Use polling for stats
      cacheDuration: 120000, // 2 minutes cache for stats
      pollingInterval: 300000, // 5 minutes polling
    }),
    [filters]
  );

  const { statistics, loading } = useBotActivities(stableOptions);

  return useMemo(
    () => ({
      statistics,
      loading,
      isEmpty: statistics.totalActivities === 0,
    }),
    [statistics, loading]
  );
}
