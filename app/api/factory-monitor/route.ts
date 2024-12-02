// /app/api/factory-monitor/route.ts

import { NextResponse } from "next/server";
import {
  collection,
  addDoc,
  setDoc,
  doc,
  updateDoc,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/firebase";
import { decodeEventLog, formatEther, parseAbiItem } from "viem";
import {
  TokenCreatedEvent,
  TokensPurchasedEvent,
  TokensSoldEvent,
  TokenState,
  TradingHaltedEvent,
} from "@/types";

// import { FACTORY_ADDRESS } from "@/types";
const FACTORY_ADDRESS = "0x56aec6B1D4Ea8Ee0B35B526e216aDd6e8268b1eA";

const EVENTS = {
  TokenCreated: {
    abi: parseAbiItem(
      "event TokenCreated(address indexed tokenAddress, string name, string symbol, string imageUrl, address creator, uint256 fundingGoal)"
    ),
    signature:
      "0x72d6a46765aafdd4100a7143409417ecff26241bbeddd3f3ac10adcbd636b83b",
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
} as const;

// Collection names
const COLLECTIONS = {
  TOKENS: "tokens",
  USERS: "users",
  TRADES: "trades",
};

async function handleTokenCreated(
  args: TokenCreatedEvent,
  timestamp: string,
  blockNumber: number,
  transactionHash: string
) {
  const tokenAddress = args.tokenAddress.toLowerCase();
  const creatorAddress = args.creator.toLowerCase();

  console.log("\n=== TOKEN CREATION DETAILS ===");
  console.log("Token Address:", tokenAddress);
  console.log("Name:", args.name);
  console.log("Symbol:", args.symbol);
  console.log("Creator:", creatorAddress);
  console.log("Image URL:", args.imageUrl);
  console.log("Timestamp:", timestamp);
  console.log("Block Number:", blockNumber);
  console.log("Funding Goal:", formatEther(args.fundingGoal), "ETH");
  console.log("Transaction Hash:", transactionHash);

  try {
    // Create token document
    await setDoc(doc(db, COLLECTIONS.TOKENS, tokenAddress), {
      address: tokenAddress,
      name: args.name,
      symbol: args.symbol,
      imageUrl: args.imageUrl,
      creator: creatorAddress,
      fundingGoal: formatEther(args.fundingGoal),
      createdAt: timestamp,
      currentState: TokenState.TRADING,
      collateral: "0",
      statistics: {
        totalSupply: "0",
        currentPrice: "0",
        volumeETH: "0",
        tradeCount: 0,
        uniqueHolders: 0,
      },
      blockNumber,
      transactionHash,
    });
    console.log("✅ Token document created in", COLLECTIONS.TOKENS);

    // Update user document
    await setDoc(
      doc(db, COLLECTIONS.USERS, creatorAddress),
      {
        address: creatorAddress,
        lastActive: timestamp,
        createdTokens: [
          {
            address: tokenAddress,
            name: args.name,
            symbol: args.symbol,
            imageUrl: args.imageUrl,
            fundingGoal: formatEther(args.fundingGoal),
            timestamp,
          },
        ],
      },
      { merge: true }
    );
    console.log("✅ User document updated in", COLLECTIONS.USERS);
  } catch (error) {
    console.error("❌ Database Error:", error);
    console.error("Failed to save token:", {
      token: tokenAddress,
      creator: creatorAddress,
      timestamp,
    });
    throw error;
  }
}

// Updated handleTokenTrade function with error handling
async function handleTokenTrade(
  eventType: "buy" | "sell",
  token: string,
  trader: string,
  tokenAmount: bigint,
  ethAmount: bigint,
  timestamp: string,
  blockNumber: number,
  transactionHash: string
) {
  let formattedTokenAmount: string;
  let formattedEthAmount: string;
  let pricePerToken: number;

  try {
    formattedTokenAmount = formatEther(tokenAmount);
    formattedEthAmount = formatEther(ethAmount);

    // Add validation before division
    const tokenAmountNum = Number(formattedTokenAmount);
    if (tokenAmountNum === 0) {
      throw new Error("Token amount cannot be zero");
    }

    pricePerToken = Number(formattedEthAmount) / tokenAmountNum;

    // Validate the calculated price
    if (!Number.isFinite(pricePerToken)) {
      throw new Error("Invalid price calculation");
    }
  } catch (error: any) {
    console.error("❌ Error processing amounts:", error);
    throw new Error(`Failed to process trade amounts: ${error.message}`);
  }

  console.log("\n=== TRADE DETAILS ===");
  console.log("Type:", eventType);
  console.log("Token Address:", token);
  console.log("Trader:", trader);
  console.log("Token Amount:", formattedTokenAmount);
  console.log("ETH Amount:", formattedEthAmount);
  console.log("Price per Token:", pricePerToken);
  console.log("Block Number:", blockNumber);
  console.log("Timestamp:", timestamp);
  console.log("Transaction Hash:", transactionHash);

  try {
    // Create trade document
    const tradeDoc = await addDoc(collection(db, COLLECTIONS.TRADES), {
      type: eventType,
      token: token.toLowerCase(),
      trader: trader.toLowerCase(),
      tokenAmount: tokenAmount.toString(),
      ethAmount: ethAmount.toString(),
      pricePerToken: pricePerToken.toString(),
      blockNumber,
      transactionHash,
      timestamp,
    });
    console.log(
      "✅ Trade document created in",
      COLLECTIONS.TRADES,
      "with ID:",
      tradeDoc.id
    );

    // Convert ethAmount to number for increment
    const ethAmountNum = Number(formattedEthAmount);

    // Update token statistics
    await updateDoc(doc(db, COLLECTIONS.TOKENS, token.toLowerCase()), {
      collateral: increment(eventType === "buy" ? ethAmountNum : -ethAmountNum),
      "statistics.volumeETH": increment(ethAmountNum),
      "statistics.tradeCount": increment(1),
      "statistics.currentPrice": pricePerToken.toString(),
      lastTrade: {
        price: pricePerToken.toString(),
        timestamp,
        type: eventType,
      },
    });
    console.log("✅ Token statistics updated in", COLLECTIONS.TOKENS);
  } catch (error) {
    console.error("❌ Database Error:", error);
    console.error("Failed to save trade:", {
      type: eventType,
      token,
      trader,
      timestamp,
    });
    throw error;
  }
}

async function handleTradingHalted(
  token: string,
  collateral: bigint,
  timestamp: string,
  blockNumber: number
) {
  const formattedCollateral = formatEther(collateral);

  console.log("\n=== TRADING HALTED DETAILS ===");
  console.log("Token Address:", token);
  console.log("Final Collateral:", formattedCollateral);
  console.log("Block Number:", blockNumber);
  console.log("Timestamp:", timestamp);

  try {
    await updateDoc(doc(db, COLLECTIONS.TOKENS, token.toLowerCase()), {
      currentState: TokenState.HALTED,
      finalCollateral: formattedCollateral,
      haltedAt: timestamp,
      haltBlock: blockNumber,
    });
    console.log(
      "✅ Token state updated to GOAL_REACHED in",
      COLLECTIONS.TOKENS
    );
  } catch (error) {
    console.error("❌ Database Error:", error);
    console.error("Failed to update token state:", {
      token,
      collateral: formattedCollateral,
      timestamp,
    });
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event } = body;
    console.log("Event Received! Details: ", event);
    const blockInfo = event.data.block;

    console.log("\n============================");
    console.log(`📦 Processing Block #${blockInfo.number}`);
    console.log(
      `⏰ ${new Date(Number(blockInfo.timestamp) * 1000).toLocaleString()}`
    );
    console.log("============================");

    const factoryLogs = blockInfo.logs.filter(
      (log: any) =>
        log.account?.address?.toLowerCase() === FACTORY_ADDRESS.toLowerCase()
    );

    console.log(`\nFound ${factoryLogs.length} factory logs`);

    for (const log of factoryLogs) {
      const eventSignature = log.topics?.[0];
      if (!eventSignature) continue;

      console.log("\n--- Processing Log ---");
      console.log("Event Signature:", eventSignature);
      console.log("Transaction Hash:", log.transaction?.hash);

      const eventEntry = Object.entries(EVENTS).find(
        ([_, event]) => event.signature === eventSignature
      );

      if (!eventEntry) {
        console.log("⚠️ Unknown event signature");
        continue;
      }

      const [eventType, eventDef] = eventEntry;
      const timestamp = new Date(
        Number(blockInfo.timestamp) * 1000
      ).toISOString();

      console.log("Event Type:", eventType);

      try {
        const decoded = decodeEventLog({
          abi: [eventDef.abi],
          data: log.data,
          topics: log.topics,
        });

        switch (eventType) {
          case "TokenCreated": {
            const args = decoded.args as TokenCreatedEvent;
            await handleTokenCreated(
              args,
              timestamp,
              Number(blockInfo.number),
              log.transaction.hash
            );
            break;
          }

          case "TokensPurchased": {
            const args = decoded.args as TokensPurchasedEvent;
            await handleTokenTrade(
              "buy",
              args.token,
              args.buyer,
              args.amount,
              args.price,
              timestamp,
              Number(blockInfo.number),
              log.transaction.hash
            );
            break;
          }

          case "TokensSold": {
            const args = decoded.args as TokensSoldEvent;
            await handleTokenTrade(
              "sell",
              args.token,
              args.seller,
              args.tokenAmount,
              args.ethAmount,
              timestamp,
              Number(blockInfo.number),
              log.transaction.hash
            );
            break;
          }

          case "TradingHalted": {
            const args = decoded.args as TradingHaltedEvent;
            await handleTradingHalted(
              args.token,
              args.collateral,
              timestamp,
              Number(blockInfo.number)
            );
            break;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${eventType} event:`, error);
      }
    }

    return NextResponse.json({
      status: "success",
      blockNumber: blockInfo.number,
      logsProcessed: factoryLogs.length,
    });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
