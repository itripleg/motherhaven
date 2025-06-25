"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";

// Import Components and Helpers from the correct relative path
import {
  BotStatus,
  ActivityLog as ActivityLogType,
} from "../components/detailHelpers";
import BotHeader from "../components/BotHeader";
import PerformanceStats from "../components/PerformanceStats";
import BotConfiguration from "../components/BotConfiguration";
import ActivityLog from "../components/ActivityLog";

const ADMIN_ADDRESSES = ["0xd85327505Ab915AB0C1aa5bC6768bF4002732258"];

const BotDetailPage = () => {
  const [bot, setBot] = useState<BotStatus | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const params = useParams();
  const botName = params.bot as string;

  const fetchBotDetails = useCallback(async () => {
    if (!botName) return;

    try {
      const response = await fetch("/api/tvb/webhook");
      if (!response.ok) throw new Error("Failed to fetch fleet data");

      const data = await response.json();
      if (data.success && Array.isArray(data.bots)) {
        const specificBot = data.bots.find((b: any) => b.name === botName);
        if (specificBot) {
          setBot(specificBot);
          setLastUpdate(new Date());

          // --- MOCK ACTIVITY LOG GENERATION (from original file) ---
          const generateActivityMessage = (
            action: string,
            botData: any
          ): string => {
            const messages = {
              buy: botData.config?.buyPhrases || [
                "Buying the dip!",
                "Going long!",
              ],
              sell: botData.config?.sellPhrases || [
                "Taking profits!",
                "Securing gains!",
              ],
              heartbeat: [
                `${botData.displayName} is active`,
                "Systems operational",
              ],
              create_token: botData.config?.createPhrases || [
                "Launching new token!",
              ],
            };
            const phraseList = messages[action as keyof typeof messages] || [
              `Performed ${action}`,
            ];
            return phraseList[Math.floor(Math.random() * phraseList.length)];
          };

          const activities: ActivityLogType[] = Array.from({ length: 20 }).map(
            (_, i) => {
              const actions = ["buy", "sell", "heartbeat", "create_token"];
              const action = actions[i % 4];
              return {
                id: `${specificBot.name}-${Date.now() - i * 10000}`,
                action,
                message: generateActivityMessage(action, specificBot),
                timestamp: new Date(
                  Date.now() - i * 300000 - Math.random() * 60000
                ),
                tokenSymbol: ["MOON", "BULL", "ROCKET"][
                  Math.floor(Math.random() * 3)
                ],
                amount: `${(Math.random() * 0.05 + 0.005).toFixed(3)} AVAX`,
              };
            }
          );

          if (specificBot.lastAction) {
            const latestActivity: ActivityLogType = {
              id: `${specificBot.name}-latest`,
              action: specificBot.lastAction.type,
              message: specificBot.lastAction.message,
              timestamp: new Date(specificBot.lastAction.timestamp),
            };
            setActivityLog([latestActivity, ...activities]);
          } else {
            setActivityLog(activities);
          }
          // --- END MOCK DATA ---
        } else {
          setBot(null);
        }
      }
    } catch (error) {
      console.error("Error fetching bot details:", error);
      setBot(null);
    } finally {
      setIsLoading(false);
    }
  }, [botName]);

  useEffect(() => {
    fetchBotDetails();
    const interval = setInterval(fetchBotDetails, 30000);
    return () => clearInterval(interval);
  }, [fetchBotDetails]);

  if (isLoading && !bot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading bot details for "{botName}"...</p>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl text-white mb-4">Bot Not Found</h1>
          <p className="text-gray-400 mb-4">
            Could not find bot "{botName}" in the active fleet.
          </p>
          <Link
            href="/bots"
            className="text-purple-400 hover:underline inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bot Fleet
          </Link>
        </div>
      </div>
    );
  }

  // The fix is here: `return (` instead of `return (>`
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="fixed inset-0 z-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto p-6 pt-24 space-y-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between"
        >
          <Link
            href="/bots"
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bot Fleet
          </Link>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <div className="text-sm text-gray-400 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <Button
              onClick={fetchBotDetails}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BotHeader
            bot={bot}
            showConfig={showConfig}
            onToggleConfig={() => setShowConfig(!showConfig)}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PerformanceStats bot={bot} />
        </motion.div>

        {bot.config && (
          <BotConfiguration showConfig={showConfig} config={bot.config} />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ActivityLog logs={activityLog} />
        </motion.div>
      </div>
    </div>
  );
};

export default BotDetailPage;
