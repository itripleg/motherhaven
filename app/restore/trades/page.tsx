"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { FACTORY_ADDRESS } from "@/types";
import { formatEther, createPublicClient, http, parseAbiItem, Log } from "viem";
import { sepolia } from "viem/chains";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/craft";

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_TESTNET_RPC),
});

const FACTORY_CREATION_BLOCK = 36932589n;

// Event types
interface TokensPurchasedEvent {
  token: `0x${string}`;
  buyer: `0x${string}`;
  amount: bigint;
  price: bigint;
}

interface TokensSoldEvent {
  token: `0x${string}`;
  seller: `0x${string}`;
  tokenAmount: bigint;
  ethAmount: bigint;
}

// Trade types
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
}

export default function RestoreTrades() {
  const [tokenTrades, setTokenTrades] = useState<TokenTrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContractTrades = async () => {
    try {
      const tradesByToken = new Map<string, TokenTrades>();

      // Fetch buy events
      const buyLogs = await publicClient.getLogs({
        address: FACTORY_ADDRESS,
        event: parseAbiItem(
          "event TokensPurchased(address indexed token, address indexed buyer, uint256 amount, uint256 price)"
        ),
        fromBlock: FACTORY_CREATION_BLOCK,
        toBlock: "latest",
      });

      console.log("Found buy events:", buyLogs.length);

      // Process buy events
      for (const log of buyLogs) {
        if (!log.args) continue;

        const args = log.args as TokensPurchasedEvent;
        const blockNumber = log.blockNumber;
        const transactionHash = log.transactionHash;
        const tokenAddress = args.token.toLowerCase();

        if (!tradesByToken.has(tokenAddress)) {
          tradesByToken.set(tokenAddress, {
            address: tokenAddress,
            trades: [],
            inContract: true,
            inFirestore: false,
          });
        }

        const block = await publicClient.getBlock({ blockNumber });

        const trade: FirestoreTrade = {
          blockNumber: Number(blockNumber),
          ethAmount: args.price.toString(),
          tokenAmount: args.amount.toString(),
          pricePerToken: formatEther(args.price),
          timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
          token: tokenAddress,
          trader: args.buyer.toLowerCase(),
          transactionHash,
          type: "buy",
        };

        console.log("Processing buy trade:", trade);
        tradesByToken.get(tokenAddress)!.trades.push(trade);
      }

      // Fetch sell events
      const sellLogs = await publicClient.getLogs({
        address: FACTORY_ADDRESS,
        event: parseAbiItem(
          "event TokensSold(address indexed token, address indexed seller, uint256 tokenAmount, uint256 ethAmount)"
        ),
        fromBlock: FACTORY_CREATION_BLOCK,
        toBlock: "latest",
      });

      console.log("Found sell events:", sellLogs.length);

      // Process sell events
      for (const log of sellLogs) {
        if (!log.args) continue;

        const args = log.args as TokensSoldEvent;
        const blockNumber = log.blockNumber;
        const transactionHash = log.transactionHash;
        const tokenAddress = args.token.toLowerCase();

        if (!tradesByToken.has(tokenAddress)) {
          tradesByToken.set(tokenAddress, {
            address: tokenAddress,
            trades: [],
            inContract: true,
            inFirestore: false,
          });
        }

        const block = await publicClient.getBlock({ blockNumber });

        const trade: FirestoreTrade = {
          blockNumber: Number(blockNumber),
          ethAmount: args.ethAmount.toString(),
          tokenAmount: args.tokenAmount.toString(),
          pricePerToken: formatEther(args.ethAmount),
          timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
          token: tokenAddress,
          trader: args.seller.toLowerCase(),
          transactionHash,
          type: "sell",
        };

        console.log("Processing sell trade:", trade);
        tradesByToken.get(tokenAddress)!.trades.push(trade);
      }

      return Array.from(tradesByToken.values());
    } catch (err) {
      console.error("Error fetching contract trades:", err);
      throw new Error("Failed to fetch trades from contract");
    }
  };

  const handleRestoreTrades = async (token: TokenTrades) => {
    try {
      console.log(
        `Starting restore for token ${token.address} with ${token.trades.length} trades`
      );

      // Reference the top-level trades collection
      const tradesRef = collection(db, "trades");
      const existingTradesSnapshot = await getDocs(tradesRef);
      const existingTradeHashes = new Set(
        existingTradesSnapshot.docs.map((doc) => doc.data().transactionHash)
      );

      console.log(`Found ${existingTradeHashes.size} existing trades`);

      // Filter out trades that already exist
      const newTrades = token.trades.filter(
        (trade) => !existingTradeHashes.has(trade.transactionHash)
      );

      console.log(`Processing ${newTrades.length} new trades`);

      for (let i = 0; i < newTrades.length; i++) {
        const trade = newTrades[i];
        try {
          console.log(`Storing trade ${i + 1}/${newTrades.length}:`, trade);

          // Write to top-level trades collection
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
        `Successfully restored all new trades for token ${token.address}`
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

  useEffect(() => {
    const loadTrades = async () => {
      try {
        setLoading(true);
        const trades = await fetchContractTrades();
        setTokenTrades(trades);
      } catch (err) {
        console.error("Error loading trades:", err);
        setError("Failed to load trade data");
      } finally {
        setLoading(false);
      }
    };

    loadTrades();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse">Loading trade history...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <Container>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">
          Trade History Restore Interface
        </h1>
        {tokenTrades.map((token) => (
          <Card key={token.address} className="p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">{token.address}</h3>
                <p className="text-sm">
                  Number of trades: {token.trades.length}
                </p>
              </div>
              {!token.inFirestore && (
                <Button onClick={() => handleRestoreTrades(token)}>
                  Restore Trades
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
}
