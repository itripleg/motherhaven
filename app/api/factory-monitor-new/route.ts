// /app/api/factory-monitor/route.ts

import { NextResponse } from "next/server";
import {
  collection,
  addDoc,
  setDoc,
  doc,
  updateDoc,
  increment,
  getDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/firebase";
import { decodeEventLog, formatEther, parseAbiItem } from "viem";
import { FACTORY_ADDRESS } from "@/types";

// Event definitions with correct signatures
const EVENTS = {
  TokenCreated: {
    abi: parseAbiItem(
      "event TokenCreated(address indexed tokenAddress, string name, string ticker, address creator)"
    ),
    signature:
      "0x6596c1670eb3390048d23721809c3da5d3f531375ac0e2cab0f77a808ed64331",
  },
  TokensPurchased: {
    abi: parseAbiItem(
      "event TokensPurchased(address indexed token, address indexed buyer, uint256 amount, uint256 price)"
    ),
    signature:
      "0x6faf93231a456e552dbc9961f58d9713ee4f2e69d15f1975b050ef0911053a7b",
  },
  TokensSold: {
    abi: parseAbiItem(
      "event TokensSold(address indexed token, address indexed seller, uint256 tokenAmount, uint256 ethAmount)"
    ),
    signature:
      "0x697c42d55a5e1fed3f464ec6f38b32546a0bd368dc8068b065c67566d73f3290",
  },
  TradingHalted: {
    abi: parseAbiItem(
      "event TradingHalted(address indexed token, uint256 collateral)"
    ),
    signature:
      "0xb88b7874f043c64f2f74ff66df3ca7559f7253821a4f862a4a7af74e9c147170",
  },
};

function formatAmount(amount: bigint): string {
  return Number(formatEther(amount)).toFixed(18);
}

async function ensureUserExists(address: string) {
  const userRef = doc(db, "users", address.toLowerCase());
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      address: address.toLowerCase(),
      firstSeen: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      totalTrades: 0,
      createdTokens: [],
      statistics: {
        totalVolumeETH: "0",
        totalTokensBought: "0",
        totalTokensSold: "0",
      },
    });
  }
  return userRef;
}

async function updateTokenStatistics(tokenAddress: string, tradeData: any) {
  const tokenRef = doc(db, "tokens", tokenAddress.toLowerCase());

  await runTransaction(db, async (transaction) => {
    const tokenDoc = await transaction.get(tokenRef);
    if (!tokenDoc.exists()) return;

    const currentStats = tokenDoc.data().statistics || {
      totalSupply: "0",
      currentPrice: "0",
      volumeETH: "0",
      tradeCount: 0,
      uniqueHolders: 0,
    };

    const newStats = {
      ...currentStats,
      volumeETH: (
        Number(currentStats.volumeETH) + Number(tradeData.ethAmount)
      ).toString(),
      tradeCount: currentStats.tradeCount + 1,
      currentPrice: tradeData.pricePerToken,
    };

    transaction.update(tokenRef, {
      statistics: newStats,
      lastTrade: {
        price: tradeData.pricePerToken,
        timestamp: tradeData.timestamp,
        type: tradeData.type,
      },
    });
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event } = body;
    const blockInfo = event.data.block;

    console.log(`📦 Processing Block #${blockInfo.number}`);

    for (const log of event.data.block.logs) {
      if (log.account.address.toLowerCase() !== FACTORY_ADDRESS.toLowerCase())
        continue;

      const eventSignature = log.topics[0];

      try {
        // Handle TokenCreated
        if (eventSignature === EVENTS.TokenCreated.signature) {
          const decoded = decodeEventLog({
            abi: [EVENTS.TokenCreated.abi],
            data: log.data,
            topics: log.topics,
          });

          const timestamp = new Date(
            Number(blockInfo.timestamp) * 1000
          ).toISOString();
          const tokenAddress = decoded.args.tokenAddress.toLowerCase();
          const creatorAddress = decoded.args.creator.toLowerCase();

          // Create token document
          await setDoc(doc(db, "tokens", tokenAddress), {
            address: tokenAddress,
            name: decoded.args.name,
            symbol: decoded.args.ticker,
            creator: creatorAddress,
            createdAt: timestamp,
            currentState: "TRADING",
            collateral: "0",
            statistics: {
              totalSupply: "0",
              currentPrice: "0",
              volumeETH: "0",
              tradeCount: 0,
              uniqueHolders: 0,
            },
            blockNumber: Number(blockInfo.number),
            transactionHash: log.transaction.hash,
          });

          // Update creator's document
          const userRef = await ensureUserExists(creatorAddress);
          await updateDoc(userRef, {
            lastActive: timestamp,
            createdTokens: arrayUnion({
              address: tokenAddress,
              name: decoded.args.name,
              symbol: decoded.args.ticker,
              timestamp: timestamp,
            }),
          });
        }

        // Handle TokensPurchased
        else if (eventSignature === EVENTS.TokensPurchased.signature) {
          const decoded = decodeEventLog({
            abi: [EVENTS.TokensPurchased.abi],
            data: log.data,
            topics: log.topics,
          });

          const timestamp = new Date(
            Number(blockInfo.timestamp) * 1000
          ).toISOString();
          const tokenAddress = decoded.args.token.toLowerCase();
          const buyerAddress = decoded.args.buyer.toLowerCase();

          const tradeData = {
            type: "buy",
            token: {
              address: tokenAddress,
            },
            trader: buyerAddress,
            tokenAmount: formatAmount(decoded.args.amount),
            ethAmount: formatAmount(decoded.args.price),
            pricePerToken:
              formatAmount(decoded.args.price) /
              formatAmount(decoded.args.amount),
            blockNumber: Number(blockInfo.number),
            transactionHash: log.transaction.hash,
            timestamp: timestamp,
          };

          // Create trade document
          await addDoc(collection(db, "trades"), tradeData);

          // Update token statistics
          await updateTokenStatistics(tokenAddress, tradeData);

          // Update token collateral
          await updateDoc(doc(db, "tokens", tokenAddress), {
            collateral: increment(tradeData.ethAmount),
          });

          // Update user statistics
          const userRef = await ensureUserExists(buyerAddress);
          await updateDoc(userRef, {
            lastActive: timestamp,
            totalTrades: increment(1),
            "statistics.totalVolumeETH": increment(tradeData.ethAmount),
            "statistics.totalTokensBought": increment(tradeData.tokenAmount),
          });
        }

        // Handle TokensSold
        else if (eventSignature === EVENTS.TokensSold.signature) {
          const decoded = decodeEventLog({
            abi: [EVENTS.TokensSold.abi],
            data: log.data,
            topics: log.topics,
          });

          const timestamp = new Date(
            Number(blockInfo.timestamp) * 1000
          ).toISOString();
          const tokenAddress = decoded.args.token.toLowerCase();
          const sellerAddress = decoded.args.seller.toLowerCase();

          const tradeData = {
            type: "sell",
            token: {
              address: tokenAddress,
            },
            trader: sellerAddress,
            tokenAmount: formatAmount(decoded.args.tokenAmount),
            ethAmount: formatAmount(decoded.args.ethAmount),
            pricePerToken:
              formatAmount(decoded.args.ethAmount) /
              formatAmount(decoded.args.tokenAmount),
            blockNumber: Number(blockInfo.number),
            transactionHash: log.transaction.hash,
            timestamp: timestamp,
          };

          // Create trade document
          await addDoc(collection(db, "trades"), tradeData);

          // Update token statistics
          await updateTokenStatistics(tokenAddress, tradeData);

          // Update token collateral
          await updateDoc(doc(db, "tokens", tokenAddress), {
            collateral: increment(-tradeData.ethAmount),
          });

          // Update user statistics
          const userRef = await ensureUserExists(sellerAddress);
          await updateDoc(userRef, {
            lastActive: timestamp,
            totalTrades: increment(1),
            "statistics.totalVolumeETH": increment(tradeData.ethAmount),
            "statistics.totalTokensSold": increment(tradeData.tokenAmount),
          });
        }

        // Handle TradingHalted
        else if (eventSignature === EVENTS.TradingHalted.signature) {
          const decoded = decodeEventLog({
            abi: [EVENTS.TradingHalted.abi],
            data: log.data,
            topics: log.topics,
          });

          const timestamp = new Date(
            Number(blockInfo.timestamp) * 1000
          ).toISOString();
          const tokenAddress = decoded.args.token.toLowerCase();

          await updateDoc(doc(db, "tokens", tokenAddress), {
            currentState: "GOAL_REACHED",
            finalCollateral: formatAmount(decoded.args.collateral),
            haltedAt: timestamp,
            haltBlock: Number(blockInfo.number),
          });
        }
      } catch (error: any) {
        console.error("Error processing event:", {
          error: error.message,
          eventSignature,
          tx: log.transaction.hash,
        });
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
