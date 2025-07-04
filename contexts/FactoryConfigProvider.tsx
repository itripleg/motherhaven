// contexts/FactoryConfigProvider.tsx
"use client";

import { createContext, useContext, useMemo } from "react";
import { useReadContracts } from "wagmi";
import { FACTORY_ABI, FACTORY_ADDRESS, FACTORY_CONSTANTS } from "@/types";
import { formatUnits } from "viem";

export interface FactoryConfig {
  decimals: string;
  initialPrice: string;
  maxSupply: string;
  minPurchase: string;
  maxPurchase: string;
  maxWalletPercentage: number;
  priceRate: string;
  tradingFee: number;
  defaultFundingGoal: string; // This should be a regular string, not a literal type
}

const safeFormatUnits = (value: bigint, decimals: number): string => {
  try {
    if (value > BigInt("9".repeat(30))) {
      const valueStr = value.toString();
      if (valueStr.length > decimals) {
        const integerPart = valueStr.slice(0, -decimals) || "0";
        const decimalPart = valueStr.slice(-decimals).slice(0, 6);
        return `${integerPart}.${decimalPart}`;
      }
      return "0." + "0".repeat(decimals - valueStr.length) + valueStr;
    }
    return formatUnits(value, decimals);
  } catch (error) {
    console.error("Error formatting units:", error, "Value:", value.toString());
    if (decimals === 18) {
      const divisor = BigInt("1000000000000000000");
      return (value / divisor).toString();
    }
    return "0";
  }
};

function useFactoryConfig() {
  // Only read the dynamic values from the contract
  // Static constants will come from FACTORY_CONSTANTS
  const factoryContractCalls = [
    { functionName: "defaultFundingGoal" }, // This can be changed by owner
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
      // If contract call fails, we can still use the static constants
      // Only defaultFundingGoal needs to be read from contract
      let defaultFundingGoal: string = FACTORY_CONSTANTS.DEFAULT_FUNDING_GOAL;

      if (data && data[0]?.status === "success" && data[0]?.result) {
        defaultFundingGoal = safeFormatUnits(data[0].result as bigint, 18);
      } else if (data && data[0]?.status === "failure") {
        console.warn(
          "Failed to read defaultFundingGoal from contract, using fallback:",
          FACTORY_CONSTANTS.DEFAULT_FUNDING_GOAL
        );
      }

      // Use the exported FACTORY_CONSTANTS for consistency
      return {
        decimals: "18", // Always 18 for our tokens
        initialPrice: FACTORY_CONSTANTS.INITIAL_PRICE,
        maxSupply: FACTORY_CONSTANTS.MAX_SUPPLY,
        minPurchase: FACTORY_CONSTANTS.MIN_PURCHASE,
        maxPurchase: FACTORY_CONSTANTS.MAX_PURCHASE,
        maxWalletPercentage: FACTORY_CONSTANTS.MAX_WALLET_PERCENTAGE,
        priceRate: FACTORY_CONSTANTS.PRICE_RATE,
        tradingFee: FACTORY_CONSTANTS.TRADING_FEE,
        defaultFundingGoal: defaultFundingGoal,
      };
    } catch (error) {
      console.error("Error processing factory config:", error);

      // Even if there's an error, return the static constants
      // This ensures the app still works even if contract calls fail
      return {
        decimals: "18",
        initialPrice: FACTORY_CONSTANTS.INITIAL_PRICE,
        maxSupply: FACTORY_CONSTANTS.MAX_SUPPLY,
        minPurchase: FACTORY_CONSTANTS.MIN_PURCHASE,
        maxPurchase: FACTORY_CONSTANTS.MAX_PURCHASE,
        maxWalletPercentage: FACTORY_CONSTANTS.MAX_WALLET_PERCENTAGE,
        priceRate: FACTORY_CONSTANTS.PRICE_RATE,
        tradingFee: FACTORY_CONSTANTS.TRADING_FEE,
        defaultFundingGoal: FACTORY_CONSTANTS.DEFAULT_FUNDING_GOAL,
      };
    }
  }, [data]);

  return {
    config,
    isLoading,
    error: error ? "Failed to read dynamic factory configuration" : null,
  };
}

interface FactoryConfigContextState {
  config: FactoryConfig | null;
  isLoading: boolean;
  error: string | null;
}

const FactoryConfigContext = createContext<FactoryConfigContextState | null>(
  null
);

export function FactoryConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { config, isLoading, error } = useFactoryConfig();

  return (
    <FactoryConfigContext.Provider value={{ config, isLoading, error }}>
      {children}
    </FactoryConfigContext.Provider>
  );
}

export function useFactoryConfigContext() {
  const context = useContext(FactoryConfigContext);
  if (!context) {
    throw new Error(
      "useFactoryConfigContext must be used within a FactoryConfigProvider"
    );
  }
  return context;
}
