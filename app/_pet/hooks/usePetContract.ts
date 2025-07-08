// pet/hooks/usePetContract.ts
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useAccount,
} from "wagmi";
import { type Address, formatUnits, parseUnits } from "viem";
import { useToast } from "@/hooks/use-toast";
import {
  PetStatus,
  PetStats,
  UserStats,
  SupportedToken,
  PetType,
  PetMood,
  PetActionType,
  UsePetContractReturn,
  PET_TYPE_NAMES,
  PET_MOOD_NAMES,
  PET_ACTION_NAMES,
  formatAge,
  getTimeSinceLastFed,
} from "../types";

// Pet contract address - will be set after deployment
const PET_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_PET_CONTRACT_ADDRESS as Address) ||
  "0x0000000000000000000000000000000000000000";

// Pet contract ABI - extracted from our PetBurnManager.sol
const PET_CONTRACT_ABI = [
  // Read functions
  {
    inputs: [],
    name: "getPetStatus",
    outputs: [
      { name: "name", type: "string" },
      { name: "petType", type: "uint8" },
      { name: "health", type: "uint256" },
      { name: "happiness", type: "uint256" },
      { name: "energy", type: "uint256" },
      { name: "age", type: "uint256" },
      { name: "isAlive", type: "bool" },
      { name: "mood", type: "uint8" },
      { name: "action", type: "uint8" },
      { name: "message", type: "string" },
      { name: "lastFed", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPetStats",
    outputs: [
      {
        components: [
          { name: "totalFeedings", type: "uint256" },
          { name: "totalBurnedTokens", type: "uint256" },
          { name: "totalFeeders", type: "uint256" },
          { name: "longestSurvival", type: "uint256" },
          { name: "currentAge", type: "uint256" },
          { name: "deathCount", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserStats",
    outputs: [
      { name: "hasEverFed", type: "bool" },
      { name: "feedingCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSupportedTokens",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "supportedTokens",
    outputs: [
      { name: "isSupported", type: "bool" },
      { name: "feedingPower", type: "uint256" },
      { name: "minBurnAmount", type: "uint256" },
      { name: "tokenName", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "hours", type: "uint256" }],
    name: "previewPetStatusAfterTime",
    outputs: [
      { name: "health", type: "uint256" },
      { name: "happiness", type: "uint256" },
      { name: "energy", type: "uint256" },
      { name: "wouldBeAlive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "revivalCost",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Write functions
  {
    inputs: [],
    name: "revivePet",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "feeder", type: "address" },
      { indexed: true, name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "healthGained", type: "uint256" },
      { name: "happinessGained", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
    name: "PetFed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { name: "actionType", type: "uint8" },
      { name: "message", type: "string" },
      { name: "timestamp", type: "uint256" },
      { name: "newHealth", type: "uint256" },
      { name: "newHappiness", type: "uint256" },
      { name: "newEnergy", type: "uint256" },
    ],
    name: "PetAction",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { name: "deathTimestamp", type: "uint256" },
      { name: "finalHealth", type: "uint256" },
      { name: "lastWords", type: "string" },
    ],
    name: "PetDeath",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "reviver", type: "address" },
      { name: "revivalCost", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
    name: "PetRevived",
    type: "event",
  },
] as const;

// Types for our pet data
export interface PetStatus {
  name: string;
  petType: number; // 0 = DOG, 1 = CAT, etc.
  health: number;
  happiness: number;
  energy: number;
  age: number; // in hours
  isAlive: boolean;
  mood: number; // 0-5 mood enum
  action: number; // 0-7 action enum
  message: string;
  lastFed: number; // timestamp
}

export interface PetStats {
  totalFeedings: number;
  totalBurnedTokens: string;
  totalFeeders: number;
  longestSurvival: number;
  currentAge: number;
  deathCount: number;
}

export interface UserStats {
  hasEverFed: boolean;
  feedingCount: number;
}

export interface SupportedToken {
  address: string;
  name: string;
  feedingPower: string;
  minBurnAmount: string;
  isSupported: boolean;
}

export interface PetPreview {
  health: number;
  happiness: number;
  energy: number;
  wouldBeAlive: boolean;
}

export function usePetContract(): UsePetContractReturn {
  const { address } = useAccount();
  const { toast } = useToast();
  const { writeContract, isPending: isWritePending } = useWriteContract();

  // State for managing data freshness
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [manualRefreshCount, setManualRefreshCount] = useState(0);

  // Contract configuration - memoized to prevent re-renders
  const petContract = useMemo(
    () =>
      ({
        address: PET_CONTRACT_ADDRESS,
        abi: PET_CONTRACT_ABI,
      } as const),
    []
  );

  // Read pet status
  const {
    data: petStatusData,
    isLoading: petStatusLoading,
    error: petStatusError,
    refetch: refetchPetStatus,
  } = useReadContract({
    ...petContract,
    functionName: "getPetStatus",
    query: {
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 15000, // Consider fresh for 15 seconds
    },
  });

  // Read pet stats
  const {
    data: petStatsData,
    isLoading: petStatsLoading,
    error: petStatsError,
    refetch: refetchPetStats,
  } = useReadContract({
    ...petContract,
    functionName: "getPetStats",
    query: {
      refetchInterval: 60000, // Less frequent for stats
      staleTime: 30000,
    },
  });

  // Read user stats
  const {
    data: userStatsData,
    isLoading: userStatsLoading,
    error: userStatsError,
    refetch: refetchUserStats,
  } = useReadContract({
    ...petContract,
    functionName: "getUserStats",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
      refetchInterval: 45000,
      staleTime: 30000,
    },
  });

  // Read supported tokens
  const {
    data: supportedTokensData,
    isLoading: tokensLoading,
    refetch: refetchTokens,
  } = useReadContract({
    ...petContract,
    functionName: "getSupportedTokens",
    query: {
      refetchInterval: 120000, // Tokens change infrequently
      staleTime: 60000,
    },
  });

  // Read revival cost
  const { data: revivalCostData, isLoading: revivalCostLoading } =
    useReadContract({
      ...petContract,
      functionName: "revivalCost",
      query: {
        staleTime: 300000, // Revival cost rarely changes
      },
    });

  // Watch for pet events to trigger updates
  useWatchContractEvent({
    ...petContract,
    eventName: "PetFed",
    onLogs: (logs) => {
      console.log("🍖 Pet fed:", logs);
      // Refresh data when pet is fed
      setTimeout(() => {
        refetchPetStatus();
        refetchPetStats();
        refetchUserStats();
      }, 2000); // Delay to let blockchain state settle
    },
  });

  useWatchContractEvent({
    ...petContract,
    eventName: "PetAction",
    onLogs: (logs) => {
      console.log("🐕 Pet action:", logs);
      setTimeout(() => {
        refetchPetStatus();
      }, 1000);
    },
  });

  useWatchContractEvent({
    ...petContract,
    eventName: "PetDeath",
    onLogs: (logs) => {
      console.log("💀 Pet died:", logs);
      toast({
        title: "😢 Pet Has Passed Away",
        description:
          "Our beloved pet is no longer with us. Consider reviving them!",
        variant: "destructive",
      });
      setTimeout(() => {
        refetchPetStatus();
        refetchPetStats();
      }, 2000);
    },
  });

  useWatchContractEvent({
    ...petContract,
    eventName: "PetRevived",
    onLogs: (logs) => {
      console.log("❤️ Pet revived:", logs);
      toast({
        title: "🎉 Pet Revived!",
        description: "Welcome back! Our pet is alive and ready for love.",
      });
      setTimeout(() => {
        refetchPetStatus();
        refetchPetStats();
      }, 2000);
    },
  });

  // Process pet status data
  const petStatus = useMemo((): PetStatus | null => {
    if (!petStatusData) return null;

    const [
      name,
      petType,
      health,
      happiness,
      energy,
      age,
      isAlive,
      mood,
      action,
      message,
      lastFed,
    ] = petStatusData;

    return {
      name,
      petType: Number(petType) as PetType,
      health: Number(health),
      happiness: Number(happiness),
      energy: Number(energy),
      age: Number(age),
      isAlive,
      mood: Number(mood) as PetMood,
      action: Number(action) as PetActionType,
      message,
      lastFed: Number(lastFed),
    };
  }, [petStatusData]);

  // Process pet stats data
  const petStats = useMemo((): PetStats | null => {
    if (!petStatsData) return null;

    // petStatsData is a tuple, destructure it properly
    const stats = petStatsData as {
      totalFeedings: bigint;
      totalBurnedTokens: bigint;
      totalFeeders: bigint;
      longestSurvival: bigint;
      currentAge: bigint;
      deathCount: bigint;
    };

    return {
      totalFeedings: Number(stats.totalFeedings),
      totalBurnedTokens: formatUnits(stats.totalBurnedTokens, 18),
      totalFeeders: Number(stats.totalFeeders),
      longestSurvival: Number(stats.longestSurvival),
      currentAge: Number(stats.currentAge),
      deathCount: Number(stats.deathCount),
    };
  }, [petStatsData]);

  // Process user stats data
  const userStats = useMemo((): UserStats | null => {
    if (!userStatsData || !address) return null;

    const [hasEverFed, feedingCount] = userStatsData;

    return {
      hasEverFed,
      feedingCount: Number(feedingCount),
    };
  }, [userStatsData, address]);

  // Process supported tokens (placeholder - will need individual token calls)
  const supportedTokens = useMemo((): SupportedToken[] => {
    if (!supportedTokensData) return [];

    // TODO: For each token address, we need to call supportedTokens(address) to get details
    // For now, return empty array until we implement the token details fetching
    return [];
  }, [supportedTokensData]);

  // Write function: Revive pet
  const revivePet = useCallback(async () => {
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to revive the pet.",
        variant: "destructive",
      });
      return;
    }

    if (!revivalCostData) {
      toast({
        title: "Revival Cost Unknown",
        description: "Unable to determine revival cost. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      await writeContract({
        ...petContract,
        functionName: "revivePet",
        value: revivalCostData,
      });

      toast({
        title: "Revival Transaction Sent",
        description: "Your pet revival transaction has been submitted!",
      });
    } catch (error) {
      console.error("Revival error:", error);
      toast({
        title: "Revival Failed",
        description: "Failed to revive pet. Please try again.",
        variant: "destructive",
      });
    }
  }, [address, revivalCostData, writeContract, toast, petContract]);

  // Write function: Feed pet (will be called from token contracts)
  const feedPet = useCallback(
    async (tokenAddress: Address, amount: string) => {
      // This will actually be handled by the token burn mechanism
      // The user burns tokens, which calls notifyBurn on our contract
      toast({
        title: "Feed Function",
        description: "This will be implemented when token contracts are ready.",
      });
    },
    [toast]
  );

  // Manual refresh function
  const refreshData = useCallback(async () => {
    setManualRefreshCount((prev: number) => prev + 1);
    await Promise.all([
      refetchPetStatus(),
      refetchPetStats(),
      refetchUserStats(),
      refetchTokens(),
    ]);
    setLastUpdate(new Date());
  }, [refetchPetStatus, refetchPetStats, refetchUserStats, refetchTokens]);

  // Update last update time when data changes
  useEffect(() => {
    if (petStatusData || petStatsData) {
      setLastUpdate(new Date());
    }
  }, [petStatusData, petStatsData, manualRefreshCount]);

  // Computed loading and error states
  const isLoading =
    petStatusLoading ||
    petStatsLoading ||
    (address ? userStatsLoading : false) ||
    tokensLoading;
  const error =
    petStatusError?.message ||
    petStatsError?.message ||
    userStatsError?.message ||
    null;

  // Helper functions for UI
  const getPetTypeName = useCallback((type: PetType): string => {
    return PET_TYPE_NAMES[type] || "Unknown";
  }, []);

  const getMoodName = useCallback((mood: PetMood): string => {
    return PET_MOOD_NAMES[mood] || "Unknown";
  }, []);

  const getActionName = useCallback((action: PetActionType): string => {
    return PET_ACTION_NAMES[action] || "Unknown";
  }, []);

  const getTimeSinceLastFedFormatted = useCallback(
    (lastFed: number): string => {
      return getTimeSinceLastFed(lastFed);
    },
    []
  );

  const formatAgeFormatted = useCallback((ageInHours: number): string => {
    return formatAge(ageInHours);
  }, []);

  const revivalCost = revivalCostData
    ? formatUnits(revivalCostData, 18)
    : "0.1";

  return {
    // Core data
    petStatus,
    petStats,
    userStats,
    supportedTokens,
    revivalCost,

    // Loading states
    isLoading,
    error,
    lastUpdate,

    // Actions
    refreshData,
    feedPet,
    revivePet,
    isWritePending,

    // Helpers
    getPetTypeName,
    getMoodName,
    getActionName,
    formatAge: formatAgeFormatted,
    getTimeSinceLastFed: getTimeSinceLastFedFormatted,

    // Contract address for debugging
    contractAddress: PET_CONTRACT_ADDRESS,
  };
}
