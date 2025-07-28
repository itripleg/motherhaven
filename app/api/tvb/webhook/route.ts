// app/api/tvb/webhook/route.ts - HYBRID: Firebase for startup data, memory for real-time activity

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
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

// HYBRID: Firebase for persistent bot profiles
interface BotProfile {
  botName: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  character?: any;
  config?: any;
  walletAddress?: string;
  createdAt: any;
  lastStartup: string;
  lastSeen?: string; // Added for heartbeat persistence
}

// HYBRID: In-memory for real-time status and activity
interface BotRuntimeStatus {
  botName: string;
  displayName: string;
  isOnline: boolean;
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

  // Session metrics (real-time only)
  startingBalance?: number;
  currentBalance?: number;
  pnlAmount?: number;
  pnlPercentage?: number;
  sessionDurationMinutes?: number;
}

// HYBRID: Combined bot data for API responses
interface BotData {
  // Profile data (from Firebase)
  botName: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  character?: any;
  config?: any;
  walletAddress?: string;
  createdAt: any;
  lastStartup: string;

  // Runtime status (from memory + Firebase)
  isOnline: boolean;
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
  startingBalance?: number;
  currentBalance?: number;
  pnlAmount?: number;
  pnlPercentage?: number;
  sessionDurationMinutes?: number;
}

// In-memory storage for real-time data
const botRuntimeStatus = new Map<string, BotRuntimeStatus>();
const MAX_STORED_BOTS = 50;

// Firebase collections
const BOT_PROFILES_COLLECTION = "bot_profiles";

// Cache for Firebase bot profiles (to reduce reads)
const profileCache = new Map<
  string,
  { profile: BotProfile; timestamp: number }
>();
const PROFILE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function saveBotProfile(botData: BotProfile): Promise<void> {
  try {
    const docRef = doc(db, BOT_PROFILES_COLLECTION, botData.botName);
    await setDoc(
      docRef,
      {
        ...botData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Update cache
    profileCache.set(botData.botName, {
      profile: botData,
      timestamp: Date.now(),
    });

    console.log(`💾 Saved bot profile: ${botData.displayName}`);
  } catch (error) {
    console.error(
      `❌ Failed to save bot profile for ${botData.botName}:`,
      error
    );
  }
}

async function loadBotProfile(botName: string): Promise<BotProfile | null> {
  try {
    // Check cache first
    const cached = profileCache.get(botName);
    if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_DURATION) {
      console.log(`📚 Using cached profile for ${botName}`);
      return cached.profile;
    }

    // Load from Firebase
    const docRef = doc(db, BOT_PROFILES_COLLECTION, botName);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const profile = docSnap.data() as BotProfile;

      // Update cache
      profileCache.set(botName, {
        profile,
        timestamp: Date.now(),
      });

      console.log(
        `📖 Loaded bot profile from Firebase: ${profile.displayName}`
      );
      return profile;
    }

    return null;
  } catch (error) {
    console.error(`❌ Failed to load bot profile for ${botName}:`, error);
    return null;
  }
}

async function loadAllBotProfiles(): Promise<BotProfile[]> {
  try {
    console.log("📖 Loading all bot profiles from Firebase...");

    const profilesRef = collection(db, BOT_PROFILES_COLLECTION);
    const snapshot = await getDocs(profilesRef);

    const profiles: BotProfile[] = [];
    snapshot.forEach((doc) => {
      const profile = doc.data() as BotProfile;
      profiles.push(profile);

      // Update cache
      profileCache.set(profile.botName, {
        profile,
        timestamp: Date.now(),
      });
    });

    console.log(`📖 Loaded ${profiles.length} bot profiles from Firebase`);
    return profiles;
  } catch (error) {
    console.error("❌ Failed to load bot profiles:", error);
    return [];
  }
}

// Cleanup old runtime status
function cleanupRuntimeStatus() {
  if (botRuntimeStatus.size <= MAX_STORED_BOTS) return;

  const sortedBots = Array.from(botRuntimeStatus.entries()).sort(
    ([, a], [, b]) =>
      new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime()
  );

  const botsToRemove = sortedBots.slice(
    0,
    botRuntimeStatus.size - MAX_STORED_BOTS
  );
  botsToRemove.forEach(([botName]) => {
    botRuntimeStatus.delete(botName);
  });

  console.log(`🧹 Cleaned up ${botsToRemove.length} old runtime records`);
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
      bio,
      walletAddress,
    } = body;

    if (!botName || !action) {
      console.log("❌ POST request missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: botName, action" },
        { status: 400 }
      );
    }

    // Authentication logic
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

    const now = timestamp || new Date().toISOString();

    // HYBRID: Handle startup action - save profile to Firebase
    if (action === "startup") {
      const profileData: BotProfile = {
        botName,
        displayName: displayName || botName,
        avatarUrl: avatarUrl || "",
        bio: bio || details?.bio,
        character: details?.character,
        config: details?.config,
        walletAddress: walletAddress || details?.walletAddress,
        createdAt: serverTimestamp(),
        lastStartup: now,
      };

      // Save to Firebase (non-blocking)
      saveBotProfile(profileData);

      console.log(
        `${
          isDevMode ? "🔧 DEV" : "🚀 PROD"
        } ${displayName} startup - profile saved to Firebase`
      );
      if (details?.startingBalance !== undefined) {
        console.log(
          `   💰 Starting balance: ${details.startingBalance.toFixed(4)} AVAX`
        );
      }
      if (details?.tokensFound !== undefined) {
        console.log(`   🎯 Found ${details.tokensFound} tradeable tokens`);
      }
    }

    // HYBRID: Update heartbeat in Firebase to maintain online status
    if (action === "heartbeat" || action === "startup") {
      // Update just the lastSeen timestamp in Firebase (lightweight update)
      try {
        const docRef = doc(db, BOT_PROFILES_COLLECTION, botName);
        await setDoc(
          docRef,
          {
            lastSeen: now,
            isOnline: true,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Update cache with new lastSeen
        const cached = profileCache.get(botName);
        if (cached) {
          cached.profile.lastSeen = now;
          cached.timestamp = Date.now(); // Refresh cache timestamp
        }

        // Only log occasionally for heartbeats
        if (action === "startup" || Math.random() < 0.01) {
          // 1% of heartbeats
          console.log(`💓 ${displayName}: heartbeat persisted to Firebase`);
        }
      } catch (error) {
        console.error(`❌ Failed to update heartbeat for ${botName}:`, error);
      }
    }

    // HYBRID: Update runtime status in memory
    let runtimeStatus = botRuntimeStatus.get(botName);

    if (!runtimeStatus) {
      // First time seeing this bot in this session
      runtimeStatus = {
        botName,
        displayName: displayName || botName,
        isOnline: true,
        lastSeen: now,
        lastAction: {
          type: action,
          message: details?.message || `Bot ${botName} performed ${action}`,
          details: details || {},
          timestamp: now,
        },
        totalActions: 0,
        sessionStarted: now,
        isDevMode: isDevMode,
      };

      console.log(
        `${
          isDevMode ? "🔧 DEV" : "🤖 PROD"
        } New runtime session: ${displayName}`
      );
    }

    // Update runtime status
    runtimeStatus.isDevMode = isDevMode;
    runtimeStatus.lastSeen = now;
    runtimeStatus.lastAction = {
      type: action,
      message: details?.message || `${action} action performed`,
      details: details || {},
      timestamp: now,
    };

    // Handle different action types
    if (action === "startup") {
      // Reset for new session
      runtimeStatus.sessionStarted = now;
      runtimeStatus.totalActions = 0;
      if (details?.startingBalance !== undefined) {
        runtimeStatus.startingBalance = details.startingBalance;
      }
    } else if (action !== "heartbeat") {
      // Regular action - increment counter (don't count heartbeats)
      runtimeStatus.totalActions += 1;
    }

    // Update session metrics if provided
    if (details?.currentBalance !== undefined) {
      runtimeStatus.currentBalance = details.currentBalance;

      // Calculate P&L if we have starting balance
      if (runtimeStatus.startingBalance !== undefined) {
        runtimeStatus.pnlAmount =
          details.currentBalance - runtimeStatus.startingBalance;
        runtimeStatus.pnlPercentage =
          runtimeStatus.startingBalance > 0
            ? (runtimeStatus.pnlAmount / runtimeStatus.startingBalance) * 100
            : 0;
      }
    }

    // Calculate session duration
    if (runtimeStatus.sessionStarted) {
      const sessionStart = new Date(runtimeStatus.sessionStarted).getTime();
      const currentTime = new Date(now).getTime();
      runtimeStatus.sessionDurationMinutes = Math.floor(
        (currentTime - sessionStart) / (1000 * 60)
      );
    }

    // Store updated runtime status
    botRuntimeStatus.set(botName, runtimeStatus);

    // Periodic cleanup
    if (Math.random() < 0.01) {
      // 1% chance on each request
      cleanupRuntimeStatus();
    }

    // Logging
    if (action === "heartbeat") {
      // Only log heartbeat occasionally to reduce noise
      if (Math.random() < 0.05) {
        // 5% of heartbeats
        console.log(
          `💓 ${displayName}: heartbeat (${runtimeStatus.totalActions} actions)`
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
        name: runtimeStatus.botName,
        displayName: runtimeStatus.displayName,
        isOnline: true,
        lastSeen: runtimeStatus.lastSeen,
        totalActions: runtimeStatus.totalActions,
        sessionStarted: runtimeStatus.sessionStarted,
        isDevMode: isDevMode,
        currentBalance: runtimeStatus.currentBalance,
        pnlAmount: runtimeStatus.pnlAmount,
        pnlPercentage: runtimeStatus.pnlPercentage,
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

    // HYBRID: Combine Firebase profiles with runtime status
    const combinedBots: BotData[] = [];

    if (botName) {
      // Get specific bot
      const profile = await loadBotProfile(botName);
      const runtime = botRuntimeStatus.get(botName);

      if (profile || runtime) {
        combinedBots.push({
          // Firebase profile data (persistent)
          botName: profile?.botName || runtime?.botName || botName,
          displayName: profile?.displayName || runtime?.displayName || botName,
          avatarUrl: profile?.avatarUrl || "/default.png",
          bio: profile?.bio,
          character: profile?.character,
          config: profile?.config,
          walletAddress: profile?.walletAddress,
          createdAt: profile?.createdAt,
          lastStartup: profile?.lastStartup || "",

          // Runtime status (memory + Firebase lastSeen)
          isOnline: runtime
            ? Date.now() - new Date(runtime.lastSeen).getTime() < 3 * 60 * 1000
            : profile?.lastSeen
            ? Date.now() - new Date(profile.lastSeen).getTime() < 3 * 60 * 1000
            : false,
          lastSeen:
            runtime?.lastSeen ||
            profile?.lastSeen ||
            profile?.lastStartup ||
            new Date().toISOString(),
          lastAction: runtime?.lastAction || {
            type: "unknown",
            message: "No recent activity",
            details: {},
            timestamp: profile?.lastStartup || new Date().toISOString(),
          },
          totalActions: runtime?.totalActions || 0,
          sessionStarted:
            runtime?.sessionStarted ||
            profile?.lastStartup ||
            new Date().toISOString(),
          isDevMode: runtime?.isDevMode || false,
          startingBalance: runtime?.startingBalance,
          currentBalance: runtime?.currentBalance,
          pnlAmount: runtime?.pnlAmount,
          pnlPercentage: runtime?.pnlPercentage,
          sessionDurationMinutes: runtime?.sessionDurationMinutes,
        });
      }
    } else {
      // Get all bots - combine profiles with runtime status
      const profiles = await loadAllBotProfiles();
      const runtimeBots = Array.from(botRuntimeStatus.values());

      // Create a map of all unique bots
      const allBotNames = new Set([
        ...profiles.map((p) => p.botName),
        ...runtimeBots.map((r) => r.botName),
      ]);

      for (const name of allBotNames) {
        const profile = profiles.find((p) => p.botName === name);
        const runtime = runtimeBots.find((r) => r.botName === name);

        combinedBots.push({
          // Firebase profile data (persistent)
          botName: profile?.botName || runtime?.botName || name,
          displayName: profile?.displayName || runtime?.displayName || name,
          avatarUrl: profile?.avatarUrl || "/default.png",
          bio: profile?.bio,
          character: profile?.character,
          config: profile?.config,
          walletAddress: profile?.walletAddress,
          createdAt: profile?.createdAt,
          lastStartup: profile?.lastStartup || "",

          // Runtime status (memory + Firebase lastSeen)
          isOnline: runtime
            ? Date.now() - new Date(runtime.lastSeen).getTime() < 3 * 60 * 1000
            : profile?.lastSeen
            ? Date.now() - new Date(profile.lastSeen).getTime() < 3 * 60 * 1000
            : false,
          lastSeen:
            runtime?.lastSeen ||
            profile?.lastSeen ||
            profile?.lastStartup ||
            new Date().toISOString(),
          lastAction: runtime?.lastAction || {
            type: "startup",
            message: "Bot profile loaded",
            details: {},
            timestamp: profile?.lastStartup || new Date().toISOString(),
          },
          totalActions: runtime?.totalActions || 0,
          sessionStarted:
            runtime?.sessionStarted ||
            profile?.lastStartup ||
            new Date().toISOString(),
          isDevMode: runtime?.isDevMode || false,
          startingBalance: runtime?.startingBalance,
          currentBalance: runtime?.currentBalance,
          pnlAmount: runtime?.pnlAmount,
          pnlPercentage: runtime?.pnlPercentage,
          sessionDurationMinutes: runtime?.sessionDurationMinutes,
        });
      }
    }

    // Calculate metrics
    const onlineBots = combinedBots.filter((bot) => bot.isOnline).length;
    const devBots = combinedBots.filter((bot) => bot.isDevMode).length;
    const prodBots = combinedBots.filter((bot) => !bot.isDevMode).length;

    const response: any = {
      success: true,
      bots: combinedBots,
      totalBots: combinedBots.length,
      onlineBots: onlineBots,
      devMode: DEV_MODE,
      devBots: devBots,
      prodBots: prodBots,
      timestamp: new Date().toISOString(),
      dataSource: "hybrid", // Firebase profiles + Memory runtime
    };

    // Only log occasionally to reduce noise
    if (Math.random() < 0.1) {
      console.log(
        `📊 Hybrid Status: ${combinedBots.length} bots (${onlineBots} online, ${devBots} dev, ${prodBots} prod)`
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

// Cleanup endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botName = searchParams.get("bot");

    let clearedCount = 0;

    if (botName) {
      // Clear specific bot runtime status
      if (botRuntimeStatus.has(botName)) {
        botRuntimeStatus.delete(botName);
        clearedCount = 1;
      }
      // Note: We don't delete Firebase profiles as they should persist
    } else {
      // Clear all runtime status
      clearedCount = botRuntimeStatus.size;
      botRuntimeStatus.clear();
      profileCache.clear(); // Clear profile cache too
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedCount} runtime records (profiles preserved)`,
    });
  } catch (error) {
    console.error("❌ TVB Cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
