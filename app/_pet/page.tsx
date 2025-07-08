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

  // Get all pet data from our custom hook
  const {
    petStatus,
    petStats,
    userStats,
    supportedTokens,
    isLoading,
    error,
    lastUpdate,
    refreshData,
    // Write functions
    feedPet,
    revivePet,
    isWritePending,
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
            petName={petStatus.name}
            petType={petStatus.petType}
            isAlive={petStatus.isAlive}
            lastUpdate={lastUpdate}
            onRefresh={refreshData}
            isRefreshing={isLoading}
          />
        </motion.div>

        {/* Main Pet Status Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <PetStatusCard
            petStatus={petStatus}
            userStats={userStats}
            onRevive={revivePet}
            isConnected={isConnected}
            isWritePending={isWritePending}
          />
        </motion.div>

        {/* Community Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <CommunityStats petStats={petStats} userStats={userStats} />
        </motion.div>

        {/* Feeding Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <FeedingSection
            petName={petStatus.name}
            petIsAlive={petStatus.isAlive}
            supportedTokens={supportedTokens}
            onFeed={feedPet}
            isConnected={isConnected}
            isWritePending={isWritePending}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default PetPage;
