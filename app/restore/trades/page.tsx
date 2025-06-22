"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import {
  FACTORY_ADDRESS,
  TokensPurchasedEvent,
  TokensSoldEvent,
} from "@/types";
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
} from "lucide-react";

const DEFAULT_STARTING_BLOCK = 36999988n;

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
}

interface TokenTrades {
  address: string;
  trades: FirestoreTrade[];
  inContract: boolean;
  inFirestore: boolean;
  buyTrades: number;
  sellTrades: number;
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
  return (Number(ethAmount) / Number(tokenAmount)).toString();
};

export default function RestoreTrades() {
  const [tokenTrades, setTokenTrades] = useState<TokenTrades[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBlock, setCurrentBlock] = useState<bigint | null>(null);
  const [blockRange, setBlockRange] = useState<BlockRange>({
    from: DEFAULT_STARTING_BLOCK.toString(),
    to: "latest",
  });
  const [batchSize, setBatchSize] = useState("500");
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [cancelRequested, setCancelRequested] = useState(false);

  const publicClient = usePublicClient();

  // Get current block number on load
  useEffect(() => {
    const getCurrentBlock = async () => {
      if (publicClient) {
        try {
          const block = await publicClient.getBlockNumber();
          setCurrentBlock(block);

          // Set a reasonable default range (last 10k blocks)
          const defaultFrom = block - 10000n;
          setBlockRange({
            from: defaultFrom.toString(),
            to: "latest",
          });
        } catch (err) {
          console.error("Error getting current block:", err);
        }
      }
    };

    getCurrentBlock();
  }, [publicClient]);

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

  // Fetch contract trades with user-defined range and batching
  const fetchContractTrades = async (
    fromBlock: bigint,
    toBlock: bigint | "latest"
  ) => {
    if (!publicClient) {
      console.error("Public client not initialized");
      throw new Error("Public client not initialized");
    }

    try {
      console.log("Fetching trade logs for factory address:", FACTORY_ADDRESS);
      console.log("Block range:", fromBlock.toString(), "to", toBlock);

      const actualToBlock =
        toBlock === "latest" ? await publicClient.getBlockNumber() : toBlock;
      const BATCH_SIZE = BigInt(batchSize);
      const tradesByToken = new Map<string, TokenTrades>();

      const totalBlocks = Number(actualToBlock - fromBlock + 1n);
      const totalBatches = Math.ceil(totalBlocks / Number(BATCH_SIZE));
      let currentBatch = 0;

      let currentFromBlock = fromBlock;

      while (currentFromBlock <= actualToBlock) {
        // Check if cancel was requested
        if (cancelRequested) {
          console.log("Trade search cancelled by user");
          setProgress(null);
          throw new Error("Search cancelled by user");
        }

        const currentToBlock =
          currentFromBlock + BATCH_SIZE - 1n > actualToBlock
            ? actualToBlock
            : currentFromBlock + BATCH_SIZE - 1n;

        currentBatch++;
        setProgress({ current: currentBatch, total: totalBatches });

        console.log(
          `Fetching trade batch ${currentBatch}/${totalBatches}: blocks ${currentFromBlock} to ${currentToBlock}`
        );

        try {
          // Fetch buy events
          const buyLogs = await publicClient.getLogs({
            address: FACTORY_ADDRESS,
            event: parseAbiItem(
              "event TokensPurchased(address indexed token, address indexed buyer, uint256 amount, uint256 price, uint256 fee)"
            ),
            fromBlock: currentFromBlock,
            toBlock: currentToBlock,
          });

          // Fetch sell events
          const sellLogs = await publicClient.getLogs({
            address: FACTORY_ADDRESS,
            event: parseAbiItem(
              "event TokensSold(address indexed token, address indexed seller, uint256 tokenAmount, uint256 ethAmount, uint256 fee)"
            ),
            fromBlock: currentFromBlock,
            toBlock: currentToBlock,
          });

          console.log(
            `Found ${buyLogs.length} buy events and ${sellLogs.length} sell events in batch ${currentBatch}`
          );

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
              });
            }

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
            };

            const tokenData = tradesByToken.get(tokenAddress)!;
            tokenData.trades.push(trade);
            tokenData.buyTrades++;
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
            };

            const tokenData = tradesByToken.get(tokenAddress)!;
            tokenData.trades.push(trade);
            tokenData.sellTrades++;
          }
        } catch (batchError) {
          console.error(
            `Error fetching trade batch ${currentBatch} from ${currentFromBlock} to ${currentToBlock}:`,
            batchError
          );
          // Continue with next batch instead of failing completely
        }

        currentFromBlock = currentToBlock + 1n;

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setProgress(null);

      // Sort trades by block number for each token
      const result = Array.from(tradesByToken.values());
      result.forEach((tokenData) => {
        tokenData.trades.sort((a, b) => a.blockNumber - b.blockNumber);
      });

      // Sort tokens by total trade count (most active first)
      result.sort((a, b) => b.trades.length - a.trades.length);

      console.log(`Found trades for ${result.length} tokens`);
      return result;
    } catch (err) {
      setProgress(null);
      console.error("Error fetching contract trades:", err);
      throw new Error(`Failed to fetch trades from contract: ${err}`);
    }
  };

  // Search for trades with user-defined range
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

      console.log("Starting trade search...");
      console.log("Using factory address:", FACTORY_ADDRESS);
      console.log("Block range:", fromBlock.toString(), "to", toBlock);

      const [contractTrades, existingTradeHashes] = await Promise.all([
        fetchContractTrades(fromBlock, toBlock),
        fetchFirestoreTrades(),
      ]);

      // Check which tokens already have trades in Firestore
      contractTrades.forEach((tokenData) => {
        const hasTradesInFirestore = tokenData.trades.some((trade) =>
          existingTradeHashes.has(trade.transactionHash)
        );
        tokenData.inFirestore = hasTradesInFirestore;
      });

      console.log("Final trade results:", contractTrades);
      setTokenTrades(contractTrades);
    } catch (err: any) {
      console.error("Error searching for trades:", err);
      if (err.message?.includes("cancelled")) {
        setError("Search was cancelled");
      } else {
        setError(`Failed to load trade data: ${err}`);
      }
    } finally {
      setLoading(false);
      setCancelRequested(false);
      setProgress(null);
    }
  };

  // Cancel the current search
  const handleCancel = () => {
    setCancelRequested(true);
  };

  // Function to restore trades for a token to Firestore
  const handleRestoreTrades = async (token: TokenTrades) => {
    try {
      console.log(
        `Starting restore for token ${token.address} with ${token.trades.length} trades`
      );

      // Get existing trades to avoid duplicates
      const existingTradeHashes = await fetchFirestoreTrades();
      const newTrades = token.trades.filter(
        (trade) => !existingTradeHashes.has(trade.transactionHash)
      );

      console.log(
        `Processing ${newTrades.length} new trades out of ${token.trades.length} total`
      );

      if (newTrades.length === 0) {
        console.log("No new trades to restore");
        setTokenTrades((prev) =>
          prev.map((t) =>
            t.address === token.address ? { ...t, inFirestore: true } : t
          )
        );
        return;
      }

      const tradesRef = collection(db, "trades");

      for (let i = 0; i < newTrades.length; i++) {
        const trade = newTrades[i];
        try {
          console.log(`Storing trade ${i + 1}/${newTrades.length}:`, trade);
          const newTradeRef = doc(tradesRef);
          await setDoc(newTradeRef, trade);
          console.log(
            `Successfully stored trade ${i + 1} with ID: ${newTradeRef.id}`
          );
        } catch (tradeError) {
          console.error(`Failed to store trade ${i + 1}:`, tradeError);
          console.error("Trade data:", trade);
          throw tradeError;
        }
      }

      console.log(
        `Successfully restored ${newTrades.length} new trades for token ${token.address}`
      );

      setTokenTrades((prev) =>
        prev.map((t) =>
          t.address === token.address ? { ...t, inFirestore: true } : t
        )
      );
    } catch (err) {
      console.error("Error in handleRestoreTrades:", err);
      setError(
        `Failed to restore trades for token ${token.address}: ${
          (err as Error).message
        }`
      );
    }
  };

  // Quick preset buttons
  const handlePresetRange = (preset: "last1k" | "last10k" | "all") => {
    if (!currentBlock) return;

    switch (preset) {
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
      case "all":
        setBlockRange({
          from: DEFAULT_STARTING_BLOCK.toString(),
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

  return (
    <Container>
      <div className="p-4 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Trade History Restore Interface
        </h1>

        {/* Network Info */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Network Information</h3>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <strong>Factory Address:</strong> {FACTORY_ADDRESS}
            </p>
            <p>
              <strong>Current Block:</strong>{" "}
              {currentBlock?.toString() || "Loading..."}
            </p>
            <p>
              <strong>Default Starting Block:</strong>{" "}
              {DEFAULT_STARTING_BLOCK.toString()}
            </p>
          </div>
        </Card>

        {/* Search Controls */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Search Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              />
            </div>

            <div>
              <Label htmlFor="batchSize">Batch Size</Label>
              <Input
                id="batchSize"
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                placeholder="500"
                min="1"
                max="500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max 500 for Alchemy free tier
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
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
              onClick={() => handlePresetRange("all")}
              disabled={!currentBlock}
            >
              All History (Slow!)
            </Button>
          </div>

          {/* Search Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 md:flex-none"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Searching Trades...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Search for Trades
                </>
              )}
            </Button>

            {loading && (
              <Button onClick={handleCancel} variant="outline" className="px-3">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          {/* Progress Indicator */}
          {progress && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center text-sm text-blue-700 mb-2">
                <span>Processing trade batches...</span>
                <div className="flex items-center gap-2">
                  <span>
                    {progress.current} / {progress.total}
                  </span>
                  {cancelRequested && (
                    <span className="text-orange-600 font-medium">
                      Cancelling...
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    cancelRequested ? "bg-orange-500" : "bg-blue-600"
                  }`}
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-4 mb-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div className="text-red-800">
                <p className="font-semibold">Error encountered:</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Results */}
        {!loading && tokenTrades.length === 0 && !error && (
          <Card className="p-8 text-center text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No trades found in the specified range.</p>
            <p className="text-sm">
              Try adjusting your search parameters or expanding the block range.
            </p>
          </Card>
        )}

        {tokenTrades.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Found Trades for {tokenTrades.length} Token
              {tokenTrades.length !== 1 ? "s" : ""}
            </h2>

            {tokenTrades.map((token) => (
              <Card key={token.address} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold">
                        Token: {token.address}
                      </h3>
                      <div className="flex gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            token.inContract
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {token.inContract
                            ? "✓ In Contract"
                            : "✗ Not in Contract"}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            token.inFirestore
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {token.inFirestore
                            ? "✓ In Firestore"
                            : "Missing from Firestore"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>
                        <p>
                          <strong>Total Trades:</strong> {token.trades.length}
                        </p>
                        <p>
                          <strong>Buy Trades:</strong> {token.buyTrades}
                        </p>
                        <p>
                          <strong>Sell Trades:</strong> {token.sellTrades}
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong>Address:</strong>{" "}
                          <code className="bg-gray-100 px-1 rounded text-xs">
                            {token.address}
                          </code>
                        </p>
                        {token.trades.length > 0 && (
                          <>
                            <p>
                              <strong>First Trade Block:</strong>{" "}
                              {Math.min(
                                ...token.trades.map((t) => t.blockNumber)
                              ).toLocaleString()}
                            </p>
                            <p>
                              <strong>Latest Trade Block:</strong>{" "}
                              {Math.max(
                                ...token.trades.map((t) => t.blockNumber)
                              ).toLocaleString()}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {!token.inFirestore && (
                    <Button
                      onClick={() => handleRestoreTrades(token)}
                      variant="default"
                      className="ml-4"
                    >
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
