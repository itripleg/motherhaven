// app/bots/page.tsx - SIMPLIFIED with direct API calls, no Firebase

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

// Import the modular components
import PageHeader from "./components/PageHeader";
import BotFleetTab from "./components/BotFleetTab";
import LiveActivityFeed from "./components/LiveActivityFeed";

// SIMPLIFIED: Bot interfaces
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
  bio?: string;
  isOnline: boolean;
  lastSeen: string;
  lastAction?: {
    type: string;
    message: string;
    details: any;
    timestamp: string;
  };
  totalActions: number;
  sessionStarted: string;
  character?: any;
  config?: any;
  isDevMode?: boolean;
  walletAddress?: string;

  // Session metrics
  startingBalance?: number;
  currentBalance?: number;
  pnlAmount?: number;
  pnlPercentage?: number;
  sessionDurationMinutes?: number;
}

interface FleetStats {
  totalActions: number;
  activeBots: number;
  totalBots: number;
}

const REFRESH_INTERVAL = 5000; // 5 seconds - much more frequent since it's just an API call
const MAX_CONSECUTIVE_FAILURES = 3;

const TVBPage = () => {
  const [bots, setBots] = useState<SimpleBot[]>([]);
  const [activities, setActivities] = useState<SimpleBotActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("fleet");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  // Generate fixed star positions for background
  const fixedStars = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: 2 + Math.random() * 3,
    }));
  }, []);

  // SIMPLIFIED: Direct API fetch
  const fetchBots = useCallback(async (includeActivities = false) => {
    try {
      console.log("🤖 TVB: Fetching bot data from simplified API...");

      const url = new URL("/api/tvb/webhook", window.location.origin);
      if (includeActivities) {
        url.searchParams.set("history", "true");
        url.searchParams.set("limit", "50");
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "API returned unsuccessful response");
      }

      console.log("🤖 TVB: API Response:", {
        totalBots: data.totalBots,
        onlineBots: data.onlineBots,
        devBots: data.devBots,
        prodBots: data.prodBots,
        activitiesIncluded: !!data.activities,
      });

      // Update bots
      setBots(data.bots || []);

      // Update activities if included
      if (data.activities) {
        setActivities(data.activities || []);
      }

      setLastUpdate(new Date());
      setError(null);
      setConsecutiveFailures(0);

      console.log(`🤖 TVB: Successfully loaded ${data.bots?.length || 0} bots`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch bots";
      console.error("🤖 TVB: Error fetching bots:", errorMessage);

      setConsecutiveFailures((prev) => prev + 1);
      setError(errorMessage);

      // Don't clear bots on error - keep showing cached data
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBots(true); // Include activities on initial load
  }, [fetchBots]);

  // SIMPLIFIED: Regular refresh interval
  useEffect(() => {
    // Don't set up interval if we have too many consecutive failures
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log("🤖 TVB: Too many failures, pausing auto-refresh");
      return;
    }

    const interval = setInterval(() => {
      // Only fetch activities for the activity tab
      const shouldIncludeActivities = activeTab === "activity";
      fetchBots(shouldIncludeActivities);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchBots, activeTab, consecutiveFailures]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    console.log("🤖 TVB: Manual refresh triggered");
    setConsecutiveFailures(0); // Reset failure count
    setIsLoading(true);
    fetchBots(true); // Always include activities on manual refresh
  }, [fetchBots]);

  // SIMPLIFIED: Fleet stats calculation
  const fleetStats: FleetStats = useMemo(() => {
    return {
      totalActions: bots.reduce((sum, bot) => sum + (bot.totalActions || 0), 0),
      activeBots: bots.filter((bot) => bot.isOnline).length,
      totalBots: bots.length,
    };
  }, [bots]);

  // SIMPLIFIED: Show loading only on initial load
  if (isLoading && bots.length === 0) {
    return (
      <div className="min-h-screen animated-bg floating-particles flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading TVB Fleet...</p>
          <p className="text-muted-foreground text-sm mt-2">
            Fetching bot status from simplified API...
          </p>
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

      <div className="relative z-10 container mx-auto p-6 pt-24">
        {/* Page Header */}
        <PageHeader
          lastUpdate={lastUpdate}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />

        {/* SIMPLIFIED: Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="unified-card border-destructive/30 bg-destructive/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div className="flex-1">
                    <h3 className="text-destructive font-medium">
                      Connection Error
                    </h3>
                    <p className="text-destructive/80 text-sm">{error}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Consecutive failures: {consecutiveFailures}
                      {consecutiveFailures >= MAX_CONSECUTIVE_FAILURES &&
                        " (Auto-refresh paused)"}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>API: Simplified</p>
                    <p>Storage: In-memory</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* SIMPLIFIED: Status info for development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 text-xs text-muted-foreground bg-secondary/20 rounded-lg p-3 border border-border/30">
            <h4 className="font-medium mb-2">
              🚀 Simplified Architecture Status
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="font-medium">Data Source</p>
                <p className="text-green-400">Direct API</p>
              </div>
              <div>
                <p className="font-medium">Storage</p>
                <p className="text-blue-400">In-Memory</p>
              </div>
              <div>
                <p className="font-medium">Refresh Rate</p>
                <p className="text-blue-400">{REFRESH_INTERVAL / 1000}s</p>
              </div>
              <div>
                <p className="font-medium">Firebase</p>
                <p className="text-green-400">Eliminated</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border/30">
              <p>
                Last Update: {lastUpdate?.toLocaleTimeString() || "Never"} |
                Failures: {consecutiveFailures} | Bots: {bots.length} |
                Activities: {activities.length}
              </p>
            </div>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-background/80 border border-border/50 backdrop-blur-sm">
            <TabsTrigger
              value="fleet"
              className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-foreground"
            >
              🤖 Bot Fleet ({bots.length})
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-foreground"
            >
              📊 Live Activity ({fleetStats.activeBots} active)
            </TabsTrigger>
          </TabsList>

          {/* Bot Fleet Tab */}
          <TabsContent value="fleet" className="space-y-6">
            <BotFleetTab bots={bots} fleetStats={fleetStats} />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <LiveActivityFeed bots={bots} activities={activities} />
          </TabsContent>
        </Tabs>

        {/* SIMPLIFIED: Performance info footer for development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-secondary/20 rounded-lg border border-border/30">
            <h4 className="text-sm font-medium text-foreground mb-2">
              📊 Simplified Performance Stats
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="font-medium">Architecture</p>
                <p>Direct API → In-Memory → UI</p>
              </div>
              <div>
                <p className="font-medium">Eliminated</p>
                <p>Firebase, Complex hooks, Caching layers</p>
              </div>
              <div>
                <p className="font-medium">Benefits</p>
                <p>Instant updates, Zero DB costs, Simple debugging</p>
              </div>
              <div>
                <p className="font-medium">Memory Usage</p>
                <p>~50 bots max, ~500 activities max</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TVBPage;
