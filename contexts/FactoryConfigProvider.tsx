"use client";

import { createContext, useContext, useMemo } from "react";
import { useReadContracts } from "wagmi";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types";
import { formatUnits } from "viem";

// 1. The Type Definition lives here and is exported for other files to use.
export interface FactoryConfig {
  decimals: string;
  initialPrice: string;
  maxSupply: string;
  initialMint: string;
  minPurchase: string;
  maxPurchase: string;
  maxWalletPercentage: number;
  priceRate: string;
  tradingFee: number;
}

// 2. The Data-Fetching logic is a local helper hook, NOT exported.
function useFactoryConfig() {
  const factoryContractCalls = [
    { functionName: "DECIMALS" },
    { functionName: "INITIAL_PRICE" },
    { functionName: "MAX_SUPPLY" },
    { functionName: "INITIAL_MINT" },
    { functionName: "MIN_PURCHASE" },
    { functionName: "MAX_PURCHASE" },
    { functionName: "MAX_WALLET_PERCENTAGE" },
    { functionName: "PRICE_RATE" },
    { functionName: "TRADING_FEE" },
  ] as const;

  const { data, isLoading, error, isSuccess } = useReadContracts({
    contracts: factoryContractCalls.map((call) => ({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      ...call,
    })),
  });

  const config = useMemo((): FactoryConfig | null => {
    if (!isSuccess || !data) {
      // This guard clause prevents any calculations until all data has been successfully fetched.
      return null;
    }

    const results = data.map((d) => d.result);
    const decimalsNumber = Number(results[0] as bigint);

    return {
      decimals: decimalsNumber.toString(),
      initialPrice: formatUnits(results[1] as bigint, decimalsNumber),
      maxSupply: formatUnits(results[2] as bigint, decimalsNumber),
      initialMint: formatUnits(results[3] as bigint, decimalsNumber),
      minPurchase: formatUnits(results[4] as bigint, decimalsNumber),
      maxPurchase: formatUnits(results[5] as bigint, decimalsNumber),
      maxWalletPercentage: Number(results[6] as bigint),
      priceRate: (results[7] as bigint).toString(),
      tradingFee: Number(results[8] as bigint),
    };
  }, [data, isSuccess]);

  return { config, isLoading, error: error?.message || null };
}

// 3. The Context and Provider are defined and exported.
interface FactoryConfigContextState {
  config: FactoryConfig | null;
  isLoading: boolean;
}

const FactoryConfigContext = createContext<FactoryConfigContextState | null>(
  null
);

export function FactoryConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { config, isLoading } = useFactoryConfig(); // It calls the local hook

  return (
    <FactoryConfigContext.Provider value={{ config, isLoading }}>
      {children}
    </FactoryConfigContext.Provider>
  );
}

// 4. The Consumer Hook is exported for other components to use.
export function useFactoryConfigContext() {
  const context = useContext(FactoryConfigContext);
  if (!context) {
    throw new Error(
      "useFactoryConfigContext must be used within a FactoryConfigProvider"
    );
  }
  return context;
}
