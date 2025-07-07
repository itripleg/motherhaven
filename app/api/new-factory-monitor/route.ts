// /app/api/new-factory-monitor/route.ts

import { NextResponse } from "next/server";
import { collection, setDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { decodeEventLog, formatEther, createPublicClient, http } from "viem";
import { avalancheFuji } from "viem/chains"; // Use the correct chain for your network
import {
  TokenCreatedEvent,
  TokensPurchasedEvent,
  TokensSoldEvent,
  TokenState,
  TradingHaltedEvent,
  TradingResumedEvent,
  TradingAutoResumedEvent,
} from "@/types";

// Import from the updated contracts types
import {
  FACTORY_ADDRESS,
  FACTORY_EVENTS,
  FACTORY_CONSTANTS,
  FACTORY_ABI,
} from "@/types/contracts";

// Create viem client for reading contract state - use your actual RPC URL
const publicClient = createPublicClient({
  chain: avalancheFuji, // Make sure this matches your network
  transport: http(
    process.env.RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
  ), // Use server-side env var
});

// Collection names
const COLLECTIONS = {
  TOKENS: "tokens",
  USERS: "users",
  TRADES: "trades",
};

/**
 * Reads the current collateral and virtual supply from the contract
 * Falls back to null if contract read fails
 */
async function getContractTokenData(tokenAddress: string) {
  try {
    console.log("🔍 Attempting to read contract data for:", tokenAddress);
    console.log("🔍 Using factory address:", FACTORY_ADDRESS);
    console.log("🔍 Using RPC:", process.env.RPC_URL || "fallback RPC");

    const [collateral, virtualSupply, lastPrice] = await Promise.all([
      publicClient.readContract({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "collateral",
        args: [tokenAddress as `0x${string}`],
      }),
      publicClient.readContract({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "virtualSupply",
        args: [tokenAddress as `0x${string}`],
      }),
      publicClient.readContract({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "lastPrice",
        args: [tokenAddress as `0x${string}`],
      }),
    ]);

    console.log("✅ Contract read successful:", {
      collateral: collateral.toString(),
      virtualSupply: virtualSupply.toString(),
      lastPrice: lastPrice.toString(),
    });

    return {
      collateral: formatEther(collateral as bigint),
      virtualSupply: formatEther(virtualSupply as bigint),
      lastPrice: formatEther(lastPrice as bigint),
      success: true,
    };
  } catch (error) {
    console.error(
      "❌ Error reading contract data, will use calculated values:"
    );
    console.error("Error details:", error);
    return {
      collateral: null,
      virtualSupply: null,
      lastPrice: null,
      success: false,
    };
  }
}

async function handleTokenCreated(
  args: TokenCreatedEvent,
  timestamp: string,
  blockNumber: number,
  transactionHash: string
) {
  const tokenAddress = args.tokenAddress.toLowerCase();
  const creatorAddress = args.creator.toLowerCase();
  const fundingGoal = formatEther(args.fundingGoal);

  console.log("\n=== TOKEN CREATION DETAILS ===");
  console.log("Token Address:", tokenAddress);
  console.log("Name:", args.name);
  console.log("Symbol:", args.symbol);
  console.log("Creator:", creatorAddress);
  console.log("Image URL:", args.imageUrl);
  console.log("Timestamp:", timestamp);
  console.log("Block Number:", blockNumber);
  console.log("Funding Goal:", fundingGoal, "ETH");
  console.log("Burn Manager:", args.burnManager);
  console.log("Creator Tokens:", formatEther(args.creatorTokens));
  console.log("ETH Spent:", formatEther(args.ethSpent));
  console.log("Transaction Hash:", transactionHash);

  try {
    const tokenData = {
      address: tokenAddress,
      name: args.name,
      symbol: args.symbol,
      imageUrl: args.imageUrl,
      // description is now optional - don't set empty string
      creator: creatorAddress,
      burnManager: args.burnManager,
      fundingGoal,
      createdAt: timestamp,
      currentState: TokenState.TRADING,
      collateral: formatEther(args.ethSpent), // Initialize with ETH spent during creation
      virtualSupply: formatEther(args.creatorTokens), // Start with tokens created (could be 0)
      totalSupply: formatEther(args.creatorTokens), // Initially same as virtualSupply
      lastPrice:
        args.creatorTokens > 0n
          ? (
              Number(formatEther(args.ethSpent)) /
              Number(formatEther(args.creatorTokens))
            ).toString()
          : FACTORY_CONSTANTS.INITIAL_PRICE, // Calculate initial price or use default

      // Factory constants (from types/contracts.ts - matches your Token interface)
      decimals: FACTORY_CONSTANTS.DECIMALS,
      maxSupply: FACTORY_CONSTANTS.MAX_SUPPLY,
      initialPrice: FACTORY_CONSTANTS.INITIAL_PRICE,
      minPurchase: FACTORY_CONSTANTS.MIN_PURCHASE,
      maxPurchase: FACTORY_CONSTANTS.MAX_PURCHASE,
      maxWalletPercentage: FACTORY_CONSTANTS.MAX_WALLET_PERCENTAGE,
      priceRate: FACTORY_CONSTANTS.PRICE_RATE,
      tradingFee: FACTORY_CONSTANTS.TRADING_FEE,

      // Initialize goal tracking
      goalReachedTimestamp: null,
      haltedAt: null,
      resumedAt: null,
      autoResumedAt: null,

      statistics: {
        currentPrice:
          args.creatorTokens > 0n
            ? (
                Number(formatEther(args.ethSpent)) /
                Number(formatEther(args.creatorTokens))
              ).toString()
            : FACTORY_CONSTANTS.INITIAL_PRICE,
        volumeETH: formatEther(args.ethSpent), // Start with creation volume
        tradeCount: args.ethSpent > 0n ? 1 : 0, // Count creation as trade if ETH was spent
        uniqueHolders: args.creatorTokens > 0n ? 1 : 0, // Creator is only a holder if they got tokens
      },
      blockNumber,
      transactionHash,
    };

    await setDoc(doc(db, COLLECTIONS.TOKENS, tokenAddress), tokenData, {
      merge: true,
    });
    console.log("✅ Token document created/updated in", COLLECTIONS.TOKENS);

    // Update user data with created token info
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

    // If ETH was spent during creation, record it as the first trade
    if (args.ethSpent > 0n && args.creatorTokens > 0n) {
      const tradeData = {
        type: "buy",
        token: tokenAddress,
        trader: creatorAddress,
        tokenAmount: args.creatorTokens.toString(),
        ethAmount: args.ethSpent.toString(),
        fee: "0", // No fee for creator
        pricePerToken: (
          Number(formatEther(args.ethSpent)) /
          Number(formatEther(args.creatorTokens))
        ).toString(),
        blockNumber,
        transactionHash,
        timestamp,
      };

      const tradeRef = doc(collection(db, COLLECTIONS.TRADES));
      await setDoc(tradeRef, tradeData);
      console.log("✅ Creation trade recorded in", COLLECTIONS.TRADES);
    }
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
  let pricePerToken: string;

  try {
    formattedTokenAmount = formatEther(tokenAmount);
    formattedEthAmount = formatEther(ethAmount);
    formattedFee = formatEther(fee);

    const tokenAmountNum = Number(formattedTokenAmount);
    if (tokenAmountNum === 0) {
      throw new Error("Token amount cannot be zero");
    }

    const pricePerTokenNum = Number(formattedEthAmount) / tokenAmountNum;

    if (!Number.isFinite(pricePerTokenNum)) {
      throw new Error("Invalid price calculation");
    }

    // Keep price as string with full precision
    pricePerToken = pricePerTokenNum.toString();
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
  console.log("Fee Amount:", formattedFee);
  console.log("Price per Token:", pricePerToken);

  try {
    // 1. Create trade document with deduplication
    const tradeId = `${transactionHash}-${eventType}-${token.toLowerCase()}`;
    const tradeRef = doc(db, COLLECTIONS.TRADES, tradeId);

    // Check if this trade already exists to prevent duplicates
    const existingTrade = await getDoc(tradeRef);
    if (existingTrade.exists()) {
      console.log("⚠️ Trade already processed, skipping:", tradeId);
      return;
    }

    const tradeData = {
      type: eventType,
      token: token.toLowerCase(),
      trader: trader.toLowerCase(),
      tokenAmount: tokenAmount.toString(),
      ethAmount: ethAmount.toString(),
      fee: fee.toString(),
      pricePerToken: pricePerToken,
      blockNumber,
      transactionHash,
      timestamp,
    };

    await setDoc(tradeRef, tradeData);
    console.log(
      "✅ Trade document created in",
      COLLECTIONS.TRADES,
      "with ID:",
      tradeId
    );

    // 2. Try to read actual contract state, fallback to calculation if it fails
    console.log("📖 Reading current contract state...");
    const contractData = await getContractTokenData(token.toLowerCase());

    // 3. Update token statistics with real contract data or calculated values
    const tokenDocRef = doc(db, COLLECTIONS.TOKENS, token.toLowerCase());
    const tokenDoc = await getDoc(tokenDocRef);

    if (!tokenDoc.exists()) {
      console.error("❌ Token document not found:", token.toLowerCase());
      return;
    }

    const currentData = tokenDoc.data();
    const currentVolume = parseFloat(currentData.statistics?.volumeETH || "0");
    const currentTradeCount = currentData.statistics?.tradeCount || 0;
    const currentUniqueHolders = currentData.statistics?.uniqueHolders || 0;

    // Track unique holders - simple approach: collect all unique trader addresses
    const existingHolders = currentData.uniqueTraders || [];
    const traderLower = trader.toLowerCase();
    const isNewHolder = !existingHolders.includes(traderLower);
    const newUniqueHolders = isNewHolder
      ? currentUniqueHolders + 1
      : currentUniqueHolders;
    const updatedHolders = isNewHolder
      ? [...existingHolders, traderLower]
      : existingHolders;

    // Calculate new volume (still need to track this for statistics)
    const ethAmountNum = parseFloat(formattedEthAmount);
    const newVolume = currentVolume + ethAmountNum;
    const newTradeCount = currentTradeCount + 1;

    let tokenUpdateData;

    if (contractData.success) {
      // Use actual contract values when available
      console.log("✅ Using contract data");
      tokenUpdateData = {
        collateral: contractData.collateral,
        virtualSupply: contractData.virtualSupply,
        lastPrice: contractData.lastPrice,

        uniqueTraders: updatedHolders,
        statistics: {
          currentPrice: contractData.lastPrice,
          volumeETH: newVolume.toString(),
          tradeCount: newTradeCount,
          uniqueHolders: newUniqueHolders,
        },
        lastTrade: {
          price: pricePerToken,
          timestamp,
          type: eventType,
          fee: formattedFee,
        },
      };

      console.log("📊 Contract collateral:", contractData.collateral);
      console.log("📊 Contract virtual supply:", contractData.virtualSupply);
      console.log("📊 Contract last price:", contractData.lastPrice);
    } else {
      // Fallback to calculated values when contract read fails
      console.log("⚠️ Contract read failed, using calculated values");
      const currentCollateral = parseFloat(currentData.collateral || "0");
      const newCollateral =
        eventType === "buy"
          ? currentCollateral + ethAmountNum
          : currentCollateral - ethAmountNum;

      tokenUpdateData = {
        collateral: newCollateral.toString(),
        lastPrice: pricePerToken,

        uniqueTraders: updatedHolders,
        statistics: {
          currentPrice: pricePerToken,
          volumeETH: newVolume.toString(),
          tradeCount: newTradeCount,
          uniqueHolders: newUniqueHolders,
        },
        lastTrade: {
          price: pricePerToken,
          timestamp,
          type: eventType,
          fee: formattedFee,
        },
      };

      console.log("📊 Calculated collateral:", newCollateral.toString());
    }

    await updateDoc(tokenDocRef, tokenUpdateData);
    console.log("✅ Token statistics updated in", COLLECTIONS.TOKENS);
    console.log("📊 New volume:", newVolume.toString());
    console.log("📊 New trade count:", newTradeCount);
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
  const formattedCollateral = formatEther(collateral);
  const tokenAddress = token.toLowerCase();

  console.log("\n=== TRADING HALTED DETAILS ===");
  console.log("Token Address:", tokenAddress);
  console.log("Final Collateral:", formattedCollateral);

  try {
    const tokenUpdateData = {
      currentState: TokenState.GOAL_REACHED,
      finalCollateral: formattedCollateral,
      haltedAt: timestamp,
      haltBlock: blockNumber,
      goalReachedTimestamp: timestamp, // Track when goal was reached for auto-resume
    };

    await setDoc(doc(db, COLLECTIONS.TOKENS, tokenAddress), tokenUpdateData, {
      merge: true,
    });
    console.log(
      "✅ Token state updated to GOAL_REACHED in",
      COLLECTIONS.TOKENS
    );
  } catch (error) {
    console.error("❌ Database Error:", error);
    throw error;
  }
}

async function handleTradingResumed(
  token: string,
  timestamp: string,
  blockNumber: number
) {
  const tokenAddress = token.toLowerCase();

  console.log("\n=== TRADING RESUMED DETAILS ===");
  console.log("Token Address:", tokenAddress);

  try {
    const tokenUpdateData = {
      currentState: TokenState.RESUMED,
      resumedAt: timestamp,
      resumeBlock: blockNumber,
    };

    await setDoc(doc(db, COLLECTIONS.TOKENS, tokenAddress), tokenUpdateData, {
      merge: true,
    });
    console.log("✅ Token state updated to RESUMED in", COLLECTIONS.TOKENS);
  } catch (error) {
    console.error("❌ Database Error:", error);
    throw error;
  }
}

async function handleTradingAutoResumed(
  token: string,
  resumeTimestamp: bigint,
  timestamp: string,
  blockNumber: number
) {
  const tokenAddress = token.toLowerCase();
  const resumeTime = new Date(Number(resumeTimestamp) * 1000).toISOString();

  console.log("\n=== TRADING AUTO-RESUMED DETAILS ===");
  console.log("Token Address:", tokenAddress);
  console.log("Auto-Resume Timestamp:", resumeTime);

  try {
    const tokenUpdateData = {
      currentState: TokenState.RESUMED,
      autoResumedAt: timestamp,
      autoResumeBlock: blockNumber,
      actualResumeTimestamp: resumeTime, // When the auto-resume was triggered
    };

    await setDoc(doc(db, COLLECTIONS.TOKENS, tokenAddress), tokenUpdateData, {
      merge: true,
    });
    console.log(
      "✅ Token state updated to AUTO-RESUMED in",
      COLLECTIONS.TOKENS
    );
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
    console.log(`🏭 Factory Address: ${FACTORY_ADDRESS}`);
    console.log(`🌐 Network: ${process.env.NEXT_PUBLIC_NETWORK || "testnet"}`);
    console.log(
      `⏰ ${new Date(Number(blockInfo.timestamp) * 1000).toLocaleString()}`
    );
    console.log("============================");

    // Use dynamic factory address
    const factoryLogs = blockInfo.logs.filter(
      (log: any) =>
        log.account?.address?.toLowerCase() === FACTORY_ADDRESS?.toLowerCase()
    );

    console.log(`\nFound ${factoryLogs.length} factory logs`);

    for (const log of factoryLogs) {
      const timestamp = new Date(
        Number(blockInfo.timestamp) * 1000
      ).toISOString();

      console.log("\n--- Processing Log ---");
      console.log("Transaction Hash:", log.transaction?.hash);

      try {
        // Use the events directly from the metadata - NO HARDCODED VALUES!
        const decoded = decodeEventLog({
          abi: FACTORY_EVENTS,
          data: log.data,
          topics: log.topics,
        });

        // Type-safe access to eventName
        if (
          !("eventName" in decoded) ||
          typeof decoded.eventName !== "string"
        ) {
          console.log("⚠️ Decoded event missing eventName, skipping");
          continue;
        }

        const eventName = decoded.eventName;
        console.log(`🎯 Processing ${eventName} event`);

        // Handle each event type - UPDATED FOR NEW CONTRACT EVENTS
        switch (eventName) {
          case "TokenCreated": {
            const args = decoded.args as unknown as TokenCreatedEvent;
            await handleTokenCreated(
              args,
              timestamp,
              Number(blockInfo.number),
              log.transaction.hash
            );
            break;
          }

          case "TokensPurchased": {
            const args = decoded.args as unknown as TokensPurchasedEvent;
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
            const args = decoded.args as unknown as TokensSoldEvent;
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
            const args = decoded.args as unknown as TradingHaltedEvent;
            await handleTradingHalted(
              args.token,
              args.collateral,
              timestamp,
              Number(blockInfo.number)
            );
            break;
          }

          case "TradingResumed": {
            const args = decoded.args as unknown as TradingResumedEvent;
            await handleTradingResumed(
              args.token,
              timestamp,
              Number(blockInfo.number)
            );
            break;
          }

          case "TradingAutoResumed": {
            const args = decoded.args as unknown as TradingAutoResumedEvent;
            await handleTradingAutoResumed(
              args.token,
              args.timestamp,
              timestamp,
              Number(blockInfo.number)
            );
            break;
          }

          default:
            console.log(`⚠️ Unhandled event: ${eventName}`);
            console.log(
              "Available events:",
              FACTORY_EVENTS.map((e: any) => e.name)
            );
        }
      } catch (decodeError) {
        console.log(
          "📝 Could not decode log - likely not a factory event, skipping"
        );
      }
    }

    return NextResponse.json({
      status: "success",
      blockNumber: blockInfo.number,
      logsProcessed: factoryLogs.length,
      factoryAddress: FACTORY_ADDRESS,
      network: process.env.NEXT_PUBLIC_NETWORK || "testnet",
      eventsSupported: FACTORY_EVENTS.map((e: any) => e.name),
    });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return NextResponse.json(
    {
      status: "info",
      message: "Factory Event Monitor Webhook",
      configuration: {
        factoryAddress: FACTORY_ADDRESS,
        network: process.env.NEXT_PUBLIC_NETWORK || "testnet",
        supportedEvents: FACTORY_EVENTS.map((e: any) => e.name),
      },
      usage: {
        description:
          "This endpoint processes blockchain factory events via POST requests",
        allowedMethods: ["POST"],
      },
    },
    {
      status: 200,
      headers: {
        Allow: "GET, POST",
      },
    }
  );
}
