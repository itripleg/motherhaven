// pet/hooks/usePetContract.ts
import { useState, useCallback, useMemo, useEffect } from "react";
import { useReadContracts, useWriteContract, useAccount } from "wagmi";
import { type Address, formatUnits } from "viem";
import { useToast } from "@/hooks/use-toast";
import { petEventEmitter } from "../components/PetEventWatcher";

const PET_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_PET_CONTRACT_ADDRESS as Address) ||
  "0x821a3AE43bc36a103c67f6C3B4DFDDF8847457b8";

const PET_CONTRACT_ABI = [
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
] as const;

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

export function usePetContract() {
  const { address } = useAccount();
  const { toast } = useToast();
  const { writeContract, isPending: isWritePending } = useWriteContract();

  const petContract = useMemo(
    () => ({
      address: PET_CONTRACT_ADDRESS,
      abi: PET_CONTRACT_ABI,
    }),
    []
  );

  // Single consolidated contract call
  const contractCalls = useMemo(() => {
    const calls: any[] = [
      { ...petContract, functionName: "getPetInfo" },
      { ...petContract, functionName: "getRevivalInfo" },
      { ...petContract, functionName: "getCurrentHealth" },
      { ...petContract, functionName: "getTimeSinceLastFed" },
    ];

    if (address) {
      calls.push({
        ...petContract,
        functionName: "getUserFeedingCount",
        args: [address],
      });
    }

    return calls;
  }, [petContract, address]);

  const {
    data: contractData,
    isLoading,
    error: contractError,
    refetch,
  } = useReadContracts({
    contracts: contractCalls,
    query: {
      refetchInterval: 60000, // 1 minute auto-refresh
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 30000, // 30 seconds
    },
  });

  // Listen to pet events and refresh data
  useEffect(() => {
    const handlePetEvent = (event: any) => {
      console.log("Pet event received:", event.eventName);

      // Refresh data when events occur
      setTimeout(() => {
        refetch();
      }, 2000); // Small delay to ensure blockchain state is updated
    };

    petEventEmitter.addEventListener(handlePetEvent);

    return () => {
      petEventEmitter.removeEventListener(handlePetEvent);
    };
  }, [refetch]);

  const processedData = useMemo(() => {
    if (!contractData) {
      return {
        petInfo: null,
        revivalInfo: null,
        currentHealth: null,
        timeSinceLastFed: null,
        userFeedingCount: null,
      };
    }

    const [
      petInfoResult,
      revivalInfoResult,
      healthResult,
      timeResult,
      userStatsResult,
    ] = contractData;

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
        name: String(name),
        health: Number(health),
        isAlive,
        lastFed: Number(lastFed),
        totalFeedings: Number(totalFeedings),
        deathCount: Number(deathCount),
        currentCaretaker: currentCaretaker as string,
      };
    }

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

    const currentHealth =
      healthResult.status === "success" && healthResult.result
        ? Number(healthResult.result)
        : null;

    const timeSinceLastFed =
      timeResult.status === "success" && timeResult.result
        ? Number(timeResult.result)
        : null;

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

  const refreshData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const revivePet = useCallback(async () => {
    if (!address || !processedData.revivalInfo?.currentCost) return;

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
      if (!address) return;

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

  const formatTimeSince = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m ago` : `${minutes}m ago`;
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
    // Backwards compatibility
    petStatus: processedData.petInfo
      ? {
          name: processedData.petInfo.name,
          health: processedData.petInfo.health,
          isAlive: processedData.petInfo.isAlive,
          lastFed: processedData.petInfo.lastFed,
          totalFeedings: processedData.petInfo.totalFeedings,
        }
      : null,
    extendedPetInfo: processedData.petInfo,
    revivalInfo: processedData.revivalInfo,
    currentHealth: processedData.currentHealth,
    timeSinceLastFed: processedData.timeSinceLastFed,
    userFeedingCount: processedData.userFeedingCount,
  };
}
