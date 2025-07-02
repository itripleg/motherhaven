// /app/api/new-factory-monitor/route.ts

import { NextResponse } from "next/server";
import { collection, setDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { decodeEventLog, formatEther } from "viem";
import {
  TokenCreatedEvent,
  TokensPurchasedEvent,
  TokensSoldEvent,
  TokenState,
  TradingHaltedEvent,
  TradingResumedEvent,
} from "@/types";

// Import from the updated contracts types
import {
  FACTORY_ADDRESS,
  FACTORY_EVENTS,
  FACTORY_ABI,
} from "@/types/contracts";
import { createPublicClient, http } from "viem";
import { avalancheFuji } from "viem/chains";

// Create a public client to read contract constants
const publicClient = createPublicClient({
  chain: avalancheFuji, // Adjust based on your network
  transport: http(
    process.env.NEXT_PUBLIC_RPC_URL ||
      "https://api.avax-test.network/ext/bc/C/rpc"
  ),
});

// Cache for factory constants to avoid repeated contract calls
let factoryConstants: any = null;

async function getFactoryConstants() {
  if (factoryConstants) return factoryConstants;

  try {
    console.log("📡 Reading factory constants from contract...");

    // Read all constants from the contract
    const [
      decimals,
      maxSupply,
      initialMint,
      initialPrice,
      minPurchase,
      maxPurchase,
      maxWalletPercentage,
      priceRate,
      tradingFee,
    ] = await Promise.all([
      publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "DECIMALS",
      }),
      publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "MAX_SUPPLY",
      }),
      publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "INITIAL_MINT",
      }),
      publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "INITIAL_PRICE",
      }),
      publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "MIN_PURCHASE",
      }),
      publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "MAX_PURCHASE",
      }),
      publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "MAX_WALLET_PERCENTAGE",
      }),
      publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "PRICE_RATE",
      }),
      publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "TRADING_FEE",
      }),
    ]);

    // Cache the constants (formatted as strings for consistency)
    factoryConstants = {
      decimals: (decimals as bigint).toString(),
      maxSupply: (maxSupply as bigint).toString(),
      initialMint: (initialMint as bigint).toString(),
      initialPrice: formatEther(initialPrice as bigint),
      minPurchase: formatEther(minPurchase as bigint),
      maxPurchase: formatEther(maxPurchase as bigint),
      maxWalletPercentage: Number(maxWalletPercentage as bigint),
      priceRate: (priceRate as bigint).toString(),
      tradingFee: Number(tradingFee as bigint),
    };

    console.log("✅ Factory constants loaded:", factoryConstants);
    return factoryConstants;
  } catch (error) {
    console.error("❌ Failed to read factory constants:", error);
    // Fallback to hardcoded values if contract read fails
    return {
      decimals: "1000000000000000000",
      maxSupply: "1000000000000000000000000000",
      initialMint: "200000000000000000000000000",
      initialPrice: "0.00001",
      minPurchase: "0.00001",
      maxPurchase: "50",
      maxWalletPercentage: 5,
      priceRate: "2000",
      tradingFee: 30,
    };
  }
}

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
  console.log("Transaction Hash:", transactionHash);

  try {
    // Get factory constants from contract
    const constants = await getFactoryConstants();

    const tokenData = {
      address: tokenAddress,
      name: args.name,
      symbol: args.symbol,
      imageUrl: args.imageUrl,
      description: "", // Add missing field from Token interface
      creator: creatorAddress,
      burnManager: args.burnManager,
      fundingGoal,
      createdAt: timestamp,
      currentState: TokenState.TRADING,
      collateral: "0",
      virtualSupply: constants.initialMint, // Use contract value
      totalSupply: constants.initialMint, // Initially same as virtualSupply
      lastPrice: constants.initialPrice, // Use contract INITIAL_PRICE

      // Factory constants (from contract - matches your Token interface)
      decimals: constants.decimals,
      maxSupply: constants.maxSupply,
      initialMint: constants.initialMint,
      initialPrice: constants.initialPrice,
      minPurchase: constants.minPurchase,
      maxPurchase: constants.maxPurchase,
      maxWalletPercentage: constants.maxWalletPercentage,
      priceRate: constants.priceRate,
      tradingFee: constants.tradingFee,

      statistics: {
        currentPrice: "0",
        volumeETH: "0",
        tradeCount: 0,
        uniqueHolders: 0,
      },
      blockNumber,
      transactionHash,
    };

    await setDoc(doc(db, COLLECTIONS.TOKENS, tokenAddress), tokenData, {
      merge: true,
    });
    console.log("✅ Token document created/updated in", COLLECTIONS.TOKENS);

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
    // 1. Create trade document
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

    const tradeRef = doc(collection(db, COLLECTIONS.TRADES));
    await setDoc(tradeRef, tradeData);
    console.log(
      "✅ Trade document created in",
      COLLECTIONS.TRADES,
      "with ID:",
      tradeRef.id
    );

    // 2. Update token statistics - use proper atomic updates
    const tokenDocRef = doc(db, COLLECTIONS.TOKENS, token.toLowerCase());
    const tokenDoc = await getDoc(tokenDocRef);

    if (!tokenDoc.exists()) {
      console.error("❌ Token document not found:", token.toLowerCase());
      return;
    }

    const currentData = tokenDoc.data();
    const currentCollateral = parseFloat(currentData.collateral || "0");
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

    // Calculate new values
    const ethAmountNum = parseFloat(formattedEthAmount);
    const newCollateral =
      eventType === "buy"
        ? currentCollateral + ethAmountNum
        : currentCollateral - ethAmountNum;
    const newVolume = currentVolume + ethAmountNum;
    const newTradeCount = currentTradeCount + 1;

    // Update token with consistent data structure
    const tokenUpdateData = {
      collateral: newCollateral.toString(),
      lastPrice: pricePerToken,
      uniqueTraders: updatedHolders, // Track for uniqueHolders calculation
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

    await updateDoc(tokenDocRef, tokenUpdateData);
    console.log("✅ Token statistics updated in", COLLECTIONS.TOKENS);
    console.log("📊 New collateral:", newCollateral.toString());
    console.log("📊 New volume:", newVolume.toString());
    console.log("📊 New trade count:", newTradeCount);
    console.log("📊 New price:", pricePerToken);
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
      currentState: TokenState.GOAL_REACHED, // Use GOAL_REACHED instead of HALTED
      finalCollateral: formattedCollateral,
      haltedAt: timestamp,
      haltBlock: blockNumber,
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
      currentState: TokenState.RESUMED, // Use RESUMED instead of TRADING
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

        // Handle each event type
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
