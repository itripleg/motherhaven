// app/pet/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Users, Utensils } from "lucide-react";
import { usePetContract } from "./hooks/usePetContract";
import { PetHeader } from "./components/PetHeader";
import { PetStatusCard } from "./components/PetStatusCard";
import { CommunityStats } from "./components/CommunityStats";
import { FeedingSection } from "./components/FeedingSection";
import { PetBackground } from "./components/PetBackground";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";

const SimplifiedPetPage = () => {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("status");

  // Single consolidated hook call
  const {
    data,
    isLoading,
    error,
    refreshData,
    revivePet,
    renamePet,
    updatePetHealth,
    isWritePending,
    formatTimeSince,
    isUserCaretaker,
    revivalCost,
    contractAddress,
  } = usePetContract();

  // Memoized derived data to prevent unnecessary recalculations
  const derivedData = useMemo(() => {
    if (!data.petInfo) return null;

    const { petInfo, currentHealth, timeSinceLastFed, userFeedingCount } = data;

    // Use current health if available, otherwise stored health
    const displayHealth =
      currentHealth !== null ? currentHealth : petInfo.health;

    // Create user stats from contract data
    const userStats = {
      feedingCount: userFeedingCount || 0,
      hasEverFed: (userFeedingCount || 0) > 0,
    };

    // Create pet stats from contract data
    const petStats = {
      totalFeedings: petInfo.totalFeedings,
      deathCount: petInfo.deathCount,
    };

    return {
      displayHealth,
      userStats,
      petStats,
      petInfo,
      timeSinceLastFed,
    };
  }, [data]);

  // Loading state
  if (isLoading && !derivedData) {
    return <LoadingState />;
  }

  // Error state
  if (error && !derivedData) {
    return <ErrorState error={error} onRetry={refreshData} />;
  }

  // No pet data
  if (!derivedData) {
    return <ErrorState error="Pet data not available" onRetry={refreshData} />;
  }

  const { displayHealth, userStats, petStats, petInfo, timeSinceLastFed } =
    derivedData;

  return (
    <div className="min-h-screen animated-bg">
      {/* Animated Background */}
      <PetBackground variant="alive" intensity="medium" />

      <div className="relative z-10 container mx-auto p-6 pt-24 space-y-8">
        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
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

            {/* Pet Status Tab - Only tab that shows the full pet header */}
            <TabsContent value="status" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Pet Header - Only shown on status tab */}
                <PetHeader
                  petName={petInfo.name}
                  isAlive={petInfo.isAlive}
                  currentHealth={displayHealth}
                  currentCaretaker={petInfo.currentCaretaker}
                  deathCount={petInfo.deathCount}
                  revivalCost={revivalCost}
                  isUserCaretaker={isUserCaretaker}
                  timeSinceLastFed={timeSinceLastFed}
                  onRenamePet={renamePet}
                  isWritePending={isWritePending}
                />

                {/* Pet Status Card */}
                <PetStatusCard
                  extendedPetInfo={petInfo}
                  revivalInfo={data.revivalInfo}
                  userStats={userStats}
                  onRevive={revivePet}
                  onUpdateHealth={updatePetHealth}
                  isConnected={isConnected}
                  isWritePending={isWritePending}
                  isUserCaretaker={isUserCaretaker}
                  currentHealth={data.currentHealth}
                  timeSinceLastFed={timeSinceLastFed}
                  formatTimeSince={formatTimeSince}
                />
              </motion.div>
            </TabsContent>

            {/* Community Stats Tab - Community stats acts as its own header */}
            <TabsContent value="community" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <CommunityStats petStats={petStats} userStats={userStats} />
              </motion.div>
            </TabsContent>

            {/* Feeding Tab - Feeding section acts as its own header */}
            <TabsContent value="feeding" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <FeedingSection
                  petName={petInfo.name}
                  petIsAlive={petInfo.isAlive}
                  isConnected={isConnected}
                  isWritePending={isWritePending}
                  contractAddress={contractAddress}
                />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center space-y-2 hidden"
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
            <span>Feed gives +1-50 health</span>
            <span>•</span>
            <span>Deaths: {petInfo.deathCount}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SimplifiedPetPage;