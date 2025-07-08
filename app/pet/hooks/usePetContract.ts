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
  "0x821a3AE43bc36a103c67f6C3B4DFDDF8847457b8"; // Your deployed contract

// Enhanced ABI for our updated contract
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
    inputs: [],
    name: "getPetInfo",
    outputs: [
      { name: "name", type: "string" },
      { name: "health", type: "uint256" },
      { name: "isAlive", type: "bool" },
      { name: "lastFed", type: "uint256" },
      { name: "totalFeedings", type: "uint256" },
      { name: "deathCount", type: "uint256" },
      { name: "currentCaretaker", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRevivalInfo",
    outputs: [
      { name: "currentCost", type: "uint256" },
      { name: "nextCost", type: "uint256" },
      { name: "deathCount", type: "uint256" },
      { name: "maxCost", type: "uint256" },
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
    inputs: [{ name: "newName", type: "string" }],
    name: "renamePet",
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
      { name: "healthGained", type: "uint256" },
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
      { name: "deathCount", type: "uint256" },
    ],
    name: "PetDied",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "reviver", type: "address" },
      { indexed: true, name: "newOwner", type: "address" },
      { name: "revivalCost", type: "uint256" },
      { name: "timestamp", type: "uint256" },
      { name: "deathCount", type: "uint256" },
    ],
    name: "PetRevived",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "previousCaretaker", type: "address" },
      { indexed: true, name: "newCaretaker", type: "address" },
    ],
    name: "PetCaretakerChanged",
    type: "event",
  },
] as const;

// Types
interface SimplePetStatus {
  name: string;
  health: number;
  isAlive: boolean;
  lastFed: number;
  totalFeedings: number;
}

export interface ExtendedPetStatus {
  name: string;
  health: number;
  isAlive: boolean;
  lastFed: number;
  totalFeedings: number;
  deathCount: number;
  currentCaretaker: string;
}

export interface RevivalInfo {
  currentCost: bigint;
  nextCost: bigint;
  deathCount: number;
  maxCost: bigint;
}

export interface UsePetContractReturn {
  // Core data
  petStatus: SimplePetStatus | null;
  extendedPetInfo: ExtendedPetStatus | null;
  revivalInfo: RevivalInfo | null;
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
  renamePet: (newName: string) => Promise<void>;
  updatePetHealth: () => Promise<void>;
  isWritePending: boolean;

  // Helpers
  formatTimeSince: (seconds: number) => string;
  isUserCaretaker: boolean;

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

  // Read extended pet info (includes caretaker)
  const {
    data: extendedPetData,
    isLoading: extendedPetLoading,
    error: extendedPetError,
    refetch: refetchExtendedPet,
  } = useReadContract({
    ...petContract,
    functionName: "getPetInfo",
    query: {
      refetchInterval: 30000,
    },
  });

  // Read revival info
  const {
    data: revivalData,
    isLoading: revivalLoading,
    refetch: refetchRevival,
  } = useReadContract({
    ...petContract,
    functionName: "getRevivalInfo",
    query: {
      refetchInterval: 30000,
    },
  });

  // Read current health
  const {
    data: currentHealthData,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useReadContract({
    ...petContract,
    functionName: "getCurrentHealth",
    query: {
      refetchInterval: 10000,
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
        refetchExtendedPet();
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
        refetchExtendedPet();
        refetchRevival();
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
        refetchExtendedPet();
        refetchRevival();
        refetchHealth();
      }, 2000);
    },
  });

  useWatchContractEvent({
    ...petContract,
    eventName: "PetCaretakerChanged",
    onLogs: (logs) => {
      console.log("👑 Caretaker changed:", logs);
      toast({
        title: "👑 New Caretaker!",
        description: "Pet ownership has been transferred!",
      });
      setTimeout(() => {
        refetchExtendedPet();
      }, 2000);
    },
  });

  // Process extended pet data
  const extendedPetInfo = useMemo((): ExtendedPetStatus | null => {
    if (!extendedPetData) return null;

    const [
      name,
      health,
      isAlive,
      lastFed,
      totalFeedings,
      deathCount,
      currentCaretaker,
    ] = extendedPetData;

    return {
      name,
      health: Number(health),
      isAlive,
      lastFed: Number(lastFed),
      totalFeedings: Number(totalFeedings),
      deathCount: Number(deathCount),
      currentCaretaker: currentCaretaker as string,
    };
  }, [extendedPetData]);

  // Process pet status data (for backwards compatibility)
  const petStatus = useMemo((): SimplePetStatus | null => {
    if (!extendedPetInfo) return null;

    return {
      name: extendedPetInfo.name,
      health: extendedPetInfo.health,
      isAlive: extendedPetInfo.isAlive,
      lastFed: extendedPetInfo.lastFed,
      totalFeedings: extendedPetInfo.totalFeedings,
    };
  }, [extendedPetInfo]);

  // Process revival info
  const revivalInfo = useMemo((): RevivalInfo | null => {
    if (!revivalData) return null;

    const [currentCost, nextCost, deathCount, maxCost] = revivalData;

    return {
      currentCost,
      nextCost,
      deathCount: Number(deathCount),
      maxCost,
    };
  }, [revivalData]);

  // Check if user is caretaker
  const isUserCaretaker = useMemo(() => {
    if (!address || !extendedPetInfo?.currentCaretaker) return false;
    return (
      address.toLowerCase() === extendedPetInfo.currentCaretaker.toLowerCase()
    );
  }, [address, extendedPetInfo?.currentCaretaker]);

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

    if (!revivalInfo?.currentCost) {
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
        value: revivalInfo.currentCost,
      });

      toast({
        title: "Revival Transaction Sent",
        description:
          "Your pet revival transaction has been submitted! You will become the new caretaker.",
      });
    } catch (error) {
      console.error("Revival error:", error);
      toast({
        title: "Revival Failed",
        description: "Failed to revive pet. Please try again.",
        variant: "destructive",
      });
    }
  }, [address, revivalInfo?.currentCost, writeContract, toast, petContract]);

  const renamePet = useCallback(
    async (newName: string) => {
      if (!address) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet to rename the pet.",
          variant: "destructive",
        });
        return;
      }

      if (!isUserCaretaker) {
        toast({
          title: "Not Pet Caretaker",
          description: "Only the current caretaker can rename the pet.",
          variant: "destructive",
        });
        return;
      }

      try {
        await writeContract({
          ...petContract,
          functionName: "renamePet",
          args: [newName],
        });

        toast({
          title: "Rename Transaction Sent",
          description: `Renaming pet to "${newName}"!`,
        });
      } catch (error) {
        console.error("Rename error:", error);
        toast({
          title: "Rename Failed",
          description: "Failed to rename pet. Please try again.",
          variant: "destructive",
        });
      }
    },
    [address, isUserCaretaker, writeContract, toast, petContract]
  );

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
      refetchExtendedPet(),
      refetchRevival(),
      refetchHealth(),
      refetchTime(),
      refetchUserStats(),
    ]);
  }, [
    refetchExtendedPet,
    refetchRevival,
    refetchHealth,
    refetchTime,
    refetchUserStats,
  ]);

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
    extendedPetLoading ||
    revivalLoading ||
    healthLoading ||
    timeLoading ||
    (address ? userStatsLoading : false);
  const error = extendedPetError?.message || null;
  const revivalCost = revivalInfo?.currentCost
    ? formatUnits(revivalInfo.currentCost, 18)
    : "0";

  return {
    // Core data
    petStatus,
    extendedPetInfo,
    revivalInfo,
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
    renamePet,
    updatePetHealth,
    isWritePending,

    // Helpers
    formatTimeSince,
    isUserCaretaker,

    // Contract info
    contractAddress: PET_CONTRACT_ADDRESS,
  };
}
