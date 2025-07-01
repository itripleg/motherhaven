// final-hooks/useTokenList.ts
import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  QueryConstraint,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useFactoryConfigContext } from "@/contexts/FactoryConfigProvider";

// Enums for better type safety
export enum SortBy {
  NEWEST = "createdAt",
  OLDEST = "createdAt",
  NAME = "name",
  SYMBOL = "symbol",
  PRICE = "currentPrice",
  VOLUME = "volumeETH",
}

export enum SortDirection {
  ASC = "asc",
  DESC = "desc",
}

export enum FilterBy {
  ALL = "all",
  TRADING = "trading",
  NEW = "new", // created in last 24h
  TRENDING = "trending", // high activity
  GOAL_REACHED = "goal_reached", // close to or reached funding goal
}

// Interface for token list items (lighter than full Token interface)
export interface TokenListItem {
  address: string;
  name: string;
  symbol: string;
  imageUrl: string;
  creator: string;
  createdAt: string;
  fundingGoal: string;
  state: number; // TokenState enum value
  currentPrice: string;
  statistics: {
    volumeETH: string;
    tradeCount: number;
    uniqueHolders: number;
    collateral: string;
  };
  // Image positioning data if needed for display
  imagePosition?: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    fit?: "cover" | "contain" | "fill";
  };
}

// Hook options interface
interface UseTokenListOptions {
  sortBy?: SortBy;
  sortDirection?: SortDirection;
  filterBy?: FilterBy;
  limitCount?: number;
  searchQuery?: string;
  enableRealtime?: boolean; // Option to disable real-time updates
}

// Default options
const DEFAULT_OPTIONS: Required<Omit<UseTokenListOptions, "searchQuery">> = {
  sortBy: SortBy.NEWEST,
  sortDirection: SortDirection.DESC,
  filterBy: FilterBy.ALL,
  limitCount: 25,
  enableRealtime: true,
};

/**
 * Consolidated token list hook with real-time updates and filtering
 * Replaces the old useTokenList functionality with better performance
 */
export function useTokenList(options: UseTokenListOptions = {}) {
  const {
    sortBy = DEFAULT_OPTIONS.sortBy,
    sortDirection = DEFAULT_OPTIONS.sortDirection,
    filterBy = DEFAULT_OPTIONS.filterBy,
    limitCount = DEFAULT_OPTIONS.limitCount,
    searchQuery = "",
    enableRealtime = DEFAULT_OPTIONS.enableRealtime,
  } = options;

  const { config: factoryConfig } = useFactoryConfigContext();
  const [tokens, setTokens] = useState<TokenListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build Firestore query constraints
  const queryConstraints = useMemo((): QueryConstraint[] => {
    const constraints: QueryConstraint[] = [];

    // Add filtering
    if (filterBy === FilterBy.TRADING) {
      constraints.push(where("state", "==", 1)); // TokenState.TRADING
    } else if (filterBy === FilterBy.NEW) {
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      constraints.push(where("createdAt", ">=", yesterday));
    } else if (filterBy === FilterBy.TRENDING) {
      constraints.push(where("statistics.tradeCount", ">=", 5));
    } else if (filterBy === FilterBy.GOAL_REACHED) {
      // This might need to be computed client-side if we don't store this field
      // For now, we'll filter this in the client-side processing
    }

    // Add sorting - be careful with Firestore composite index requirements
    if (sortBy && sortBy !== SortBy.NAME && sortBy !== SortBy.SYMBOL) {
      let firestoreField = sortBy;
      if (sortBy === SortBy.PRICE) {
        firestoreField = "statistics.currentPrice";
      } else if (sortBy === SortBy.VOLUME) {
        firestoreField = "statistics.volumeETH";
      }

      // Only add orderBy if we're not already filtering by a field that needs ordering
      if (filterBy === FilterBy.NEW && sortBy !== SortBy.NEWEST) {
        // Can't combine where with different orderBy fields in Firestore
        // Will sort client-side instead
      } else {
        constraints.push(orderBy(firestoreField, sortDirection));
      }
    } else {
      // Default sort by creation time
      constraints.push(orderBy("createdAt", "desc"));
    }

    constraints.push(limit(limitCount));

    return constraints;
  }, [sortBy, sortDirection, filterBy, limitCount]);

  // Fetch tokens from Firestore
  useEffect(() => {
    if (!factoryConfig) return;

    setLoading(true);
    setError(null);

    const tokensRef = collection(db, "tokens");
    const q = query(tokensRef, ...queryConstraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`📊 Loaded ${snapshot.docs.length} tokens from Firestore`);

        const tokenData: TokenListItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            address: doc.id,
            name: data.name || "Unknown",
            symbol: data.symbol || "UNKNOWN",
            imageUrl: data.imageUrl || "",
            creator: data.creator || "0x0",
            createdAt: data.createdAt || new Date().toISOString(),
            fundingGoal: data.fundingGoal || "0",
            state: data.state || 0,
            currentPrice: data.statistics?.currentPrice || "0",
            statistics: {
              volumeETH: data.statistics?.volumeETH || "0",
              tradeCount: data.statistics?.tradeCount || 0,
              uniqueHolders: data.statistics?.uniqueHolders || 0,
              collateral: data.statistics?.collateral || "0",
            },
            imagePosition: data.imagePosition || undefined,
          };
        });

        setTokens(tokenData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching tokens:", err);
        setError(`Failed to load tokens: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [factoryConfig, queryConstraints, enableRealtime]);

  // Apply client-side filtering and sorting
  const filteredAndSortedTokens = useMemo(() => {
    let result = [...tokens];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (token) =>
          token.name.toLowerCase().includes(query) ||
          token.symbol.toLowerCase().includes(query) ||
          token.address.toLowerCase().includes(query) ||
          token.creator.toLowerCase().includes(query)
      );
    }

    // Apply goal reached filter (client-side)
    if (filterBy === FilterBy.GOAL_REACHED) {
      result = result.filter((token) => {
        const collateral = parseFloat(token.statistics.collateral);
        const goal = parseFloat(token.fundingGoal);
        return goal > 0 && collateral / goal >= 0.8; // 80% or more
      });
    }

    // Apply client-side sorting for fields not supported by Firestore ordering
    if (sortBy === SortBy.NAME || sortBy === SortBy.SYMBOL) {
      result.sort((a, b) => {
        const aValue = sortBy === SortBy.NAME ? a.name : a.symbol;
        const bValue = sortBy === SortBy.NAME ? b.name : b.symbol;
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === SortDirection.ASC ? comparison : -comparison;
      });
    }

    // Handle complex sorting that couldn't be done in Firestore
    if (filterBy === FilterBy.NEW && sortBy !== SortBy.NEWEST) {
      if (sortBy === SortBy.PRICE) {
        result.sort((a, b) => {
          const aPrice = parseFloat(a.currentPrice);
          const bPrice = parseFloat(b.currentPrice);
          return sortDirection === SortDirection.ASC
            ? aPrice - bPrice
            : bPrice - aPrice;
        });
      }
    }

    return result;
  }, [tokens, searchQuery, sortBy, sortDirection, filterBy]);

  // Helper functions for convenience
  const getTrendingTokens = useMemo(() => {
    return tokens
      .filter((token) => token.statistics.tradeCount > 5)
      .sort((a, b) => b.statistics.tradeCount - a.statistics.tradeCount)
      .slice(0, 10);
  }, [tokens]);

  const getNewTokens = useMemo(() => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    return tokens
      .filter((token) => new Date(token.createdAt).getTime() > yesterday)
      .slice(0, 10);
  }, [tokens]);

  const getTopVolumeTokens = useMemo(() => {
    return tokens
      .sort(
        (a, b) =>
          parseFloat(b.statistics.volumeETH) -
          parseFloat(a.statistics.volumeETH)
      )
      .slice(0, 10);
  }, [tokens]);

  const getGoalCloseTokens = useMemo(() => {
    return tokens
      .filter((token) => {
        const collateral = parseFloat(token.statistics.collateral);
        const goal = parseFloat(token.fundingGoal);
        return goal > 0 && collateral / goal >= 0.5; // 50% or more
      })
      .sort((a, b) => {
        const aProgress =
          parseFloat(a.statistics.collateral) / parseFloat(a.fundingGoal);
        const bProgress =
          parseFloat(b.statistics.collateral) / parseFloat(b.fundingGoal);
        return bProgress - aProgress;
      })
      .slice(0, 10);
  }, [tokens]);

  // Manual refresh function
  const refreshTokens = () => {
    setLoading(true);
    // The onSnapshot will automatically refresh the data
  };

  return {
    // Main data
    tokens: filteredAndSortedTokens,
    loading,
    error,

    // Convenience getters
    trendingTokens: getTrendingTokens,
    newTokens: getNewTokens,
    topVolumeTokens: getTopVolumeTokens,
    goalCloseTokens: getGoalCloseTokens,

    // Stats
    totalCount: tokens.length,
    filteredCount: filteredAndSortedTokens.length,

    // Helper functions
    refreshTokens,

    // Raw unfiltered data
    allTokens: tokens,
  };
}

// Lightweight hook for just getting recent tokens (no real-time updates)
export function useRecentTokens(limit: number = 10) {
  const { tokens, loading, error } = useTokenList({
    limitCount: limit,
    sortBy: SortBy.NEWEST,
    enableRealtime: true,
  });

  return {
    recentTokens: tokens,
    loading,
    error,
  };
}

// Hook specifically for trending tokens
export function useTrendingTokens(limit: number = 10) {
  const { tokens, loading, error } = useTokenList({
    filterBy: FilterBy.TRENDING,
    limitCount: limit * 2, // Get more to account for filtering
  });

  return {
    trendingTokens: tokens.slice(0, limit),
    loading,
    error,
  };
}
