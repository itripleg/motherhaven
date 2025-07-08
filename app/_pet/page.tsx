"use client";

import React from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
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
      <PetBackground />

      <div className="relative z-10 container mx-auto p-6 pt-24 space-y-8">
        {/* Page Header with refresh controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <PetHeader
            petName={transformedPetStatus.name}
            petType={transformedPetStatus.petType}
            isAlive={transformedPetStatus.isAlive}
            lastUpdate={new Date()} // Always current time for simplified version
            onRefresh={refreshData}
            isRefreshing={isLoading}
            // Add simplified status info
            currentHealth={transformedPetStatus.health}
            timeSinceLastFed={
              timeSinceLastFed ? formatTimeSince(timeSinceLastFed) : "Unknown"
            }
          />
        </motion.div>

        {/* Main Pet Status Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <PetStatusCard
            petStatus={transformedPetStatus}
            userStats={transformedUserStats}
            onRevive={revivePet}
            isConnected={isConnected}
            isWritePending={isWritePending}
            revivalCost={revivalCost}
            // Add simplified contract functions
            onUpdateHealth={updatePetHealth}
            currentHealth={currentHealth}
            timeSinceLastFed={timeSinceLastFed}
            formatTimeSince={formatTimeSince}
          />
        </motion.div>

        {/* Community Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <CommunityStats
            petStats={transformedPetStats}
            userStats={transformedUserStats}
            // Add note about simplified tracking
            isSimplified={true}
          />
        </motion.div>

        {/* Feeding Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <FeedingSection
            petName={transformedPetStatus.name}
            petIsAlive={transformedPetStatus.isAlive}
            supportedTokens={supportedTokens}
            onFeed={feedPet}
            isConnected={isConnected}
            isWritePending={isWritePending}
            // Add simplified feeding info
            isSimplified={true}
            contractAddress={contractAddress}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default PetPage;
