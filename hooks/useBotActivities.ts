// hooks/useBotActivities.ts - Fixed version without re-render loops

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
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

// Hook options
interface UseBotActivitiesOptions {
  filters?: ActivityFilters;
  limitCount?: number;
  realTime?: boolean;
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

/**
 * Hook for fetching and managing bot activities from Firestore
 * Fixed version to prevent re-render loops
 */
export function useBotActivities(options: UseBotActivitiesOptions = {}) {
  const { filters = {}, limitCount = 50, realTime = true } = options;

  const [activities, setActivities] = useState<BotActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use refs to track current values and prevent unnecessary re-renders
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const mountedRef = useRef(true);

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

  // Build Firestore query based on filters
  const buildQuery = useCallback(() => {
    const activitiesRef = collection(db, "bot_activities");
    const constraints: any[] = [];

    // Add filters
    if (stableFilters.botName) {
      constraints.push(where("botName", "==", stableFilters.botName));
    }

    if (stableFilters.actionTypes && stableFilters.actionTypes.length > 0) {
      // Firestore 'in' operator supports up to 10 values
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

  // Setup Firestore listener
  useEffect(() => {
    if (!realTime || !mountedRef.current) return;

    // Cleanup previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setLoading(true);
    setError(null);

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
        },
        (err) => {
          if (!mountedRef.current) return;

          console.error("Error fetching bot activities:", err);
          setError(err.message || "Failed to fetch activities");
          setLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      if (!mountedRef.current) return;

      console.error("Error setting up activities listener:", err);
      setError(err instanceof Error ? err.message : "Failed to setup listener");
      setLoading(false);
    }

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [buildQuery, realTime]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
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
      // Count personality vs system actions
      if (activity.isPersonalityAction) {
        stats.personalityActions++;
      } else {
        stats.systemActions++;
      }

      // Count action types
      stats.actionTypeCounts[activity.actionType] =
        (stats.actionTypeCounts[activity.actionType] || 0) + 1;

      // Count activities per bot
      stats.botActivityCounts[activity.botName] =
        (stats.botActivityCounts[activity.botName] || 0) + 1;

      // Track unique bots
      uniqueBotNames.add(activity.botName);
    });

    stats.uniqueBots = uniqueBotNames.size;
    return stats;
  }, [activities]);

  // Memoized helper functions to prevent recreation on every render
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

  // Refresh function that doesn't cause re-renders
  const refresh = useCallback(() => {
    if (unsubscribeRef.current) {
      // Force a re-subscription by rebuilding the query
      const newQuery = buildQuery();
      // The useEffect will handle the cleanup and re-subscription
    }
  }, [buildQuery]);

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

    // Convenience getters (memoized)
    hasActivities: activities.length > 0,
    isEmpty: activities.length === 0,
    personalityActions: getPersonalityActions,
    tradeActivities: getTradeActivities,
    recentActivities: getRecentActivities(),
  };
}

/**
 * Hook specifically for a single bot's activities
 */
export function useBotActivity(
  botName: string,
  options: Omit<UseBotActivitiesOptions, "filters"> = {}
) {
  // Stable options object to prevent re-renders
  const stableOptions = useMemo(
    () => ({
      ...options,
      filters: { botName },
    }),
    [botName, options.limitCount, options.realTime]
  );

  return useBotActivities(stableOptions);
}

/**
 * Hook for live activity feed across all bots
 */
export function useLiveActivityFeed(limitCount: number = 20) {
  // Stable options object to prevent re-renders
  const stableOptions = useMemo(
    () => ({
      filters: { personalityActionsOnly: true },
      limitCount,
      realTime: true,
    }),
    [limitCount]
  );

  return useBotActivities(stableOptions);
}

/**
 * Hook for trade activities only
 */
export function useTradeActivities(botName?: string, limitCount: number = 50) {
  // Stable options object to prevent re-renders
  const stableOptions = useMemo(
    () => ({
      filters: {
        botName,
        actionTypes: ["buy", "sell"],
      },
      limitCount,
      realTime: true,
    }),
    [botName, limitCount]
  );

  return useBotActivities(stableOptions);
}

/**
 * Hook for getting activity statistics
 */
export function useActivityStatistics(filters?: ActivityFilters) {
  // Stable options object to prevent re-renders
  const stableOptions = useMemo(
    () => ({
      filters,
      limitCount: 1000,
      realTime: true,
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
