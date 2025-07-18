// app/api/vanity-webhook/route.ts
import { NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/firebase";
import { decodeEventLog, formatEther, createPublicClient, http } from "viem";
import { avalancheFuji } from "viem/chains";
import {
  VanityRequestStatus,
  VanityNameValidationError,
  VanityNameError,
  WebhookProcessingError,
  VANITY_NAME_CONSTANTS,
  type VanityRequestDocument,
  type VanityNameDocument,
  type UserDocument,
  type VanityNameHistoryEntry,
  type ProcessedVanityWebhook,
  type AlchemyWebhookPayload,
  isVanityNameRequestedEvent,
  isVanityNameConfirmedEvent,
  isVanityNameRejectedEvent,
} from "@/types/vanity";
import { Address } from "viem";

// =================================================================
//                    CONTRACT CONFIGURATION
// =================================================================

// TODO: Replace with actual deployed contract address
const VANITY_BURN_MANAGER_ADDRESS = process.env
  .VANITY_BURN_MANAGER_ADDRESS as Address;

// Vanity Burn Manager ABI (events only)
const VANITY_BURN_MANAGER_EVENTS = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "oldName", type: "string" },
      { indexed: true, name: "newName", type: "string" },
      { indexed: false, name: "burnAmount", type: "uint256" },
      { indexed: false, name: "token", type: "address" },
      { indexed: false, name: "timestamp", type: "uint256" },
      { indexed: false, name: "requestId", type: "uint256" },
    ],
    name: "VanityNameRequested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "vanityName", type: "string" },
      { indexed: false, name: "requestId", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "VanityNameConfirmed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "requestedName", type: "string" },
      { indexed: false, name: "requestId", type: "uint256" },
      { indexed: false, name: "reason", type: "string" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "VanityNameRejected",
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
//                    VALIDATION HELPERS
// =================================================================

/**
 * Validate vanity name format and availability
 */
async function validateVanityName(
  name: string,
  userAddress: Address
): Promise<VanityNameValidationError | null> {
  // Length validation
  if (name.length < VANITY_NAME_CONSTANTS.MIN_LENGTH) {
    return VanityNameValidationError.TOO_SHORT;
  }
  if (name.length > VANITY_NAME_CONSTANTS.MAX_LENGTH) {
    return VanityNameValidationError.TOO_LONG;
  }

  // Character validation
  if (!VANITY_NAME_CONSTANTS.ALLOWED_CHARACTERS.test(name)) {
    return VanityNameValidationError.INVALID_CHARACTERS;
  }

  // Reserved names check
  if (
    VANITY_NAME_CONSTANTS.RESERVED_NAMES.includes(name.toLowerCase() as any)
  ) {
    return VanityNameValidationError.RESERVED;
  }

  // Check if name is already taken
  const lowerName = name.toLowerCase();
  const nameDoc = await getDoc(
    doc(db, VANITY_NAME_CONSTANTS.COLLECTION_NAMES.VANITY_NAMES, lowerName)
  );

  if (nameDoc.exists()) {
    const nameData = nameDoc.data() as VanityNameDocument;
    // Allow if the current user already owns this name
    if (nameData.owner.toLowerCase() !== userAddress.toLowerCase()) {
      return VanityNameValidationError.ALREADY_TAKEN;
    }
  }

  return null; // Valid name
}

/**
 * Check for profanity (basic implementation - could be enhanced)
 */
function containsProfanity(name: string): boolean {
  const profanityList = [
    // Add your profanity filter words here
    "badword1",
    "badword2", // placeholder
  ];

  const lowerName = name.toLowerCase();
  return profanityList.some((word) => lowerName.includes(word));
}

// =================================================================
//                    EVENT PROCESSORS
// =================================================================

/**
 * Process VanityNameRequested event
 */
async function processVanityNameRequested(
  event: any,
  transactionHash: string,
  blockNumber: number,
  timestamp: string
): Promise<void> {
  console.log("🔄 Processing VanityNameRequested event:", event);

  if (!isVanityNameRequestedEvent(event)) {
    throw new WebhookProcessingError(
      "Invalid VanityNameRequested event format",
      "unknown",
      transactionHash,
      blockNumber
    );
  }

  const requestId = Number(event.requestId);
  const userAddress = event.user.toLowerCase() as Address;
  const oldName = event.oldName;
  const newName = event.newName;
  const burnAmount = event.burnAmount.toString();
  const tokenAddress = event.token as Address;

  // Validate the requested name
  const validationError = await validateVanityName(newName, userAddress);

  if (validationError) {
    console.log(`❌ Validation failed for name "${newName}":`, validationError);

    // Auto-reject the request
    await processVanityNameRejection(
      requestId,
      userAddress,
      newName,
      validationError,
      transactionHash,
      blockNumber,
      timestamp
    );
    return;
  }

  // Check for profanity
  if (containsProfanity(newName)) {
    console.log(`❌ Profanity detected in name "${newName}"`);
    await processVanityNameRejection(
      requestId,
      userAddress,
      newName,
      VanityNameValidationError.PROFANITY,
      transactionHash,
      blockNumber,
      timestamp
    );
    return;
  }

  // Create vanity request document
  const requestDoc: VanityRequestDocument = {
    requestId,
    user: userAddress,
    oldName,
    newName,
    burnAmount,
    tokenAddress,
    status: VanityRequestStatus.PENDING,
    rejectionReason: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    transactionHash,
    blockNumber,
    webhookProcessed: true,
    webhookProcessedAt: timestamp,
    confirmationTxHash: null,
    confirmationBlockNumber: null,
  };

  // Use transaction to ensure atomicity
  await runTransaction(db, async (transaction) => {
    const requestRef = doc(
      db,
      VANITY_NAME_CONSTANTS.COLLECTION_NAMES.VANITY_REQUESTS,
      requestId.toString()
    );
    const userRef = doc(
      db,
      VANITY_NAME_CONSTANTS.COLLECTION_NAMES.USERS,
      userAddress
    );

    // Check if request already exists
    const existingRequest = await transaction.get(requestRef);
    if (existingRequest.exists()) {
      console.log("⚠️ Request already processed, skipping:", requestId);
      return;
    }

    // Create the request
    transaction.set(requestRef, requestDoc);

    // Ensure user document exists
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      // Create basic user document
      const newUserDoc: Partial<UserDocument> = {
        address: userAddress,
        createdTokens: [],
        lastActive: timestamp,
        vanityName: {
          current: "",
          history: [],
          totalChanges: 0,
          lastChanged: null,
        },
        theme: {
          colors: [],
          lastUpdated: timestamp,
        },
      };
      transaction.set(userRef, newUserDoc);
    }

    console.log("✅ VanityNameRequested processed successfully");
  });

  // Auto-approve the request (you might want to add manual approval logic here)
  await processVanityNameApproval(
    requestId,
    userAddress,
    newName,
    transactionHash,
    blockNumber,
    timestamp
  );
}

/**
 * Process VanityNameConfirmed event
 */
async function processVanityNameConfirmed(
  event: any,
  transactionHash: string,
  blockNumber: number,
  timestamp: string
): Promise<void> {
  console.log("✅ Processing VanityNameConfirmed event:", event);

  if (!isVanityNameConfirmedEvent(event)) {
    throw new WebhookProcessingError(
      "Invalid VanityNameConfirmed event format",
      "unknown",
      transactionHash,
      blockNumber
    );
  }

  const requestId = Number(event.requestId);
  const userAddress = event.user.toLowerCase() as Address;
  const vanityName = event.vanityName;

  // Update request status
  const requestRef = doc(
    db,
    VANITY_NAME_CONSTANTS.COLLECTION_NAMES.VANITY_REQUESTS,
    requestId.toString()
  );
  await updateDoc(requestRef, {
    status: VanityRequestStatus.CONFIRMED,
    updatedAt: timestamp,
    confirmationTxHash: transactionHash,
    confirmationBlockNumber: blockNumber,
  });

  console.log("✅ VanityNameConfirmed processed successfully");
}

/**
 * Process VanityNameRejected event
 */
async function processVanityNameRejected(
  event: any,
  transactionHash: string,
  blockNumber: number,
  timestamp: string
): Promise<void> {
  console.log("❌ Processing VanityNameRejected event:", event);

  if (!isVanityNameRejectedEvent(event)) {
    throw new WebhookProcessingError(
      "Invalid VanityNameRejected event format",
      "unknown",
      transactionHash,
      blockNumber
    );
  }

  const requestId = Number(event.requestId);
  const userAddress = event.user.toLowerCase() as Address;
  const requestedName = event.requestedName;
  const reason = event.reason;

  await processVanityNameRejection(
    requestId,
    userAddress,
    requestedName,
    reason,
    transactionHash,
    blockNumber,
    timestamp
  );
}

/**
 * Helper function to process name rejection
 */
async function processVanityNameRejection(
  requestId: number,
  userAddress: Address,
  requestedName: string,
  reason: string | VanityNameValidationError,
  transactionHash: string,
  blockNumber: number,
  timestamp: string
): Promise<void> {
  const reasonText =
    typeof reason === "string" ? reason : `Validation failed: ${reason}`;

  await runTransaction(db, async (transaction) => {
    const requestRef = doc(
      db,
      VANITY_NAME_CONSTANTS.COLLECTION_NAMES.VANITY_REQUESTS,
      requestId.toString()
    );
    const nameRef = doc(
      db,
      VANITY_NAME_CONSTANTS.COLLECTION_NAMES.VANITY_NAMES,
      requestedName.toLowerCase()
    );

    // Update request status
    transaction.update(requestRef, {
      status: VanityRequestStatus.REJECTED,
      rejectionReason: reasonText,
      updatedAt: timestamp,
      confirmationTxHash: transactionHash,
      confirmationBlockNumber: blockNumber,
    });

    // Release the reserved name
    transaction.delete(nameRef);

    console.log("❌ VanityNameRejected processed successfully");
  });
}

/**
 * Helper function to process name approval
 */
async function processVanityNameApproval(
  requestId: number,
  userAddress: Address,
  newName: string,
  transactionHash: string,
  blockNumber: number,
  timestamp: string
): Promise<void> {
  console.log("🔄 Auto-approving vanity name request:", {
    requestId,
    userAddress,
    newName,
  });

  await runTransaction(db, async (transaction) => {
    const requestRef = doc(
      db,
      VANITY_NAME_CONSTANTS.COLLECTION_NAMES.VANITY_REQUESTS,
      requestId.toString()
    );
    const userRef = doc(
      db,
      VANITY_NAME_CONSTANTS.COLLECTION_NAMES.USERS,
      userAddress
    );
    const nameRef = doc(
      db,
      VANITY_NAME_CONSTANTS.COLLECTION_NAMES.VANITY_NAMES,
      newName.toLowerCase()
    );

    // Get current request and user data
    const requestDoc = await transaction.get(requestRef);
    const userDoc = await transaction.get(userRef);

    if (!requestDoc.exists() || !userDoc.exists()) {
      throw new Error("Request or user document not found");
    }

    const requestData = requestDoc.data() as VanityRequestDocument;
    const userData = userDoc.data() as UserDocument;

    // Create history entry
    const historyEntry: VanityNameHistoryEntry = {
      name: newName,
      changedAt: timestamp,
      requestId,
      burnAmount: requestData.burnAmount,
      tokenAddress: requestData.tokenAddress,
      transactionHash,
    };

    // Update user's vanity name data
    const updatedVanityName = {
      current: newName,
      history: [...(userData.vanityName?.history || []), historyEntry],
      totalChanges: (userData.vanityName?.totalChanges || 0) + 1,
      lastChanged: timestamp,
    };

    // Release old name if it exists
    if (userData.vanityName?.current) {
      const oldNameRef = doc(
        db,
        VANITY_NAME_CONSTANTS.COLLECTION_NAMES.VANITY_NAMES,
        userData.vanityName.current.toLowerCase()
      );
      transaction.delete(oldNameRef);
    }

    // Create new vanity name document
    const nameDoc: VanityNameDocument = {
      name: newName.toLowerCase(),
      displayName: newName,
      owner: userAddress,
      claimedAt: timestamp,
      requestId,
      burnAmount: requestData.burnAmount,
      tokenAddress: requestData.tokenAddress,
      transactionHash,
      isActive: true,
    };

    // Update all documents
    transaction.update(requestRef, {
      status: VanityRequestStatus.CONFIRMED,
      updatedAt: timestamp,
    });

    transaction.update(userRef, {
      vanityName: updatedVanityName,
      lastActive: timestamp,
    });

    transaction.set(nameRef, nameDoc);

    console.log("✅ Vanity name approved and processed successfully");
  });

  // TODO: Call contract to confirm the name change
  // This would require a function to call the contract's confirmVanityName method
  // await confirmVanityNameOnContract(requestId);
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
    });

    if (!body.event?.activity || body.event.activity.length === 0) {
      return NextResponse.json({
        status: "success",
        message: "No events to process",
      });
    }

    const processedEvents: ProcessedVanityWebhook[] = [];

    for (const activity of body.event.activity) {
      try {
        const log = activity.log;

        // Skip if not from vanity burn manager
        if (
          log.address.toLowerCase() !==
          VANITY_BURN_MANAGER_ADDRESS?.toLowerCase()
        ) {
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
          case "VanityNameRequested":
            await processVanityNameRequested(
              eventArgs,
              transactionHash,
              blockNumber,
              timestamp
            );
            break;

          case "VanityNameConfirmed":
            await processVanityNameConfirmed(
              eventArgs,
              transactionHash,
              blockNumber,
              timestamp
            );
            break;

          case "VanityNameRejected":
            await processVanityNameRejected(
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
          requestId: Number((eventArgs as any).requestId),
          eventType: eventName as any,
          user: ((eventArgs as any).user as string).toLowerCase() as Address,
          transactionHash,
          blockNumber,
          timestamp,
        });
      } catch (error) {
        console.error("❌ Error processing activity:", error);
        // Continue processing other events
      }
    }

    return NextResponse.json({
      status: "success",
      processed: processedEvents.length,
      events: processedEvents,
      contractAddress: VANITY_BURN_MANAGER_ADDRESS,
    });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return NextResponse.json({
    status: "info",
    message: "Vanity Name Webhook Endpoint",
    configuration: {
      contractAddress: VANITY_BURN_MANAGER_ADDRESS,
      network: process.env.NEXT_PUBLIC_NETWORK || "testnet",
      supportedEvents: [
        "VanityNameRequested",
        "VanityNameConfirmed",
        "VanityNameRejected",
      ],
    },
    usage: {
      description:
        "This endpoint processes vanity name events from the burn manager contract",
      allowedMethods: ["POST"],
    },
  });
}
