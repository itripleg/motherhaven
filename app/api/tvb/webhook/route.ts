// app/api/tvb/webhook/route.ts - SIMPLIFIED webhook with in-memory storage only

import { NextRequest, NextResponse } from "next/server";

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

// SIMPLIFIED: In-memory storage only - no Firebase
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
  walletAddress?: string;

  // Session metrics
  startingBalance?: number;
  currentBalance?: number;
  pnlAmount?: number;
  pnlPercentage?: number;
  sessionDurationMinutes?: number;
}

// SIMPLIFIED: Just in-memory storage
const botActivities = new Map<string, BotActivity>();
const MAX_STORED_BOTS = 50;

// SIMPLIFIED: Activity history (keep last 100 activities per bot)
interface ActivityEntry {
  id: string;
  botName: string;
  actionType: string;
  message: string;
  timestamp: string;
  details: any;
}

const recentActivities = new Map<string, ActivityEntry[]>();
const MAX_ACTIVITIES_PER_BOT = 100;
const MAX_GLOBAL_ACTIVITIES = 500;

function addActivity(botName: string, activity: ActivityEntry) {
  // Add to bot-specific activities
  if (!recentActivities.has(botName)) {
    recentActivities.set(botName, []);
  }

  const botActivities = recentActivities.get(botName)!;
  botActivities.unshift(activity); // Add to front

  // Keep only latest activities per bot
  if (botActivities.length > MAX_ACTIVITIES_PER_BOT) {
    botActivities.splice(MAX_ACTIVITIES_PER_BOT);
  }

  // Global cleanup - remove oldest activities if we have too many total
  const totalActivities = Array.from(recentActivities.values()).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  if (totalActivities > MAX_GLOBAL_ACTIVITIES) {
    // Remove oldest activities from least active bots
    const sortedBots = Array.from(recentActivities.entries()).sort(
      ([, a], [, b]) => {
        const aLatest = new Date(a[0]?.timestamp || 0).getTime();
        const bLatest = new Date(b[0]?.timestamp || 0).getTime();
        return aLatest - bLatest; // Oldest first
      }
    );

    for (const [botName, activities] of sortedBots) {
      if (activities.length > 20) {
        activities.splice(50); // Keep only 50 for less active bots
        break;
      }
    }
  }
}

// Cleanup old bot records
function cleanupBotActivities() {
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
    recentActivities.delete(botName);
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

    // SIMPLIFIED: Authentication logic
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

    // SIMPLIFIED: Get or create bot activity record
    let botActivity = botActivities.get(botName);
    const now = timestamp || new Date().toISOString();

    if (!botActivity) {
      // First time seeing this bot
      botActivity = {
        botName,
        displayName: displayName || botName,
        avatarUrl: avatarUrl || "",
        bio: bio || details?.bio,
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
        walletAddress: walletAddress || details?.walletAddress,
      };

      console.log(
        `${isDevMode ? "🔧 DEV" : "🤖 PROD"} New bot registered: ${displayName}`
      );
    }

    // Update dev mode status and basic info
    botActivity.isDevMode = isDevMode;
    if (bio) botActivity.bio = bio;
    if (walletAddress) botActivity.walletAddress = walletAddress;

    // Handle startup action specially
    if (action === "startup") {
      // Reset for new session
      botActivity.sessionStarted = now;
      botActivity.totalActions = 0;

      // Update bot metadata from startup details
      if (details?.bio) botActivity.bio = details.bio;
      if (details?.character) botActivity.character = details.character;
      if (details?.config) botActivity.config = details.config;
      if (details?.startingBalance !== undefined)
        botActivity.startingBalance = details.startingBalance;
      if (details?.walletAddress)
        botActivity.walletAddress = details.walletAddress;

      console.log(
        `${isDevMode ? "🔧 DEV" : "🚀 PROD"} ${displayName} started new session`
      );
      if (details?.startingBalance !== undefined) {
        console.log(
          `   💰 Starting balance: ${details.startingBalance.toFixed(4)} AVAX`
        );
      }
      if (details?.tokensFound !== undefined) {
        console.log(`   🎯 Found ${details.tokensFound} tradeable tokens`);
      }
    } else if (action !== "heartbeat") {
      // Regular action - increment counter (don't count heartbeats)
      botActivity.totalActions += 1;
    }

    // Update session metrics if provided
    if (details?.currentBalance !== undefined) {
      botActivity.currentBalance = details.currentBalance;

      // Calculate P&L if we have starting balance
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

    // Add to activity history (skip frequent heartbeats)
    if (action !== "heartbeat" || Math.random() < 0.1) {
      // Only log 10% of heartbeats
      addActivity(botName, {
        id: `${botName}_${now}_${Math.random().toString(36).substr(2, 9)}`,
        botName,
        actionType: action,
        message: details?.message || `${action} action performed`,
        timestamp: now,
        details: details || {},
      });
    }

    // Periodic cleanup
    if (Math.random() < 0.01) {
      // 1% chance on each request
      cleanupBotActivities();
    }

    // SIMPLIFIED: Minimal logging
    if (action === "heartbeat") {
      // Only log heartbeat occasionally to reduce noise
      if (Math.random() < 0.05) {
        // 5% of heartbeats
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
    const includeHistory = searchParams.get("history") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    // SIMPLIFIED: Better offline detection
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
        character: bot.character,
        config: bot.config,
        isDevMode: bot.isDevMode || false,
        walletAddress: bot.walletAddress,

        // Session metrics
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

    // SIMPLIFIED: Basic metrics
    const devBots = botStatuses.filter((bot) => bot.isDevMode).length;
    const prodBots = botStatuses.filter((bot) => !bot.isDevMode).length;
    const onlineBots = botStatuses.filter((bot) => bot.isOnline).length;

    const response: any = {
      success: true,
      bots: filteredBots,
      totalBots: botStatuses.length,
      onlineBots: onlineBots,
      devMode: DEV_MODE,
      devBots: devBots,
      prodBots: prodBots,
      timestamp: new Date().toISOString(),
    };

    // SIMPLIFIED: Include activity history if requested (from memory only)
    if (includeHistory) {
      const activities: ActivityEntry[] = [];

      if (botName) {
        // Get activities for specific bot
        const botActivities = recentActivities.get(botName) || [];
        activities.push(...botActivities.slice(0, limit));
      } else {
        // Get recent activities from all bots
        const allActivities: ActivityEntry[] = [];
        for (const botActivities of recentActivities.values()) {
          allActivities.push(...botActivities);
        }

        // Sort by timestamp and take most recent
        allActivities.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        activities.push(...allActivities.slice(0, limit));
      }

      response.activities = activities;
      response.activityCount = activities.length;
    }

    // Only log occasionally to reduce noise
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

// SIMPLIFIED: Basic cleanup endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botName = searchParams.get("bot");

    let clearedCount = 0;

    if (botName) {
      // Clear specific bot
      if (botActivities.has(botName)) {
        botActivities.delete(botName);
        recentActivities.delete(botName);
        clearedCount = 1;
      }
    } else {
      // Clear all
      clearedCount = botActivities.size;
      botActivities.clear();
      recentActivities.clear();
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedCount} bot records`,
    });
  } catch (error) {
    console.error("❌ TVB Cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
