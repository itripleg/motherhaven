// app/dex/components/tokens/TokenContainer.tsx
import { useState, useEffect } from "react";
import React from "react";
import { TokenTabs } from "./TokenTabs";
import { TokenGrid } from "./TokenGrid";
import { FilterBy, SortBy, SortDirection } from "@/final-hooks/useTokenList";
import { Token } from "@/types";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  QueryConstraint,
  QuerySnapshot,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { SortAsc, SortDesc, RefreshCw, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenContainerProps {
  searchQuery?: string;
}

interface TokenListItem {
  address: string;
  name: string;
  symbol: string;
  imageUrl: string;
  creator: string;
  createdAt: string;
  fundingGoal: string;
  state: number;
  currentState?: number;
  currentPrice: string;
  lastPrice?: string;
  collateral: string;
  statistics: {
    volumeETH: string;
    tradeCount: number;
    uniqueHolders: number;
    currentPrice?: string;
  };
  lastTrade?: {
    timestamp: string;
    type: "buy" | "sell";
    price: string;
    fee?: string;
  };
  uniqueTraders?: string[];
  imagePosition?: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    fit?: "cover" | "contain" | "fill";
  };
}

interface DropdownOption {
  value: string;
  label: string;
}

// localStorage keys
const STORAGE_KEYS = {
  FILTER: "token-container-filter",
  SORT_BY: "token-container-sort-by",
  SORT_DIRECTION: "token-container-sort-direction",
} as const;

// Helper functions for localStorage
const saveToStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Failed to save to localStorage:", error);
  }
};

const loadFromStorage = (key: string, defaultValue: string) => {
  try {
    const saved = localStorage.getItem(key);
    return saved !== null ? saved : defaultValue;
  } catch (error) {
    console.warn("Failed to load from localStorage:", error);
    return defaultValue;
  }
};

// Popover Dropdown Component
const PopoverDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-9 px-3 font-normal",
            className
          )}
        >
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div className="max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between",
                value === option.value && "bg-accent text-accent-foreground"
              )}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Convert TokenListItem to Token
const convertToToken = (item: TokenListItem): Token => {
  return {
    address: item.address as `0x${string}`,
    name: item.name || "Unknown Token",
    symbol: item.symbol || "UNKNOWN",
    imageUrl: item.imageUrl || "",
    description: "",
    creator: (item.creator || "0x0") as `0x${string}`,
    burnManager: "0x0" as `0x${string}`,
    state: item.state || 0,
    lastPrice: item.currentPrice || "0",
    collateral: item.collateral || "0",
    fundingGoal: item.fundingGoal || "5",
    virtualSupply: "0",
    decimals: "1000000000000000000",
    maxSupply: "1000000000000000000000000000",
    initialMint: "200000000000000000000000000",
    initialPrice: "0.00001",
    minPurchase: "0.00001",
    maxPurchase: "50",
    maxWalletPercentage: 5,
    priceRate: "2000",
    tradingFee: 30,
    createdAt: item.createdAt || new Date().toISOString(),
    blockNumber: 0,
    transactionHash: "",
    totalSupply: "0",
    imagePosition: item.imagePosition,
  };
};

export const TokenContainer: React.FC<TokenContainerProps> = ({
  searchQuery = "",
}) => {
  // Initialize state with localStorage values
  const [filter, setFilter] = useState<FilterBy>(() => {
    const saved = loadFromStorage(STORAGE_KEYS.FILTER, FilterBy.ALL);
    return Object.values(FilterBy).includes(saved as FilterBy)
      ? (saved as FilterBy)
      : FilterBy.ALL;
  });

  const [sortBy, setSortBy] = useState<SortBy>(() => {
    const saved = loadFromStorage(STORAGE_KEYS.SORT_BY, SortBy.NEWEST);
    return Object.values(SortBy).includes(saved as SortBy)
      ? (saved as SortBy)
      : SortBy.NEWEST;
  });

  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const saved = loadFromStorage(
      STORAGE_KEYS.SORT_DIRECTION,
      SortDirection.DESC
    );
    return Object.values(SortDirection).includes(saved as SortDirection)
      ? (saved as SortDirection)
      : SortDirection.DESC;
  });

  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Sort options for the dropdown
  const sortOptions: DropdownOption[] = [
    { value: SortBy.NEWEST, label: "Newest First" },
    { value: SortBy.OLDEST, label: "Oldest First" },
    { value: SortBy.NAME, label: "Name A-Z" },
    { value: SortBy.SYMBOL, label: "Symbol A-Z" },
    { value: SortBy.PRICE, label: "Price" },
    { value: SortBy.VOLUME, label: "Volume" },
  ];

  // Save to localStorage when state changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FILTER, filter);
  }, [filter]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SORT_BY, sortBy);
  }, [sortBy]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SORT_DIRECTION, sortDirection);
  }, [sortDirection]);

  // Enhanced trending calculation
  const calculateTrendingScore = React.useCallback((item: TokenListItem) => {
    const volume = parseFloat(item.statistics.volumeETH || "0");
    const trades = item.statistics.tradeCount || 0;
    const holders = item.statistics.uniqueHolders || 0;

    const lastTradeTime = item.lastTrade?.timestamp
      ? new Date(item.lastTrade.timestamp).getTime()
      : 0;
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const hasRecentActivity = lastTradeTime > twentyFourHoursAgo;

    const createdTime = new Date(item.createdAt).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const isNewToken = createdTime > sevenDaysAgo;

    let score = 0;
    score += Math.min(volume * 5, 40);
    score += Math.min(trades * 10, 30);
    score += Math.min(holders * 5, 20);
    if (hasRecentActivity) score += 15;
    if (isNewToken) score += 10;
    if (holders > 0 && trades / holders > 2) score += 10;

    return score;
  }, []);

  // Separate sorting function that respects both filter and sort preferences
  const applySorting = React.useCallback(
    (items: TokenListItem[], includeTrendingScore = false) => {
      const itemsWithScores = items.map((item) => ({
        ...item,
        trendingScore: includeTrendingScore ? calculateTrendingScore(item) : 0,
      })) as (TokenListItem & { trendingScore: number })[];

      return itemsWithScores.sort((a, b) => {
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
          case SortBy.OLDEST:
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case SortBy.NEWEST:
          default:
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
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
    },
    [sortBy, sortDirection, calculateTrendingScore]
  );

  // Filter application that doesn't interfere with sorting
  const applyFilters = React.useCallback(
    (items: TokenListItem[]) => {
      let filteredItems = items;

      if (filter === FilterBy.TRADING) {
        filteredItems = filteredItems.filter((item) => item.state === 1);
      } else if (filter === FilterBy.NEW) {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        filteredItems = filteredItems.filter((item) => {
          const createdTime = new Date(item.createdAt).getTime();
          return createdTime > oneDayAgo;
        });
      } else if (filter === FilterBy.TRENDING) {
        const tokensWithScores = filteredItems.map((item) => ({
          ...item,
          trendingScore: calculateTrendingScore(item),
        }));

        filteredItems = tokensWithScores
          .filter((item) => item.trendingScore >= 25)
          .slice(0, 50);
      } else if (filter === FilterBy.GOAL_REACHED) {
        filteredItems = filteredItems.filter((item) => {
          const collateral = parseFloat(item.collateral || "0");
          const goal = parseFloat(item.fundingGoal);
          return goal > 0 && collateral >= goal * 0.8;
        });
      }

      return filteredItems;
    },
    [filter, calculateTrendingScore]
  );

  // Raw token data from Firestore (no sorting applied here)
  const [rawTokens, setRawTokens] = useState<TokenListItem[]>([]);

  // Firestore data fetching - ONLY re-runs when filter, search, or refresh changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const tokensRef = collection(db, "tokens");
      const constraints: QueryConstraint[] = [];

      if (filter === FilterBy.ALL) {
        constraints.push(orderBy("createdAt", "desc"));
        constraints.push(limit(100));
      } else if (filter === FilterBy.TRADING) {
        try {
          constraints.push(where("currentState", "==", 1));
          constraints.push(orderBy("createdAt", "desc"));
          constraints.push(limit(50));
        } catch {
          constraints.length = 0;
          constraints.push(orderBy("createdAt", "desc"));
          constraints.push(limit(100));
        }
      } else if (filter === FilterBy.NEW) {
        const yesterday = new Date(
          Date.now() - 24 * 60 * 60 * 1000
        ).toISOString();
        try {
          constraints.push(where("createdAt", ">=", yesterday));
          constraints.push(orderBy("createdAt", "desc"));
          constraints.push(limit(50));
        } catch {
          constraints.length = 0;
          constraints.push(orderBy("createdAt", "desc"));
          constraints.push(limit(100));
        }
      } else {
        constraints.push(orderBy("createdAt", "desc"));
        constraints.push(limit(100));
      }

      const firestoreQuery = query(tokensRef, ...constraints);

      const unsubscribe = onSnapshot(
        firestoreQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const tokenListItems: TokenListItem[] = [];

          snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            const item: TokenListItem = {
              address: doc.id,
              name: data.name || "Unknown",
              symbol: data.symbol || "???",
              imageUrl: data.imageUrl || "",
              creator: data.creator || "",
              createdAt: data.createdAt || "",
              fundingGoal: data.fundingGoal || "0",
              state: data.currentState || data.state || 0,
              currentState: data.currentState,
              currentPrice:
                data.statistics?.currentPrice ||
                data.lastPrice ||
                data.currentPrice ||
                "0",
              lastPrice: data.lastPrice,
              collateral: data.collateral || "0",
              statistics: {
                volumeETH: data.statistics?.volumeETH || "0",
                tradeCount: data.statistics?.tradeCount || 0,
                uniqueHolders: data.statistics?.uniqueHolders || 0,
                currentPrice: data.statistics?.currentPrice,
              },
              lastTrade: data.lastTrade
                ? {
                    timestamp: data.lastTrade.timestamp,
                    type: data.lastTrade.type,
                    price: data.lastTrade.price,
                    fee: data.lastTrade.fee,
                  }
                : undefined,
              uniqueTraders: data.uniqueTraders || [],
              imagePosition: data.imagePosition,
            };
            tokenListItems.push(item);
          });

          // Store raw data without sorting
          setRawTokens(tokenListItems);
          setLoading(false);
        },
        (firestoreError: any) => {
          console.error("❌ Firestore error:", firestoreError);
          setError(`Failed to load tokens: ${firestoreError.message}`);
          setLoading(false);
        }
      );

      return unsubscribe;
    } catch (queryError) {
      console.error("❌ Query setup error:", queryError);
      setError(
        `Query error: ${
          queryError instanceof Error ? queryError.message : String(queryError)
        }`
      );
      setLoading(false);
    }
  }, [filter, searchQuery, lastRefresh]); // Removed sortBy and sortDirection from dependencies

  // Separate effect for client-side sorting and filtering - this doesn't scroll to top
  useEffect(() => {
    let filteredItems = [...rawTokens];

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredItems = filteredItems.filter(
        (token) =>
          token.name.toLowerCase().includes(query) ||
          token.symbol.toLowerCase().includes(query) ||
          token.address.toLowerCase().includes(query)
      );
    }

    // Apply category filters
    filteredItems = applyFilters(filteredItems);

    // Apply sorting
    const includeTrendingScore = filter === FilterBy.TRENDING;
    filteredItems = applySorting(filteredItems, includeTrendingScore);

    // Convert to Token format
    const convertedTokens = filteredItems.map(convertToToken);
    setTokens(convertedTokens);
  }, [
    rawTokens,
    sortBy,
    sortDirection,
    searchQuery,
    filter,
    applyFilters,
    applySorting,
  ]);

  const handleRefresh = () => {
    setLastRefresh(Date.now());
  };

  // Map tab categories to FilterBy enum
  const handleTabChange = (category: string) => {
    switch (category) {
      case "all":
        setFilter(FilterBy.ALL);
        break;
      case "new":
        setFilter(FilterBy.NEW);
        break;
      case "trading":
        setFilter(FilterBy.TRADING);
        break;
      case "trending":
        setFilter(FilterBy.TRENDING);
        break;
      case "goal":
        setFilter(FilterBy.GOAL_REACHED);
        break;
      default:
        setFilter(FilterBy.ALL);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls bar with Popover dropdown */}
      <div className="flex items-center justify-between gap-4 min-h-[40px]">
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Show active search */}
          {searchQuery && (
            <Badge variant="secondary" className="flex-shrink-0">
              &quot;{searchQuery}&quot;
            </Badge>
          )}

          {/* Show token count */}
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {tokens.length} token{tokens.length !== 1 ? "s" : ""} found
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Popover Sort Dropdown */}
          <div className="w-[140px]">
            <PopoverDropdown
              value={sortBy}
              onChange={(value) => setSortBy(value as SortBy)}
              options={sortOptions}
              className="w-full"
            />
          </div>

          {/* Sort Direction */}
          <div className="w-[40px]">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSortDirection(
                  sortDirection === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC
                )
              }
              className="w-full h-9"
            >
              {sortDirection === SortDirection.ASC ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Refresh */}
          <div className="w-[40px]">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="w-full h-9"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <TokenTabs onCategoryChange={handleTabChange} activeCategory={filter} />

      {/* Results with Fade-out Effect */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-pulse flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading tokens...
          </div>
        </div>
      ) : error ? (
        <div className="text-center p-8">
          <div className="text-red-600 mb-2">{error}</div>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Token Grid with Fade-out Effect */}
          <div
            className="token-grid-container"
            style={{
              maskImage:
                "linear-gradient(to bottom, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 85%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 85%, transparent 100%)",
            }}
          >
            <TokenGrid tokens={tokens} />
          </div>
        </div>
      )}
    </div>
  );
};
