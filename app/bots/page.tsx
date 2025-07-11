// app/bots/page.tsx
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
import { TVBBot, FleetStats } from "./components/helpers";

const TVBPage = () => {
  const [bots, setBots] = useState<TVBBot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("fleet");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Generate fixed star positions that won't change on re-renders
  const fixedStars = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 5,
      animationDuration: 2 + Math.random() * 3,
    }));
  }, []); // Empty dependency array ensures this only runs once

  // Fetch bot data from TVB API
  const fetchBots = useCallback(async () => {
    try {
      console.log("🤖 TVB: Fetching bot fleet data...");
      setError(null);

      const response = await fetch("/api/tvb/webhook", {
        method: "GET",
        headers: {
          "X-Request-Source": "bots-page",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("🤖 TVB: API Response:", data);

      if (data.success && Array.isArray(data.bots)) {
        setBots(data.bots);
        setLastUpdate(new Date());
        console.log(`🤖 TVB: Loaded ${data.bots.length} bots`);

        // Log bot details for debugging
        data.bots.forEach((bot: TVBBot) => {
          console.log(`🤖 ${bot.displayName}:`, {
            isOnline: bot.isOnline,
            totalActions: bot.totalActions,
            lastAction: bot.lastAction,
            sessionStarted: bot.sessionStarted,
          });
        });
      } else {
        console.warn("🤖 TVB: Invalid response format:", data);
        setBots([]);
      }
    } catch (err) {
      console.error("🤖 TVB: Error fetching bots:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch bots");
      setBots([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    fetchBots();
    const interval = setInterval(fetchBots, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [fetchBots]);

  // Calculate fleet stats
  const fleetStats: FleetStats = {
    totalActions: bots.reduce((sum, bot) => sum + (bot.totalActions || 0), 0),
    activeBots: bots.filter((bot) => bot.isOnline).length,
    totalBots: bots.length,
  };

  if (isLoading && bots.length === 0) {
    return (
      <div className="min-h-screen animated-bg floating-particles flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading TVB Fleet...</p>
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
          onRefresh={fetchBots}
          isLoading={isLoading}
        />

        {/* Error State */}
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
                  <div>
                    <h3 className="text-destructive font-medium">
                      Connection Error
                    </h3>
                    <p className="text-destructive/80 text-sm">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
              📊 Live Activity
            </TabsTrigger>
          </TabsList>

          {/* Bot Fleet Tab */}
          <TabsContent value="fleet" className="space-y-6">
            <BotFleetTab bots={bots} fleetStats={fleetStats} />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <LiveActivityFeed bots={bots} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TVBPage;
