// app/api/tvb/webhook/route.ts - MINIMAL: Only startup + heartbeat persistence

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
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
  companion_cube: "companion_cube_secret_2024",
};

// MINIMAL: Just track basic bot info in memory
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
  isDevMode?: boolean;

  // Session metrics for display
  startingBalance?: number;
  currentBalance?: number;
  pnlAmount?: number;
  pnlPercentage?: number;
  sessionDurationMinutes?: number;
}

// MINIMAL: Firebase profile for persistence (startup + heartbeat only)
interface BotProfile {
  botName: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  character?: any;
  config?: any;
  walletAddress?: string;
  lastStartup: string;
  lastHeartbeat: string;
  isOnline: boolean;
  createdAt: any;
  updatedAt: any;
}

// In-memory storage
const botActivities = new Map<string, BotActivity>();
const MAX_STORED_BOTS = 50;

// Firebase collection
const BOT_PROFILES_COLLECTION = "bot_profiles";

// MINIMAL: Only save startup profile to Firebase
async function saveStartupProfile(botData: BotProfile): Promise<void> {
  try {
    const docRef = doc(db, BOT_PROFILES_COLLECTION, botData.botName);

    // Check if profile already exists
    const existingDoc = await getDoc(docRef);

    if (existingDoc.exists()) {
      // Bot exists - just update startup time and online status
      await setDoc(
        docRef,
        {
          lastStartup: botData.lastStartup,
          lastHeartbeat: botData.lastHeartbeat,
          isOnline: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log(`🔄 ${botData.displayName}: session restarted`);
    } else {
      // New bot - save full profile
      await setDoc(docRef, {
        ...botData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`🚀 NEW bot registered: ${botData.displayName}`);
    }
  } catch (error) {
    console.error(
      `❌ Failed to save startup profile for ${botData.botName}:`,
      error
    );
  }
}

// MINIMAL: Only update heartbeat timestamp in Firebase
async function updateHeartbeat(
  botName: string,
  timestamp: string
): Promise<void> {
  try {
    const docRef = doc(db, BOT_PROFILES_COLLECTION, botName);
    await setDoc(
      docRef,
      {
        lastHeartbeat: timestamp,
        isOnline: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error(`❌ Failed to update heartbeat for ${botName}:`, error);
  }
}

// MINIMAL: Get bot profile from Firebase
async function getBotProfile(botName: string): Promise<BotProfile | null> {
  try {
    const docRef = doc(db, BOT_PROFILES_COLLECTION, botName);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as BotProfile;
    }
    return null;
  } catch (error) {
    console.error(`❌ Failed to get bot profile for ${botName}:`, error);
    return null;
  }
}

// Cleanup old memory records
function cleanupMemory() {
  if (botActivities.size <= MAX_STORED_BOTS) return;

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

  console.log(`🧹 Cleaned up ${botsToRemove.length} old memory records`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      botName,
      displayName,
      avatarUrl,
      action,
      details,
      timestamp,
      botSecret,
      bio,
      walletAddress,
    } = body;

    if (!botName || !action) {
      return NextResponse.json(
        { error: "Missing required fields: botName, action" },
        { status: 400 }
      );
    }

    // Authentication
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
      return NextResponse.json(
        { error: "Invalid bot authentication" },
        { status: 401 }
      );
    }

    if (!authPassed) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    const now = timestamp || new Date().toISOString();

    // MINIMAL: Handle startup action - save to Firebase
    if (action === "startup") {
      const profileData: BotProfile = {
        botName,
        displayName: displayName || botName,
        avatarUrl: avatarUrl || "",
        bio: bio || details?.bio,
        character: details?.character,
        config: details?.config,
        walletAddress: walletAddress || details?.walletAddress,
        lastStartup: now,
        lastHeartbeat: now,
        isOnline: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Save to Firebase (non-blocking)
      saveStartupProfile(profileData);

      if (details?.startingBalance !== undefined) {
        console.log(
          `   💰 Starting balance: ${details.startingBalance.toFixed(4)} AVAX`
        );
      }
      if (details?.tokensFound !== undefined) {
        console.log(`   🎯 Found ${details.tokensFound} tradeable tokens`);
      }
    }

    // MINIMAL: Handle heartbeat - update Firebase timestamp only
    if (action === "heartbeat") {
      // Update Firebase heartbeat every 5th heartbeat to reduce writes
      if (Math.random() < 0.2) {
        // 20% of heartbeats = ~every 5th one
        updateHeartbeat(botName, now);
      }
    }

    // MINIMAL: Update in-memory record
    let botActivity = botActivities.get(botName);

    if (!botActivity) {
      botActivity = {
        botName,
        displayName: displayName || botName,
        avatarUrl: avatarUrl || "",
        bio: bio || details?.bio,
        lastSeen: now,
        lastAction: {
          type: action,
          message: details?.message || `${action} action`,
          details: details || {},
          timestamp: now,
        },
        totalActions: 0,
        sessionStarted: now,
        isDevMode: isDevMode,
      };
    }

    // Update activity
    botActivity.isDevMode = isDevMode;
    botActivity.lastSeen = now;
    botActivity.lastAction = {
      type: action,
      message: details?.message || `${action} action`,
      details: details || {},
      timestamp: now,
    };

    // Handle startup specially
    if (action === "startup") {
      botActivity.sessionStarted = now;
      botActivity.totalActions = 0;
      if (details?.startingBalance !== undefined) {
        botActivity.startingBalance = details.startingBalance;
      }
    } else if (action !== "heartbeat") {
      botActivity.totalActions += 1;
    }

    // Update session metrics
    if (details?.currentBalance !== undefined) {
      botActivity.currentBalance = details.currentBalance;
      if (botActivity.startingBalance !== undefined) {
        botActivity.pnlAmount =
          details.currentBalance - botActivity.startingBalance;
        botActivity.pnlPercentage =
          botActivity.startingBalance > 0
            ? (botActivity.pnlAmount / botActivity.startingBalance) * 100
            : 0;
      }
    }

    // Calculate session duration
    if (botActivity.sessionStarted) {
      const sessionStart = new Date(botActivity.sessionStarted).getTime();
      const currentTime = new Date(now).getTime();
      botActivity.sessionDurationMinutes = Math.floor(
        (currentTime - sessionStart) / (1000 * 60)
      );
    }

    botActivities.set(botName, botActivity);

    // Periodic cleanup
    if (Math.random() < 0.01) {
      cleanupMemory();
    }

    // MINIMAL: Reduced logging
    if (action === "heartbeat") {
      // Only log heartbeat occasionally
      if (Math.random() < 0.02) {
        // 2% of heartbeats
        console.log(
          `💓 ${displayName}: heartbeat (${botActivity.totalActions} actions)`
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
        currentBalance: botActivity.currentBalance,
        pnlAmount: botActivity.pnlAmount,
        pnlPercentage: botActivity.pnlPercentage,
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

    // Better offline detection
    const currentTime = Date.now();
    const OFFLINE_THRESHOLD = 3 * 60 * 1000; // 3 minutes

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
        isDevMode: bot.isDevMode || false,
        startingBalance: bot.startingBalance,
        currentBalance: bot.currentBalance,
        pnlAmount: bot.pnlAmount,
        pnlPercentage: bot.pnlPercentage,
        sessionDurationMinutes: bot.sessionDurationMinutes,
      };
    });

    // Filter by specific bot if requested
    const filteredBots = botName
      ? botStatuses.filter((bot) => bot.name === botName)
      : botStatuses;

    const devBots = botStatuses.filter((bot) => bot.isDevMode).length;
    const prodBots = botStatuses.filter((bot) => !bot.isDevMode).length;
    const onlineBots = botStatuses.filter((bot) => bot.isOnline).length;

    const response = {
      success: true,
      bots: filteredBots,
      totalBots: botStatuses.length,
      onlineBots: onlineBots,
      devMode: DEV_MODE,
      devBots: devBots,
      prodBots: prodBots,
      timestamp: new Date().toISOString(),
    };

    // Only log occasionally
    if (Math.random() < 0.1) {
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botName = searchParams.get("bot");

    let clearedCount = 0;

    if (botName) {
      if (botActivities.has(botName)) {
        botActivities.delete(botName);
        clearedCount = 1;
      }
    } else {
      clearedCount = botActivities.size;
      botActivities.clear();
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedCount} bot records from memory`,
    });
  } catch (error) {
    console.error("❌ TVB Cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
