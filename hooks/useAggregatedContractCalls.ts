// hooks/useAggregatedContractCalls.ts
import { useReadContracts } from "wagmi";
import { useMemo } from "react";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";
import { Address, formatUnits } from "viem";

// Safe conversion utilities
function safeBigInt(value: any): bigint {
  try {
    if (!value) return 0n;
    if (typeof value === "bigint") return value;
    if (typeof value === "number") {
      return BigInt(Math.floor(value));
    }
    return BigInt(value.toString());
  } catch (error) {
    console.error("Error converting to BigInt:", error);
    return 0n;
  }
}

function safeFormatUnits(value: any, decimals: number = 18): string {
  try {
    if (value === null || value === undefined) return "0";

    if (typeof value === "string") value = BigInt(value);
    if (typeof value === "number") value = BigInt(Math.floor(value));
    if (typeof value !== "bigint") return "0";

    return formatUnits(value, decimals);
  } catch (error) {
    console.error("Error in safeFormatUnits:", error);
    return "0";
  }
}

interface AggregatedTokenData {
  // Raw BigInt values
  raw: {
    price: bigint;
    collateral: bigint;
    virtualSupply: bigint;
    fundingGoal: bigint;
    maxSupply: bigint;
    totalSupply: bigint;
  };

  // Formatted string values
  formatted: {
    price: string;
    collateral: string;
    virtualSupply: string;
    fundingGoal: string;
    maxSupply: string;
    totalSupply: string;
  };

  // State and config
  state: number;
  tradingFee: number;
  decimals: number;

  // Progress calculations
  progress: {
    fundingPercentage: number;
    isGoalReached: boolean;
    supplyUtilization: number;
  };

  // Loading and error states
  isLoading: boolean;
  error: Error | null;
  lastUpdated: number;
}

export function useAggregatedContractCalls(
  tokenAddress: Address
): AggregatedTokenData {
  // Single batched call for ALL token data
  const { data, isLoading, error, dataUpdatedAt } = useReadContracts({
    contracts: [
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "lastPrice",
        args: [tokenAddress],
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "collateral",
        args: [tokenAddress],
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "getTokenState",
        args: [tokenAddress],
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "virtualSupply",
        args: [tokenAddress],
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "getFundingGoal",
        args: [tokenAddress],
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "getMaxSupply",
        args: [tokenAddress],
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "totalSupply",
        args: [tokenAddress],
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "TRADING_FEE",
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "DECIMALS",
      },
    ],
    query: {
      refetchInterval: 30000, // 30 seconds
      staleTime: 15000, // Consider stale after 15 seconds
      enabled: !!tokenAddress,
      // Batch optimization
      gcTime: 60000, // Keep in cache for 1 minute
    },
  });

  return useMemo(() => {
    if (!data || isLoading) {
      return {
        raw: {
          price: 0n,
          collateral: 0n,
          virtualSupply: 0n,
          fundingGoal: 0n,
          maxSupply: 0n,
          totalSupply: 0n,
        },
        formatted: {
          price: "0",
          collateral: "0",
          virtualSupply: "0",
          fundingGoal: "0",
          maxSupply: "0",
          totalSupply: "0",
        },
        state: 0,
        tradingFee: 30, // Default 0.3%
        decimals: 18,
        progress: {
          fundingPercentage: 0,
          isGoalReached: false,
          supplyUtilization: 0,
        },
        isLoading: true,
        error: null,
        lastUpdated: 0,
      };
    }

    try {
      // Extract raw values safely
      const price = safeBigInt(data[0]?.result);
      const collateral = safeBigInt(data[1]?.result);
      const state = data[2]?.result ? Number(data[2].result) : 0;
      const virtualSupply = safeBigInt(data[3]?.result);
      const fundingGoal = safeBigInt(data[4]?.result);
      const maxSupply = safeBigInt(data[5]?.result);
      const totalSupply = safeBigInt(data[6]?.result);
      const tradingFee = data[7]?.result ? Number(data[7].result) : 30;
      const decimals = data[8]?.result ? Number(data[8].result) : 18;

      // Calculate progress metrics
      const fundingPercentage =
        fundingGoal > 0n
          ? Number((collateral * 10000n) / fundingGoal) / 100
          : 0;

      const isGoalReached = fundingPercentage >= 100;

      const supplyUtilization =
        maxSupply > 0n ? Number((totalSupply * 10000n) / maxSupply) / 100 : 0;

      return {
        raw: {
          price,
          collateral,
          virtualSupply,
          fundingGoal,
          maxSupply,
          totalSupply,
        },
        formatted: {
          price: safeFormatUnits(price, 18),
          collateral: safeFormatUnits(collateral, 18),
          virtualSupply: safeFormatUnits(virtualSupply, 18),
          fundingGoal: safeFormatUnits(fundingGoal, 18),
          maxSupply: safeFormatUnits(maxSupply, 18),
          totalSupply: safeFormatUnits(totalSupply, 18),
        },
        state,
        tradingFee,
        decimals,
        progress: {
          fundingPercentage: Math.min(fundingPercentage, 100),
          isGoalReached,
          supplyUtilization: Math.min(supplyUtilization, 100),
        },
        isLoading: false,
        error: error || null,
        lastUpdated: dataUpdatedAt || Date.now(),
      };
    } catch (processingError) {
      console.error(
        "Error processing aggregated contract data:",
        processingError
      );

      return {
        raw: {
          price: 0n,
          collateral: 0n,
          virtualSupply: 0n,
          fundingGoal: 0n,
          maxSupply: 0n,
          totalSupply: 0n,
        },
        formatted: {
          price: "0",
          collateral: "0",
          virtualSupply: "0",
          fundingGoal: "0",
          maxSupply: "0",
          totalSupply: "0",
        },
        state: 0,
        tradingFee: 30,
        decimals: 18,
        progress: {
          fundingPercentage: 0,
          isGoalReached: false,
          supplyUtilization: 0,
        },
        isLoading: false,
        error: processingError as Error,
        lastUpdated: Date.now(),
      };
    }
  }, [data, isLoading, error, dataUpdatedAt]);
}

// Example usage:
/*
function TokenComponent({ tokenAddress }: { tokenAddress: Address }) {
  const tokenData = useAggregatedContractCalls(tokenAddress);
  
  if (tokenData.isLoading) {
    return <div>Loading...</div>;
  }
  
  if (tokenData.error) {
    return <div>Error: {tokenData.error.message}</div>;
  }
  
  return (
    <div>
      <h2>Price: {tokenData.formatted.price} AVAX</h2>
      <p>Collateral: {tokenData.formatted.collateral} AVAX</p>
      <p>Funding Progress: {tokenData.progress.fundingPercentage}%</p>
      <p>State: {tokenData.state}</p>
      {tokenData.progress.isGoalReached && (
        <div>🎉 Goal Reached!</div>
      )}
    </div>
  );
}
*/
