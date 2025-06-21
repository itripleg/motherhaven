"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { FACTORY_ADDRESS, FACTORY_ABI, TokenCreatedEvent } from "@/types";
import { formatEther, parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/craft";
import { RefreshCw, Search, AlertCircle, Info, X } from "lucide-react";

const DEFAULT_STARTING_BLOCK = 36999988n;

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
  inContract: boolean;
  inFirestore: boolean;
  blockNumber: number;
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

  // Get Firestore tokens
  const fetchFirestoreTokens = async () => {
    try {
      const tokenDocs = await getDocs(collection(db, "tokens"));
      console.log(
        "Firestore tokens raw:",
        tokenDocs.docs.map((doc) => doc.data())
      );
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

  // Get token state from factory contract
  const getTokenState = async (tokenAddress: string) => {
    if (!publicClient) throw new Error("Public client not initialized");

    try {
      const data = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "getTokenState",
        args: [tokenAddress],
      });

      console.log(`Token ${tokenAddress} state:`, data);
      return Number(data);
    } catch (err) {
      console.error(`Error getting state for token ${tokenAddress}:`, err);
      throw err;
    }
  };

  // Get token collateral from factory contract
  const getTokenCollateral = async (tokenAddress: string) => {
    if (!publicClient) throw new Error("Public client not initialized");

    try {
      const data = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "collateral",
        args: [tokenAddress],
      });

      console.log(`Token ${tokenAddress} collateral:`, data);
      return formatEther(data as bigint);
    } catch (err) {
      console.error(`Error getting collateral for token ${tokenAddress}:`, err);
      return "0";
    }
  };

  // Get contract tokens with user-defined range and batching
  const fetchContractTokens = async (
    fromBlock: bigint,
    toBlock: bigint | "latest"
  ) => {
    if (!publicClient) {
      console.error("Public client not initialized");
      throw new Error("Public client not initialized");
    }

    try {
      console.log("Fetching logs for factory address:", FACTORY_ADDRESS);
      console.log("Block range:", fromBlock.toString(), "to", toBlock);

      const actualToBlock =
        toBlock === "latest" ? await publicClient.getBlockNumber() : toBlock;
      const BATCH_SIZE = BigInt(batchSize);
      const allLogs = [];

      const totalBlocks = Number(actualToBlock - fromBlock + 1n);
      const totalBatches = Math.ceil(totalBlocks / Number(BATCH_SIZE));
      let currentBatch = 0;

      let currentFromBlock = fromBlock;

      while (currentFromBlock <= actualToBlock) {
        // Check if cancel was requested
        if (cancelRequested) {
          console.log("Search cancelled by user");
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
          `Fetching batch ${currentBatch}/${totalBatches}: blocks ${currentFromBlock} to ${currentToBlock}`
        );

        try {
          const logs = await publicClient.getLogs({
            address: FACTORY_ADDRESS,
            event: parseAbiItem(
              "event TokenCreated(address indexed tokenAddress, string name, string symbol, string imageUrl, address creator, uint256 fundingGoal, address burnManager)"
            ),
            fromBlock: currentFromBlock,
            toBlock: currentToBlock,
          });

          allLogs.push(...logs);
          console.log(
            `Found ${logs.length} logs in batch ${currentBatch}. Total so far: ${allLogs.length}`
          );
        } catch (batchError) {
          console.error(
            `Error fetching batch ${currentBatch} from ${currentFromBlock} to ${currentToBlock}:`,
            batchError
          );
          // Continue with next batch instead of failing completely
        }

        currentFromBlock = currentToBlock + 1n;

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setProgress(null);
      console.log(`Found ${allLogs.length} total token creation events`);

      return allLogs.map((log) => {
        try {
          const { args } = log as unknown as { args: TokenCreatedEvent };
          return {
            address: args.tokenAddress.toLowerCase(),
            name: args.name,
            symbol: args.symbol,
            imageUrl: args.imageUrl,
            creator: args.creator.toLowerCase(),
            burnManager: args.burnManager.toLowerCase(),
            fundingGoal: formatEther(args.fundingGoal),
            blockNumber: Number(log.blockNumber),
          };
        } catch (error) {
          console.error("Error decoding log:", error);
          console.log("Problematic log:", log);
          throw error;
        }
      });
    } catch (err) {
      setProgress(null);
      console.error("Error fetching contract tokens:", err);
      throw new Error(`Failed to fetch tokens from contract: ${err}`);
    }
  };

  // Compare tokens with user-defined range
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

      console.log("Starting token comparison...");
      console.log("Using factory address:", FACTORY_ADDRESS);
      console.log("Block range:", fromBlock.toString(), "to", toBlock);

      const [contractTokens, firestoreTokens] = await Promise.all([
        fetchContractTokens(fromBlock, toBlock),
        fetchFirestoreTokens(),
      ]);

      console.log("Contract tokens:", contractTokens);
      console.log("Firestore tokens:", firestoreTokens);

      if (contractTokens.length === 0) {
        setComparisons([]);
        return;
      }

      // Fetch states and collateral for all contract tokens
      const tokenDetailsPromises = contractTokens.map(async (token) => {
        try {
          const [state, collateral] = await Promise.all([
            getTokenState(token.address),
            getTokenCollateral(token.address),
          ]);

          return {
            ...token,
            state,
            collateral,
            inContract: true,
            inFirestore: firestoreTokens.some(
              (ft) => ft.address.toLowerCase() === token.address.toLowerCase()
            ),
          };
        } catch (err) {
          console.error(
            `Error fetching details for token ${token.address}:`,
            err
          );
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

      // Sort by block number (newest first)
      allComparisons.sort((a, b) => b.blockNumber - a.blockNumber);

      console.log("Final comparisons:", allComparisons);
      setComparisons(allComparisons);
    } catch (err: any) {
      console.error("Error comparing tokens:", err);
      if (err.message?.includes("cancelled")) {
        setError("Search was cancelled");
      } else {
        setError(`Failed to load token comparisons: ${err}`);
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

  // Function to restore a token to Firestore
  const handleRestoreToken = async (token: TokenComparison) => {
    try {
      console.log("Restoring token to Firestore:", token);

      await setDoc(doc(db, "tokens", token.address), {
        name: token.name,
        symbol: token.symbol,
        address: token.address,
        creator: token.creator,
        imageUrl: token.imageUrl,
        burnManager: token.burnManager,
        createdAt: new Date().toISOString(),
        currentState: token.state,
        collateral: token.collateral,
        fundingGoal: token.fundingGoal,
        statistics: {
          totalSupply: "0",
          currentPrice: "0",
          volumeETH: "0",
          tradeCount: 0,
          uniqueHolders: 0,
        },
        blockNumber: token.blockNumber,
      });

      console.log("Token restored successfully");

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
        <h1 className="text-3xl font-bold mb-6">Token Restore Interface</h1>

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
                <span>Processing batches...</span>
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
        {!loading && comparisons.length === 0 && !error && (
          <Card className="p-8 text-center text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No tokens found in the specified range.</p>
            <p className="text-sm">
              Try adjusting your search parameters or expanding the block range.
            </p>
          </Card>
        )}

        {comparisons.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Found {comparisons.length} Token
              {comparisons.length !== 1 ? "s" : ""}
            </h2>

            {comparisons.map((token) => (
              <Card key={token.address} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold">
                        {token.name} ({token.symbol})
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
                          <strong>Address:</strong>{" "}
                          <code className="bg-gray-100 px-1 rounded text-xs">
                            {token.address}
                          </code>
                        </p>
                        <p>
                          <strong>Block:</strong>{" "}
                          {token.blockNumber.toLocaleString()}
                        </p>
                        <p>
                          <strong>State:</strong> {token.state}
                        </p>
                        <p>
                          <strong>Collateral:</strong> {token.collateral} AVAX
                        </p>
                      </div>
                      <div>
                        <p>
                          <strong>Funding Goal:</strong> {token.fundingGoal}{" "}
                          AVAX
                        </p>
                        <p>
                          <strong>Creator:</strong>{" "}
                          <code className="bg-gray-100 px-1 rounded text-xs">
                            {token.creator}
                          </code>
                        </p>
                        <p>
                          <strong>Burn Manager:</strong>{" "}
                          <code className="bg-gray-100 px-1 rounded text-xs">
                            {token.burnManager}
                          </code>
                        </p>
                      </div>
                    </div>
                  </div>

                  {!token.inFirestore && (
                    <Button
                      onClick={() => handleRestoreToken(token)}
                      variant="default"
                      className="ml-4"
                    >
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
