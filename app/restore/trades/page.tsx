"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { FACTORY_ADDRESS } from "@/types";
import { formatEther, parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/craft";
import {
  RefreshCw,
  Search,
  AlertCircle,
  Info,
  X,
  TrendingUp,
  Calendar,
  Database,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

// Event interfaces based on your contract
interface TokensPurchasedEvent {
  token: string;
  buyer: string;
  amount: bigint;
  price: bigint;
  fee: bigint;
}

interface TokensSoldEvent {
  token: string;
  seller: string;
  tokenAmount: bigint;
  ethAmount: bigint;
  fee: bigint;
}

interface FirestoreTrade {
  blockNumber: number;
  ethAmount: string;
  pricePerToken: string;
  timestamp: string;
  token: string;
  tokenAmount: string;
  trader: string;
  transactionHash: string;
  type: "buy" | "sell";
  fee?: string;
}

interface TokenTrades {
  address: string;
  name?: string;
  symbol?: string;
  trades: FirestoreTrade[];
  inContract: boolean;
  inFirestore: boolean;
  buyTrades: number;
  sellTrades: number;
  totalVolume: string;
  firstTradeBlock: number;
  lastTradeBlock: number;
}

interface BlockRange {
  from: string;
  to: string;
}

const calculatePricePerToken = (
  ethAmount: bigint,
  tokenAmount: bigint
): string => {
  if (tokenAmount === 0n) return "0";
  const ethInEther = Number(formatEther(ethAmount));
  const tokensInEther = Number(formatEther(tokenAmount));
  return (ethInEther / tokensInEther).toString();
};

export default function RestoreTrades() {
  const [tokenTrades, setTokenTrades] = useState<TokenTrades[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBlock, setCurrentBlock] = useState<bigint | null>(null);
  const [factoryCreationBlock, setFactoryCreationBlock] = useState<
    bigint | null
  >(null);
  const [blockRange, setBlockRange] = useState<BlockRange>({
    from: "",
    to: "latest",
  });
  const [batchSize, setBatchSize] = useState("1000");
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    currentRange?: string;
    tradesFound?: number;
  } | null>(null);
  const [cancelRequested, setCancelRequested] = useState(false);

  const publicClient = usePublicClient();

  // Get factory creation block and current block
  useEffect(() => {
    const getBlockInfo = async () => {
      if (publicClient) {
        try {
          const currentBlock = await publicClient.getBlockNumber();
          setCurrentBlock(currentBlock);

          // Find factory creation block
          const factoryBlock = await findFactoryCreationBlock();
          setFactoryCreationBlock(factoryBlock);

          // Set default range from factory creation to latest
          setBlockRange({
            from: factoryBlock.toString(),
            to: "latest",
          });
        } catch (err) {
          console.error("Error getting block info:", err);
          // Fallback
          const fallbackBlock = currentBlock
            ? currentBlock - 50000n
            : 36999988n;
          setFactoryCreationBlock(fallbackBlock);
          setBlockRange({
            from: fallbackBlock.toString(),
            to: "latest",
          });
        }
      }
    };

    getBlockInfo();
  }, [publicClient]);

  // Binary search to find factory creation block
  const findFactoryCreationBlock = async (): Promise<bigint> => {
    if (!publicClient) throw new Error("Public client not available");

    try {
      const currentBlock = await publicClient.getBlockNumber();
      let low = currentBlock - 100000n;
      let high = currentBlock;
      let creationBlock = low;

      while (low <= high) {
        const mid = (low + high) / 2n;

        try {
          const code = await publicClient.getCode({
            address: FACTORY_ADDRESS,
            blockNumber: mid,
          });

          if (code && code !== "0x") {
            creationBlock = mid;
            high = mid - 1n;
          } else {
            low = mid + 1n;
          }
        } catch (err) {
          high = mid - 1n;
        }
      }

      return creationBlock;
    } catch (err) {
      console.error("Error finding factory creation block:", err);
      return 36999988n;
    }
  };

  // Get existing Firestore trades
  const fetchFirestoreTrades = async () => {
    try {
      const tradeDocs = await getDocs(collection(db, "trades"));
      const existingTradeHashes = new Set(
        tradeDocs.docs.map((doc) => doc.data().transactionHash)
      );
      console.log(
        `Found ${existingTradeHashes.size} existing trades in Firestore`
      );
      return existingTradeHashes;
    } catch (err) {
      console.error("Error fetching Firestore trades:", err);
      setError("Failed to fetch existing trades from Firestore");
      return new Set();
    }
  };

  // Get token info from Firestore
  const fetchTokenInfo = async () => {
    try {
      const tokenDocs = await getDocs(collection(db, "tokens"));
      const tokenMap = new Map();
      tokenDocs.docs.forEach((doc) => {
        const data = doc.data();
        tokenMap.set(doc.id.toLowerCase(), {
          name: data.name,
          symbol: data.symbol,
        });
      });
      return tokenMap;
    } catch (err) {
      console.error("Error fetching token info:", err);
      return new Map();
    }
  };

  // Fetch contract trades with improved batching and UI
  const fetchContractTrades = async (
    fromBlock: bigint,
    toBlock: bigint | "latest"
  ) => {
    if (!publicClient) {
      throw new Error("Public client not initialized");
    }

    try {
      const actualToBlock =
        toBlock === "latest" ? await publicClient.getBlockNumber() : toBlock;
      const BATCH_SIZE = BigInt(batchSize);
      const tradesByToken = new Map<string, TokenTrades>();

      const totalBlocks = Number(actualToBlock - fromBlock + 1n);
      const totalBatches = Math.ceil(totalBlocks / Number(BATCH_SIZE));
      let currentBatch = 0;
      let currentFromBlock = fromBlock;
      let totalTradesFound = 0;

      // Define event signatures
      const buyEventSignature = parseAbiItem(
        "event TokensPurchased(address indexed token, address indexed buyer, uint256 amount, uint256 price, uint256 fee)"
      );

      const sellEventSignature = parseAbiItem(
        "event TokensSold(address indexed token, address indexed seller, uint256 tokenAmount, uint256 ethAmount, uint256 fee)"
      );

      while (currentFromBlock <= actualToBlock) {
        if (cancelRequested) {
          throw new Error("Search cancelled by user");
        }

        const currentToBlock =
          currentFromBlock + BATCH_SIZE - 1n > actualToBlock
            ? actualToBlock
            : currentFromBlock + BATCH_SIZE - 1n;

        currentBatch++;
        setProgress({
          current: currentBatch,
          total: totalBatches,
          currentRange: `${currentFromBlock.toString()} - ${currentToBlock.toString()}`,
          tradesFound: totalTradesFound,
        });

        try {
          // Fetch both buy and sell events in parallel
          const [buyLogs, sellLogs] = await Promise.all([
            publicClient.getLogs({
              address: FACTORY_ADDRESS,
              event: buyEventSignature,
              fromBlock: currentFromBlock,
              toBlock: currentToBlock,
            }),
            publicClient.getLogs({
              address: FACTORY_ADDRESS,
              event: sellEventSignature,
              fromBlock: currentFromBlock,
              toBlock: currentToBlock,
            }),
          ]);

          totalTradesFound += buyLogs.length + sellLogs.length;

          // Process buy events
          for (const log of buyLogs) {
            if (!log.args) continue;

            const args = log.args as TokensPurchasedEvent;
            const tokenAddress = args.token.toLowerCase();
            const blockNumber = Number(log.blockNumber);

            if (!tradesByToken.has(tokenAddress)) {
              tradesByToken.set(tokenAddress, {
                address: tokenAddress,
                trades: [],
                inContract: true,
                inFirestore: false,
                buyTrades: 0,
                sellTrades: 0,
                totalVolume: "0",
                firstTradeBlock: blockNumber,
                lastTradeBlock: blockNumber,
              });
            }

            // Get block timestamp (cache blocks to avoid repeated calls)
            const block = await publicClient.getBlock({
              blockNumber: BigInt(blockNumber),
            });

            const trade: FirestoreTrade = {
              blockNumber,
              ethAmount: args.price.toString(),
              tokenAmount: args.amount.toString(),
              pricePerToken: calculatePricePerToken(args.price, args.amount),
              timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
              token: tokenAddress,
              trader: args.buyer.toLowerCase(),
              transactionHash: log.transactionHash,
              type: "buy",
              fee: args.fee.toString(),
            };

            const tokenData = tradesByToken.get(tokenAddress)!;
            tokenData.trades.push(trade);
            tokenData.buyTrades++;
            tokenData.firstTradeBlock = Math.min(
              tokenData.firstTradeBlock,
              blockNumber
            );
            tokenData.lastTradeBlock = Math.max(
              tokenData.lastTradeBlock,
              blockNumber
            );
          }

          // Process sell events
          for (const log of sellLogs) {
            if (!log.args) continue;

            const args = log.args as TokensSoldEvent;
            const tokenAddress = args.token.toLowerCase();
            const blockNumber = Number(log.blockNumber);

            if (!tradesByToken.has(tokenAddress)) {
              tradesByToken.set(tokenAddress, {
                address: tokenAddress,
                trades: [],
                inContract: true,
                inFirestore: false,
                buyTrades: 0,
                sellTrades: 0,
                totalVolume: "0",
                firstTradeBlock: blockNumber,
                lastTradeBlock: blockNumber,
              });
            }

            const block = await publicClient.getBlock({
              blockNumber: BigInt(blockNumber),
            });

            const trade: FirestoreTrade = {
              blockNumber,
              ethAmount: args.ethAmount.toString(),
              tokenAmount: args.tokenAmount.toString(),
              pricePerToken: calculatePricePerToken(
                args.ethAmount,
                args.tokenAmount
              ),
              timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
              token: tokenAddress,
              trader: args.seller.toLowerCase(),
              transactionHash: log.transactionHash,
              type: "sell",
              fee: args.fee.toString(),
            };

            const tokenData = tradesByToken.get(tokenAddress)!;
            tokenData.trades.push(trade);
            tokenData.sellTrades++;
            tokenData.firstTradeBlock = Math.min(
              tokenData.firstTradeBlock,
              blockNumber
            );
            tokenData.lastTradeBlock = Math.max(
              tokenData.lastTradeBlock,
              blockNumber
            );
          }
        } catch (batchError) {
          console.error(`Error in batch ${currentBatch}:`, batchError);
        }

        currentFromBlock = currentToBlock + 1n;

        // Rate limiting
        if (currentBatch % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setProgress(null);

      // Calculate total volume and sort trades for each token
      const result = Array.from(tradesByToken.values());
      result.forEach((tokenData) => {
        // Sort trades by block number
        tokenData.trades.sort((a, b) => a.blockNumber - b.blockNumber);

        // Calculate total volume in AVAX
        const totalVolumeWei = tokenData.trades.reduce((sum, trade) => {
          return sum + parseFloat(trade.ethAmount);
        }, 0);
        tokenData.totalVolume = formatEther(BigInt(Math.floor(totalVolumeWei)));
      });

      // Sort tokens by total trade count (most active first)
      result.sort((a, b) => b.trades.length - a.trades.length);

      return result;
    } catch (err) {
      setProgress(null);
      throw err;
    }
  };

  // Main search function
  const handleSearch = async () => {
    if (!publicClient) {
      setError("Waiting for network connection...");
      return;
    }

    if (!blockRange.from) {
      setError("Please enter a starting block number");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTokenTrades([]);
      setCancelRequested(false);

      const fromBlock = BigInt(blockRange.from);
      const toBlock =
        blockRange.to === "latest" || blockRange.to === ""
          ? ("latest" as const)
          : BigInt(blockRange.to);

      const [contractTrades, existingTradeHashes, tokenInfoMap] =
        await Promise.all([
          fetchContractTrades(fromBlock, toBlock),
          fetchFirestoreTrades(),
          fetchTokenInfo(),
        ]);

      // Enhance token data with names/symbols and check Firestore status
      contractTrades.forEach((tokenData) => {
        const tokenInfo = tokenInfoMap.get(tokenData.address);
        if (tokenInfo) {
          tokenData.name = tokenInfo.name;
          tokenData.symbol = tokenInfo.symbol;
        }

        // Check if any trades exist in Firestore
        const hasTradesInFirestore = tokenData.trades.some((trade) =>
          existingTradeHashes.has(trade.transactionHash)
        );
        tokenData.inFirestore = hasTradesInFirestore;
      });

      setTokenTrades(contractTrades);
    } catch (err: any) {
      console.error("Error searching for trades:", err);
      if (err.message?.includes("cancelled")) {
        setError("Search was cancelled");
      } else {
        setError(`Failed to load trade data: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setCancelRequested(false);
      setProgress(null);
    }
  };

  const handleCancel = () => {
    setCancelRequested(true);
  };

  // Restore trades for a token to Firestore
  const handleRestoreTrades = async (token: TokenTrades) => {
    try {
      const existingTradeHashes = await fetchFirestoreTrades();
      const newTrades = token.trades.filter(
        (trade) => !existingTradeHashes.has(trade.transactionHash)
      );

      if (newTrades.length === 0) {
        setTokenTrades((prev) =>
          prev.map((t) =>
            t.address === token.address ? { ...t, inFirestore: true } : t
          )
        );
        return;
      }

      const tradesRef = collection(db, "trades");

      for (const trade of newTrades) {
        const newTradeRef = doc(tradesRef);
        await setDoc(newTradeRef, trade);
      }

      setTokenTrades((prev) =>
        prev.map((t) =>
          t.address === token.address ? { ...t, inFirestore: true } : t
        )
      );
    } catch (err) {
      console.error("Error restoring trades:", err);
      setError(`Failed to restore trades for token ${token.address}: ${err}`);
    }
  };

  // Preset range functions
  const handlePresetRange = (
    preset: "last1k" | "last10k" | "factory" | "recent"
  ) => {
    if (!currentBlock) return;

    switch (preset) {
      case "recent":
        setBlockRange({
          from: (currentBlock - 100n).toString(),
          to: "latest",
        });
        break;
      case "last1k":
        setBlockRange({
          from: (currentBlock - 1000n).toString(),
          to: "latest",
        });
        break;
      case "last10k":
        setBlockRange({
          from: (currentBlock - 10000n).toString(),
          to: "latest",
        });
        break;
      case "factory":
        setBlockRange({
          from: factoryCreationBlock?.toString() || "36999988",
          to: "latest",
        });
        break;
    }
  };

  if (!publicClient) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <div>Connecting to network...</div>
          </div>
        </div>
      </Container>
    );
  }

  const missingCount = tokenTrades.filter((t) => !t.inFirestore).length;
  const totalTrades = tokenTrades.reduce((sum, t) => sum + t.trades.length, 0);

  return (
    <Container>
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Trade History Restore</h1>
          <p className="text-muted-foreground">
            Find and restore missing trade history from the factory contract to
            Firestore
          </p>
        </div>

        {/* Network Info */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-800">
              Network Information
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-green-600 font-medium">Factory Address</p>
              <code className="text-xs bg-green-100 px-2 py-1 rounded block mt-1 text-green-800">
                {FACTORY_ADDRESS}
              </code>
            </div>
            <div>
              <p className="text-green-600 font-medium">Current Block</p>
              <p className="text-green-800 font-mono">
                {currentBlock?.toLocaleString() || "Loading..."}
              </p>
            </div>
            <div>
              <p className="text-green-600 font-medium">Factory Created At</p>
              <p className="text-green-800 font-mono">
                Block {factoryCreationBlock?.toLocaleString() || "Detecting..."}
              </p>
            </div>
          </div>
        </Card>

        {/* Search Controls */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">
              Trade Search Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="fromBlock">From Block</Label>
              <Input
                id="fromBlock"
                type="text"
                value={blockRange.from}
                onChange={(e) =>
                  setBlockRange((prev) => ({ ...prev, from: e.target.value }))
                }
                placeholder="Starting block number"
                className="font-mono"
              />
            </div>

            <div>
              <Label htmlFor="toBlock">To Block</Label>
              <Input
                id="toBlock"
                type="text"
                value={blockRange.to}
                onChange={(e) =>
                  setBlockRange((prev) => ({ ...prev, to: e.target.value }))
                }
                placeholder="End block (or 'latest')"
                className="font-mono"
              />
            </div>

            <div>
              <Label htmlFor="batchSize">Batch Size</Label>
              <Input
                id="batchSize"
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                placeholder="1000"
                min="1"
                max="2000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Blocks per batch (max 2000)
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetRange("recent")}
              disabled={!currentBlock}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Last 100 Blocks
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetRange("last1k")}
              disabled={!currentBlock}
            >
              Last 1K Blocks
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetRange("last10k")}
              disabled={!currentBlock}
            >
              Last 10K Blocks
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetRange("factory")}
              disabled={!factoryCreationBlock}
              className="bg-primary/10"
            >
              <Database className="h-4 w-4 mr-1" />
              Full History (Since Factory)
            </Button>
          </div>

          {/* Search Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSearch}
              disabled={loading || !blockRange.from}
              className="flex-1 md:flex-none"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search for Trades
                </>
              )}
            </Button>

            {loading && (
              <Button onClick={handleCancel} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          {/* Enhanced Progress Indicator */}
          {progress && (
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex justify-between items-center text-sm text-primary mb-2">
                <span className="font-medium">Processing trade events...</span>
                <div className="flex items-center gap-4">
                  {progress.currentRange && (
                    <span className="text-xs text-muted-foreground font-mono">
                      Blocks {progress.currentRange}
                    </span>
                  )}
                  <span className="font-medium">
                    {progress.current} / {progress.total}
                  </span>
                  {progress.tradesFound !== undefined && (
                    <span className="text-xs bg-primary/20 px-2 py-1 rounded">
                      {progress.tradesFound} trades found
                    </span>
                  )}
                  {cancelRequested && (
                    <span className="text-orange-600 font-medium">
                      Cancelling...
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-primary/20 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    cancelRequested ? "bg-orange-500" : "bg-primary"
                  }`}
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-red-800">
                <p className="font-semibold">Error encountered:</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Results Summary */}
        {tokenTrades.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Trade Search Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Found {totalTrades} trades across {tokenTrades.length} token
                    {tokenTrades.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {missingCount > 0 && (
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">
                    {missingCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tokens missing trades
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && tokenTrades.length === 0 && !error && blockRange.from && (
          <Card className="p-12 text-center">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No Trades Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              No trading activity was found in the specified block range. Try
              expanding your search parameters or check a different time period.
            </p>
          </Card>
        )}

        {/* Results List */}
        {tokenTrades.length > 0 && (
          <div className="space-y-4">
            {tokenTrades.map((token) => (
              <Card
                key={token.address}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold truncate">
                        {token.name && token.symbol
                          ? `${token.name} (${token.symbol})`
                          : `Token ${token.address.slice(0, 8)}...`}
                      </h3>
                      <div className="flex gap-2 flex-shrink-0">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            token.inFirestore
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {token.inFirestore ? "✓ In Firestore" : "⚠ Missing"}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {token.trades.length} trades
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Token Address</p>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded block">
                          {token.address}
                        </code>
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-muted-foreground">Buy Trades</p>
                          <p className="font-semibold text-green-600 flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            {token.buyTrades}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Sell Trades</p>
                          <p className="font-semibold text-red-600 flex items-center gap-1">
                            <ArrowDownLeft className="h-3 w-3" />
                            {token.sellTrades}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Volume</p>
                        <p className="font-semibold">
                          {parseFloat(token.totalVolume).toFixed(4)} AVAX
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Block Range</p>
                        <p className="text-xs font-mono">
                          {token.firstTradeBlock.toLocaleString()} -{" "}
                          {token.lastTradeBlock.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!token.inFirestore && (
                    <Button
                      onClick={() => handleRestoreTrades(token)}
                      className="lg:ml-4 self-start lg:self-center"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Restore {token.trades.length} Trade
                      {token.trades.length !== 1 ? "s" : ""}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
