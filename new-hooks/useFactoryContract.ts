// @/new-hooks/useFactoryContract.ts

<<<<<<< HEAD
import { useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { FACTORY_ADDRESS, FACTORY_ABI, Token } from "@/types";
import { type Address, type Abi, formatEther, parseEther } from "viem";
import { useEffect, useMemo } from "react";

// Define the factory contract config once
const factoryContract = {
  address: FACTORY_ADDRESS as Address,
  abi: FACTORY_ABI as Abi,
} as const;
=======
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSimulateContract,
} from "wagmi";
import { FACTORY_ADDRESS, FACTORY_ABI, Token, TokenState } from "@/types";
import { type Address, formatEther, parseEther } from "viem";
import { useEffect } from "react";

// A custom hook that wraps useReadContract to add polling
function useLiveReadContract(hookParameters: any) {
  const { data, refetch, ...rest } = useReadContract(hookParameters);

  useEffect(() => {
    // Only set up the interval if the query is enabled
    if (hookParameters.query?.enabled === false) {
      return;
    }

    // Set up an interval to call the 'refetch' function every 4 seconds
    const intervalId = setInterval(() => {
      refetch();
    }, 4000); // 4000ms = 4 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [refetch, hookParameters.query?.enabled]);

  return { data, ...rest };
}
>>>>>>> main

// A custom hook that wraps useReadContract to add polling
function useLiveReadContract(hookParameters: any) {
  const { data, refetch, ...rest } = useReadContract(hookParameters);

  useEffect(() => {
    // Only set up the interval if the query is enabled
    if (hookParameters.query?.enabled === false) {
      return;
    }

    // Set up an interval to call the 'refetch' function every 4 seconds
    const intervalId = setInterval(() => {
      refetch();
    }, 4000); // 4000ms = 4 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [refetch, hookParameters.query?.enabled]);

  return { data, ...rest };
}

export function useFactoryContract() {
<<<<<<< HEAD
  const {
    writeContract,
    isPending: isWritePending,
    data: hash,
    ...writeRest
  } = useWriteContract();

  // Read Operations - now use live-updating hook for real-time data
  const useTokenState = (tokenAddress?: Address) => {
    return useLiveReadContract({
      ...factoryContract,
=======
  const { writeContract, isPending: isWritePending } = useWriteContract();

  // Read Operations - now use live-updating hook for real-time data
  const useTokenState = (tokenAddress?: Address) => {
    return useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
>>>>>>> main
      functionName: "getTokenState",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: Boolean(tokenAddress),
      },
    });
  };

  const useCollateral = (tokenAddress?: Address) => {
<<<<<<< HEAD
    const { data, ...rest } = useLiveReadContract({
      ...factoryContract,
=======
    const { data, ...rest } = useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
>>>>>>> main
      functionName: "collateral",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: Boolean(tokenAddress),
      },
    });

    return {
      data: data ? formatEther(data as bigint) : undefined,
      ...rest,
    };
  };

<<<<<<< HEAD
  const useCurrentPrice = (tokenAddress?: Address) => {
    return useLiveReadContract({
      ...factoryContract,
      functionName: "lastPrice",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: { enabled: Boolean(tokenAddress) },
=======
  // Write Operations with Simulation
  const useCreateToken = (name?: string, symbol?: string) => {
    const simulation = useSimulateContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "createToken",
      args: name && symbol ? [name, symbol] : undefined,
      query: {
        enabled: Boolean(name && symbol),
      },
>>>>>>> main
    });

    const write = async () => {
      if (!name || !symbol) throw new Error("Name and symbol are required");

      const hash = await writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "createToken",
        args: [name, symbol],
      });

      return hash;
    };

    return {
      simulation,
      write,
      isPending: isWritePending,
    };
  };

  const useBuyTokens = (tokenAddress?: Address, amount?: string) => {
    const simulation = useSimulateContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "buy",
      args: tokenAddress ? [tokenAddress] : undefined,
      value: amount ? parseEther(amount) : undefined,
      query: {
        enabled: Boolean(tokenAddress && amount),
      },
    });

    const write = async () => {
      if (!tokenAddress || !amount)
        throw new Error("Token address and amount are required");

      const hash = await writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "buy",
        args: [tokenAddress],
        value: parseEther(amount),
      });

      return hash;
    };

    return {
      simulation,
      write,
      isPending: isWritePending,
    };
  };

  const useSellTokens = (tokenAddress?: Address, amount?: string) => {
    const simulation = useSimulateContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "sell",
      args:
        tokenAddress && amount ? [tokenAddress, parseEther(amount)] : undefined,
      query: {
        enabled: Boolean(tokenAddress && amount),
      },
    });

    const write = async () => {
      if (!tokenAddress || !amount)
        throw new Error("Token address and amount are required");

      const hash = await writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "sell",
        args: [tokenAddress, parseEther(amount)],
      });

      return hash;
    };

    return {
      simulation,
      write,
      isPending: isWritePending,
    };
  };

<<<<<<< HEAD
  // /new-hooks/useFactoryContract.ts

  // ... (imports and other hook logic)

  const formatPriceDecimals = (
    price: bigint | undefined,
    precision: number = 7 // Use a higher default precision for consistency
  ): string => {
    if (price === undefined || price === null) return "0.000000";
    const formatted = formatEther(price);
    // Use toLocaleString to handle different locales and avoid unnecessary trailing zeros
    // while ensuring a minimum number of decimal places.
    return parseFloat(formatted).toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  };

  // ... (rest of the hook)

=======
  const useCurrentPrice = (tokenAddress?: Address) => {
    return useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "getCurrentPrice",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: Boolean(tokenAddress), // Only run query if tokenAddress is provided
        // You can add caching or polling here if needed
        // gcTime: 1000 * 60 * 5, // Cache for 5 minutes
        // refetchInterval: 1000 * 30 // Refetch every 30 seconds
      },
    });
  };
  // Function to format price with a specified number of decimals
  const formatPriceDecimals = (
    price: bigint | undefined,
    decimals: number = 18
  ): string => {
    if (!price) return "0";
    const formatted = formatEther(price);
    return Number(formatted).toFixed(decimals);
  };
>>>>>>> main
  return {
    useTokenState,
    useCollateral,
    useCreateToken,
    useBuyTokens,
    useSellTokens,
    useCurrentPrice,
    formatPriceDecimals,
  };
}
