// app/api/tvb/webhook/route.ts - OPTIMIZED webhook with reduced Firebase usage

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase";

// Development mode toggle
const DEV_MODE =
  process.env.NODE_ENV === "development" || process.env.TVB_DEV_MODE === "true";

// Bot secrets for authentication
const BOT_SECRETS = {
  bullish_billy: "bullish_billy_secret_2024",
  jackpot_jax: "jax_trader_secret_2024",
  melancholy_mort: "melancholy_mort_secret_2024",
};

// OPTIMIZED: In-memory storage with better offline detection
interface BotActivity {
  botName: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  lastSeen: string;
  lastAction: {
    type: string;
    message: string;
    details: any;
    timestamp: string;
  };
  totalActions: number;
  sessionStarted: string;
  config?: any;
  character?: any;
  isDevMode?: boolean;

  // OPTIMIZATION: Add heartbeat tracking
  lastHeartbeat: string;
  consecutiveHeartbeats: number;
  missedHeartbeats: number;
}

// OPTIMIZED: Better memory management
const botActivities = new Map<string, BotActivity>();
const MAX_STORED_BOTS = 50; // Limit memory usage

// Firestore collection names
const COLLECTIONS = {
  BOT_ACTIVITIES: "bot_activities",
};

// OPTIMIZED: Only persist important activities to reduce Firebase writes
const PERSISTENT_ACTIVITY_TYPES = new Set([
  "buy",
  "sell",
  "create_token",
  "startup",
  "shutdown",
  "error",
  "insufficient_funds",
]);

// OPTIMIZED: Don't persist heartbeats and system messages
const PERSONALITY_ACTIONS = new Set([
  "buy",
  "sell",
  "create_token",
  "hold",
  "error",
]);

interface PersistentBotActivity {
  botName: string;
  displayName: string;
  avatarUrl: string;
  actionType: string;
  message: string;
  details: any;
  timestamp: string;
  isPersonalityAction: boolean;
  sessionId: string;

  // Financial metrics (if available)
  currentBalance?: number;
  pnlAmount?: number;
  pnlPercentage?: number;

  // Token info (if applicable)
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenName?: string;

  // Trade details (if applicable)
  tradeAmount?: number;
  txHash?: string;

  // Server timestamp for consistent ordering
  createdAt: any; // Firestore serverTimestamp
}

// OPTIMIZED: Batch Firebase writes and use connection pooling
let pendingWrites: PersistentBotActivity[] = [];
let writeTimeout: NodeJS.Timeout | null = null;

async function batchPersistToFirestore(): Promise<void> {
  if (pendingWrites.length === 0) return;

  try {
    // Process all pending writes
    const writes = [...pendingWrites];
    pendingWrites = []; // Clear queue immediately

    // OPTIMIZATION: Batch write to Firebase (up to 10 at a time)
    const batchSize = 10;
    for (let i = 0; i < writes.length; i += batchSize) {
      const batch = writes.slice(i, i + batchSize);

      // Write batch concurrently
      await Promise.all(
        batch.map((activityData) =>
          addDoc(collection(db, COLLECTIONS.BOT_ACTIVITIES), activityData)
        )
      );
    }

    console.log(`✅ Batch persisted ${writes.length} activities to Firestore`);
  } catch (error) {
    console.error(`❌ Failed to batch persist activities:`, error);
    // Re-queue failed writes
    pendingWrites.unshift(...pendingWrites);
  }
}

async function queueActivityForPersistence(
  botName: string,
  displayName: string,
  avatarUrl: string,
  actionType: string,
  details: any,
  timestamp: string,
  sessionId: string
): Promise<void> {
  // OPTIMIZATION: Only persist important activities
  if (!PERSISTENT_ACTIVITY_TYPES.has(actionType)) {
    return;
  }

  const activityData: PersistentBotActivity = {
    botName,
    displayName,
    avatarUrl,
    actionType,
    message: details.message || `${actionType} action`,
    details,
    timestamp,
    isPersonalityAction: PERSONALITY_ACTIONS.has(actionType),
    sessionId,
    createdAt: serverTimestamp(),
  };

  // Add financial metrics if available
  if (details.currentBalance !== undefined) {
    activityData.currentBalance = details.currentBalance;
  }
  if (details.pnlAmount !== undefined) {
    activityData.pnlAmount = details.pnlAmount;
  }
  if (details.pnlPercentage !== undefined) {
    activityData.pnlPercentage = details.pnlPercentage;
  }

  // Add token info if available
  if (details.tokenAddress) {
    activityData.tokenAddress = details.tokenAddress;
  }
  if (details.tokenSymbol) {
    activityData.tokenSymbol = details.tokenSymbol;
  }
  if (details.tokenName) {
    activityData.tokenName = details.tokenName;
  }

  // Add trade details if available
  if (details.amountAvax) {
    activityData.tradeAmount = details.amountAvax;
  }
  if (details.txHash) {
    activityData.txHash = details.txHash;
  }

  // OPTIMIZATION: Queue for batch processing
  pendingWrites.push(activityData);

  // OPTIMIZATION: Batch write after 5 seconds or when queue reaches 5 items
  if (pendingWrites.length >= 5) {
    if (writeTimeout) {
      clearTimeout(writeTimeout);
      writeTimeout = null;
    }
    await batchPersistToFirestore();
  } else if (!writeTimeout) {
    writeTimeout = setTimeout(async () => {
      writeTimeout = null;
      await batchPersistToFirestore();
    }, 5000);
  }
}

// OPTIMIZED: Cache recent activities to reduce Firebase reads
let cachedActivities: PersistentBotActivity[] = [];
let activitiesCacheExpiry = 0;
const ACTIVITIES_CACHE_DURATION = 30000; // 30 seconds

async function getRecentActivitiesFromFirestore(
  botName?: string,
  limitCount: number = 50
): Promise<PersistentBotActivity[]> {
  // OPTIMIZATION: Use cache if still valid
  const now = Date.now();
  if (now < activitiesCacheExpiry && !botName) {
    console.log(
      `📚 Using cached activities (${cachedActivities.length} items)`
    );
    return cachedActivities;
  }

  try {
    const activitiesRef = collection(db, COLLECTIONS.BOT_ACTIVITIES);

    const queryConstraints: any[] = [
      orderBy("createdAt", "desc"),
      limit(limitCount),
    ];

    // Filter by bot if specified (don't cache bot-specific queries)
    if (botName) {
      queryConstraints.unshift(where("botName", "==", botName));
    }

    const q = query(activitiesRef, ...queryConstraints);
    const snapshot = await getDocs(q);

    const activities: PersistentBotActivity[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as PersistentBotActivity;
      activities.push({
        ...data,
        id: doc.id,
      } as any);
    });

    // OPTIMIZATION: Cache general queries
    if (!botName) {
      cachedActivities = activities;
      activitiesCacheExpiry = now + ACTIVITIES_CACHE_DURATION;
      console.log(`📚 Cached ${activities.length} activities for 30 seconds`);
    }

    return activities;
  } catch (error) {
    console.error("❌ Failed to fetch activities from Firestore:", error);
    return cachedActivities; // Return cached data on error
  }
}

// OPTIMIZED: Memory cleanup for bot activities
function cleanupBotActivities() {
  if (botActivities.size <= MAX_STORED_BOTS) return;

  // Remove oldest bots (by lastSeen timestamp)
  const sortedBots = Array.from(botActivities.entries()).sort(
    ([, a], [, b]) =>
      new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime()
  );

  const botsToRemove = sortedBots.slice(
    0,
    botActivities.size - MAX_STORED_BOTS
  );
  botsToRemove.forEach(([botName]) => {
    botActivities.delete(botName);
  });

  console.log(`🧹 Cleaned up ${botsToRemove.length} old bot records`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      botName,
      displayName,
      avatarUrl,
      action,
      details,
      timestamp,
      botSecret,
    } = body;

    if (!botName || !action) {
      console.log("❌ POST request missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: botName, action" },
        { status: 400 }
      );
    }

    // OPTIMIZED: Authentication logic
    let isDevMode = false;
    let authPassed = false;

    if (
      DEV_MODE &&
      (!botSecret || botSecret === "dev" || botSecret === "test")
    ) {
      isDevMode = true;
      authPassed = true;
    } else if (BOT_SECRETS[botName as keyof typeof BOT_SECRETS] === botSecret) {
      authPassed = true;
    } else {
      console.log(
        `❌ Invalid bot secret for ${botName} (dev mode: ${DEV_MODE})`
      );
      return NextResponse.json(
        {
          error: "Invalid bot authentication",
          devMode: DEV_MODE,
          hint: DEV_MODE
            ? "Use 'dev' or 'test' as botSecret in dev mode"
            : "Valid botSecret required",
        },
        { status: 401 }
      );
    }

    if (!authPassed) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // OPTIMIZED: Get or create bot activity record
    let botActivity = botActivities.get(botName);
    const now = timestamp;

    if (!botActivity) {
      // First time seeing this bot
      botActivity = {
        botName,
        displayName: displayName || botName,
        avatarUrl: avatarUrl || "",
        bio: details?.bio,
        lastSeen: now,
        lastAction: {
          type: action,
          message: details?.message || `Bot ${botName} performed ${action}`,
          details: details || {},
          timestamp: now,
        },
        totalActions: 0,
        sessionStarted: now,
        character: details?.character,
        config: details?.config,
        isDevMode: isDevMode,
        lastHeartbeat: action === "heartbeat" ? now : "",
        consecutiveHeartbeats: action === "heartbeat" ? 1 : 0,
        missedHeartbeats: 0,
      };

      console.log(
        `${isDevMode ? "🔧 DEV" : "🤖 PROD"} New bot registered: ${displayName}`
      );
    }

    // Update dev mode status
    botActivity.isDevMode = isDevMode;

    // OPTIMIZED: Handle heartbeat tracking
    if (action === "heartbeat") {
      botActivity.lastHeartbeat = now;
      botActivity.consecutiveHeartbeats += 1;
      botActivity.missedHeartbeats = 0;
    } else {
      // Reset missed heartbeats on any activity
      botActivity.missedHeartbeats = 0;
    }

    // Generate session ID for grouping activities
    const sessionId = `${botName}_${botActivity.sessionStarted}`;

    // Handle startup action specially
    if (action === "startup") {
      // Reset for new session
      botActivity.sessionStarted = now;
      botActivity.totalActions = 0;
      botActivity.consecutiveHeartbeats = 0;
      botActivity.missedHeartbeats = 0;

      // Update bot metadata from startup details
      if (details?.bio) botActivity.bio = details.bio;
      if (details?.character) botActivity.character = details.character;
      if (details?.config) botActivity.config = details.config;

      console.log(
        `${isDevMode ? "🔧 DEV" : "🚀 PROD"} ${displayName} started new session`
      );
      if (details?.startingBalance) {
        console.log(
          `   💰 Starting balance: ${details.startingBalance.toFixed(4)} AVAX`
        );
      }
      if (details?.tokensFound) {
        console.log(`   🎯 Found ${details.tokensFound} tradeable tokens`);
      }
    } else if (action !== "heartbeat") {
      // Regular action - increment counter (don't count heartbeats)
      botActivity.totalActions += 1;
    }

    // Update last seen and action
    botActivity.lastSeen = now;
    botActivity.lastAction = {
      type: action,
      message: details?.message || `${action} action performed`,
      details: details || {},
      timestamp: now,
    };

    // Store updated activity in memory
    botActivities.set(botName, botActivity);

    // OPTIMIZED: Periodic cleanup
    if (Math.random() < 0.01) {
      // 1% chance on each request
      cleanupBotActivities();
    }

    // OPTIMIZED: Queue for batch persistence (only important activities)
    await queueActivityForPersistence(
      botName,
      displayName || botName,
      avatarUrl || "",
      action,
      details || {},
      now,
      sessionId
    );

    // OPTIMIZED: Minimal logging for heartbeats
    if (action === "heartbeat") {
      // Only log heartbeat every 10th time to reduce noise
      if (botActivity.consecutiveHeartbeats % 10 === 0) {
        console.log(
          `💓 ${displayName}: ${botActivity.consecutiveHeartbeats} heartbeats`
        );
      }
    } else {
      // Log other activities normally
      const modeLabel = isDevMode ? "🔧" : "🔄";
      console.log(
        `${modeLabel} ${displayName}: ${action}${
          details?.message ? ` - ${details.message}` : ""
        }`
      );

      // Log trade details
      if (action === "buy" && details?.tokenSymbol && details?.amountAvax) {
        console.log(
          `   💰 Bought ${details.tokenSymbol} with ${details.amountAvax} AVAX`
        );
      } else if (action === "sell" && details?.tokenSymbol) {
        const percentage = details.sellPercentage
          ? `${details.sellPercentage.toFixed(1)}%`
          : "";
        console.log(`   📈 Sold ${details.tokenSymbol} ${percentage}`);
      } else if (action === "create_token" && details?.tokenName) {
        console.log(
          `   🎨 Created token: ${details.tokenName} (${details.tokenSymbol})`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Bot activity recorded",
      devMode: isDevMode,
      botStatus: {
        name: botActivity.botName,
        displayName: botActivity.displayName,
        isOnline: true,
        lastSeen: botActivity.lastSeen,
        totalActions: botActivity.totalActions,
        sessionStarted: botActivity.sessionStarted,
        isDevMode: isDevMode,
      },
      persistence: {
        queued: PERSISTENT_ACTIVITY_TYPES.has(action),
        sessionId: sessionId,
      },
    });
  } catch (error) {
    console.error("❌ TVB Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botName = searchParams.get("bot");
    const includeHistory = searchParams.get("history") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    // OPTIMIZED: Better offline detection
    const currentTime = Date.now();
    const OFFLINE_THRESHOLD = 3 * 60 * 1000; // 3 minutes (was 5)
    const HEARTBEAT_THRESHOLD = 2.5 * 60 * 1000; // 2.5 minutes for heartbeat-based detection

    const botStatuses = Array.from(botActivities.values()).map((bot) => {
      const lastSeenTime = new Date(bot.lastSeen).getTime();
      const lastHeartbeatTime = bot.lastHeartbeat
        ? new Date(bot.lastHeartbeat).getTime()
        : 0;

      // OPTIMIZED: More sophisticated online detection
      let isOnline = false;

      if (lastHeartbeatTime > 0) {
        // Use heartbeat-based detection if available
        isOnline = currentTime - lastHeartbeatTime < HEARTBEAT_THRESHOLD;
      } else {
        // Fallback to last seen
        isOnline = currentTime - lastSeenTime < OFFLINE_THRESHOLD;
      }

      return {
        name: bot.botName,
        displayName: bot.displayName,
        avatarUrl: bot.avatarUrl,
        bio: bot.bio,
        isOnline,
        lastSeen: bot.lastSeen,
        lastAction: bot.lastAction,
        totalActions: bot.totalActions,
        sessionStarted: bot.sessionStarted,
        character: bot.character,
        config: bot.config,
        isDevMode: bot.isDevMode || false,
      };
    });

    // OPTIMIZED: Cache-friendly metrics
    const devBots = botStatuses.filter((bot) => bot.isDevMode).length;
    const prodBots = botStatuses.filter((bot) => !bot.isDevMode).length;
    const onlineBots = botStatuses.filter((bot) => bot.isOnline).length;

    const response: any = {
      success: true,
      bots: botStatuses,
      totalBots: botStatuses.length,
      onlineBots: onlineBots,
      devMode: DEV_MODE,
      devBots: devBots,
      prodBots: prodBots,
      timestamp: new Date().toISOString(),
    };

    // OPTIMIZED: Only fetch historical data when specifically requested
    if (includeHistory) {
      try {
        const activities = await getRecentActivitiesFromFirestore(
          botName || undefined,
          limit
        );

        response.activities = activities;
        response.activityCount = activities.length;
      } catch (error) {
        console.error("❌ Failed to fetch historical activities:", error);
        response.activities = [];
        response.activityError = "Failed to fetch historical activities";
      }
    }

    // OPTIMIZED: Minimal logging
    if (Math.random() < 0.1) {
      // Only log 10% of GET requests
      console.log(
        `📊 Status: ${botStatuses.length} bots (${onlineBots} online, ${devBots} dev, ${prodBots} prod)`
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ TVB Status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// OPTIMIZED: Cleanup endpoint with better memory management
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Clear activities cache
    cachedActivities = [];
    activitiesCacheExpiry = 0;

    // Flush any pending writes
    if (writeTimeout) {
      clearTimeout(writeTimeout);
      writeTimeout = null;
    }
    await batchPersistToFirestore();

    return NextResponse.json({
      success: true,
      message: `Cache cleared and pending writes flushed`,
    });
  } catch (error) {
    console.error("❌ TVB Cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
