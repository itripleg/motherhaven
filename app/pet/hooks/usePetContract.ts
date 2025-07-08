// pet/hooks/usePetContract.ts
import { useState, useCallback, useMemo } from "react";
import {
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
  useAccount,
} from "wagmi";
import { type Address, formatUnits } from "viem";
import { useToast } from "@/hooks/use-toast";

// Pet contract address - will be set after deployment
const PET_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_PET_CONTRACT_ADDRESS as Address) ||
  "0x0000000000000000000000000000000000000000";

// Simplified ABI for our basic contract
const PET_CONTRACT_ABI = [
  // Read functions
  {
    inputs: [],
    name: "getPetStatus",
    outputs: [
      { name: "name", type: "string" },
      { name: "health", type: "uint256" },
      { name: "isAlive", type: "bool" },
      { name: "lastFed", type: "uint256" },
      { name: "totalFeedings", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserFeedingCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentHealth",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTimeSinceLastFed",
    outputs: [{ name: "", type: "uint256" }],
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
  {
    inputs: [{ name: "token", type: "address" }],
    name: "supportedTokens",
    outputs: [{ name: "", type: "bool" }],
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
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "supported", type: "bool" },
    ],
    name: "setSupportedToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "updatePetHealth",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "feeder", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "newHealth", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
    name: "PetFed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { name: "timestamp", type: "uint256" },
      { name: "message", type: "string" },
    ],
    name: "PetDied",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "reviver", type: "address" },
      { name: "timestamp", type: "uint256" },
    ],
    name: "PetRevived",
    type: "event",
  },
] as const;

// Simplified types
export interface SimplePetStatus {
  name: string;
  health: number;
  isAlive: boolean;
  lastFed: number;
  totalFeedings: number;
}

export interface UsePetContractReturn {
  // Core data
  petStatus: SimplePetStatus | null;
  currentHealth: number | null;
  timeSinceLastFed: number | null;
  userFeedingCount: number | null;
  revivalCost: string;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshData: () => Promise<void>;
  revivePet: () => Promise<void>;
  updatePetHealth: () => Promise<void>;
  isWritePending: boolean;

  // Helpers
  formatTimeSince: (seconds: number) => string;

  // Contract info
  contractAddress: string;
}

export function usePetContract(): UsePetContractReturn {
  const { address } = useAccount();
  const { toast } = useToast();
  const { writeContract, isPending: isWritePending } = useWriteContract();

  // Contract configuration
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
    },
  });

  // Read current health (includes decay calculation)
  const {
    data: currentHealthData,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useReadContract({
    ...petContract,
    functionName: "getCurrentHealth",
    query: {
      refetchInterval: 10000, // More frequent for real-time health
    },
  });

  // Read time since last fed
  const {
    data: timeSinceLastFedData,
    isLoading: timeLoading,
    refetch: refetchTime,
  } = useReadContract({
    ...petContract,
    functionName: "getTimeSinceLastFed",
    query: {
      refetchInterval: 10000,
    },
  });

  // Read user feeding count
  const {
    data: userFeedingCountData,
    isLoading: userStatsLoading,
    refetch: refetchUserStats,
  } = useReadContract({
    ...petContract,
    functionName: "getUserFeedingCount",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
      refetchInterval: 30000,
    },
  });

  // Read revival cost
  const { data: revivalCostData } = useReadContract({
    ...petContract,
    functionName: "revivalCost",
  });

  // Watch for events
  useWatchContractEvent({
    ...petContract,
    eventName: "PetFed",
    onLogs: (logs) => {
      console.log("🍖 Pet fed:", logs);
      toast({
        title: "🍖 Pet Fed!",
        description: "The pet has been fed and is feeling better!",
      });
      setTimeout(() => {
        refetchPetStatus();
        refetchHealth();
        refetchUserStats();
      }, 2000);
    },
  });

  useWatchContractEvent({
    ...petContract,
    eventName: "PetDied",
    onLogs: (logs) => {
      console.log("💀 Pet died:", logs);
      toast({
        title: "😢 Pet Has Died",
        description: "The pet needs to be revived!",
        variant: "destructive",
      });
      setTimeout(() => {
        refetchPetStatus();
        refetchHealth();
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
        description: "Welcome back! The pet is alive again!",
      });
      setTimeout(() => {
        refetchPetStatus();
        refetchHealth();
      }, 2000);
    },
  });

  // Process pet status data
  const petStatus = useMemo((): SimplePetStatus | null => {
    if (!petStatusData) return null;

    const [name, health, isAlive, lastFed, totalFeedings] = petStatusData;

    return {
      name,
      health: Number(health),
      isAlive,
      lastFed: Number(lastFed),
      totalFeedings: Number(totalFeedings),
    };
  }, [petStatusData]);

  // Actions
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
        description: "Unable to determine revival cost.",
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

  const updatePetHealth = useCallback(async () => {
    try {
      await writeContract({
        ...petContract,
        functionName: "updatePetHealth",
      });

      toast({
        title: "Health Update Sent",
        description: "Pet health update transaction submitted!",
      });
    } catch (error) {
      console.error("Update health error:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update pet health.",
        variant: "destructive",
      });
    }
  }, [writeContract, toast, petContract]);

  const refreshData = useCallback(async () => {
    await Promise.all([
      refetchPetStatus(),
      refetchHealth(),
      refetchTime(),
      refetchUserStats(),
    ]);
  }, [refetchPetStatus, refetchHealth, refetchTime, refetchUserStats]);

  // Helper function
  const formatTimeSince = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  }, []);

  // Computed states
  const isLoading =
    petStatusLoading ||
    healthLoading ||
    timeLoading ||
    (address ? userStatsLoading : false);
  const error = petStatusError?.message || null;
  const revivalCost = revivalCostData
    ? formatUnits(revivalCostData, 18)
    : "0.1";

  return {
    // Core data
    petStatus,
    currentHealth: currentHealthData ? Number(currentHealthData) : null,
    timeSinceLastFed: timeSinceLastFedData
      ? Number(timeSinceLastFedData)
      : null,
    userFeedingCount: userFeedingCountData
      ? Number(userFeedingCountData)
      : null,
    revivalCost,

    // Loading states
    isLoading,
    error,

    // Actions
    refreshData,
    revivePet,
    updatePetHealth,
    isWritePending,

    // Helpers
    formatTimeSince,

    // Contract info
    contractAddress: PET_CONTRACT_ADDRESS,
  };
}
