// pet/hooks/usePetContract.ts - Optimized Version
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  useReadContracts,
  useWriteContract,
  useWatchContractEvent,
  useAccount,
  useBlockNumber,
} from "wagmi";
import { type Address, formatUnits } from "viem";
import { useToast } from "@/hooks/use-toast";

// Pet contract address
const PET_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_PET_CONTRACT_ADDRESS as Address) ||
  "0x821a3AE43bc36a103c67f6C3B4DFDDF8847457b8";

// Consolidated ABI
const PET_CONTRACT_ABI = [
  // Read functions
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
    inputs: [{ name: "amount", type: "uint256" }],
    name: "previewHealthGain",
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
      { indexed: true, name: "owner", type: "address" },
      { name: "oldName", type: "string" },
      { name: "newName", type: "string" },
      { name: "timestamp", type: "uint256" },
    ],
    name: "PetRenamed",
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

export interface PetContractData {
  petInfo: ExtendedPetStatus | null;
  revivalInfo: RevivalInfo | null;
  currentHealth: number | null;
  timeSinceLastFed: number | null;
  userFeedingCount: number | null;
}

export interface UsePetContractReturn {
  // Consolidated data
  data: PetContractData;

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
  revivalCost: string;

  // Contract info
  contractAddress: string;
}

export function usePetContract(): UsePetContractReturn {
  const { address } = useAccount();
  const { toast } = useToast();
  const { writeContract, isPending: isWritePending } = useWriteContract();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // State for manual refresh tracking
  const [lastRefresh, setLastRefresh] = useState(0);

  // Contract configuration
  const petContract = useMemo(
    () => ({
      address: PET_CONTRACT_ADDRESS,
      abi: PET_CONTRACT_ABI,
    }),
    []
  );

  // Build consolidated contract calls
  const contractCalls = useMemo(() => {
    const calls: any[] = [
      // Always fetch pet info
      {
        ...petContract,
        functionName: "getPetInfo",
      },
      // Always fetch revival info
      {
        ...petContract,
        functionName: "getRevivalInfo",
      },
      // Always fetch current health
      {
        ...petContract,
        functionName: "getCurrentHealth",
      },
      // Always fetch time since last fed
      {
        ...petContract,
        functionName: "getTimeSinceLastFed",
      },
    ];

    // Only add user feeding count if we have an address
    if (address) {
      calls.push({
        ...petContract,
        functionName: "getUserFeedingCount",
        args: [address],
      });
    }

    return calls;
  }, [petContract, address]);

  // Single consolidated read call
  const {
    data: contractData,
    isLoading,
    error: contractError,
    refetch,
  } = useReadContracts({
    contracts: contractCalls,
    query: {
      // Optimize refresh intervals
      refetchInterval: 30000, // 30 seconds
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  });

  // Process the consolidated data
  const processedData = useMemo((): PetContractData => {
    if (!contractData) {
      return {
        petInfo: null,
        revivalInfo: null,
        currentHealth: null,
        timeSinceLastFed: null,
        userFeedingCount: null,
      };
    }

    // Extract results - order matches contractCalls
    const [
      petInfoResult,
      revivalInfoResult,
      healthResult,
      timeResult,
      userStatsResult,
    ] = contractData;

    // Process pet info
    let petInfo: ExtendedPetStatus | null = null;
    if (petInfoResult.status === "success" && petInfoResult.result) {
      const result = petInfoResult.result as readonly [
        string,
        bigint,
        boolean,
        bigint,
        bigint,
        bigint,
        `0x${string}`
      ];
      const [
        name,
        health,
        isAlive,
        lastFed,
        totalFeedings,
        deathCount,
        currentCaretaker,
      ] = result;
      petInfo = {
        name,
        health: Number(health),
        isAlive,
        lastFed: Number(lastFed),
        totalFeedings: Number(totalFeedings),
        deathCount: Number(deathCount),
        currentCaretaker: currentCaretaker as string,
      };
    }

    // Process revival info
    let revivalInfo: RevivalInfo | null = null;
    if (revivalInfoResult.status === "success" && revivalInfoResult.result) {
      const result = revivalInfoResult.result as readonly [
        bigint,
        bigint,
        bigint,
        bigint
      ];
      const [currentCost, nextCost, deathCount, maxCost] = result;
      revivalInfo = {
        currentCost,
        nextCost,
        deathCount: Number(deathCount),
        maxCost,
      };
    }

    // Process current health
    const currentHealth =
      healthResult.status === "success" && healthResult.result
        ? Number(healthResult.result)
        : null;

    // Process time since last fed
    const timeSinceLastFed =
      timeResult.status === "success" && timeResult.result
        ? Number(timeResult.result)
        : null;

    // Process user feeding count
    const userFeedingCount =
      userStatsResult?.status === "success" && userStatsResult.result
        ? Number(userStatsResult.result)
        : null;

    return {
      petInfo,
      revivalInfo,
      currentHealth,
      timeSinceLastFed,
      userFeedingCount,
    };
  }, [contractData]);

  // Enhanced error handler for events
  const handleEventError = useCallback((error: Error, eventName: string) => {
    if (
      error.message.includes("filter not found") ||
      error.message.includes("eth_uninstallFilter") ||
      error.message.includes("RpcRequestError")
    ) {
      console.warn(`Event filter warning for ${eventName}:`, error.message);
      return;
    }
    console.error(`Event watch error for ${eventName}:`, error);
  }, []);

  // Manual refresh function
  const refreshData = useCallback(async () => {
    setLastRefresh(Date.now());
    await refetch();
  }, [refetch]);

  // Auto-refresh on successful transactions
  const triggerRefresh = useCallback(() => {
    // Immediate refresh
    setTimeout(refreshData, 1000);
    // Backup refresh
    setTimeout(refreshData, 3000);
    // Final refresh
    setTimeout(refreshData, 8000);
  }, [refreshData]);

  // Watch for PetFed events
  useWatchContractEvent({
    ...petContract,
    eventName: "PetFed",
    onLogs: (logs) => {
      console.log("🍖 Pet fed:", logs);
      toast({
        title: "🍖 Pet Fed!",
        description: "The pet has been fed and is feeling better!",
      });
      triggerRefresh();
    },
    onError: (error) => handleEventError(error, "PetFed"),
  });

  // Watch for PetDied events
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
      triggerRefresh();
    },
    onError: (error) => handleEventError(error, "PetDied"),
  });

  // Watch for PetRevived events
  useWatchContractEvent({
    ...petContract,
    eventName: "PetRevived",
    onLogs: (logs) => {
      console.log("❤️ Pet revived:", logs);
      toast({
        title: "🎉 Pet Revived!",
        description: "Welcome back! The pet is alive again!",
      });
      triggerRefresh();
    },
    onError: (error) => handleEventError(error, "PetRevived"),
  });

  // Watch for PetRenamed events
  useWatchContractEvent({
    ...petContract,
    eventName: "PetRenamed",
    onLogs: (logs) => {
      console.log("🏷️ Pet renamed:", logs);
      toast({
        title: "🏷️ Pet Renamed!",
        description: "Your pet has a new name!",
      });
      triggerRefresh();
    },
    onError: (error) => handleEventError(error, "PetRenamed"),
  });

  // Watch for PetCaretakerChanged events
  useWatchContractEvent({
    ...petContract,
    eventName: "PetCaretakerChanged",
    onLogs: (logs) => {
      console.log("👑 Caretaker changed:", logs);
      toast({
        title: "👑 New Caretaker!",
        description: "Pet ownership has been transferred!",
      });
      triggerRefresh();
    },
    onError: (error) => handleEventError(error, "PetCaretakerChanged"),
  });

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

    if (!processedData.revivalInfo?.currentCost) {
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
        value: processedData.revivalInfo.currentCost,
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
  }, [
    address,
    processedData.revivalInfo?.currentCost,
    writeContract,
    toast,
    petContract,
  ]);

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
    [address, writeContract, toast, petContract]
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

  // Helper functions
  const formatTimeSince = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  }, []);

  const isUserCaretaker = useMemo(() => {
    if (!address || !processedData.petInfo?.currentCaretaker) return false;
    return (
      address.toLowerCase() ===
      processedData.petInfo.currentCaretaker.toLowerCase()
    );
  }, [address, processedData.petInfo?.currentCaretaker]);

  const revivalCost = useMemo(() => {
    return processedData.revivalInfo?.currentCost
      ? formatUnits(processedData.revivalInfo.currentCost, 18)
      : "0";
  }, [processedData.revivalInfo?.currentCost]);

  const error = contractError?.message || null;

  return {
    data: processedData,
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
    contractAddress: PET_CONTRACT_ADDRESS,
  };
}
