"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";
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
  Calendar,
  Database,
  TrendingUp,
} from "lucide-react";

// Updated TokenCreated event signature to match your contract
interface TokenCreatedEvent {
  tokenAddress: string;
  name: string;
  symbol: string;
  imageUrl: string;
  creator: string;
  fundingGoal: bigint;
  burnManager: string;
  creatorTokens: bigint;
  ethSpent: bigint;
}

interface TokenComparison {
  address: string;
  name: string;
  symbol: string;
  creator: string;
  state: number;
  imageUrl: string;
  burnManager: string;
  fundingGoal: string;
  collateral: string;
  creatorTokens: string;
  ethSpent: string;
  inContract: boolean;
  inFirestore: boolean;
  blockNumber: number;
  timestamp?: string;
}

interface BlockRange {
  from: string;
  to: string;
}

export default function RestoreTokens() {
  const [comparisons, setComparisons] = useState<TokenComparison[]>([]);
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
  } | null>(null);
  const [cancelRequested, setCancelRequested] = useState(false);

  const publicClient = usePublicClient();

  // Get factory creation block and current block
  useEffect(() => {
    const getBlockInfo = async () => {
      if (publicClient) {
        try {
          const [currentBlock, factoryCode] = await Promise.all([
            publicClient.getBlockNumber(),
            publicClient.getCode({ address: FACTORY_ADDRESS }),
          ]);

          setCurrentBlock(currentBlock);

          // Get factory creation block by binary search
          const factoryBlock = await findFactoryCreationBlock();
          setFactoryCreationBlock(factoryBlock);

          // Set default range from factory creation to latest
          setBlockRange({
            from: factoryBlock.toString(),
            to: "latest",
          });
        } catch (err) {
          console.error("Error getting block info:", err);
          // Fallback to a reasonable default
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
      let low = currentBlock - 100000n; // Search last 100k blocks
      let high = currentBlock;
      let creationBlock = low;

      console.log("Searching for factory creation block...");

      while (low <= high) {
        const mid = (low + high) / 2n;

        try {
          const code = await publicClient.getCode({
            address: FACTORY_ADDRESS,
            blockNumber: mid,
          });

          if (code && code !== "0x") {
            // Contract exists at this block, search earlier
            creationBlock = mid;
            high = mid - 1n;
          } else {
            // Contract doesn't exist, search later
            low = mid + 1n;
          }
        } catch (err) {
          // If we can't check this block, assume contract exists and search earlier
          high = mid - 1n;
        }
      }

      console.log("Factory creation block found:", creationBlock.toString());
      return creationBlock;
    } catch (err) {
      console.error("Error finding factory creation block:", err);
      // Return a reasonable fallback
      return 36999988n;
    }
  };

  // Get Firestore tokens
  const fetchFirestoreTokens = async () => {
    try {
      const tokenDocs = await getDocs(collection(db, "tokens"));
      return tokenDocs.docs.map((doc) => ({
        address: doc.id.toLowerCase(),
        ...doc.data(),
      }));
    } catch (err) {
      console.error("Error fetching Firestore tokens:", err);
      setError("Failed to fetch Firestore tokens");
      return [];
    }
  };

  // Get token state and other details from factory contract
  const getTokenDetails = async (tokenAddress: string) => {
    if (!publicClient) throw new Error("Public client not initialized");

    try {
      const [state, collateral, fundingGoal] = await Promise.all([
        publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: FACTORY_ABI,
          functionName: "getTokenState",
          args: [tokenAddress],
        }),
        publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: FACTORY_ABI,
          functionName: "collateral",
          args: [tokenAddress],
        }),
        publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: FACTORY_ABI,
          functionName: "getFundingGoal",
          args: [tokenAddress],
        }),
      ]);

      return {
        state: Number(state),
        collateral: formatEther(collateral as bigint),
        fundingGoal: formatEther(fundingGoal as bigint),
      };
    } catch (err) {
      console.error(`Error getting details for token ${tokenAddress}:`, err);
      return {
        state: 0,
        collateral: "0",
        fundingGoal: "25", // Default funding goal
      };
    }
  };

  // Get contract tokens with improved batching and the correct event signature
  const fetchContractTokens = async (
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
      const allLogs = [];

      const totalBlocks = Number(actualToBlock - fromBlock + 1n);
      const totalBatches = Math.ceil(totalBlocks / Number(BATCH_SIZE));
      let currentBatch = 0;
      let currentFromBlock = fromBlock;

      // Updated event signature to match your contract exactly
      const tokenCreatedEvent = parseAbiItem(
        "event TokenCreated(address indexed tokenAddress, string name, string symbol, string imageUrl, address creator, uint256 fundingGoal, address burnManager, uint256 creatorTokens, uint256 ethSpent)"
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
        });

        try {
          const logs = await publicClient.getLogs({
            address: FACTORY_ADDRESS,
            event: tokenCreatedEvent,
            fromBlock: currentFromBlock,
            toBlock: currentToBlock,
          });

          allLogs.push(...logs);

          if (logs.length > 0) {
            console.log(`Found ${logs.length} tokens in batch ${currentBatch}`);
          }
        } catch (batchError) {
          console.error(`Error in batch ${currentBatch}:`, batchError);
          // Continue with next batch
        }

        currentFromBlock = currentToBlock + 1n;

        // Small delay to avoid rate limiting
        if (currentBatch % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setProgress(null);

      // Process logs and get block timestamps
      const tokenPromises = allLogs.map(async (log) => {
        try {
          const { args } = log as unknown as { args: TokenCreatedEvent };

          // Get block timestamp
          let timestamp = "";
          try {
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber,
            });
            timestamp = new Date(Number(block.timestamp) * 1000).toISOString();
          } catch (err) {
            console.warn("Could not get timestamp for block", log.blockNumber);
          }

          return {
            address: args.tokenAddress.toLowerCase(),
            name: args.name,
            symbol: args.symbol,
            imageUrl: args.imageUrl,
            creator: args.creator.toLowerCase(),
            burnManager: args.burnManager.toLowerCase(),
            fundingGoal: formatEther(args.fundingGoal),
            creatorTokens: formatEther(args.creatorTokens),
            ethSpent: formatEther(args.ethSpent),
            blockNumber: Number(log.blockNumber),
            timestamp,
          };
        } catch (error) {
          console.error("Error processing log:", error, log);
          return null;
        }
      });

      const processedTokens = (await Promise.all(tokenPromises)).filter(
        Boolean
      );
      return processedTokens as any[];
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
      setComparisons([]);
      setCancelRequested(false);

      const fromBlock = BigInt(blockRange.from);
      const toBlock =
        blockRange.to === "latest" || blockRange.to === ""
          ? ("latest" as const)
          : BigInt(blockRange.to);

      const [contractTokens, firestoreTokens] = await Promise.all([
        fetchContractTokens(fromBlock, toBlock),
        fetchFirestoreTokens(),
      ]);

      if (contractTokens.length === 0) {
        setComparisons([]);
        return;
      }

      // Get detailed state for each token
      const tokenDetailsPromises = contractTokens.map(async (token) => {
        try {
          const details = await getTokenDetails(token.address);
          return {
            ...token,
            ...details,
            inContract: true,
            inFirestore: firestoreTokens.some(
              (ft) => ft.address.toLowerCase() === token.address.toLowerCase()
            ),
          };
        } catch (err) {
          console.error(`Error fetching details for ${token.address}:`, err);
          return {
            ...token,
            state: 0,
            collateral: "0",
            inContract: true,
            inFirestore: firestoreTokens.some(
              (ft) => ft.address.toLowerCase() === token.address.toLowerCase()
            ),
          };
        }
      });

      const allComparisons = await Promise.all(tokenDetailsPromises);
      allComparisons.sort((a, b) => b.blockNumber - a.blockNumber);

      setComparisons(allComparisons);
    } catch (err: any) {
      console.error("Error comparing tokens:", err);
      if (err.message?.includes("cancelled")) {
        setError("Search was cancelled");
      } else {
        setError(`Failed to load token comparisons: ${err.message}`);
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

  // Restore token to Firestore
  const handleRestoreToken = async (token: TokenComparison) => {
    try {
      await setDoc(doc(db, "tokens", token.address), {
        name: token.name,
        symbol: token.symbol,
        address: token.address,
        creator: token.creator,
        imageUrl: token.imageUrl,
        burnManager: token.burnManager,
        createdAt: token.timestamp || new Date().toISOString(),
        currentState: token.state,
        state: token.state,
        collateral: token.collateral,
        fundingGoal: token.fundingGoal,
        lastPrice: "0.00001", // Initial price
        statistics: {
          currentPrice: "0.00001",
          volumeETH: "0",
          tradeCount: 0,
          uniqueHolders: 0,
        },
        blockNumber: token.blockNumber,
        transactionHash: "", // Could be populated if needed
      });

      setComparisons((prev) =>
        prev.map((t) =>
          t.address === token.address ? { ...t, inFirestore: true } : t
        )
      );
    } catch (err) {
      console.error("Error restoring token:", err);
      setError(`Failed to restore token ${token.address}: ${err}`);
    }
  };

  // Preset range functions
  const handlePresetRange = (
    preset: "last1k" | "last10k" | "factory" | "recent"
  ) => {
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
      case "factory":
        setBlockRange({
          from: factoryCreationBlock?.toString() || "36999988",
          to: "latest",
        });
        break;
      case "recent":
        setBlockRange({
          from: (currentBlock - 100n).toString(),
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

  const missingCount = comparisons.filter((t) => !t.inFirestore).length;

  return (
    <Container>
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Token Restore Interface</h1>
          <p className="text-muted-foreground">
            Find and restore missing tokens from the factory contract to
            Firestore
          </p>
        </div>

        {/* Network Info */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Network Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-600 font-medium">Factory Address</p>
              <code className="text-xs bg-blue-100 px-2 py-1 rounded block mt-1 text-blue-800">
                {FACTORY_ADDRESS}
              </code>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Current Block</p>
              <p className="text-blue-800 font-mono">
                {currentBlock?.toLocaleString() || "Loading..."}
              </p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Factory Created At</p>
              <p className="text-blue-800 font-mono">
                Block {factoryCreationBlock?.toLocaleString() || "Detecting..."}
              </p>
            </div>
          </div>
        </Card>

        {/* Search Controls */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Search Configuration</h2>
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
                  Search for Tokens
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

          {/* Progress Indicator */}
          {progress && (
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex justify-between items-center text-sm text-primary mb-2">
                <span className="font-medium">Processing batches...</span>
                <div className="flex items-center gap-3">
                  {progress.currentRange && (
                    <span className="text-xs text-muted-foreground font-mono">
                      Blocks {progress.currentRange}
                    </span>
                  )}
                  <span className="font-medium">
                    {progress.current} / {progress.total}
                  </span>
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
        {comparisons.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Search Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Found {comparisons.length} token
                    {comparisons.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {missingCount > 0 && (
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">
                    {missingCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Missing from Firestore
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && comparisons.length === 0 && !error && blockRange.from && (
          <Card className="p-12 text-center">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No Tokens Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              No tokens were found in the specified block range. Try expanding
              your search parameters or check if the factory address is correct.
            </p>
          </Card>
        )}

        {/* Results List */}
        {comparisons.length > 0 && (
          <div className="space-y-4">
            {comparisons.map((token) => (
              <Card
                key={token.address}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold truncate">
                        {token.name} ({token.symbol})
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
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          State: {token.state}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Address</p>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded block">
                          {token.address}
                        </code>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Block</p>
                        <p className="font-mono">
                          {token.blockNumber.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Collateral</p>
                        <p className="font-semibold">
                          {parseFloat(token.collateral).toFixed(4)} AVAX
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          Initial Purchase
                        </p>
                        <p className="font-semibold">
                          {parseFloat(token.ethSpent).toFixed(4)} AVAX
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Creator Tokens</p>
                        <p className="font-semibold">
                          {parseFloat(token.creatorTokens).toFixed(0)}
                        </p>
                      </div>
                      {token.timestamp && (
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="text-xs">
                            {new Date(token.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {!token.inFirestore && (
                    <Button
                      onClick={() => handleRestoreToken(token)}
                      className="lg:ml-4 self-start lg:self-center"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Restore to Firestore
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
