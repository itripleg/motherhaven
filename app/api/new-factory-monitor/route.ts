// /app/api/new-factory-monitor/route.ts

import { NextResponse } from "next/server";
import { collection, setDoc, doc, increment } from "firebase/firestore";
import { db } from "@/firebase";
import { decodeEventLog, formatEther, parseAbiItem } from "viem";
import {
  TokenCreatedEvent,
  TokensPurchasedEvent,
  TokensSoldEvent,
  TokenState,
  TradingHaltedEvent,
  FACTORY_ADDRESS,
} from "@/types";

const EVENTS = {
  TokenCreated: {
    abi: parseAbiItem(
      "event TokenCreated(address indexed tokenAddress, string name, string symbol, string imageUrl, address creator, uint256 fundingGoal, address burnManager)"
    ),
    signature:
      "0x0e8cc4b226b8752d338d6e23e7e14f71e6dd2480faf8bfae44848d7fc596e3bf",
  },
  TokensPurchased: {
    abi: parseAbiItem(
      "event TokensPurchased(address indexed token, address indexed buyer, uint256 amount, uint256 price, uint256 fee)"
    ),
    signature:
      "0x377aadedb6b2a771959584d10a6a36eccb5f56b4eb3a48525f76108d2660d8d4",
  },
  TokensSold: {
    abi: parseAbiItem(
      "event TokensSold(address indexed token, address indexed seller, uint256 tokenAmount, uint256 ethAmount, uint256 fee)"
    ),
    signature:
      "0xa0fe9740856690637d999c103293d3c823fc3b81443c34c6004bb582ab4b6166",
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
  const fundingGoal = formatEther(args.fundingGoal);

  try {
    // Store only immutable token data
    const tokenData = {
      address: tokenAddress,
      name: args.name,
      symbol: args.symbol,
      imageUrl: args.imageUrl,
      creator: creatorAddress,
      burnManager: args.burnManager,
      fundingGoal,
      createdAt: timestamp,
      blockNumber,
      transactionHash,
    };

    await setDoc(doc(db, COLLECTIONS.TOKENS, tokenAddress), tokenData);
    console.log("✅ Token document created in", COLLECTIONS.TOKENS);

    // Update user's created tokens list
    const userData = {
      address: creatorAddress,
      lastActive: timestamp,
      createdTokens: [
        {
          address: tokenAddress,
          name: args.name,
          symbol: args.symbol,
          imageUrl: args.imageUrl,
          fundingGoal,
          timestamp,
        },
      ],
    };

    await setDoc(doc(db, COLLECTIONS.USERS, creatorAddress), userData, {
      merge: true,
    });
    console.log("✅ User document updated in", COLLECTIONS.USERS);
  } catch (error) {
    console.error("❌ Database Error:", error);
    throw error;
  }
}

async function handleTokenTrade(
  eventType: "buy" | "sell",
  token: string,
  trader: string,
  tokenAmount: bigint,
  ethAmount: bigint,
  fee: bigint,
  timestamp: string,
  blockNumber: number,
  transactionHash: string
) {
  let formattedTokenAmount: string;
  let formattedEthAmount: string;
  let formattedFee: string;
  let pricePerToken: number;

  try {
    formattedTokenAmount = formatEther(tokenAmount);
    formattedEthAmount = formatEther(ethAmount);
    formattedFee = formatEther(fee);

    const tokenAmountNum = Number(formattedTokenAmount);
    if (tokenAmountNum === 0) {
      throw new Error("Token amount cannot be zero");
    }

    pricePerToken = Number(formattedEthAmount) / tokenAmountNum;

    if (!Number.isFinite(pricePerToken)) {
      throw new Error("Invalid price calculation");
    }
  } catch (error: any) {
    console.error("❌ Error processing amounts:", error);
    throw new Error(`Failed to process trade amounts: ${error.message}`);
  }

  try {
    // Store trade data in Firestore
    const tradeData = {
      type: eventType,
      token: token.toLowerCase(),
      trader: trader.toLowerCase(),
      tokenAmount: tokenAmount.toString(),
      ethAmount: ethAmount.toString(),
      fee: fee.toString(),
      pricePerToken: pricePerToken.toString(),
      blockNumber,
      transactionHash,
      timestamp,
    };

    // Create trade document with auto-generated ID
    const tradeRef = doc(collection(db, COLLECTIONS.TRADES));
    await setDoc(tradeRef, tradeData);
    console.log("✅ Trade document created in", COLLECTIONS.TRADES);
  } catch (error) {
    console.error("❌ Database Error:", error);
    throw error;
  }
}

async function handleTradingHalted(
  token: string,
  collateral: bigint,
  timestamp: string,
  blockNumber: number
) {
  try {
    // Store the halt event in trades collection for historical record
    const haltData = {
      type: "halt",
      token: token.toLowerCase(),
      collateral: collateral.toString(),
      timestamp,
      blockNumber,
    };

    const tradeRef = doc(collection(db, COLLECTIONS.TRADES));
    await setDoc(tradeRef, haltData);
    console.log("✅ Halt event recorded in", COLLECTIONS.TRADES);
  } catch (error) {
    console.error("❌ Database Error:", error);
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
      if (!eventSignature) {
        console.log("⚠️ Skipping log - no event signature");
        continue;
      }

      console.log("\n--- Processing Log ---");
      console.log("Event Signature:", eventSignature);
      console.log("Transaction Hash:", log.transaction?.hash);

      const eventEntry = Object.entries(EVENTS).find(
        ([_, event]) => event.signature === eventSignature
      );

      if (!eventEntry) {
        console.log("⚠️ Unknown event signature:", eventSignature);
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
              args.fee,
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
              args.fee,
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
        console.error("Event processing failed for log:", {
          eventType,
          signature: eventSignature,
          transactionHash: log.transaction?.hash,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      status: "success",
      blockNumber: blockInfo.number,
      logsProcessed: factoryLogs.length,
    });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    console.error("Request processing failed:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
