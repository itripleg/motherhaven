// @/new-hooks/useFactoryContract.ts

import { useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { FACTORY_ADDRESS, FACTORY_ABI, Token } from "@/types";
import { type Address, type Abi, formatEther, parseEther } from "viem";
import { useEffect, useMemo } from "react";

// Define the factory contract config once
const factoryContract = {
  address: FACTORY_ADDRESS as Address,
  abi: FACTORY_ABI as Abi,
} as const;

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
      functionName: "getTokenState",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: { enabled: Boolean(tokenAddress) },
    });
  };

  const useCollateral = (tokenAddress?: Address) => {
    const { data, ...rest } = useLiveReadContract({
      ...factoryContract,
      functionName: "collateral",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: { enabled: Boolean(tokenAddress) },
    });
    return {
      data: data ? formatEther(data as bigint) : undefined,
      ...rest,
    };
  };

  const useCurrentPrice = (tokenAddress?: Address) => {
    return useLiveReadContract({
      ...factoryContract,
      functionName: "lastPrice",
      args: tokenAddress ? [tokenAddress] : undefined,
      query: { enabled: Boolean(tokenAddress) },
    });
  };

  // Multicall hook for token grid data - accepts partial Token array and returns fully hydrated Token array
  const useTokenGridData = (baseTokens: Partial<Token>[]) => {
    const contractCalls = useMemo(
      () =>
        baseTokens.flatMap((token) =>
          token.address
            ? [
                {
                  ...factoryContract,
                  functionName: "lastPrice",
                  args: [token.address],
                },
                {
                  ...factoryContract,
                  functionName: "collateral",
                  args: [token.address],
                },
                {
                  ...factoryContract,
                  functionName: "virtualSupply",
                  args: [token.address],
                },
              ]
            : []
        ),
      [baseTokens]
    );

    const { data: multicallData, isLoading } = useReadContracts({
      contracts: contractCalls,
      query: { enabled: baseTokens.length > 0 },
    });

    const hydratedTokens: Token[] = useMemo(() => {
      if (!multicallData || baseTokens.length === 0) return [];

      return baseTokens.map((token, index) => {
        const priceResult = multicallData[index * 3]?.result;
        const collateralResult = multicallData[index * 3 + 1]?.result;
        const supplyResult = multicallData[index * 3 + 2]?.result;

        // Construct the full Token object by combining base data with on-chain data
        return {
          ...token, // Spreads properties like name, symbol, imageUrl from Firestore
          address: token.address || "0x0",
          // Add the real-time on-chain properties
          currentPrice: priceResult
            ? parseFloat(formatEther(priceResult as bigint)).toFixed(5)
            : "0.00000",
          collateral: collateralResult
            ? parseFloat(formatEther(collateralResult as bigint)).toFixed(3)
            : "0.000",
          virtualSupply: supplyResult
            ? parseFloat(formatEther(supplyResult as bigint)).toLocaleString()
            : "0",
          // Ensure other required fields have default values
          name: token.name || "Unnamed Token",
          symbol: token.symbol || "N/A",
          creator: token.creator || "0x0",
        } as Token; // Assert the final, complete type
      });
    }, [multicallData, baseTokens]);

    return { hydratedTokens, isLoading };
  };

  // Write Operations
  const createToken = (
    name: string,
    symbol: string,
    imageUrl: string,
    burnManager: Address
  ) => {
    writeContract({
      ...factoryContract,
      functionName: "createToken",
      args: [name, symbol, imageUrl, burnManager],
    });
  };

  const buyTokens = (tokenAddress: Address, amount: string) => {
    writeContract({
      ...factoryContract,
      functionName: "buy",
      args: [tokenAddress],
      value: parseEther(amount),
    });
  };

  const sellTokens = (tokenAddress: Address, amount: string) => {
    writeContract({
      ...factoryContract,
      functionName: "sell",
      args: [tokenAddress, parseEther(amount)],
    });
  };

  // Helper Functions
  const formatPriceDecimals = (
    price: bigint | undefined,
    precision: number = 6
  ): string => {
    if (price === undefined || price === null) return "0.00000";
    const formatted = formatEther(price);
    return parseFloat(formatted).toFixed(precision);
  };

  return {
    // Read operations
    useTokenState,
    useCollateral,
    useCurrentPrice,
    useTokenGridData,

    // Write operations
    createToken,
    buyTokens,
    sellTokens,

    // Helper functions
    formatPriceDecimals,

    // Write contract state
    isWritePending,
    writeHash: hash,
    ...writeRest,
  };
}
