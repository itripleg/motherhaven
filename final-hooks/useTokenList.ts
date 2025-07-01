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
  NEWEST = "createdAt_desc",
  OLDEST = "createdAt_asc",
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
  const [totalCount, setTotalCount] = useState(0);

  // Build Firestore query constraints
  const queryConstraints = useMemo((): QueryConstraint[] => {
    const constraints: QueryConstraint[] = [];

    // Add filtering
    if (filterBy === FilterBy.TRADING) {
      constraints.push(where("currentState", "==", 1)); // Use currentState instead of state
    } else if (filterBy === FilterBy.NEW) {
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      constraints.push(where("createdAt", ">=", yesterday));
    } else if (filterBy === FilterBy.TRENDING) {
      constraints.push(where("statistics.tradeCount", ">=", 5));
    } else if (filterBy === FilterBy.GOAL_REACHED) {
      // This will be filtered client-side since it requires calculation
    }

    // Add sorting - use the actual Firebase field names
    if (sortBy && sortBy !== SortBy.NAME && sortBy !== SortBy.SYMBOL) {
      let firestoreField: string = sortBy;
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

  // Effect for real-time data subscription
  useEffect(() => {
    if (!enableRealtime) return;

    setLoading(true);
    setError(null);

    try {
      const tokensCollection = collection(db, "tokens");
      const q = query(tokensCollection, ...queryConstraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const tokenList: TokenListItem[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            const token: TokenListItem = {
              address: doc.id,
              name: data.name || "Unknown",
              symbol: data.symbol || "???",
              imageUrl: data.imageUrl || "",
              creator: data.creator || "",
              createdAt: data.createdAt || "",
              fundingGoal: data.fundingGoal || "0",
              state: data.currentState || data.state || 0,
              currentPrice:
                data.statistics?.currentPrice || data.currentPrice || "0",
              statistics: {
                volumeETH: data.statistics?.volumeETH || "0",
                tradeCount: data.statistics?.tradeCount || 0,
                uniqueHolders: data.statistics?.uniqueHolders || 0,
                collateral: data.statistics?.collateral || "0",
              },
              imagePosition: data.imagePosition,
            };
            tokenList.push(token);
          });

          // Apply client-side filtering if needed
          let filteredTokens = tokenList;

          // Search filter
          if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filteredTokens = filteredTokens.filter(
              (token) =>
                token.name.toLowerCase().includes(query) ||
                token.symbol.toLowerCase().includes(query) ||
                token.address.toLowerCase().includes(query)
            );
          }

          // Goal reached filter (requires calculation)
          if (filterBy === FilterBy.GOAL_REACHED) {
            filteredTokens = filteredTokens.filter((token) => {
              const collateral = parseFloat(token.statistics.collateral);
              const goal = parseFloat(token.fundingGoal);
              return goal > 0 && collateral >= goal * 0.8; // 80% of goal
            });
          }

          // Client-side sorting if needed
          if (
            sortBy === SortBy.NAME ||
            sortBy === SortBy.SYMBOL ||
            (filterBy === FilterBy.NEW && sortBy !== SortBy.NEWEST)
          ) {
            filteredTokens.sort((a, b) => {
              let aValue: string | number;
              let bValue: string | number;

              switch (sortBy) {
                case SortBy.NAME:
                  aValue = a.name.toLowerCase();
                  bValue = b.name.toLowerCase();
                  break;
                case SortBy.SYMBOL:
                  aValue = a.symbol.toLowerCase();
                  bValue = b.symbol.toLowerCase();
                  break;
                case SortBy.PRICE:
                  aValue = parseFloat(a.currentPrice);
                  bValue = parseFloat(b.currentPrice);
                  break;
                case SortBy.VOLUME:
                  aValue = parseFloat(a.statistics.volumeETH);
                  bValue = parseFloat(b.statistics.volumeETH);
                  break;
                default:
                  return 0;
              }

              if (typeof aValue === "string" && typeof bValue === "string") {
                return sortDirection === SortDirection.ASC
                  ? aValue.localeCompare(bValue)
                  : bValue.localeCompare(aValue);
              } else {
                return sortDirection === SortDirection.ASC
                  ? (aValue as number) - (bValue as number)
                  : (bValue as number) - (aValue as number);
              }
            });
          }

          setTokens(filteredTokens);
          setTotalCount(filteredTokens.length);
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching tokens:", err);
          setError(err.message || "Failed to fetch tokens");
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error("Error setting up token subscription:", err);
      setError(
        err instanceof Error ? err.message : "Failed to setup subscription"
      );
      setLoading(false);
    }
  }, [
    queryConstraints,
    searchQuery,
    filterBy,
    sortBy,
    sortDirection,
    enableRealtime,
  ]);

  // Function to manually refresh tokens
  const refreshTokens = () => {
    setLoading(true);
    setError(null);
    // The effect will automatically re-run due to dependency changes
  };

  // Return the hook interface
  return {
    tokens,
    loading,
    error,
    totalCount,
    refreshTokens,
  };
}
