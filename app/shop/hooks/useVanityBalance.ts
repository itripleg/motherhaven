// app/shop/hooks/useVanityBalance.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useBalance } from "wagmi";
import { Address } from "viem";
import { VANITY_BURN_MANAGER_ABI, VANITY_BURN_MANAGER_ADDRESS } from "../types";
import { useUserTokenBalances } from "@/hooks/token/useUserTokenBalances";

interface VanityBalanceData {
  totalBurned: bigint;
  totalSpent: bigint;
  availableBalance: bigint;
  possibleNameChanges: number;
}

interface UseVanityBalanceReturn {
  // Token balances
  vainTokenBalance: number; // User's actual VAIN token balance from dashboard system
  burnedBalance: number; // Amount burned (available for shop purchases)
  totalBurned: number;
  totalSpent: number;
  avaxBalance: number; // Native AVAX balance

  // User state
  canSetName: boolean;
  currentVanityName: string;

  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Actions
  refetch: () => void;

  // Additional helper states
  hasTokens: boolean;
  hasBurnedTokens: boolean;
  hasAvax: boolean;
}

export function useVanityBalance(): UseVanityBalanceReturn {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user's token balances from the dashboard system
  const {
    balances,
    totalTokens,
    refetch: refetchTokenBalances,
  } = useUserTokenBalances();

  // Get native AVAX balance
  const { data: avaxBalance, refetch: refetchAvaxBalance } = useBalance({
    address,
  });

  // Look for VAIN token in user's balances (you might need to adjust the search criteria)
  const vainToken = balances.find(
    (token) =>
      token.symbol.toLowerCase().includes("vain") ||
      token.name.toLowerCase().includes("vain") ||
      // Add your specific VAIN token address here if you know it
      token.address.toLowerCase() === "your_vain_token_address_here"
  );

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
      refetchInterval: 30000,
      staleTime: 15000,
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
      refetchInterval: 60000,
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
  const formatBigIntToNumber = useCallback(
    (value: bigint | undefined): number => {
      if (!value) return 0;
      try {
        // Convert from wei to ether (divide by 10^18)
        return Number(value) / 1e18;
      } catch (error) {
        console.error("Error formatting BigInt:", error);
        return 0;
      }
    },
    []
  );

  // Prepare return data
  const balanceData: VanityBalanceData | null = burnInfo
    ? {
        totalBurned: burnInfo[0] as bigint,
        totalSpent: burnInfo[1] as bigint,
        availableBalance: burnInfo[2] as bigint,
        possibleNameChanges: Number(burnInfo[3]),
      }
    : null;

  // Use token balance from dashboard system
  const vainTokenBalance = vainToken
    ? parseFloat(vainToken.formattedBalance)
    : 0;
  const burnedBalance = formatBigIntToNumber(balanceData?.availableBalance);
  const totalBurned = formatBigIntToNumber(balanceData?.totalBurned);
  const totalSpent = formatBigIntToNumber(balanceData?.totalSpent);
  const avaxBalanceFormatted = avaxBalance
    ? parseFloat(avaxBalance.formatted)
    : 0;

  const currentVanityName = (vanityName as string) || "";
  const userCanSetName = Boolean(canSetName);

  // Helper states
  const hasTokens = vainTokenBalance > 0;
  const hasBurnedTokens = burnedBalance > 0;
  const hasAvax = avaxBalanceFormatted > 0;

  const isLoading =
    !mounted || isBurnInfoLoading || isVanityNameLoading || isCanSetNameLoading;

  const isError = isBurnInfoError;
  const error = burnInfoError;

  // Combined refetch function
  const refetch = useCallback(() => {
    refetchTokenBalances();
    refetchAvaxBalance();
    refetchBurnInfo();
    refetchVanityName();
    refetchCanSetName();
  }, [
    refetchTokenBalances,
    refetchAvaxBalance,
    refetchBurnInfo,
    refetchVanityName,
    refetchCanSetName,
  ]);

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("VanityBalance Debug:", {
        address,
        vainTokenBalance,
        burnedBalance,
        totalBurned,
        totalSpent,
        avaxBalance: avaxBalanceFormatted,
        currentVanityName,
        canSetName: userCanSetName,
        totalTokensInWallet: totalTokens,
        vainTokenFound: !!vainToken,
      });
    }
  }, [
    address,
    vainTokenBalance,
    burnedBalance,
    totalBurned,
    totalSpent,
    avaxBalanceFormatted,
    currentVanityName,
    userCanSetName,
    totalTokens,
    vainToken,
  ]);

  return {
    // Token balances
    vainTokenBalance,
    burnedBalance,
    totalBurned,
    totalSpent,
    avaxBalance: avaxBalanceFormatted,

    // User state
    canSetName: userCanSetName,
    currentVanityName,

    // Loading states
    isLoading,
    isError,
    error,

    // Actions
    refetch,

    // Additional helper states
    hasTokens,
    hasBurnedTokens,
    hasAvax,
  };
}
