// app/api/tvb/webhook/route.ts - IMPROVED VERSION

import { NextRequest, NextResponse } from "next/server";

// Bot secrets for authentication
const BOT_SECRETS = {
  bullish_billy: "bullish_billy_secret_2024",
  jackpot_jax: "jax_trader_secret_2024",
};

// In-memory storage for bot status (use Redis/DB in production)
interface BotActivity {
  botName: string;
  displayName: string;
  avatarUrl: string;
  lastSeen: string;
  lastAction: {
    type: string;
    message: string;
    details: any;
    timestamp: string;
  };
  totalActions: number;
  sessionStarted: string;
}

// Simple in-memory store (replace with database in production)
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
      // First time seeing this bot
      botActivity = {
        botName,
        displayName: displayName || botName,
        avatarUrl: avatarUrl || "",
        lastSeen: timestamp,
        lastAction: {
          type: action,
          message: details?.message || `Bot ${botName} performed ${action}`,
          details: details || {},
          timestamp,
        },
        totalActions: 0,
        sessionStarted: timestamp,
      };

      console.log(`🤖 New bot registered: ${displayName}`);
    }

    // Update bot activity
    botActivity.lastSeen = timestamp;
    botActivity.lastAction = {
      type: action,
      message: details?.message || `${action} action performed`,
      details: details || {},
      timestamp,
    };
    botActivity.totalActions += 1;

    // Store updated activity
    botActivities.set(botName, botActivity);

    // Log the activity
    console.log(
      `🔄 ${displayName}: ${action} - ${botActivity.lastAction.message}`
    );

    // Log additional details based on action type
    if (action === "buy" && details?.tokenSymbol) {
      console.log(
        `   💰 Bought ${details.tokenSymbol} with ${details.amountAvax} AVAX`
      );
    } else if (action === "sell" && details?.tokenSymbol) {
      console.log(
        `   📈 Sold ${details.tokenSymbol} (${details.sellPercentage?.toFixed(
          1
        )}%)`
      );
    } else if (action === "create_token" && details?.tokenName) {
      console.log(
        `   🎨 Created token: ${details.tokenName} (${details.tokenSymbol})`
      );
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
    // Add logging to track GET requests
    const requestSource = request.headers.get("X-Request-Source");
    const userAgent = request.headers.get("User-Agent");

    console.log(`📊 GET request received from: ${requestSource || "unknown"}`);

    // Return current bot statuses for the frontend
    const currentTime = Date.now();
    const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    const botStatuses = Array.from(botActivities.values()).map((bot) => {
      const lastSeenTime = new Date(bot.lastSeen).getTime();
      const isOnline = currentTime - lastSeenTime < OFFLINE_THRESHOLD;

      return {
        name: bot.botName,
        displayName: bot.displayName,
        avatarUrl: bot.avatarUrl,
        isOnline,
        lastSeen: bot.lastSeen,
        lastAction: bot.lastAction,
        totalActions: bot.totalActions,
        sessionStarted: bot.sessionStarted,
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
