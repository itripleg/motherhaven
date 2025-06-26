// utils/tokenPriceFormatter.ts

import { formatUnits } from "viem";

/**
 * Enhanced price formatter that handles various price ranges with appropriate precision
 * This is the single source of truth for all token price formatting in the app
 */
export const formatTokenPrice = (
  priceString: string | bigint,
  decimals: number = 18
): string => {
  try {
    let price: number;

    // Handle both string and bigint inputs
    if (typeof priceString === "bigint") {
      price = parseFloat(formatUnits(priceString, decimals));
    } else {
      price = parseFloat(priceString);
    }

    if (price === 0 || isNaN(price)) return "0.000000";

    // For very small numbers, use scientific notation
    if (price < 0.000001) {
      return price.toExponential(2);
    } else if (price < 0.001) {
      return price.toFixed(8);
    } else if (price < 1) {
      return price.toFixed(6);
    } else if (price < 1000) {
      return price.toFixed(4);
    } else {
      return price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
    }
  } catch (error) {
    console.error("Error formatting token price:", error);
    return "0.000000";
  }
};

/**
 * Format price for chart Y-axis ticks (shorter format for space constraints)
 */
export const formatChartPrice = (value: number): string => {
  if (value === 0) return "0";

  if (value < 0.000001) {
    return value.toExponential(1);
  } else if (value < 0.001) {
    return value.toFixed(6);
  } else if (value < 1) {
    return value.toFixed(4);
  } else if (value < 1000) {
    return value.toFixed(3);
  } else {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
};

/**
 * Convert a bigint price to a number with proper precision for chart calculations
 */
export const priceToNumber = (priceInWei: bigint): number => {
  return parseFloat(formatUnits(priceInWei, 18));
};

/**
 * Format value using the factory contract's formatValue function signature
 * This matches the pattern used in your useFactoryContract hook
 */
export const formatFactoryValue = (
  value: bigint | undefined,
  precision: number = 6
): string => {
  if (value === undefined || value === null) {
    return parseFloat("0").toFixed(precision);
  }

  const formatted = formatUnits(value, 18);
  return parseFloat(formatted).toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
};
