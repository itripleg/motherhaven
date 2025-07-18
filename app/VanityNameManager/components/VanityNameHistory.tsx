// app/VanityNameManager/components/VanityNameHistory.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  Crown,
  ArrowRight,
  Calendar,
  Coins,
  ExternalLink,
  Filter,
  Search,
  TrendingUp,
  Clock,
  Flame,
  Star,
  Award,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { formatEther } from "viem";
import { useToast } from "@/hooks/use-toast";
import {
  type VanityNameData,
  type VanityNameHistoryEntry,
} from "@/types/vanity";

interface VanityNameHistoryProps {
  userAddress: string;
  vanityData: VanityNameData | null;
}

type SortOption = "newest" | "oldest" | "name" | "cost";
type FilterOption = "all" | "thisYear" | "lastYear" | "thisMonth";

export function VanityNameHistory({
  userAddress,
  vanityData,
}: VanityNameHistoryProps) {
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Mock data if no vanity data provided
  const mockHistory: VanityNameHistoryEntry[] = vanityData?.history || [
    {
      name: "CryptoMaster",
      changedAt: "2024-12-15T10:30:00Z",
      requestId: 5,
      burnAmount: "1000000000000000000000", // 1000 tokens
      tokenAddress: "0xc3df61f5387fe2e0e6521ffdad338b1bbf5e5f7c",
      transactionHash: "0x1234567890abcdef1234567890abcdef12345678",
    },
    {
      name: "MoonWalker",
      changedAt: "2024-11-20T14:15:00Z",
      requestId: 3,
      burnAmount: "1000000000000000000000",
      tokenAddress: "0xc3df61f5387fe2e0e6521ffdad338b1bbf5e5f7c",
      transactionHash: "0x9876543210fedcba9876543210fedcba98765432",
    },
    {
      name: "DiamondHands",
      changedAt: "2024-10-05T09:45:00Z",
      requestId: 1,
      burnAmount: "1000000000000000000000",
      tokenAddress: "0xc3df61f5387fe2e0e6521ffdad338b1bbf5e5f7c",
      transactionHash: "0xabcdef1234567890abcdef1234567890abcdef12",
    },
  ];

  const displayHistory = mockHistory.length > 0 ? mockHistory : [];

  // Filter and sort history
  const filteredHistory = displayHistory
    .filter((entry) => {
      // Search filter
      if (
        searchQuery &&
        !entry.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Date filter
      const entryDate = new Date(entry.changedAt);
      const now = new Date();

      switch (filterBy) {
        case "thisMonth":
          return (
            entryDate.getMonth() === now.getMonth() &&
            entryDate.getFullYear() === now.getFullYear()
          );
        case "thisYear":
          return entryDate.getFullYear() === now.getFullYear();
        case "lastYear":
          return entryDate.getFullYear() === now.getFullYear() - 1;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        case "cost":
          return Number(b.burnAmount) - Number(a.burnAmount);
        default:
          return 0;
      }
    });

  const toggleExpanded = (requestId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedItems(newExpanded);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} Copied! 📋`,
      description: "Text has been copied to clipboard.",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000)
      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  const getTotalSpent = () => {
    return displayHistory.reduce((sum, entry) => {
      return sum + Number(formatEther(BigInt(entry.burnAmount)));
    }, 0);
  };

  const getNameBadge = (name: string, index: number) => {
    if (index === 0)
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
          Current
        </Badge>
      );
    if (index === 1)
      return (
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
          Previous
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-xs">
        #{displayHistory.length - index}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Name History</h2>
        <p className="text-muted-foreground">
          Track your vanity name changes and evolution over time
        </p>
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="unified-card border-primary/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <Label className="text-sm text-muted-foreground">
                    Total Changes
                  </Label>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {displayHistory.length}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <Label className="text-sm text-muted-foreground">
                    Tokens Burned
                  </Label>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {getTotalSpent().toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <Label className="text-sm text-muted-foreground">
                    Favorite Name
                  </Label>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {displayHistory[0]?.name || "N/A"}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <Label className="text-sm text-muted-foreground">
                    Last Change
                  </Label>
                </div>
                <div className="text-sm font-medium text-foreground">
                  {displayHistory[0]
                    ? getTimeAgo(displayHistory[0].changedAt)
                    : "Never"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="unified-card border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Search Names
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Sort By
                  </Label>
                  <Select
                    value={sortBy}
                    onValueChange={(value: SortOption) => setSortBy(value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="cost">Cost High-Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Filter
                  </Label>
                  <Select
                    value={filterBy}
                    onValueChange={(value: FilterOption) => setFilterBy(value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="thisMonth">This Month</SelectItem>
                      <SelectItem value="thisYear">This Year</SelectItem>
                      <SelectItem value="lastYear">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* History Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {filteredHistory.length === 0 ? (
          <Card className="unified-card border-primary/20">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="text-6xl opacity-50">📜</div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {displayHistory.length === 0
                      ? "No Name History"
                      : "No Results Found"}
                  </h3>
                  <p className="text-muted-foreground">
                    {displayHistory.length === 0
                      ? "You haven't changed your vanity name yet. Start building your identity!"
                      : "Try adjusting your search or filters to find what you're looking for."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredHistory.map((entry, index) => (
                <motion.div
                  key={entry.requestId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="unified-card border-primary/20 hover:border-primary/40 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Timeline dot */}
                          <div className="relative">
                            <div
                              className={`w-4 h-4 rounded-full ${
                                index === 0 ? "bg-green-400" : "bg-primary"
                              } border-2 border-background`}
                            />
                            {index < filteredHistory.length - 1 && (
                              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-16 bg-border" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-foreground">
                                  {entry.name}
                                </h3>
                                {getNameBadge(entry.name, index)}
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(entry.requestId)}
                                className="flex items-center gap-1"
                              >
                                {expandedItems.has(entry.requestId) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                                Details
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground">
                                  {new Date(
                                    entry.changedAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Coins className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground">
                                  {formatEther(BigInt(entry.burnAmount))} tokens
                                  burned
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {getTimeAgo(entry.changedAt)}
                                </span>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                              {expandedItems.has(entry.requestId) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="mt-4 pt-4 border-t border-border"
                                >
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">
                                          Request ID
                                        </Label>
                                        <div className="flex items-center gap-2">
                                          <code className="text-xs bg-muted px-2 py-1 rounded">
                                            #{entry.requestId}
                                          </code>
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">
                                          Token Address
                                        </Label>
                                        <div className="flex items-center gap-2">
                                          <code className="text-xs bg-muted px-2 py-1 rounded truncate">
                                            {entry.tokenAddress.slice(0, 6)}...
                                            {entry.tokenAddress.slice(-4)}
                                          </code>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              copyToClipboard(
                                                entry.tokenAddress,
                                                "Token Address"
                                              )
                                            }
                                            className="h-6 w-6 p-0"
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label className="text-xs text-muted-foreground">
                                        Transaction Hash
                                      </Label>
                                      <div className="flex items-center gap-2">
                                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                                          {entry.transactionHash}
                                        </code>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            copyToClipboard(
                                              entry.transactionHash,
                                              "Transaction Hash"
                                            )
                                          }
                                          className="h-6 w-6 p-0"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            window.open(
                                              `https://testnet.snowtrace.io/tx/${entry.transactionHash}`,
                                              "_blank"
                                            )
                                          }
                                          className="h-6 w-6 p-0"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Results Summary */}
      {filteredHistory.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Showing {filteredHistory.length} of {displayHistory.length} name
            changes
          </p>
        </div>
      )}
    </div>
  );
}
