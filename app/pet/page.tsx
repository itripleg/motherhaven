"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Utensils } from "lucide-react";
import { usePetContract } from "./hooks/usePetContract";
import { PetHeader } from "./components/PetHeader";
import { PetStatusCard } from "./components/PetStatusCard";
import { CommunityStats } from "./components/CommunityStats";
import { FeedingSection } from "./components/FeedingSection";
import { PetBackground } from "./components/PetBackground";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";

const PetPage = () => {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("status");

  // Get real contract data only
  const {
    petStatus,
    extendedPetInfo,
    revivalInfo,
    currentHealth,
    timeSinceLastFed,
    userFeedingCount,
    revivalCost,
    isLoading,
    error,
    refreshData,
    revivePet,
    renamePet,
    updatePetHealth,
    isWritePending,
    formatTimeSince,
    isUserCaretaker,
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
  if (!petStatus || !extendedPetInfo) {
    return <ErrorState error="Pet data not available" onRetry={refreshData} />;
  }

  // Create real user stats from contract data
  const userStats = {
    feedingCount: userFeedingCount || 0,
    hasEverFed: (userFeedingCount || 0) > 0,
  };

  // Create real pet stats from contract data
  const petStats = {
    totalFeedings: extendedPetInfo.totalFeedings,
    deathCount: extendedPetInfo.deathCount,
  };

  // Use current health if available, otherwise stored health
  const displayHealth =
    currentHealth !== null ? currentHealth : extendedPetInfo.health;

  return (
    <div className="min-h-screen animated-bg">
      {/* Animated Background */}
      <PetBackground variant="default" intensity="medium" />

      <div className="relative z-10 container mx-auto p-6 pt-24 space-y-8">
        {/* Pet Header - Real Data Only */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <PetHeader
            petName={extendedPetInfo.name}
            isAlive={extendedPetInfo.isAlive}
            currentHealth={displayHealth}
            currentCaretaker={extendedPetInfo.currentCaretaker}
            deathCount={extendedPetInfo.deathCount}
            revivalCost={revivalCost}
            isUserCaretaker={isUserCaretaker}
            timeSinceLastFed={timeSinceLastFed}
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
                  extendedPetInfo={extendedPetInfo}
                  revivalInfo={revivalInfo}
                  userStats={userStats}
                  onRevive={revivePet}
                  onRenamePet={renamePet}
                  onUpdateHealth={updatePetHealth}
                  isConnected={isConnected}
                  isWritePending={isWritePending}
                  isUserCaretaker={isUserCaretaker}
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
                <CommunityStats petStats={petStats} userStats={userStats} />
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
                  petName={extendedPetInfo.name}
                  petIsAlive={extendedPetInfo.isAlive}
                  isConnected={isConnected}
                  isWritePending={isWritePending}
                  contractAddress={contractAddress}
                />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Quick Action Cards - Real Data Only */}
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
                    displayHealth >= 70
                      ? "text-green-500"
                      : displayHealth >= 40
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                />
                <div>
                  <div className="font-medium">Health Status</div>
                  <div className="text-sm text-muted-foreground">
                    {displayHealth}/100 HP
                  </div>
                </div>
                <Badge
                  variant={extendedPetInfo.isAlive ? "default" : "destructive"}
                  className="ml-auto"
                >
                  {extendedPetInfo.isAlive ? "Alive" : "Dead"}
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
                    {extendedPetInfo.totalFeedings} total feeds
                  </div>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {userStats.feedingCount} yours
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
                  variant={extendedPetInfo.isAlive ? "default" : "secondary"}
                  className="ml-auto"
                >
                  {extendedPetInfo.isAlive ? "Ready" : "Revive First"}
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
            <span>•</span>
            <span>Deaths: {extendedPetInfo.deathCount}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PetPage;
