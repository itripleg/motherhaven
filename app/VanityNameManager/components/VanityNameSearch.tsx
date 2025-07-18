// app/VanityNameManager/components/VanityNameSearch.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  User,
  Crown,
  Clock,
  ExternalLink,
  Copy,
  Filter,
  Users,
  Star,
  TrendingUp,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Address } from "viem";

interface SearchResult {
  vanityName: string;
  displayName: string;
  owner: Address;
  claimedAt: string;
  totalChanges: number;
  lastChanged: string;
  isActive: boolean;
  badges: string[];
}

type SearchFilter = "all" | "recent" | "popular" | "active";
type SortOption =
  | "relevance"
  | "newest"
  | "oldest"
  | "alphabetical"
  | "mostChanges";

const MOCK_SEARCH_RESULTS: SearchResult[] = [
  {
    vanityName: "cryptoking",
    displayName: "CryptoKing",
    owner: "0x1234567890123456789012345678901234567890" as Address,
    claimedAt: "2024-01-15T10:00:00Z",
    totalChanges: 5,
    lastChanged: "2024-12-01T15:30:00Z",
    isActive: true,
    badges: ["Early Adopter", "Trendsetter"],
  },
  {
    vanityName: "moonwalker",
    displayName: "MoonWalker",
    owner: "0x0987654321098765432109876543210987654321" as Address,
    claimedAt: "2024-02-20T14:30:00Z",
    totalChanges: 3,
    lastChanged: "2024-11-15T09:15:00Z",
    isActive: true,
    badges: ["Creative"],
  },
  {
    vanityName: "diamondhands",
    displayName: "DiamondHands",
    owner: "0xabcdef1234567890abcdef1234567890abcdef12" as Address,
    claimedAt: "2024-03-10T11:45:00Z",
    totalChanges: 1,
    lastChanged: "2024-03-10T11:45:00Z",
    isActive: true,
    badges: ["Loyal"],
  },
  {
    vanityName: "degen",
    displayName: "DeGen",
    owner: "0xfedcba0987654321fedcba0987654321fedcba09" as Address,
    claimedAt: "2024-04-05T16:20:00Z",
    totalChanges: 8,
    lastChanged: "2024-12-10T12:00:00Z",
    isActive: true,
    badges: ["Power User", "Trendsetter"],
  },
  {
    vanityName: "hodler",
    displayName: "HODLer",
    owner: "0x1111222233334444555566667777888899990000" as Address,
    claimedAt: "2024-01-30T08:15:00Z",
    totalChanges: 2,
    lastChanged: "2024-10-20T14:45:00Z",
    isActive: true,
    badges: ["Early Adopter"],
  },
];

export function VanityNameSearch() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filter, setFilter] = useState<SearchFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "CryptoKing",
    "MoonWalker",
    "DiamondHands",
  ]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        return;
      }

      setIsSearching(true);
      setHasSearched(true);

      // Simulate API call
      setTimeout(() => {
        const filtered = MOCK_SEARCH_RESULTS.filter((result) =>
          result.displayName.toLowerCase().includes(query.toLowerCase())
        );

        // Apply filters
        let filteredResults = filtered;

        switch (filter) {
          case "recent":
            filteredResults = filtered.filter((result) => {
              const lastChanged = new Date(result.lastChanged);
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return lastChanged > thirtyDaysAgo;
            });
            break;
          case "popular":
            filteredResults = filtered.filter(
              (result) => result.totalChanges >= 3
            );
            break;
          case "active":
            filteredResults = filtered.filter((result) => result.isActive);
            break;
          default:
            filteredResults = filtered;
        }

        // Apply sorting
        filteredResults.sort((a, b) => {
          switch (sortBy) {
            case "newest":
              return (
                new Date(b.claimedAt).getTime() -
                new Date(a.claimedAt).getTime()
              );
            case "oldest":
              return (
                new Date(a.claimedAt).getTime() -
                new Date(b.claimedAt).getTime()
              );
            case "alphabetical":
              return a.displayName.localeCompare(b.displayName);
            case "mostChanges":
              return b.totalChanges - a.totalChanges;
            default: // relevance
              return (
                a.displayName.toLowerCase().indexOf(query.toLowerCase()) -
                b.displayName.toLowerCase().indexOf(query.toLowerCase())
              );
          }
        });

        setSearchResults(filteredResults);
        setIsSearching(false);
      }, 800);
    },
    [filter, sortBy]
  );

  // Search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, debouncedSearch]);

  // Filter/sort effect
  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    }
  }, [filter, sortBy, searchQuery, debouncedSearch]);

  const handleQuickSearch = (name: string) => {
    setSearchQuery(name);

    // Add to recent searches if not already there
    if (!recentSearches.includes(name)) {
      setRecentSearches((prev) => [name, ...prev.slice(0, 4)]);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied! 📋",
      description: "Wallet address has been copied to clipboard.",
    });
  };

  const viewOnExplorer = (address: string) => {
    window.open(`https://testnet.snowtrace.io/address/${address}`, "_blank");
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000)
      return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Early Adopter":
        return "bg-purple-500/20 text-purple-400 border-purple-400/30";
      case "Trendsetter":
        return "bg-pink-500/20 text-pink-400 border-pink-400/30";
      case "Creative":
        return "bg-blue-500/20 text-blue-400 border-blue-400/30";
      case "Loyal":
        return "bg-green-500/20 text-green-400 border-green-400/30";
      case "Power User":
        return "bg-orange-500/20 text-orange-400 border-orange-400/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-400/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Search Vanity Names
        </h2>
        <p className="text-muted-foreground">
          Discover users by their unique vanity names and connect with the
          community
        </p>
      </div>

      {/* Search Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="unified-card border-primary/20">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for vanity names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-12 text-lg"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && !searchQuery && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Recent Searches
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((name) => (
                      <Button
                        key={name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSearch(name)}
                        className="h-8 text-xs hover:bg-primary/10"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              {!searchQuery && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Popular Names
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "CryptoKing",
                      "MoonWalker",
                      "DiamondHands",
                      "DeGen",
                      "HODLer",
                    ].map((name) => (
                      <Button
                        key={name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSearch(name)}
                        className="h-8 text-xs hover:bg-primary/10"
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      {(hasSearched || searchQuery) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="unified-card border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm text-muted-foreground">
                    Filters:
                  </Label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Filter:
                    </Label>
                    <Select
                      value={filter}
                      onValueChange={(value: SearchFilter) => setFilter(value)}
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Names</SelectItem>
                        <SelectItem value="recent">Recent</SelectItem>
                        <SelectItem value="popular">Popular</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Sort:
                    </Label>
                    <Select
                      value={sortBy}
                      onValueChange={(value: SortOption) => setSortBy(value)}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="alphabetical">A-Z</SelectItem>
                        <SelectItem value="mostChanges">
                          Most Changes
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search Results */}
      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="unified-card border-primary/20">
              <CardContent className="p-12 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Searching for vanity names...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : hasSearched && searchResults.length === 0 ? (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="unified-card border-primary/20">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="text-6xl opacity-50">🔍</div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No Results Found
                    </h3>
                    <p className="text-muted-foreground">
                      No vanity names match your search "{searchQuery}". Try
                      different keywords or filters.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : searchResults.length > 0 ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Search Results ({searchResults.length})
              </h3>
              <Badge variant="outline" className="text-xs">
                {searchQuery ? `"${searchQuery}"` : "All Names"}
              </Badge>
            </div>

            {/* Results List */}
            <div className="space-y-3">
              {searchResults.map((result, index) => (
                <motion.div
                  key={result.vanityName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="unified-card border-primary/20 hover:border-primary/40 transition-colors group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${result.owner}`}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {result.displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-lg font-bold text-foreground">
                                  {result.displayName}
                                </h4>
                                <Crown className="h-4 w-4 text-primary" />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {result.owner.slice(0, 6)}...
                                {result.owner.slice(-4)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyAddress(result.owner)}
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewOnExplorer(result.owner)}
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground">
                                Claimed {getTimeAgo(result.claimedAt)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground">
                                {result.totalChanges} change
                                {result.totalChanges !== 1 ? "s" : ""}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground">
                                Last: {getTimeAgo(result.lastChanged)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground">
                                {result.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>

                          {/* Badges */}
                          {result.badges.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {result.badges.map((badge) => (
                                <Badge
                                  key={badge}
                                  className={`text-xs ${getBadgeColor(badge)}`}
                                >
                                  <Award className="h-3 w-3 mr-1" />
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Search Tips */}
      {!hasSearched && !searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="unified-card border-blue-400/20 bg-blue-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-400">Search Tips</h3>
                  <div className="text-sm text-blue-300 space-y-1">
                    <p>
                      • Search is case-insensitive and supports partial matches
                    </p>
                    <p>
                      • Use filters to narrow down results by activity or
                      popularity
                    </p>
                    <p>• Click on any result to view detailed information</p>
                    <p>• Recent searches are saved for quick access</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
