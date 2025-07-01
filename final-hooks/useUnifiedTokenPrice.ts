// final-hooks/useUnifiedTokenPrice.ts
import { useMemo } from "react";
import { useFactoryContract } from "./useFactoryContract";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import { formatUnits } from "viem";
import { Address } from "viem";

interface UnifiedPriceData {
  raw: string; // Raw price as string (e.g., "0.000123")
  formatted: string; // Formatted for display (e.g., "0.000123")
  wei: bigint | undefined; // Raw wei value from contract
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

/**
 * Unified hook for token prices that all components should use.
 * This ensures consistent price data across TokenCard, TokenHeader, and Charts.
 * Uses lastPrice (actual price from last trade) from the factory contract.
 */
export function useUnifiedTokenPrice(tokenAddress?: Address): UnifiedPriceData {
  const { usePrice } = useFactoryContract();

  // Get last price from factory contract (single source of truth)
  const { price: priceWei, isLoading, error } = usePrice(tokenAddress);

  const result = useMemo(() => {
    let rawPrice = "0";
    let formattedPrice = "0.000000";

    if (priceWei && priceWei > 0n) {
      try {
        rawPrice = formatUnits(priceWei, 18);
        formattedPrice = formatTokenPrice(rawPrice);
      } catch (error) {
        console.error("Error formatting price:", error);
      }
    }

    return {
      raw: rawPrice,
      formatted: formattedPrice,
      wei: priceWei,
      isLoading,
      error: error?.message || (error ? "Failed to fetch price" : null),
      lastUpdated: Date.now(),
    };
  }, [priceWei, isLoading, error]);

  return result;
}

/**
 * Hook for multiple token prices at once
 * More efficient than calling useUnifiedTokenPrice multiple times
 */
export function useUnifiedTokenPrices(tokenAddresses: Address[]) {
  const { usePrice } = useFactoryContract();

  // Get prices for all addresses
  const priceQueries = tokenAddresses.map((address) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return usePrice(address);
  });

  const prices = useMemo(() => {
    const result: Record<string, UnifiedPriceData> = {};

    tokenAddresses.forEach((address, index) => {
      const query = priceQueries[index];
      let rawPrice = "0";
      let formattedPrice = "0.000000";

      if (query.price && query.price > 0n) {
        try {
          rawPrice = formatUnits(query.price, 18);
          formattedPrice = formatTokenPrice(rawPrice);
        } catch (error) {
          console.error(`Error formatting price for ${address}:`, error);
        }
      }

      result[address.toLowerCase()] = {
        raw: rawPrice,
        formatted: formattedPrice,
        wei: query.price,
        isLoading: query.isLoading,
        error:
          query.error?.message ||
          (query.error ? "Failed to fetch price" : null),
        lastUpdated: Date.now(),
      };
    });

    return result;
  }, [tokenAddresses, priceQueries]);

  const isLoading = priceQueries.some((q) => q.isLoading);
  const hasError = priceQueries.some((q) => q.error);

  return {
    prices,
    isLoading,
    hasError,
    getPrice: (address: Address) =>
      prices[address.toLowerCase()] || {
        raw: "0",
        formatted: "0.000000",
        wei: undefined,
        isLoading: false,
        error: "Price not found",
        lastUpdated: 0,
      },
  };
}

/**
 * Legacy compatibility hook - provides the same interface as the old useTokenPrice
 * @deprecated Use useUnifiedTokenPrice instead
 */
export function useTokenPrice(tokenAddress?: Address) {
  const priceData = useUnifiedTokenPrice(tokenAddress);

  return {
    price: priceData.formatted,
    loading: priceData.isLoading,
    error: priceData.error,
    // Additional data for enhanced functionality
    rawPrice: priceData.raw,
    wei: priceData.wei,
    lastUpdated: priceData.lastUpdated,
  };
}

/**
 * Hook specifically for chart components that need numeric values
 */
export function useChartTokenPrice(tokenAddress?: Address) {
  const priceData = useUnifiedTokenPrice(tokenAddress);

  const numericPrice = useMemo(() => {
    try {
      return parseFloat(priceData.raw);
    } catch {
      return 0;
    }
  }, [priceData.raw]);

  return {
    price: numericPrice,
    priceString: priceData.raw,
    formatted: priceData.formatted,
    isLoading: priceData.isLoading,
    error: priceData.error,
    wei: priceData.wei,
  };
}

/**
 * Hook for components that need price with currency display
 */
export function useTokenPriceWithCurrency(
  tokenAddress?: Address,
  currency: string = "AVAX"
) {
  const priceData = useUnifiedTokenPrice(tokenAddress);

  const priceWithCurrency = useMemo(() => {
    if (priceData.isLoading) return "Loading...";
    if (priceData.error) return "Error";
    return `${priceData.formatted} ${currency}`;
  }, [priceData.formatted, priceData.isLoading, priceData.error, currency]);

  return {
    ...priceData,
    priceWithCurrency,
  };
}

/**
 * Hook that combines price with percentage change (if available)
 * Useful for showing price trends
 */
export function useTokenPriceWithChange(tokenAddress?: Address) {
  const priceData = useUnifiedTokenPrice(tokenAddress);

  // TODO: Implement price change calculation
  // This would require storing historical prices or calculating from trades
  const priceChange24h = useMemo(() => {
    // Placeholder - implement actual price change calculation
    return {
      value: 0,
      percentage: 0,
      direction: "neutral" as "up" | "down" | "neutral",
    };
  }, []);

  return {
    ...priceData,
    change24h: priceChange24h,
  };
}

/**
 * Batch price fetching hook with caching
 * Optimized for token lists and grids
 */
export function useBatchTokenPrices(
  tokenAddresses: Address[],
  options?: {
    enableCache?: boolean;
    cacheTimeout?: number;
  }
) {
  const { enableCache = true, cacheTimeout = 30000 } = options || {};

  const pricesData = useUnifiedTokenPrices(tokenAddresses);

  // TODO: Implement caching logic if enableCache is true
  // For now, just return the direct data

  return {
    ...pricesData,
    // Helper methods for common operations
    getPriceFormatted: (address: Address) =>
      pricesData.getPrice(address).formatted,
    getPriceRaw: (address: Address) => pricesData.getPrice(address).raw,
    getAllFormattedPrices: () => {
      const result: Record<string, string> = {};
      Object.entries(pricesData.prices).forEach(([address, data]) => {
        result[address] = data.formatted;
      });
      return result;
    },
  };
}

// Type exports for external use
export type { UnifiedPriceData };

// Re-export formatting utilities for convenience
export { formatTokenPrice } from "@/utils/tokenPriceFormatter";

/**
 * MIGRATION GUIDE:
 *
 * OLD USAGE:
 * ```tsx
 * const { currentPrice, isLoading } = useUnifiedTokenPrice(address);
 * ```
 *
 * NEW USAGE:
 * ```tsx
 * const { formatted, isLoading } = useUnifiedTokenPrice(address);
 * // or for legacy compatibility:
 * const { price, loading } = useTokenPrice(address);
 * ```
 *
 * CHART COMPONENTS:
 * ```tsx
 * const { price, formatted } = useChartTokenPrice(address);
 * ```
 *
 * TOKEN CARDS/LISTS:
 * ```tsx
 * const { prices, getPrice } = useBatchTokenPrices(addresses);
 * const tokenPrice = getPrice(address).formatted;
 * ```
 */
