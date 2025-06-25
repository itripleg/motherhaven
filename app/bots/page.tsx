"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Activity, AlertCircle } from "lucide-react";

// Import Components and Helpers
import { TVBBot, FleetStats } from "./components/helpers";
import PageHeader from "./components/PageHeader";
import BotFleetTab from "./components/BotFleetTab";
import LiveActivityFeed from "./components/LiveActivityFeed";

const ADMIN_ADDRESSES = ["0xd85327505Ab915AB0C1aa5bC6768bF4002732258"];

const TVBPage = () => {
  const [bots, setBots] = useState<TVBBot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("fleet");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { address } = useAccount();
  const isAdmin = address && ADMIN_ADDRESSES.includes(address);

  const fetchBots = useCallback(async () => {
    try {
      console.log("🤖 TVB: Fetching bot fleet data...");
      setError(null);

      const response = await fetch("/api/tvb/webhook", {
        method: "GET",
        headers: { "X-Request-Source": "bots-page" },
      });

      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const data = await response.json();
      if (data.success && Array.isArray(data.bots)) {
        setBots(data.bots);
        setLastUpdate(new Date());
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

  useEffect(() => {
    fetchBots();
    const interval = setInterval(fetchBots, 15000);
    return () => clearInterval(interval);
  }, [fetchBots]);

  const fleetStats: FleetStats = {
    totalActions: bots.reduce((sum, bot) => sum + (bot.totalActions || 0), 0),
    activeBots: bots.filter((bot) => bot.isOnline).length,
    totalBots: bots.length,
  };

  if (isLoading && bots.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading TVB Fleet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Background Stars Effect */}
      <div className="fixed inset-0 z-0">
        {Array.from({ length: 50 }).map((_, i) => (
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

      <div className="relative z-10 container mx-auto p-6 pt-24">
        <PageHeader
          lastUpdate={lastUpdate}
          isLoading={isLoading && bots.length > 0}
          onRefresh={fetchBots}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-red-900/20 border-red-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div>
                    <h3 className="text-red-400 font-medium">
                      Connection Error
                    </h3>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-1">
            <TabsTrigger value="fleet" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Bot Fleet ({bots.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fleet">
            <BotFleetTab bots={bots} fleetStats={fleetStats} />
          </TabsContent>

          <TabsContent value="activity">
            <LiveActivityFeed bots={bots} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TVBPage;
