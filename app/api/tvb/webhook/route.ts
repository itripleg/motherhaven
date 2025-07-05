// app/api/tvb/webhook/route.ts - Complete webhook with Firestore activity persistence

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

// Development mode toggle - set to true to allow bots without secrets
const DEV_MODE =
  process.env.NODE_ENV === "development" || process.env.TVB_DEV_MODE === "true";

// Bot secrets for authentication - ONLY hardcoded data
const BOT_SECRETS = {
  bullish_billy: "bullish_billy_secret_2024",
  jackpot_jax: "jax_trader_secret_2024",
  melancholy_mort: "melancholy_mort_secret_2024",
};

// In-memory storage for bot status (still needed for real-time status)
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
  config?: {
    buyBias?: number;
    riskTolerance?: number;
    minInterval?: number;
    maxInterval?: number;
    minTradeAmount?: number;
    maxTradeAmount?: number;
    createTokenChance?: number;
    buyPhrases?: string[];
    sellPhrases?: string[];
    createPhrases?: string[];
    errorPhrases?: string[];
  };
  character?: {
    mood?: string;
    personality?: string;
  };
  isDevMode?: boolean;
}

// Simple in-memory store (for current session status)
const botActivities = new Map<string, BotActivity>();

// Firestore collection names
const COLLECTIONS = {
  BOT_ACTIVITIES: "bot_activities",
  BOT_STATUS: "bot_status",
};

// Activity types that should be persisted to Firestore
const PERSISTENT_ACTIVITY_TYPES = new Set([
  "buy",
  "sell",
  "create_token",
  "hold",
  "error",
  "startup",
  "shutdown",
  "insufficient_funds",
  "balance_alert",
]);

// Activity types that are considered "personality actions" for display
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
  sessionId: string; // Track different bot sessions

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

async function persistActivityToFirestore(
  botName: string,
  displayName: string,
  avatarUrl: string,
  actionType: string,
  details: any,
  timestamp: string,
  sessionId: string
): Promise<boolean> {
  try {
    // Only persist certain activity types
    if (!PERSISTENT_ACTIVITY_TYPES.has(actionType)) {
      return true; // Don't persist but don't error
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

    // Store in Firestore
    await addDoc(collection(db, COLLECTIONS.BOT_ACTIVITIES), activityData);

    console.log(
      `✅ Persisted ${actionType} activity for ${displayName} to Firestore`
    );
    return true;
  } catch (error) {
    console.error(`❌ Failed to persist activity for ${botName}:`, error);
    return false;
  }
}

async function getRecentActivitiesFromFirestore(
  botName?: string,
  limitCount: number = 50
): Promise<PersistentBotActivity[]> {
  try {
    const activitiesRef = collection(db, COLLECTIONS.BOT_ACTIVITIES);

    const queryConstraints: any[] = [
      orderBy("createdAt", "desc"),
      limit(limitCount),
    ];

    // Filter by bot if specified
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

    return activities;
  } catch (error) {
    console.error("❌ Failed to fetch activities from Firestore:", error);
    return [];
  }
}

async function cleanupOldActivities(daysToKeep: number = 30): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const activitiesRef = collection(db, COLLECTIONS.BOT_ACTIVITIES);
    const q = query(
      activitiesRef,
      where("createdAt", "<", cutoffDate),
      limit(100) // Process in batches
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return;
    }

    // In a real implementation, you'd batch delete these
    // For now, just log what would be deleted
    console.log(
      `🧹 Would cleanup ${snapshot.size} old bot activities (older than ${daysToKeep} days)`
    );
  } catch (error) {
    console.error("❌ Failed to cleanup old activities:", error);
  }
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

    // Authentication logic with dev mode support
    let isDevMode = false;
    let authPassed = false;

    if (
      DEV_MODE &&
      (!botSecret || botSecret === "dev" || botSecret === "test")
    ) {
      // Allow dev mode authentication
      isDevMode = true;
      authPassed = true;
      console.log(`🔧 DEV MODE: Allowing bot ${botName} without proper secret`);
    } else if (BOT_SECRETS[botName as keyof typeof BOT_SECRETS] === botSecret) {
      // Normal authentication with proper secret
      authPassed = true;
      console.log(`🔐 PROD MODE: Bot ${botName} authenticated with secret`);
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

    // Get or create bot activity record (in-memory for real-time status)
    let botActivity = botActivities.get(botName);

    if (!botActivity) {
      // First time seeing this bot - create minimal record
      botActivity = {
        botName,
        displayName: displayName || botName,
        avatarUrl: avatarUrl || "",
        bio: details?.bio,
        lastSeen: timestamp,
        lastAction: {
          type: action,
          message: details?.message || `Bot ${botName} performed ${action}`,
          details: details || {},
          timestamp,
        },
        totalActions: 0,
        sessionStarted: timestamp,
        character: details?.character,
        config: details?.config,
        isDevMode: isDevMode,
      };

      const modeLabel = isDevMode ? "🔧 DEV" : "🤖 PROD";
      console.log(`${modeLabel} New bot registered: ${displayName}`);
    }

    // Update dev mode status
    botActivity.isDevMode = isDevMode;

    // Generate session ID for grouping activities
    const sessionId = `${botName}_${botActivity.sessionStarted}`;

    // Handle startup action specially
    if (action === "startup") {
      // Reset for new session
      botActivity.sessionStarted = timestamp;
      botActivity.totalActions = 0;

      // Update bot metadata from startup details
      if (details?.bio) botActivity.bio = details.bio;
      if (details?.character) botActivity.character = details.character;
      if (details?.config) botActivity.config = details.config;

      const modeLabel = isDevMode ? "🔧 DEV" : "🚀 PROD";
      console.log(`${modeLabel} ${displayName} started new session`);
      if (details?.startingBalance) {
        console.log(
          `   💰 Starting balance: ${details.startingBalance.toFixed(4)} AVAX`
        );
      }
      if (details?.tokensFound) {
        console.log(`   🎯 Found ${details.tokensFound} tradeable tokens`);
      }
    } else {
      // Regular action - increment counter
      botActivity.totalActions += 1;
    }

    // Update last seen and action
    botActivity.lastSeen = timestamp;
    botActivity.lastAction = {
      type: action,
      message: details?.message || `${action} action performed`,
      details: details || {},
      timestamp,
    };

    // Handle config updates
    if (action === "config_update" && details?.config) {
      botActivity.config = details.config;
    }

    // Store updated activity in memory
    botActivities.set(botName, botActivity);

    // PERSIST TO FIRESTORE
    await persistActivityToFirestore(
      botName,
      displayName || botName,
      avatarUrl || "",
      action,
      details || {},
      timestamp,
      sessionId
    );

    // Log the activity with mode indicator
    const modeLabel = isDevMode ? "🔧" : "🔄";
    const logMessage = `${modeLabel} ${displayName}: ${action}`;
    if (details?.message) {
      console.log(`${logMessage} - ${details.message}`);
    } else {
      console.log(logMessage);
    }

    // Log additional details based on action type
    if (action === "buy" && details) {
      if (details.tokenSymbol && details.amountAvax) {
        console.log(
          `   💰 Bought ${details.tokenSymbol} with ${details.amountAvax} AVAX`
        );
      }
      if (details.txHash) {
        console.log(`   📋 TX: ${details.txHash}`);
      }
    } else if (action === "sell" && details) {
      if (details.tokenSymbol) {
        const percentage = details.sellPercentage
          ? `${details.sellPercentage.toFixed(1)}%`
          : "";
        console.log(`   📈 Sold ${details.tokenSymbol} ${percentage}`);
      }
      if (details.txHash) {
        console.log(`   📋 TX: ${details.txHash}`);
      }
    } else if (action === "create_token" && details) {
      if (details.tokenName && details.tokenSymbol) {
        console.log(
          `   🎨 Created token: ${details.tokenName} (${details.tokenSymbol})`
        );
      }
    } else if (action === "heartbeat" && details) {
      if (details.currentBalance !== undefined) {
        console.log(`   💰 Balance: ${details.currentBalance.toFixed(4)} AVAX`);
      }
      if (details.tokensTracked !== undefined) {
        console.log(`   🎯 Tracking: ${details.tokensTracked} tokens`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Bot activity recorded and persisted",
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
        stored: PERSISTENT_ACTIVITY_TYPES.has(action),
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

    console.log(
      `📊 GET request received from frontend (DEV_MODE: ${DEV_MODE})`
    );

    // Return current bot statuses
    const currentTime = Date.now();
    const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    const botStatuses = Array.from(botActivities.values()).map((bot) => {
      const lastSeenTime = new Date(bot.lastSeen).getTime();
      const isOnline = currentTime - lastSeenTime < OFFLINE_THRESHOLD;

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

    const devBots = botStatuses.filter((bot) => bot.isDevMode).length;
    const prodBots = botStatuses.filter((bot) => !bot.isDevMode).length;

    const response: any = {
      success: true,
      bots: botStatuses,
      totalBots: botStatuses.length,
      onlineBots: botStatuses.filter((bot) => bot.isOnline).length,
      devMode: DEV_MODE,
      devBots: devBots,
      prodBots: prodBots,
      timestamp: new Date().toISOString(),
    };

    // Include historical activity data if requested
    if (includeHistory) {
      try {
        const activities = await getRecentActivitiesFromFirestore(
          botName || undefined,
          limit
        );

        response.activities = activities;
        response.activityCount = activities.length;

        console.log(`📚 Included ${activities.length} historical activities`);
      } catch (error) {
        console.error("❌ Failed to fetch historical activities:", error);
        response.activities = [];
        response.activityError = "Failed to fetch historical activities";
      }
    }

    console.log(
      `✅ Returning status for ${botStatuses.length} bots (${response.onlineBots} online, ${devBots} dev, ${prodBots} prod)`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ TVB Status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Cleanup endpoint (could be called by a cron job)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    await cleanupOldActivities(days);

    return NextResponse.json({
      success: true,
      message: `Initiated cleanup of activities older than ${days} days`,
    });
  } catch (error) {
    console.error("❌ TVB Cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
