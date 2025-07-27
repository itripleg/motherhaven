// app/shop/hooks/useVanityBalance.ts
"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { Address } from "viem";
import { VANITY_BURN_MANAGER_ABI, VANITY_BURN_MANAGER_ADDRESS } from "../types";

interface VanityBalanceData {
  totalBurned: bigint;
  totalSpent: bigint;
  availableBalance: bigint;
  possibleNameChanges: number;
}

interface UseVanityBalanceReturn {
  // Balance data
  balanceData: VanityBalanceData | null;
  availableBalance: number; // Formatted as number for display
  totalBurned: number;
  totalSpent: number;
  possibleNameChanges: number;

  // User state
  canSetName: boolean;
  currentVanityName: string;

  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Actions
  refetch: () => void;
}

export function useVanityBalance(): UseVanityBalanceReturn {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user's burn info from contract
  const {
    data: burnInfo,
    isLoading: isBurnInfoLoading,
    isError: isBurnInfoError,
    error: burnInfoError,
    refetch: refetchBurnInfo,
  } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "getUserBurnInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && mounted && isConnected,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 15000, // Consider data stale after 15 seconds
    },
  });

  // Fetch user's current vanity name
  const {
    data: vanityName,
    isLoading: isVanityNameLoading,
    refetch: refetchVanityName,
  } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "getUserVanityName",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && mounted && isConnected,
      refetchInterval: 60000, // Refetch every minute (names change less frequently)
      staleTime: 30000,
    },
  });

  // Check if user can set name
  const {
    data: canSetName,
    isLoading: isCanSetNameLoading,
    refetch: refetchCanSetName,
  } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "canUserSetName",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && mounted && isConnected,
      refetchInterval: 60000,
      staleTime: 30000,
    },
  });

  // Calculate formatted values
  const formatBigIntToNumber = (value: bigint | undefined): number => {
    if (!value) return 0;
    try {
      // Convert from wei to ether (divide by 10^18)
      return Number(value) / 1e18;
    } catch (error) {
      console.error("Error formatting BigInt:", error);
      return 0;
    }
  };

  // Prepare return data
  const balanceData: VanityBalanceData | null = burnInfo
    ? {
        totalBurned: burnInfo[0] as bigint,
        totalSpent: burnInfo[1] as bigint,
        availableBalance: burnInfo[2] as bigint,
        possibleNameChanges: Number(burnInfo[3]),
      }
    : null;

  const availableBalance = formatBigIntToNumber(balanceData?.availableBalance);
  const totalBurned = formatBigIntToNumber(balanceData?.totalBurned);
  const totalSpent = formatBigIntToNumber(balanceData?.totalSpent);
  const possibleNameChanges = balanceData?.possibleNameChanges || 0;

  const currentVanityName = (vanityName as string) || "";
  const userCanSetName = Boolean(canSetName);

  const isLoading =
    !mounted || isBurnInfoLoading || isVanityNameLoading || isCanSetNameLoading;

  const isError = isBurnInfoError;
  const error = burnInfoError;

  // Combined refetch function
  const refetch = () => {
    refetchBurnInfo();
    refetchVanityName();
    refetchCanSetName();
  };

  return {
    // Balance data
    balanceData,
    availableBalance,
    totalBurned,
    totalSpent,
    possibleNameChanges,

    // User state
    canSetName: userCanSetName,
    currentVanityName,

    // Loading states
    isLoading,
    isError,
    error,

    // Actions
    refetch,
  };
}
