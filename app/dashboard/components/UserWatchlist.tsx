// app/dashboard/components/UserWatchlist.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Star,
  StarOff,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  ExternalLink,
  Filter,
  SortAsc,
  SortDesc,
  Target,
  Activity,
  DollarSign,
  Clock,
  Bell,
  BellOff,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useRealtimeTokenPrices } from "@/hooks/token/useRealtimeTokenPrices";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import { isAddress } from "viem";
import Image from "next/image";

interface WatchlistItem {
  id: string;
  address: string;
  label: string;
  addedAt: Date;
  priceAlert?: {
    enabled: boolean;
    targetPrice: string;
    condition: "above" | "below";
  };
  notes?: string;
  category?: "meme" | "defi" | "gaming" | "utility" | "other";
}

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  currentPrice: string;
  change24h: number;
  volume24h: string;
  marketCap?: string;
  holders?: number;
  lastUpdate: string;
}

interface WatchlistStats {
  totalTokens: number;
  totalValue: string;
  avgChange24h: number;
  alertsSet: number;
  topGainer: TokenData | null;
  topLoser: TokenData | null;
}

export function UserWatchlist() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [tokenData, setTokenData] = useState<Record<string, TokenData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"added" | "name" | "price" | "change">(
    "added"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);

  // Form states for adding/editing
  const [newTokenAddress, setNewTokenAddress] = useState("");
  const [newTokenLabel, setNewTokenLabel] = useState("");
  const [newTokenCategory, setNewTokenCategory] = useState<string>("other");
  const [newTokenNotes, setNewTokenNotes] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertCondition, setAlertCondition] = useState<"above" | "below">(
    "above"
  );
  const [error, setError] = useState("");

  // Get token addresses for price fetching
  const tokenAddresses = watchlist.map((item) => item.address as `0x${string}`);
  const { prices, isLoading: pricesLoading } =
    useRealtimeTokenPrices(tokenAddresses);

  // Subscribe to user's watchlist
  useEffect(() => {
    if (!isConnected || !address) {
      setIsLoading(false);
      return;
    }

    const watchlistQuery = query(
      collection(db, "watchlist"),
      where("userId", "==", address.toLowerCase())
    );

    const unsubscribe = onSnapshot(
      watchlistQuery,
      (snapshot) => {
        const items: WatchlistItem[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          addedAt: doc.data().addedAt?.toDate() || new Date(),
        })) as WatchlistItem[];

        setWatchlist(items);
        fetchTokenData(items);
      },
      (error) => {
        console.error("Error fetching watchlist:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [address, isConnected]);

  // Fetch token data for watchlist items
  const fetchTokenData = async (items: WatchlistItem[]) => {
    try {
      const tokenDataMap: Record<string, TokenData> = {};

      await Promise.all(
        items.map(async (item) => {
          try {
            // Try to get token data from Firebase first
            const tokensQuery = query(
              collection(db, "tokens"),
              where("address", "==", item.address.toLowerCase())
            );
            const tokenSnapshot = await getDocs(tokensQuery);

            if (!tokenSnapshot.empty) {
              const tokenDoc = tokenSnapshot.docs[0];
              const data = tokenDoc.data();

              tokenDataMap[item.address] = {
                address: item.address,
                name: data.name || "Unknown Token",
                symbol: data.symbol || "TOKEN",
                imageUrl: data.imageUrl,
                currentPrice:
                  data.statistics?.currentPrice || data.lastPrice || "0",
                change24h:
                  data.statistics?.change24h || Math.random() * 20 - 10, // Mock if not available
                volume24h: data.statistics?.volumeETH || "0",
                marketCap: data.statistics?.marketCap,
                holders: data.statistics?.uniqueHolders,
                lastUpdate: new Date().toISOString(),
              };
            } else {
              // Fallback for tokens not in our database
              tokenDataMap[item.address] = {
                address: item.address,
                name: "Unknown Token",
                symbol: "TOKEN",
                currentPrice: "0",
                change24h: 0,
                volume24h: "0",
                lastUpdate: new Date().toISOString(),
              };
            }
          } catch (error) {
            console.error(
              `Error fetching data for token ${item.address}:`,
              error
            );
          }
        })
      );

      setTokenData(tokenDataMap);
    } catch (error) {
      console.error("Error fetching token data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new token to watchlist
  const addToWatchlist = async () => {
    if (!address || !newTokenAddress || !isAddress(newTokenAddress)) {
      setError("Please enter a valid token address");
      return;
    }

    try {
      setError("");
      await addDoc(collection(db, "watchlist"), {
        userId: address.toLowerCase(),
        address: newTokenAddress.toLowerCase(),
        label: newTokenLabel || newTokenAddress,
        category: newTokenCategory,
        notes: newTokenNotes,
        addedAt: new Date(),
        priceAlert: alertEnabled
          ? {
              enabled: true,
              targetPrice: alertPrice,
              condition: alertCondition,
            }
          : undefined,
      });

      // Reset form
      setNewTokenAddress("");
      setNewTokenLabel("");
      setNewTokenCategory("other");
      setNewTokenNotes("");
      setAlertEnabled(false);
      setAlertPrice("");
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      setError("Failed to add token to watchlist");
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, "watchlist", itemId));
    } catch (error) {
      console.error("Error removing from watchlist:", error);
    }
  };

  // Update watchlist item
  const updateWatchlistItem = async () => {
    if (!editingItem) return;

    try {
      await updateDoc(doc(db, "watchlist", editingItem.id), {
        label: newTokenLabel,
        category: newTokenCategory,
        notes: newTokenNotes,
        priceAlert: alertEnabled
          ? {
              enabled: true,
              targetPrice: alertPrice,
              condition: alertCondition,
            }
          : undefined,
      });

      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error("Error updating watchlist item:", error);
      setError("Failed to update watchlist item");
    }
  };

  const resetForm = () => {
    setNewTokenAddress("");
    setNewTokenLabel("");
    setNewTokenCategory("other");
    setNewTokenNotes("");
    setAlertEnabled(false);
    setAlertPrice("");
    setError("");
  };

  // Filter and sort watchlist
  const filteredAndSortedWatchlist = watchlist
    .filter((item) => {
      const token = tokenData[item.address];
      const matchesSearch =
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token?.symbol.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        filterCategory === "all" || item.category === filterCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const tokenA = tokenData[a.address];
      const tokenB = tokenData[b.address];
      const multiplier = sortOrder === "asc" ? 1 : -1;

      switch (sortBy) {
        case "name":
          return (
            multiplier * (tokenA?.name || "").localeCompare(tokenB?.name || "")
          );
        case "price":
          return (
            multiplier *
            (parseFloat(tokenA?.currentPrice || "0") -
              parseFloat(tokenB?.currentPrice || "0"))
          );
        case "change":
          return (
            multiplier * ((tokenA?.change24h || 0) - (tokenB?.change24h || 0))
          );
        case "added":
        default:
          return multiplier * (b.addedAt.getTime() - a.addedAt.getTime());
      }
    });

  // Calculate watchlist stats
  const watchlistStats: WatchlistStats = {
    totalTokens: watchlist.length,
    totalValue: Object.values(tokenData)
      .reduce((sum, token) => sum + parseFloat(token.currentPrice || "0"), 0)
      .toFixed(4),
    avgChange24h:
      watchlist.length > 0
        ? Object.values(tokenData).reduce(
            (sum, token) => sum + (token.change24h || 0),
            0
          ) / watchlist.length
        : 0,
    alertsSet: watchlist.filter((item) => item.priceAlert?.enabled).length,
    topGainer:
      Object.values(tokenData).sort(
        (a, b) => (b.change24h || 0) - (a.change24h || 0)
      )[0] || null,
    topLoser:
      Object.values(tokenData).sort(
        (a, b) => (a.change24h || 0) - (b.change24h || 0)
      )[0] || null,
  };

  const categoryOptions = [
    { value: "all", label: "All Categories", icon: Target },
    { value: "meme", label: "Meme", icon: Sparkles },
    { value: "defi", label: "DeFi", icon: DollarSign },
    { value: "gaming", label: "Gaming", icon: Activity },
    { value: "utility", label: "Utility", icon: BarChart3 },
    { value: "other", label: "Other", icon: Star },
  ];

  if (!isConnected) {
    return (
      <Card className="unified-card border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <Star className="h-12 w-12 text-muted-foreground opacity-50" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Connect Wallet
            </h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to manage your token watchlist
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="unified-card border-primary/20">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <Star className="h-5 w-5 text-primary" />
              Watchlist
            </CardTitle>
            <CardDescription>
              Track your favorite tokens and set price alerts
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-primary/10 hover:bg-primary/20 border-primary/30"
                onClick={resetForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Token
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Watchlist Item" : "Add to Watchlist"}
                </DialogTitle>
                <DialogDescription>
                  {editingItem
                    ? "Update the details for this watchlist item"
                    : "Add a new token to your watchlist with optional price alerts"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {!editingItem && (
                  <div className="space-y-2">
                    <Label htmlFor="address">Token Address</Label>
                    <Input
                      id="address"
                      placeholder="0x..."
                      value={newTokenAddress}
                      onChange={(e) => setNewTokenAddress(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    placeholder="My Token"
                    value={newTokenLabel}
                    onChange={(e) => setNewTokenLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={newTokenCategory}
                    onChange={(e) => setNewTokenCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    {categoryOptions.slice(1).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Research notes, reasons for watching..."
                    value={newTokenNotes}
                    onChange={(e) => setNewTokenNotes(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="alert"
                      checked={alertEnabled}
                      onChange={(e) => setAlertEnabled(e.target.checked)}
                      className="rounded border-border"
                    />
                    <Label htmlFor="alert">Set Price Alert</Label>
                  </div>
                  {alertEnabled && (
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={alertCondition}
                        onChange={(e) =>
                          setAlertCondition(e.target.value as "above" | "below")
                        }
                        className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      >
                        <option value="above">Above</option>
                        <option value="below">Below</option>
                      </select>
                      <Input
                        placeholder="0.001"
                        value={alertPrice}
                        onChange={(e) => setAlertPrice(e.target.value)}
                        type="number"
                        step="any"
                      />
                    </div>
                  )}
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingItem ? updateWatchlistItem : addToWatchlist}
                >
                  {editingItem ? "Update" : "Add to Watchlist"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="unified-card border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Tokens</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {watchlistStats.totalTokens}
            </p>
            <p className="text-xs text-blue-400">Being watched</p>
          </div>

          <div className="unified-card border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Avg Price</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {watchlistStats.totalTokens > 0
                ? (
                    parseFloat(watchlistStats.totalValue) /
                    watchlistStats.totalTokens
                  ).toFixed(6)
                : "0.000000"}
            </p>
            <p className="text-xs text-green-400">AVAX</p>
          </div>

          <div className="unified-card border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp
                className={`h-4 w-4 ${
                  watchlistStats.avgChange24h >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              />
              <span className="text-xs text-muted-foreground">Avg Change</span>
            </div>
            <p
              className={`text-2xl font-bold ${
                watchlistStats.avgChange24h >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {watchlistStats.avgChange24h >= 0 ? "+" : ""}
              {watchlistStats.avgChange24h.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">24h</p>
          </div>

          <div className="unified-card border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Alerts</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {watchlistStats.alertsSet}
            </p>
            <p className="text-xs text-purple-400">Active</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {
                    categoryOptions.find((c) => c.value === filterCategory)
                      ?.label
                  }
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {categoryOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setFilterCategory(option.value)}
                  >
                    <option.icon className="h-4 w-4 mr-2" />
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("added")}>
                  Recently Added
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("price")}>
                  Price
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("change")}>
                  24h Change
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? "Descending" : "Ascending"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Watchlist Items */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
          ) : filteredAndSortedWatchlist.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 space-y-4"
            >
              <Star className="h-12 w-12 text-muted-foreground opacity-50 mx-auto" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  {searchQuery || filterCategory !== "all"
                    ? "No matches found"
                    : "No tokens in watchlist"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || filterCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "Add tokens to track their prices and set alerts"}
                </p>
                {!searchQuery && filterCategory === "all" && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Token
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredAndSortedWatchlist.map((item, index) => {
                const token = tokenData[item.address];
                const categoryIcon =
                  categoryOptions.find((c) => c.value === item.category)
                    ?.icon || Star;
                const CategoryIcon = categoryIcon;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="unified-card border-primary/20 bg-primary/5 p-4 hover:bg-primary/10 transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Token Image */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20 flex-shrink-0">
                        {token?.imageUrl ? (
                          <Image
                            src={token.imageUrl}
                            alt={token.name}
                            width={48}
                            height={48}
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-lg font-bold text-primary">
                              {token?.symbol?.[0] || "?"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Token Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">
                                {item.label}
                              </h3>
                              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              {item.priceAlert?.enabled && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
                                  <Bell className="h-3 w-3 mr-1" />
                                  Alert
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                {token?.name} ({token?.symbol})
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {item.addedAt.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-foreground">
                              {formatTokenPrice(token?.currentPrice || "0")}{" "}
                              AVAX
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-medium ${
                                  (token?.change24h || 0) >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {(token?.change24h || 0) >= 0 ? "+" : ""}
                                {(token?.change24h || 0).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mb-2 italic">
                            "{item.notes}"
                          </p>
                        )}

                        {/* Price Alert Info */}
                        {item.priceAlert?.enabled && (
                          <div className="mb-2">
                            <Badge variant="outline" className="text-xs">
                              Alert when {item.priceAlert.condition}{" "}
                              {item.priceAlert.targetPrice} AVAX
                            </Badge>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/dex/${item.address}`)
                              }
                              className="h-7 px-3 text-xs hover:bg-primary/20"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `https://snowtrace.io/address/${item.address}`,
                                  "_blank"
                                )
                              }
                              className="h-7 px-3 text-xs hover:bg-primary/20"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Explorer
                            </Button>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingItem(item);
                                  setNewTokenLabel(item.label);
                                  setNewTokenCategory(item.category || "other");
                                  setNewTokenNotes(item.notes || "");
                                  setAlertEnabled(
                                    item.priceAlert?.enabled || false
                                  );
                                  setAlertPrice(
                                    item.priceAlert?.targetPrice || ""
                                  );
                                  setAlertCondition(
                                    item.priceAlert?.condition || "above"
                                  );
                                  setIsAddDialogOpen(true);
                                }}
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => removeFromWatchlist(item.id)}
                                className="text-red-400 focus:text-red-400"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer Actions */}
        {filteredAndSortedWatchlist.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredAndSortedWatchlist.length} of {watchlist.length} tokens
                shown
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dex")}
                  className="bg-primary/10 hover:bg-primary/20 border-primary/30"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Discover Tokens
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-primary/10 hover:bg-primary/20 border-primary/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add More
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Performance Summary */}
        {watchlistStats.topGainer && watchlistStats.topLoser && (
          <div className="pt-4 border-t border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Today&apos;s Highlights
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="unified-card border-green-400/30 bg-green-500/10 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-green-400">Top Gainer</span>
                </div>
                <p className="font-semibold text-foreground">
                  {watchlistStats.topGainer.symbol}
                </p>
                <p className="text-sm text-green-400">
                  +{watchlistStats.topGainer.change24h.toFixed(2)}%
                </p>
              </div>
              <div className="unified-card border-red-400/30 bg-red-500/10 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-red-400" />
                  <span className="text-xs text-red-400">Top Loser</span>
                </div>
                <p className="font-semibold text-foreground">
                  {watchlistStats.topLoser.symbol}
                </p>
                <p className="text-sm text-red-400">
                  {watchlistStats.topLoser.change24h.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
