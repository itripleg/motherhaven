"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Utensils, BarChart3 } from "lucide-react";
import { usePetContract } from "./hooks/usePetContract";
import { PetHeader } from "./components/PetHeader";
import { PetStatusCard } from "./components/PetStatusCard";
import { CommunityStats } from "./components/CommunityStats";
import { FeedingSection } from "./components/FeedingSection";
import { PetBackground } from "./components/PetBackground";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";

const PetPage = () => {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("status");

  // Get simplified pet data from our custom hook
  const {
    petStatus,
    currentHealth,
    timeSinceLastFed,
    userFeedingCount,
    revivalCost,
    isLoading,
    error,
    refreshData,
    revivePet,
    updatePetHealth,
    isWritePending,
    formatTimeSince,
    contractAddress,
  } = usePetContract();

  // Loading state
  if (isLoading && !petStatus) {
    return <LoadingState />;
  }

  // Error state
  if (error && !petStatus) {
    return <ErrorState error={error} onRetry={refreshData} />;
  }

  // No pet data
  if (!petStatus) {
    return <ErrorState error="Pet data not available" onRetry={refreshData} />;
  }

  // Transform simplified data to match component expectations
  const transformedPetStatus = {
    name: petStatus.name,
    petType: 0, // Always DOG for simplified version
    health: currentHealth !== null ? currentHealth : petStatus.health,
    happiness: 50, // Fixed value for simplified version
    energy: 50, // Fixed value for simplified version
    age: 0, // Not tracked in simplified version
    isAlive: petStatus.isAlive,
    mood: 2, // Always CONTENT for simplified version
    action: 3, // Always EXPLORING for simplified version
    message: petStatus.isAlive
      ? "Woof! I'm doing great thanks to the community!"
      : "I need to be revived... please help me!",
    lastFed: petStatus.lastFed,
    totalFeedings: petStatus.totalFeedings,
  };

  // Simplified pet stats (mock data since we don't track all these in simplified contract)
  const transformedPetStats = {
    totalFeedings: petStatus.totalFeedings,
    totalBurnedTokens: "0", // Not tracked in simplified version
    totalFeeders: 1, // Simplified - would need separate tracking
    longestSurvival: 0, // Not tracked in simplified version
    currentAge: 0, // Not tracked in simplified version
    deathCount: 0, // Not tracked in simplified version
  };

  // Simplified user stats
  const transformedUserStats = {
    hasEverFed: (userFeedingCount || 0) > 0,
    feedingCount: userFeedingCount || 0,
  };

  // No supported tokens in simplified version - feeding happens directly through burn contracts
  const supportedTokens: any[] = [];

  // Simplified feed function - just shows instructions
  const feedPet = async (tokenAddress: string, amount: string) => {
    // In simplified version, feeding happens through token burn contracts
    // This is just a placeholder
    console.log("Feed pet called - handled by token contracts");
  };

  return (
    <div className="min-h-screen animated-bg">
      {/* Animated Background */}
      <PetBackground variant="default" intensity="medium" />

      <div className="relative z-10 container mx-auto p-6 pt-24 space-y-8">
        {/* Pet Header - Always Visible */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* @ts-expect-error will fix types next update */}
          <PetHeader
            petName={transformedPetStatus.name}
            petType={transformedPetStatus.petType}
            isAlive={transformedPetStatus.isAlive}
            currentHealth={transformedPetStatus.health}
          />
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger
                value="status"
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Pet Status</span>
                <span className="sm:hidden">Status</span>
              </TabsTrigger>
              <TabsTrigger
                value="community"
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Community</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger
                value="feeding"
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Utensils className="h-4 w-4" />
                <span className="hidden sm:inline">Feed Pet</span>
                <span className="sm:hidden">Feed</span>
              </TabsTrigger>
            </TabsList>

            {/* Pet Status Tab */}
            <TabsContent value="status" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <PetStatusCard
                  petStatus={transformedPetStatus}
                  userStats={transformedUserStats}
                  onRevive={revivePet}
                  isConnected={isConnected}
                  isWritePending={isWritePending}
                  revivalCost={revivalCost}
                  onUpdateHealth={updatePetHealth}
                  currentHealth={currentHealth}
                  timeSinceLastFed={timeSinceLastFed}
                  formatTimeSince={formatTimeSince}
                />
              </motion.div>
            </TabsContent>

            {/* Community Stats Tab */}
            <TabsContent value="community" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <CommunityStats
                  petStats={transformedPetStats}
                  userStats={transformedUserStats}
                  isSimplified={true}
                />
              </motion.div>
            </TabsContent>

            {/* Feeding Tab */}
            <TabsContent value="feeding" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <FeedingSection
                  petName={transformedPetStatus.name}
                  petIsAlive={transformedPetStatus.isAlive}
                  supportedTokens={supportedTokens}
                  onFeed={feedPet}
                  isConnected={isConnected}
                  isWritePending={isWritePending}
                  isSimplified={true}
                  contractAddress={contractAddress}
                />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Quick Action Cards - Always Visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Quick Status */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-2"
            onClick={() => setActiveTab("status")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity
                  className={`h-5 w-5 ${
                    transformedPetStatus.health >= 70
                      ? "text-green-500"
                      : transformedPetStatus.health >= 40
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                />
                <div>
                  <div className="font-medium">Health Status</div>
                  <div className="text-sm text-muted-foreground">
                    {transformedPetStatus.health}/100 HP
                  </div>
                </div>
                <Badge
                  variant={
                    transformedPetStatus.isAlive ? "default" : "destructive"
                  }
                  className="ml-auto"
                >
                  {transformedPetStatus.isAlive ? "Alive" : "Dead"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Community */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-2"
            onClick={() => setActiveTab("community")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">Community</div>
                  <div className="text-sm text-muted-foreground">
                    {transformedPetStats.totalFeedings} total feeds
                  </div>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {transformedUserStats.feedingCount} yours
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Feed */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-2"
            onClick={() => setActiveTab("feeding")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Utensils className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium">Feed Pet</div>
                  <div className="text-sm text-muted-foreground">
                    Burn CHOW tokens
                  </div>
                </div>
                <Badge
                  variant={
                    transformedPetStatus.isAlive ? "default" : "secondary"
                  }
                  className="ml-auto"
                >
                  {transformedPetStatus.isAlive ? "Ready" : "Revive First"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center space-y-2"
        >
          <div className="text-sm text-muted-foreground">
            Community Pet • Fuji Testnet • Contract:{" "}
            {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}
          </div>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span>Auto-updates every 30s</span>
            <span>•</span>
            <span>Health decays -1/hour</span>
            <span>•</span>
            <span>Feed gives +10 health</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PetPage;
