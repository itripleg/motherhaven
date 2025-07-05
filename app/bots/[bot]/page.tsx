// app/bots/[bot]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
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
import InlineBotSelector from "../components/InlineBotSelector";
import { AddressComponent } from "@/components/AddressComponent";

// Import the new bot activities hook
import { useBotActivity } from "@/hooks/useBotActivities";

const BotDetailPage = () => {
  const [bot, setBot] = useState<BotStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const params = useParams();
  const botName = params.bot as string;

  // Use the new persistent activities hook
  const {
    activities: persistentActivities,
    loading: activitiesLoading,
    error: activitiesError,
    statistics: activityStats,
    refresh: refreshActivities,
  } = useBotActivity(botName, {
    limitCount: 50,
    realTime: true,
  });

  // Generate fixed star positions that won't change on re-renders
  const fixedStars = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: 2 + Math.random() * 3,
    }));
  }, []); // Empty dependency array ensures this only runs once

  // Convert persistent activities to the format expected by ActivityLog component
  const activityLog = useMemo((): ActivityLogType[] => {
    return persistentActivities.map((activity) => ({
      id: activity.id || `${activity.botName}-${activity.timestamp}`,
      action: activity.actionType,
      message: activity.message,
      timestamp: new Date(activity.timestamp),
      tokenSymbol: activity.tokenSymbol,
      amount: activity.tradeAmount
        ? `${activity.tradeAmount} AVAX`
        : activity.details?.readableAmount
        ? `${activity.details.readableAmount} ${activity.tokenSymbol}`
        : undefined,
    }));
  }, [persistentActivities]);

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
    const interval = setInterval(fetchBotDetails, 10000); // Refresh every 10 seconds for more real-time feel
    return () => clearInterval(interval);
  }, [fetchBotDetails]);

  // Handle refresh for both bot details and activities
  const handleRefresh = useCallback(() => {
    fetchBotDetails();
    refreshActivities();
  }, [fetchBotDetails, refreshActivities]);

  if (isLoading && !bot) {
    return (
      <div className="min-h-screen animated-bg floating-particles flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">
            Loading bot details for "{botName}"...
          </p>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen animated-bg floating-particles flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl text-foreground mb-4">Bot Not Found</h1>
          <p className="text-muted-foreground mb-4">
            Could not find bot "{botName}" in the active fleet.
          </p>
          <Link
            href="/bots"
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bot Fleet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg floating-particles">
      {/* Fixed Background Stars Effect */}
      <div className="fixed inset-0 z-0">
        {fixedStars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: star.animationDuration,
              repeat: Infinity,
              delay: star.animationDelay,
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
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bot Fleet
          </Link>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-secondary"
              disabled={isLoading || activitiesLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${
                  isLoading || activitiesLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Inline Bot Selector Component */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <InlineBotSelector currentBotName={botName} />
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
          <ActivityLog
            logs={activityLog}
            // loading={activitiesLoading}
            // error={activitiesError}
            // statistics={activityStats}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default BotDetailPage;
