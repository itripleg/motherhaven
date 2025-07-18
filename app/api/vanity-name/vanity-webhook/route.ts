// app/api/vanity-name/vanity-webhook/route.ts
import { NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/firebase";
import { decodeEventLog, formatEther, createPublicClient, http } from "viem";
import { avalancheFuji } from "viem/chains";
import { Address } from "viem";

// =================================================================
//                    CONTRACT CONFIGURATION
// =================================================================

// Contract addresses from environment variables
const VANITY_BURN_MANAGER_ADDRESS = process.env
  .NEXT_PUBLIC_VANITY_BURN_MANAGER_ADDRESS as Address;
const VAIN_TOKEN_ADDRESS =
  "0xC3DF61f5387fE2E0e6521ffdad338b1bbf5e5f7c" as Address;

if (!VANITY_BURN_MANAGER_ADDRESS) {
  console.error("❌ VANITY_BURN_MANAGER_ADDRESS not configured");
}

// Event ABIs for the new simplified contract
const VANITY_BURN_MANAGER_EVENTS = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "burner", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "newBurnBalance", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "TokensBurned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "oldName", type: "string" },
      { indexed: true, name: "newName", type: "string" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "VanityNameSet",
    type: "event",
  },
] as const;

// Create viem client
const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(
    process.env.RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
  ),
});

// =================================================================
//                    TYPES & INTERFACES
// =================================================================

interface AlchemyWebhookPayload {
  webhookId: string;
  id: string;
  createdAt: string;
  type: string;
  event: {
    network: string;
    activity: Array<{
      fromAddress?: string;
      toAddress?: string;
      blockNum: string;
      hash: string;
      log: {
        address: string;
        topics: string[];
        data: string;
        blockNumber: string;
        transactionHash: string;
        transactionIndex: string;
        blockHash: string;
        logIndex: string;
        removed: boolean;
      };
    }>;
  };
}

interface ProcessedVanityWebhook {
  eventType: "TokensBurned" | "VanityNameSet";
  user: Address;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
  data: any;
}

interface UserBurnDocument {
  address: Address;
  totalBurned: string;
  totalSpent: string;
  availableBalance: string;
  burnHistory: BurnEntry[];
  nameHistory: NameEntry[];
  createdAt: string;
  updatedAt: string;
}

interface BurnEntry {
  amount: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
}

interface NameEntry {
  oldName: string;
  newName: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
}

interface VanityNameDocument {
  name: string;
  displayName: string;
  owner: Address;
  claimedAt: string;
  transactionHash: string;
  blockNumber: number;
  isActive: boolean;
}

// =================================================================
//                    EVENT PROCESSORS
// =================================================================

/**
 * Process TokensBurned event from VanityBurnManager
 */
async function processTokensBurned(
  event: any,
  transactionHash: string,
  blockNumber: number,
  timestamp: string
): Promise<void> {
  console.log("🔥 Processing TokensBurned event:", event);

  const burner = event.burner.toLowerCase() as Address;
  const amount = event.amount.toString();
  const newBurnBalance = event.newBurnBalance.toString();

  console.log(`🔥 Burn details:`, {
    burner,
    amount: formatEther(BigInt(amount)),
    newBurnBalance: formatEther(BigInt(newBurnBalance)),
  });

  // Update user's burn document
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "vanity_users", burner);
    const userDoc = await transaction.get(userRef);

    if (userDoc.exists()) {
      // Update existing user
      const userData = userDoc.data() as UserBurnDocument;

      const updatedBurnHistory = [
        ...userData.burnHistory,
        {
          amount,
          transactionHash,
          blockNumber,
          timestamp,
        },
      ];

      transaction.update(userRef, {
        totalBurned: newBurnBalance,
        burnHistory: updatedBurnHistory,
        updatedAt: timestamp,
      });
    } else {
      // Create new user document
      const newUserDoc: UserBurnDocument = {
        address: burner,
        totalBurned: newBurnBalance,
        totalSpent: "0",
        availableBalance: newBurnBalance,
        burnHistory: [
          {
            amount,
            transactionHash,
            blockNumber,
            timestamp,
          },
        ],
        nameHistory: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      transaction.set(userRef, newUserDoc);
      console.log(`👤 Created new user document for: ${burner}`);
    }
  });

  console.log("✅ TokensBurned processed successfully");
}

/**
 * Process VanityNameSet event
 */
async function processVanityNameSet(
  event: any,
  transactionHash: string,
  blockNumber: number,
  timestamp: string
): Promise<void> {
  console.log("🎭 Processing VanityNameSet event:", event);

  const user = event.user.toLowerCase() as Address;
  const oldName = event.oldName;
  const newName = event.newName;

  console.log(`🎭 Name change details:`, {
    user,
    oldName: oldName || "(none)",
    newName,
  });

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, "vanity_users", user);
    const newNameRef = doc(db, "vanity_names", newName.toLowerCase());

    // Get user document
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error(`User document not found: ${user}`);
    }

    const userData = userDoc.data() as UserBurnDocument;

    // Release old name if it exists
    if (oldName && oldName.length > 0) {
      const oldNameRef = doc(db, "vanity_names", oldName.toLowerCase());
      transaction.delete(oldNameRef);
      console.log(`🗑️ Released old name: ${oldName}`);
    }

    // Create new vanity name document
    const nameDoc: VanityNameDocument = {
      name: newName.toLowerCase(),
      displayName: newName,
      owner: user,
      claimedAt: timestamp,
      transactionHash,
      blockNumber,
      isActive: true,
    };

    // Update name history
    const updatedNameHistory = [
      ...userData.nameHistory,
      {
        oldName: oldName || "",
        newName,
        transactionHash,
        blockNumber,
        timestamp,
      },
    ];

    // Update user document
    transaction.update(userRef, {
      nameHistory: updatedNameHistory,
      updatedAt: timestamp,
    });

    // Set new name document
    transaction.set(newNameRef, nameDoc);

    console.log("✅ VanityNameSet processed successfully");
  });
}

// =================================================================
//                    MAIN WEBHOOK HANDLER
// =================================================================

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AlchemyWebhookPayload;

    console.log("📨 Vanity webhook received:", {
      webhookId: body.webhookId,
      eventCount: body.event?.activity?.length || 0,
      timestamp: new Date().toISOString(),
    });

    if (!VANITY_BURN_MANAGER_ADDRESS) {
      console.error("❌ VANITY_BURN_MANAGER_ADDRESS not configured");
      return NextResponse.json(
        { error: "Contract address not configured" },
        { status: 500 }
      );
    }

    if (!body.event?.activity || body.event.activity.length === 0) {
      console.log("ℹ️ No events to process");
      return NextResponse.json({
        status: "success",
        message: "No events to process",
      });
    }

    const processedEvents: ProcessedVanityWebhook[] = [];

    for (const activity of body.event.activity) {
      try {
        const log = activity.log;

        // Only process events from our vanity burn manager
        if (
          log.address.toLowerCase() !==
          VANITY_BURN_MANAGER_ADDRESS?.toLowerCase()
        ) {
          console.log(
            `⏭️ Skipping event from different contract: ${log.address}`
          );
          continue;
        }

        const timestamp = new Date().toISOString();
        const blockNumber = parseInt(log.blockNumber, 16);
        const transactionHash = log.transactionHash;

        console.log("🔍 Processing log from vanity burn manager:", {
          transactionHash,
          blockNumber,
          topics: log.topics,
        });

        // Decode the event
        const decoded = decodeEventLog({
          abi: VANITY_BURN_MANAGER_EVENTS,
          data: log.data as `0x${string}`,
          topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
        });

        console.log("📋 Decoded event:", decoded);

        // Type assertion to access eventName safely
        const eventName = (decoded as any).eventName as string;
        const eventArgs = (decoded as any).args;

        // Process based on event type
        switch (eventName) {
          case "TokensBurned":
            await processTokensBurned(
              eventArgs,
              transactionHash,
              blockNumber,
              timestamp
            );
            break;

          case "VanityNameSet":
            await processVanityNameSet(
              eventArgs,
              transactionHash,
              blockNumber,
              timestamp
            );
            break;

          default:
            console.log("⚠️ Unknown event type:", eventName);
            continue;
        }

        processedEvents.push({
          eventType: eventName as any,
          user: ((eventArgs as any).user ||
            (eventArgs as any).burner) as Address,
          transactionHash,
          blockNumber,
          timestamp,
          data: eventArgs,
        });
      } catch (error) {
        console.error("❌ Error processing activity:", error);
        // Continue processing other events
      }
    }

    console.log(`✅ Processed ${processedEvents.length} events successfully`);

    return NextResponse.json({
      status: "success",
      processed: processedEvents.length,
      events: processedEvents,
      contractAddress: VANITY_BURN_MANAGER_ADDRESS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return NextResponse.json({
    status: "info",
    message: "Simplified Vanity Name Webhook Endpoint",
    configuration: {
      contractAddress: VANITY_BURN_MANAGER_ADDRESS,
      vainTokenAddress: VAIN_TOKEN_ADDRESS,
      network: process.env.NEXT_PUBLIC_NETWORK || "testnet",
      supportedEvents: ["TokensBurned", "VanityNameSet"],
    },
    usage: {
      description:
        "This endpoint processes burn and name-setting events from the vanity burn manager contract",
      allowedMethods: ["POST"],
      webhookUrl: "/api/vanity-name/vanity-webhook",
    },
    collections: {
      vanity_users: "Tracks user burn balances and name history",
      vanity_names: "Tracks name ownership and availability",
    },
    timestamp: new Date().toISOString(),
  });
}
