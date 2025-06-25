// app/api/tvb/webhook/route.ts - CLEAN VERSION

import { NextRequest, NextResponse } from "next/server";

// Bot secrets for authentication - ONLY hardcoded data
const BOT_SECRETS = {
  bullish_billy: "bullish_billy_secret_2024",
  jackpot_jax: "jax_trader_secret_2024",
  melancholy_mort: "melancholy_mort_secret_2024",
};

// In-memory storage for bot status
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
  // Store bot configuration data from bots themselves
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
  // Store character data from bots themselves
  character?: {
    mood?: string;
    personality?: string;
  };
}

// Simple in-memory store
const botActivities = new Map<string, BotActivity>();

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

    if (!botName || !action || !botSecret) {
      console.log("❌ POST request missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: botName, action, botSecret" },
        { status: 400 }
      );
    }

    // Authenticate bot
    if (BOT_SECRETS[botName as keyof typeof BOT_SECRETS] !== botSecret) {
      console.log(`❌ Invalid bot secret for ${botName}`);
      return NextResponse.json(
        { error: "Invalid bot authentication" },
        { status: 401 }
      );
    }

    // Get or create bot activity record
    let botActivity = botActivities.get(botName);

    if (!botActivity) {
      // First time seeing this bot - create minimal record
      botActivity = {
        botName,
        displayName: displayName || botName,
        avatarUrl: avatarUrl || "",
        bio: details?.bio, // Get bio from bot data
        lastSeen: timestamp,
        lastAction: {
          type: action,
          message: details?.message || `Bot ${botName} performed ${action}`,
          details: details || {},
          timestamp,
        },
        totalActions: 0,
        sessionStarted: timestamp,
        character: details?.character, // Get character from bot data
        config: details?.config, // Get config from bot data
      };

      console.log(`🤖 New bot registered: ${displayName}`);
    }

    // Handle startup action specially
    if (action === "startup") {
      // Reset for new session
      botActivity.sessionStarted = timestamp;
      botActivity.totalActions = 0;

      // Update bot metadata from startup details
      if (details?.bio) botActivity.bio = details.bio;
      if (details?.character) botActivity.character = details.character;
      if (details?.config) botActivity.config = details.config;

      console.log(`🚀 ${displayName} started new session`);
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

    // Store updated activity
    botActivities.set(botName, botActivity);

    // Log the activity
    const logMessage = `🔄 ${displayName}: ${action}`;
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
      message: "Bot activity recorded",
      botStatus: {
        name: botActivity.botName,
        displayName: botActivity.displayName,
        isOnline: true,
        lastSeen: botActivity.lastSeen,
        totalActions: botActivity.totalActions,
        sessionStarted: botActivity.sessionStarted,
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
    console.log(`📊 GET request received from frontend`);

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
      };
    });

    const response = {
      success: true,
      bots: botStatuses,
      totalBots: botStatuses.length,
      onlineBots: botStatuses.filter((bot) => bot.isOnline).length,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `✅ Returning status for ${botStatuses.length} bots (${response.onlineBots} online)`
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
