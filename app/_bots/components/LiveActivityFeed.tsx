// app/bots/components/LiveActivityFeed.tsx - SIMPLIFIED with direct data props

"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

// SIMPLIFIED: Direct interfaces matching the new API
interface SimpleBotActivity {
  id: string;
  botName: string;
  actionType: string;
  message: string;
  timestamp: string;
  details: any;
}

interface SimpleBot {
  name: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  lastAction?: {
    type: string;
    message: string;
    details: any;
    timestamp: string;
  };
  totalActions: number;
  isDevMode?: boolean;
}

interface LiveActivityFeedProps {
  bots: SimpleBot[];
  activities?: SimpleBotActivity[];
}

// SIMPLIFIED: Action styling helpers
const getActionColor = (action?: string): string => {
  switch (action?.toLowerCase()) {
    case "buy":
      return "text-green-400 bg-green-500/10 border-green-500/30";
    case "sell":
      return "text-red-400 bg-red-500/10 border-red-500/30";
    case "hold":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    case "create_token":
      return "text-purple-400 bg-purple-500/10 border-purple-500/30";
    case "heartbeat":
      return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    case "startup":
      return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    case "shutdown":
      return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    case "error":
      return "text-red-400 bg-red-500/20 border-red-500/40";
    case "insufficient_funds":
      return "text-red-400 bg-red-500/20 border-red-500/40";
    default:
      return "text-gray-400 bg-gray-500/10 border-gray-500/30";
  }
};

const getActionIcon = (action?: string): string => {
  switch (action?.toLowerCase()) {
    case "buy":
      return "📈";
    case "sell":
      return "📉";
    case "hold":
      return "⏸️";
    case "create_token":
      return "🎨";
    case "startup":
      return "🚀";
    case "heartbeat":
      return "💓";
    case "error":
      return "⚠️";
    case "insufficient_funds":
      return "💸";
    default:
      return "🔄";
  }
};

const formatActionType = (action?: string): string => {
  if (!action) return "Unknown";

  switch (action.toLowerCase()) {
    case "insufficient_funds":
      return "Low Funds";
    case "create_token":
      return "Create Token";
    default:
      return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
};

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  bots,
  activities = [],
}) => {
  const router = useRouter();

  // SIMPLIFIED: Create activity list from either activities prop or bot last actions
  const displayActivities = useMemo(() => {
    if (activities.length > 0) {
      // Use provided activities (from API with history=true)
      return activities.map((activity) => ({
        id: activity.id,
        botName: activity.botName,
        bot: bots.find((b) => b.name === activity.botName),
        actionType: activity.actionType,
        message: activity.message,
        timestamp: activity.timestamp,
        details: activity.details,
      }));
    } else {
      // Fallback: use last actions from bots
      return bots
        .filter((bot) => bot.lastAction && bot.isOnline)
        .map((bot) => ({
          id: `${bot.name}_${bot.lastAction!.timestamp}`,
          botName: bot.name,
          bot: bot,
          actionType: bot.lastAction!.type,
          message: bot.lastAction!.message,
          timestamp: bot.lastAction!.timestamp,
          details: bot.lastAction!.details,
        }))
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 20);
    }
  }, [bots, activities]);

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    bot: SimpleBot
  ) => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/40x40/9333ea/ffffff?text=${
      bot.displayName?.charAt(0) || "B"
    }`;
  };

  const handleActivityClick = (botName: string) => {
    router.push(`/bots/${botName}`);
  };

  const getTokenLink = (details: any) => {
    const tokenAddress = details?.tokenAddress || details?.contractAddress;
    const tokenSymbol = details?.tokenSymbol;

    if (tokenAddress && tokenSymbol) {
      return {
        address: tokenAddress,
        symbol: tokenSymbol,
      };
    }
    return null;
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-400" />
          Live Bot Activity
          <span className="text-sm font-normal text-gray-400">
            ({displayActivities.length} recent events)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No Recent Activity</p>
            <p className="text-sm">
              {bots.length === 0
                ? "No bots are currently running"
                : `${
                    bots.filter((b) => b.isOnline).length
                  } bots online, waiting for activity...`}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {displayActivities.map((activity, index) => {
              const bot =
                activity.bot || bots.find((b) => b.name === activity.botName);
              const tokenInfo = getTokenLink(activity.details);

              return (
                <motion.div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/30 cursor-pointer hover:bg-gray-700/50 transition-colors group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleActivityClick(activity.botName)}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    {/* Bot Avatar */}
                    {bot && (
                      <div className="relative flex-shrink-0">
                        <img
                          src={bot.avatarUrl}
                          alt={bot.displayName}
                          className="w-10 h-10 rounded-full border border-purple-500/30 object-cover"
                          onError={(e) => handleImageError(e, bot)}
                        />
                        {bot.isDevMode && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-gray-800 flex items-center justify-center">
                            <span className="text-xs text-white font-bold leading-none text-[8px]">
                              D
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Activity Content */}
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium truncate">
                          {bot?.displayName || activity.botName}
                        </p>
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${getActionColor(
                            activity.actionType
                          )}`}
                        >
                          <span>{getActionIcon(activity.actionType)}</span>
                          <span>{formatActionType(activity.actionType)}</span>
                        </div>
                      </div>

                      {/* Message and Token Info */}
                      <div className="flex items-center gap-2 text-sm">
                        {activity.message && (
                          <span className="text-gray-400 truncate">
                            "{activity.message}"
                          </span>
                        )}

                        {tokenInfo && (
                          <Link
                            href={`/dex/${tokenInfo.address}`}
                            className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary hover:text-primary/80 rounded-full transition-colors border border-primary/30 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs font-medium">
                              {tokenInfo.symbol}
                            </span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>

                      {/* Trade Details */}
                      {activity.details && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {activity.details.amountAvax && (
                            <span>
                              💰{" "}
                              {Number(activity.details.amountAvax).toFixed(4)}{" "}
                              AVAX
                            </span>
                          )}
                          {activity.details.sellPercentage && (
                            <span>
                              📊{" "}
                              {Number(activity.details.sellPercentage).toFixed(
                                1
                              )}
                              %
                            </span>
                          )}
                          {activity.details.currentBalance && (
                            <span>
                              💼{" "}
                              {Number(activity.details.currentBalance).toFixed(
                                4
                              )}{" "}
                              AVAX
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right text-sm text-gray-500 flex items-center gap-1 flex-shrink-0 ml-2">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Footer with stats */}
      {displayActivities.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-600/30">
            <span>Showing {displayActivities.length} recent activities</span>
            <span>{bots.filter((b) => b.isOnline).length} bots active</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default LiveActivityFeed;
