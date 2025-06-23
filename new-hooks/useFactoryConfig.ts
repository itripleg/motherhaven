"use client";

import { useReadContracts } from "wagmi";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types";
import { formatUnits } from "viem";
import { useMemo } from "react";

// This is the single, official definition of the type.
// The 'export' keyword makes it available to other files.
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

export function useFactoryConfig() {
  const { data, isLoading, error } = useReadContracts({
    contracts: factoryContractCalls.map((call) => ({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      ...call,
    })),
  });

  const config = useMemo((): FactoryConfig | null => {
    if (!data || data.some((d) => d.status === "failure")) return null;

    const results = data.map((d) => d.result);
    if (results.some((r) => r === undefined || r === null)) return null;

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
  }, [data]);

  return { config, isLoading, error: error?.message || null };
}
