"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { FACTORY_ADDRESS, FACTORY_ABI, TokenCreatedEvent } from "@/types";
import {
  formatEther,
  createPublicClient,
  http,
  getContract,
  parseAbiItem,
  Log,
} from "viem";
import { sepolia } from "viem/chains";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/craft";

// Create a public client
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_TESTNET_RPC),
});

interface TokenComparison {
  address: string;
  name: string;
  symbol: string;
  creator: string;
  imageUrl: string;
  fundingGoal: string;
  inContract: boolean;
  inFirestore: boolean;
}

export default function RestoreTokens() {
  const [comparisons, setComparisons] = useState<TokenComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Get contract tokens
  const fetchContractTokens = async () => {
    try {
      // Create event filter for TokenCreated events
      const logs = await publicClient.getLogs({
        address: FACTORY_ADDRESS,
        event: parseAbiItem(
          "event TokenCreated(address indexed tokenAddress, string name, string symbol, string imageUrl, address creator, uint256 fundingGoal)"
        ),
        fromBlock: 0n,
        toBlock: "latest",
      });

      // Parse the logs
      return logs.map((log) => {
        const { args } = log as unknown as { args: TokenCreatedEvent };
        return {
          address: args.tokenAddress.toLowerCase(),
          name: args.name,
          symbol: args.symbol,
          imageUrl: args.imageUrl,
          creator: args.creator.toLowerCase(),
          fundingGoal: formatEther(args.fundingGoal),
        };
      });
    } catch (err) {
      console.error("Error fetching contract tokens:", err);
      throw new Error("Failed to fetch tokens from contract");
    }
  };

  // Compare tokens
  useEffect(() => {
    const compareTokens = async () => {
      try {
        setLoading(true);
        console.log("Fetching tokens...");

        const [contractTokens, firestoreTokens] = await Promise.all([
          fetchContractTokens(),
          fetchFirestoreTokens(),
        ]);

        console.log("Contract tokens:", contractTokens);
        console.log("Firestore tokens:", firestoreTokens);

        const allComparisons = contractTokens.map((token) => ({
          ...token,
          inContract: true,
          inFirestore: firestoreTokens.some(
            (ft) => ft.address.toLowerCase() === token.address.toLowerCase()
          ),
        }));

        console.log("Comparisons:", allComparisons);
        setComparisons(allComparisons);
      } catch (err) {
        console.error("Error comparing tokens:", err);
        setError("Failed to load token comparisons");
      } finally {
        setLoading(false);
      }
    };

    compareTokens();
  }, []);

  // Function to restore a token to Firestore
  const handleRestoreToken = async (token: TokenComparison) => {
    try {
      await setDoc(doc(db, "tokens", token.address), {
        name: token.name,
        symbol: token.symbol,
        address: token.address,
        creator: token.creator,
        imageUrl: token.imageUrl,
        fundingGoal: token.fundingGoal,
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
      });

      setComparisons((prev) =>
        prev.map((t) =>
          t.address === token.address ? { ...t, inFirestore: true } : t
        )
      );
    } catch (err) {
      console.error("Error restoring token:", err);
      setError(`Failed to restore token ${token.address}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse">Loading tokens...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <Container>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Token Restore Interface</h1>
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
                    <p className="text-sm text-gray-500">{token.address}</p>
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
