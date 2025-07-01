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
import { Token } from "@/types";
import { useFactoryConfigContext } from "@/contexts/FactoryConfigProvider";

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
}

interface UseTokenListOptions {
  sortBy?: SortBy;
  sortDirection?: SortDirection;
  filterBy?: FilterBy;
  limitCount?: number;
  searchQuery?: string;
}

interface TokenListItem {
  address: string;
  name: string;
  symbol: string;
  imageUrl: string;
  creator: string;
  createdAt: string;
  currentPrice: string;
  statistics: {
    volumeETH: string;
    tradeCount: number;
    uniqueHolders: number;
  };
}

/**
 * Simplified token list hook for displaying token grids/lists
 * Consolidates useTokenList functionality with better performance
 */
export function useTokenList(options: UseTokenListOptions = {}) {
  const {
    sortBy = SortBy.NEWEST,
    sortDirection = SortDirection.DESC,
    filterBy = FilterBy.ALL,
    limitCount = 25,
    searchQuery = "",
  } = options;

  const { config: factoryConfig } = useFactoryConfigContext();
  const [tokens, setTokens] = useState<TokenListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build Firestore query
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
    }

    // Add sorting
    if (sortBy && sortBy !== SortBy.NAME && sortBy !== SortBy.SYMBOL) {
      // For Firestore fields
      let firestoreField = sortBy;
      if (sortBy === SortBy.PRICE) {
        firestoreField = "statistics.currentPrice";
      } else if (sortBy === SortBy.VOLUME) {
        firestoreField = "statistics.volumeETH";
      }

      constraints.push(orderBy(firestoreField, sortDirection));
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
    const tokensRef = collection(db, "tokens");
    const q = query(tokensRef, ...queryConstraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tokenData: TokenListItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            address: doc.id,
            name: data.name || "Unknown",
            symbol: data.symbol || "UNKNOWN",
            imageUrl: data.imageUrl || "",
            creator: data.creator || "0x0",
            createdAt: data.createdAt || new Date().toISOString(),
            currentPrice: data.statistics?.currentPrice || "0",
            statistics: {
              volumeETH: data.statistics?.volumeETH || "0",
              tradeCount: data.statistics?.tradeCount || 0,
              uniqueHolders: data.statistics?.uniqueHolders || 0,
            },
          };
        });

        setTokens(tokenData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching tokens:", err);
        setError("Failed to load tokens");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [factoryConfig, queryConstraints]);

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
          token.address.toLowerCase().includes(query)
      );
    }

    // Apply client-side sorting for fields not supported by Firestore
    if (sortBy === SortBy.NAME || sortBy === SortBy.SYMBOL) {
      result.sort((a, b) => {
        const aValue = sortBy === SortBy.NAME ? a.name : a.symbol;
        const bValue = sortBy === SortBy.NAME ? b.name : b.symbol;
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === SortDirection.ASC ? comparison : -comparison;
      });
    }

    return result;
  }, [tokens, searchQuery, sortBy, sortDirection]);

  // Helper functions
  const getTrendingTokens = () => {
    return tokens
      .filter((token) => token.statistics.tradeCount > 5)
      .sort((a, b) => b.statistics.tradeCount - a.statistics.tradeCount)
      .slice(0, 10);
  };

  const getNewTokens = () => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    return tokens
      .filter((token) => new Date(token.createdAt).getTime() > yesterday)
      .slice(0, 10);
  };

  const getTokensByVolume = () => {
    return tokens
      .sort(
        (a, b) =>
          parseFloat(b.statistics.volumeETH) -
          parseFloat(a.statistics.volumeETH)
      )
      .slice(0, 10);
  };

  return {
    // Main data
    tokens: filteredAndSortedTokens,
    loading,
    error,

    // Convenience getters
    trendingTokens: getTrendingTokens(),
    newTokens: getNewTokens(),
    topVolumeTokens: getTokensByVolume(),

    // Stats
    totalCount: tokens.length,
    filteredCount: filteredAndSortedTokens.length,

    // Helper functions
    getTrendingTokens,
    getNewTokens,
    getTokensByVolume,
  };
}
