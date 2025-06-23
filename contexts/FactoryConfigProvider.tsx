"use client";

import { createContext, useContext, useMemo } from "react";
import { useReadContracts } from "wagmi";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types";
import { formatUnits } from "viem";

// 1. DEFINE AND EXPORT THE TYPE HERE
// This is now the single source of truth for the type's shape.
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

// Safe formatting function to prevent string length overflow
const safeFormatUnits = (value: bigint, decimals: number): string => {
  try {
    // For very large values, just convert to string with basic decimal handling
    if (value > BigInt("9".repeat(30))) {
      const valueStr = value.toString();
      if (valueStr.length > decimals) {
        const integerPart = valueStr.slice(0, -decimals) || "0";
        const decimalPart = valueStr.slice(-decimals).slice(0, 6); // Only show 6 decimal places
        return `${integerPart}.${decimalPart}`;
      }
      return "0." + "0".repeat(decimals - valueStr.length) + valueStr;
    }

    return formatUnits(value, decimals);
  } catch (error) {
    console.error("Error formatting units:", error, "Value:", value.toString());
    // Fallback: just show the raw value divided by 10^18
    if (decimals === 18) {
      const divisor = BigInt("1000000000000000000");
      return (value / divisor).toString();
    }
    return "0";
  }
};

// 2. DEFINE THE DATA-FETCHING LOGIC AS A LOCAL HOOK
// It no longer needs to be in a separate file.
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

  const { data, isLoading, error } = useReadContracts({
    contracts: factoryContractCalls.map((call) => ({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      ...call,
    })),
  });

  const config = useMemo((): FactoryConfig | null => {
    try {
      if (!data || data.some((d) => d.status === "failure")) {
        console.log("Factory config data not ready or has failures");
        return null;
      }

      const results = data.map((d) => d.result);
      if (results.some((r) => r === undefined || r === null)) {
        console.log("Some factory config results are undefined");
        return null;
      }

      console.log(
        "Raw factory config results:",
        results.map((r) => r?.toString())
      );

      // Handle the decimals value - it seems your contract returns 10^18 instead of 18
      const rawDecimals = results[0] as bigint;
      let decimalsNumber: number;

      if (rawDecimals === 1000000000000000000n) {
        // Contract returns 10^18, but we want 18
        decimalsNumber = 18;
      } else if (rawDecimals <= 30n) {
        // Contract returns actual decimal count
        decimalsNumber = Number(rawDecimals);
      } else {
        console.error("Unexpected decimals value:", rawDecimals.toString());
        return null;
      }

      console.log("Using decimals:", decimalsNumber);

      // Log each value before formatting to identify the problematic one
      const rawValues = {
        decimals: results[0],
        initialPrice: results[1],
        maxSupply: results[2],
        initialMint: results[3],
        minPurchase: results[4],
        maxPurchase: results[5],
        maxWalletPercentage: results[6],
        priceRate: results[7],
        tradingFee: results[8],
      };

      console.log("Raw factory values:", rawValues);

      return {
        decimals: decimalsNumber.toString(),
        initialPrice: safeFormatUnits(results[1] as bigint, decimalsNumber),
        maxSupply: safeFormatUnits(results[2] as bigint, decimalsNumber),
        initialMint: safeFormatUnits(results[3] as bigint, decimalsNumber),
        minPurchase: safeFormatUnits(results[4] as bigint, decimalsNumber),
        maxPurchase: safeFormatUnits(results[5] as bigint, decimalsNumber),
        maxWalletPercentage: Number(results[6] as bigint),
        priceRate: (results[7] as bigint).toString(),
        tradingFee: Number(results[8] as bigint),
      };
    } catch (error) {
      console.error("Error processing factory config:", error);
      return null;
    }
  }, [data]);

  return { config, isLoading, error: error?.message || null };
}

// 3. CREATE AND EXPORT THE CONTEXT AND PROVIDER as before
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
  const { config, isLoading } = useFactoryConfig(); // It now calls the local hook

  return (
    <FactoryConfigContext.Provider value={{ config, isLoading }}>
      {children}
    </FactoryConfigContext.Provider>
  );
}

// 4. EXPORT THE CONSUMER HOOK for other components to use
export function useFactoryConfigContext() {
  const context = useContext(FactoryConfigContext);
  if (!context) {
    throw new Error(
      "useFactoryConfigContext must be used within a FactoryConfigProvider"
    );
  }
  return context;
}
