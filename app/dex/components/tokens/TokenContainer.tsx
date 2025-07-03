// components/tokens/TokenContainer.tsx - Simplified, clean interface
import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SortAsc, SortDesc, RefreshCw } from "lucide-react";

interface TokenContainerProps {
  searchQuery?: string; // Use the external search from main page
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
  searchQuery = "", // Only use external search
}) => {
  const [filter, setFilter] = useState<FilterBy>(FilterBy.ALL);
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.NEWEST);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    SortDirection.DESC
  );
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Trending calculation
  const calculateTrendingScore = (item: TokenListItem) => {
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
  };

  // Firestore data fetching
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const tokensRef = collection(db, "tokens");
      const constraints: QueryConstraint[] = [];

      // Simple queries to avoid index issues
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

          // Apply client-side filtering
          let filteredItems = tokenListItems;

          // Search filter (only use external search)
          if (searchQuery && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filteredItems = filteredItems.filter(
              (token) =>
                token.name.toLowerCase().includes(query) ||
                token.symbol.toLowerCase().includes(query) ||
                token.address.toLowerCase().includes(query)
            );
          }

          // Category filters
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
              .filter(
                (item) =>
                  (item as typeof item & { trendingScore: number })
                    .trendingScore >= 25
              )
              .sort(
                (a, b) =>
                  (b as typeof b & { trendingScore: number }).trendingScore -
                  (a as typeof a & { trendingScore: number }).trendingScore
              )
              .slice(0, 50);
          } else if (filter === FilterBy.GOAL_REACHED) {
            filteredItems = filteredItems.filter((item) => {
              const collateral = parseFloat(item.collateral || "0");
              const goal = parseFloat(item.fundingGoal);
              return goal > 0 && collateral >= goal * 0.8;
            });
          }

          // Apply sorting (if not trending)
          if (filter !== FilterBy.TRENDING) {
            filteredItems.sort((a, b) => {
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
                  aValue = new Date(b.createdAt).getTime();
                  bValue = new Date(a.createdAt).getTime();
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
          }

          // Convert to Token format
          const convertedTokens = filteredItems.map(convertToToken);
          setTokens(convertedTokens);
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
  }, [filter, sortBy, sortDirection, searchQuery, lastRefresh]);

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
      {/* Simple controls bar - only sort and refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Show active search */}
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              🔍 &quot;{searchQuery}&quot;
            </Badge>
          )}

          {/* Show token count */}
          <div className="text-sm text-muted-foreground">
            {tokens.length} token{tokens.length !== 1 ? "s" : ""} found
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortBy)}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SortBy.NEWEST}>Newest First</SelectItem>
              <SelectItem value={SortBy.OLDEST}>Oldest First</SelectItem>
              <SelectItem value={SortBy.NAME}>Name A-Z</SelectItem>
              <SelectItem value={SortBy.PRICE}>Price</SelectItem>
              <SelectItem value={SortBy.VOLUME}>Volume</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Direction */}
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
          >
            {sortDirection === SortDirection.ASC ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>

          {/* Refresh */}
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <TokenTabs onCategoryChange={handleTabChange} />

      {/* Results */}
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
        <TokenGrid tokens={tokens} />
      )}
    </div>
  );
};
