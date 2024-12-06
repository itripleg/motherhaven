"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { FACTORY_ADDRESS, FACTORY_ABI, TokenCreatedEvent } from "@/types";
import { formatEther, parseAbiItem } from "viem";
import { usePublicClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/craft";

const STARTING_BLOCK = 36999988n;

interface TokenComparison {
  address: string;
  name: string;
  symbol: string;
  creator: string;
  imageUrl: string;
  burnManager: string;
  inContract: boolean;
  inFirestore: boolean;
  blockNumber: number;
}

export default function RestoreTokens() {
  const [comparisons, setComparisons] = useState<TokenComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

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

  // Get contract tokens
  const fetchContractTokens = async () => {
    if (!publicClient) {
      console.error("Public client not initialized");
      throw new Error("Public client not initialized");
    }

    try {
      console.log("Fetching logs for factory address:", FACTORY_ADDRESS);
      console.log("Starting from block:", STARTING_BLOCK.toString());

      const currentBlock = await publicClient.getBlockNumber();
      console.log("Current block:", currentBlock);

      const logs = await publicClient.getLogs({
        address: FACTORY_ADDRESS,
        event: parseAbiItem(
          "event TokenCreated(address indexed tokenAddress, string name, string symbol, string imageUrl, address creator, address burnManager)"
        ),
        fromBlock: STARTING_BLOCK,
        toBlock: "latest",
      });

      console.log(`Found ${logs.length} token creation events`);
      console.log("Raw logs from contract:", logs);

      return logs.map((log) => {
        try {
          const { args } = log as unknown as { args: TokenCreatedEvent };
          return {
            address: args.tokenAddress.toLowerCase(),
            name: args.name,
            symbol: args.symbol,
            imageUrl: args.imageUrl,
            creator: args.creator.toLowerCase(),
            burnManager: args.burnManager.toLowerCase(),
            blockNumber: Number(log.blockNumber),
          };
        } catch (error) {
          console.error("Error decoding log:", error);
          console.log("Problematic log:", log);
          throw error;
        }
      });
    } catch (err) {
      console.error("Error fetching contract tokens:", err);
      throw new Error(`Failed to fetch tokens from contract: ${err}`);
    }
  };

  // Compare tokens
  useEffect(() => {
    const compareTokens = async () => {
      if (!publicClient) {
        setError("Waiting for network connection...");
        return;
      }

      try {
        setLoading(true);
        console.log("Starting token comparison...");
        console.log("Using factory address:", FACTORY_ADDRESS);

        const [contractTokens, firestoreTokens] = await Promise.all([
          fetchContractTokens(),
          fetchFirestoreTokens(),
        ]);

        console.log("Contract tokens:", contractTokens);
        console.log("Firestore tokens:", firestoreTokens);

        const allComparisons = contractTokens.map((token) => {
          const isInFirestore = firestoreTokens.some(
            (ft) => ft.address.toLowerCase() === token.address.toLowerCase()
          );
          console.log(`Token ${token.address} in Firestore: ${isInFirestore}`);

          return {
            ...token,
            inContract: true,
            inFirestore: isInFirestore,
          };
        });

        // Sort by block number (newest first)
        allComparisons.sort((a, b) => b.blockNumber - a.blockNumber);

        console.log("Final comparisons:", allComparisons);
        setComparisons(allComparisons);
      } catch (err) {
        console.error("Error comparing tokens:", err);
        setError(`Failed to load token comparisons: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    compareTokens();
  }, [publicClient]);

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
        currentState: "TRADING",
        collateral: "0",
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

  if (!publicClient) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div>Connecting to network...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse">Loading tokens...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        <p>Error encountered:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <Container>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Token Restore Interface</h1>
        <div className="mb-4 text-sm">
          <p>Factory Address: {FACTORY_ADDRESS}</p>
          <p>Starting Block: {STARTING_BLOCK.toString()}</p>
        </div>
        {comparisons.length === 0 ? (
          <div className="text-center text-gray-500">No tokens found</div>
        ) : (
          <div className="grid gap-4">
            {comparisons.map((token) => (
              <Card key={token.address} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">
                      {token.name} ({token.symbol})
                    </h3>
                    <p className="text-sm text-gray-500">
                      Address: {token.address}
                    </p>
                    <p className="text-sm text-gray-500">
                      Created at block: {token.blockNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      Burn Manager: {token.burnManager}
                    </p>
                    <p className="text-sm text-gray-500">
                      Creator: {token.creator}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span
                        className={
                          token.inContract ? "text-green-500" : "text-red-500"
                        }
                      >
                        {token.inContract
                          ? "✓ In Contract"
                          : "✗ Not in Contract"}
                      </span>
                      <span
                        className={
                          token.inFirestore ? "text-green-500" : "text-red-500"
                        }
                      >
                        {token.inFirestore
                          ? "✓ In Firestore"
                          : "✗ Not in Firestore"}
                      </span>
                    </div>
                  </div>
                  {!token.inFirestore && (
                    <Button
                      onClick={() => handleRestoreToken(token)}
                      variant="outline"
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
