"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  History,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Calendar,
  Coins,
  Target,
  ExternalLink,
  RefreshCw,
  Trophy,
  X,
  ChevronLeft,
  ChevronRight,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
} from "lucide-react";

// Mock data structure for dice rolls
interface DiceRoll {
  id: string;
  timestamp: Date;
  betRange: [number, number];
  betAmount: string;
  rollResult: number;
  payout: string;
  isWin: boolean;
  transactionHash: string;
  gasUsed: string;
}

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

// Mock data - replace with real data from events/backend
const mockRolls: DiceRoll[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    betRange: [45, 55],
    betAmount: "0.1",
    rollResult: 48,
    payout: "0.909",
    isWin: true,
    transactionHash: "0x1234567890abcdef1234567890abcdef12345678",
    gasUsed: "0.001",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    betRange: [20, 80],
    betAmount: "0.5",
    rollResult: 85,
    payout: "0",
    isWin: false,
    transactionHash: "0x2345678901bcdef12345678901cdef123456789",
    gasUsed: "0.001",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    betRange: [90, 100],
    betAmount: "0.05",
    rollResult: 95,
    payout: "0.455",
    isWin: true,
    transactionHash: "0x3456789012cdef123456789012def1234567890",
    gasUsed: "0.001",
  },
];

export function DiceHistory() {
  const { address, isConnected } = useAccount();
  const [rolls, setRolls] = useState<DiceRoll[]>(mockRolls);
  const [filteredRolls, setFilteredRolls] = useState<DiceRoll[]>(mockRolls);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "wins" | "losses">(
    "all"
  );
  const [dateRange, setDateRange] = useState<
    "all" | "today" | "week" | "month"
  >("all");

  // Filter rolls based on search and filters
  useEffect(() => {
    let filtered = rolls;

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(
        (roll) =>
          roll.transactionHash
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          roll.rollResult.toString().includes(searchTerm)
      );
    }

    // Win/Loss filter
    if (filterType !== "all") {
      filtered = filtered.filter((roll) =>
        filterType === "wins" ? roll.isWin : !roll.isWin
      );
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter((roll) => roll.timestamp >= filterDate);
    }

    setFilteredRolls(filtered);
    setCurrentPage(1);
  }, [rolls, searchTerm, filterType, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredRolls.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedRolls = filteredRolls.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setDateRange("all");
  };

  const getDiceIcon = (result: number) => {
    if (result <= 16) return Dice1;
    if (result <= 33) return Dice2;
    if (result <= 50) return Dice3;
    if (result <= 66) return Dice4;
    if (result <= 83) return Dice5;
    return Dice6;
  };

  const getWinChance = (range: [number, number]) => {
    return range[1] - range[0] + 1;
  };

  const getMultiplier = (range: [number, number]) => {
    const winChance = getWinChance(range);
    return (100 / winChance).toFixed(2);
  };

  // Calculate summary stats
  const summaryStats = React.useMemo(() => {
    const totalRolls = filteredRolls.length;
    const wins = filteredRolls.filter((roll) => roll.isWin).length;
    const losses = totalRolls - wins;
    const winRate = totalRolls > 0 ? (wins / totalRolls) * 100 : 0;
    const totalWagered = filteredRolls.reduce(
      (sum, roll) => sum + parseFloat(roll.betAmount),
      0
    );
    const totalWon = filteredRolls.reduce(
      (sum, roll) => sum + parseFloat(roll.payout),
      0
    );
    const netProfit = totalWon - totalWagered;

    return {
      totalRolls,
      wins,
      losses,
      winRate,
      totalWagered,
      totalWon,
      netProfit,
    };
  }, [filteredRolls]);

  if (!isConnected) {
    return (
      <Card className="unified-card border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="text-4xl opacity-50">🔗</div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-muted-foreground">
                Connect your wallet to view your dice roll history
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-primary/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {summaryStats.totalRolls}
            </div>
            <div className="text-sm text-muted-foreground">Total Rolls</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {summaryStats.winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Win Rate</div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/10">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">
              {summaryStats.totalWagered.toFixed(3)}
            </div>
            <div className="text-sm text-muted-foreground">Total Wagered</div>
          </CardContent>
        </Card>
        <Card
          className={`border-${
            summaryStats.netProfit >= 0 ? "green" : "red"
          }-500/20 bg-${summaryStats.netProfit >= 0 ? "green" : "red"}-500/10`}
        >
          <CardContent className="p-4 text-center">
            <div
              className={`text-2xl font-bold text-${
                summaryStats.netProfit >= 0 ? "green" : "red"
              }-500`}
            >
              {summaryStats.netProfit >= 0 ? "+" : ""}
              {summaryStats.netProfit.toFixed(3)}
            </div>
            <div className="text-sm text-muted-foreground">Net Profit</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="unified-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Roll History
            <Badge variant="outline" className="ml-auto">
              {filteredRolls.length} rolls
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by transaction hash or roll result..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Type */}
            <Select
              value={filterType}
              onValueChange={(value: any) => setFilterType(value)}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rolls</SelectItem>
                <SelectItem value="wins">Wins Only</SelectItem>
                <SelectItem value="losses">Losses Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Select
              value={dateRange}
              onValueChange={(value: any) => setDateRange(value)}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(searchTerm || filterType !== "all" || dateRange !== "all") && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Rolls List */}
          <div className="space-y-4">
            <AnimatePresence>
              {displayedRolls.map((roll, index) => {
                const DiceIcon = getDiceIcon(roll.rollResult);
                const winChance = getWinChance(roll.betRange);
                const multiplier = getMultiplier(roll.betRange);

                return (
                  <motion.div
                    key={roll.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`border-2 ${
                        roll.isWin
                          ? "border-green-500/30 bg-green-500/10"
                          : "border-red-500/30 bg-red-500/10"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          {/* Left: Dice and Result */}
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-lg ${
                                roll.isWin
                                  ? "bg-green-500/20 text-green-500"
                                  : "bg-red-500/20 text-red-500"
                              }`}
                            >
                              <DiceIcon className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold">
                                  {roll.rollResult}
                                </span>
                                <Badge
                                  variant={
                                    roll.isWin ? "default" : "destructive"
                                  }
                                >
                                  {roll.isWin ? "WIN" : "LOSS"}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Range: {roll.betRange[0]}-{roll.betRange[1]} (
                                {winChance}% chance)
                              </div>
                            </div>
                          </div>

                          {/* Center: Bet Info */}
                          <div className="hidden md:flex flex-col items-center text-center">
                            <div className="text-sm text-muted-foreground mb-1">
                              Bet Amount
                            </div>
                            <div className="font-semibold">
                              {roll.betAmount} DICE
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {multiplier}x multiplier
                            </div>
                          </div>

                          {/* Right: Payout and Details */}
                          <div className="text-right">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {roll.isWin ? (
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                                <span
                                  className={`font-semibold ${
                                    roll.isWin
                                      ? "text-green-500"
                                      : "text-red-500"
                                  }`}
                                >
                                  {roll.isWin ? "+" : "-"}
                                  {roll.isWin
                                    ? roll.payout
                                    : roll.betAmount}{" "}
                                  DICE
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(roll.timestamp, "MMM d, h:mm a")}
                              </div>
                              <a
                                href={`https://testnet.snowtrace.io/tx/${roll.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View TX
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Mobile: Additional Info */}
                        <div className="md:hidden mt-4 pt-4 border-t border-border/50">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Bet:{" "}
                              </span>
                              <span className="font-medium">
                                {roll.betAmount} DICE
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Multiplier:{" "}
                              </span>
                              <span className="font-medium">{multiplier}x</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {filteredRolls.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl opacity-50 mb-4">🎲</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No rolls found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== "all" || dateRange !== "all"
                  ? "Try adjusting your filters"
                  : "Start playing to see your roll history here"}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-
                {Math.min(startIndex + itemsPerPage, filteredRolls.length)} of{" "}
                {filteredRolls.length} rolls
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
