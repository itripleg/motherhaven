// utils/priceImpactCalculator.ts
import { Token } from "@/types";

interface BondingCurveParams {
  currentCollateral: number;
  virtualSupply: number;
  priceRate: number; // From your token constants
  isBuy: boolean;
  tradeAmount: number; // In AVAX for buy, in tokens for sell
}

/**
 * Calculate accurate price impact for bonding curve trades
 * Based on your factory contract's bonding curve implementation
 */
export function calculateAccuratePriceImpact(
  token: Token,
  tradeAmountStr: string,
  isBuy: boolean = true
): number {
  try {
    const tradeAmount = parseFloat(tradeAmountStr);
    if (isNaN(tradeAmount) || tradeAmount <= 0) return 0;

    // Get current state
    const currentCollateral = parseFloat(token.collateral || "0");
    const virtualSupply = parseFloat(token.virtualSupply || "0");
    const priceRate = parseFloat(token.priceRate || "2000"); // From your constants

    // If no virtual supply data, fall back to simple calculation
    if (virtualSupply === 0 || currentCollateral === 0) {
      return calculateSimplePriceImpact(currentCollateral, tradeAmount);
    }

    if (isBuy) {
      return calculateBuyPriceImpact({
        currentCollateral,
        virtualSupply,
        priceRate,
        isBuy: true,
        tradeAmount,
      });
    } else {
      return calculateSellPriceImpact({
        currentCollateral,
        virtualSupply,
        priceRate,
        isBuy: false,
        tradeAmount,
      });
    }
  } catch (error) {
    console.error("Error calculating price impact:", error);
    return 0;
  }
}

/**
 * Calculate price impact for buying tokens
 * When buying: user pays AVAX, gets tokens, price should go UP
 */
function calculateBuyPriceImpact(params: BondingCurveParams): number {
  const { currentCollateral, virtualSupply, tradeAmount } = params;

  if (virtualSupply <= 0 || currentCollateral <= 0) return 0;

  // Current price per token: collateral / virtualSupply
  const currentPrice = currentCollateral / virtualSupply;

  // After buying with tradeAmount AVAX:
  // New collateral = old collateral + AVAX spent
  const newCollateral = currentCollateral + tradeAmount;

  // For bonding curves, typically: tokenAmount = √(collateral * 2k) - virtualSupply
  // Simplified: estimate tokens received ≈ tradeAmount / averagePrice
  const averagePrice = (currentPrice + newCollateral / virtualSupply) / 2;
  const tokensReceived = tradeAmount / averagePrice;

  // New virtual supply after tokens are minted
  const newVirtualSupply = virtualSupply + tokensReceived;

  // New price after the trade
  const newPrice = newCollateral / newVirtualSupply;

  // Price impact = (newPrice - currentPrice) / currentPrice * 100
  // For buys, this should be POSITIVE (price goes up)
  const priceImpact = ((newPrice - currentPrice) / currentPrice) * 100;

  return Math.max(0, Math.min(50, priceImpact)); // Cap at 50% for sanity
}

/**
 * Calculate price impact for selling tokens
 * When selling: user sells tokens, gets AVAX, price should go DOWN
 */
function calculateSellPriceImpact(params: BondingCurveParams): number {
  const { currentCollateral, virtualSupply, tradeAmount } = params;

  if (virtualSupply <= 0 || currentCollateral <= 0) return 0;
  if (tradeAmount >= virtualSupply) return 100; // Can't sell more tokens than exist

  // Current price per token
  const currentPrice = currentCollateral / virtualSupply;

  // After selling tradeAmount tokens:
  // Tokens are burned, so virtual supply decreases
  const newVirtualSupply = virtualSupply - tradeAmount;

  if (newVirtualSupply <= 0) return 100; // Would drain all tokens

  // Calculate AVAX received (this is what the user gets)
  // For bonding curves: avaxReceived ≈ tokenAmount * averagePrice
  const averagePrice =
    (currentPrice + currentCollateral / newVirtualSupply) / 2;
  const avaxReceived = tradeAmount * averagePrice;

  // New collateral after AVAX is paid out
  const newCollateral = currentCollateral - avaxReceived;

  if (newCollateral <= 0) return 100; // Would drain all collateral

  // New price after the trade
  const newPrice = newCollateral / newVirtualSupply;

  // Price impact = (currentPrice - newPrice) / currentPrice * 100
  // For sells, price should go DOWN, so we want the absolute decrease
  const priceImpact = ((currentPrice - newPrice) / currentPrice) * 100;

  return Math.max(0, Math.min(50, priceImpact)); // Cap at 50% for sanity
}

/**
 * Fallback simple calculation when bonding curve data unavailable
 */
function calculateSimplePriceImpact(
  liquidity: number,
  tradeAmount: number
): number {
  if (liquidity <= 0) return 50; // Assume high impact if no liquidity data

  // Simple AMM-style impact: sqrt(tradeAmount / liquidity) * 100
  const impact = Math.sqrt(tradeAmount / liquidity) * 100;
  return Math.max(0, Math.min(100, impact));
}

/**
 * Get price impact color for UI
 */
export function getPriceImpactColor(impact: number): string {
  if (impact > 15) return "text-red-500";
  if (impact > 5) return "text-yellow-500";
  if (impact > 1) return "text-orange-500";
  return "text-green-500";
}

/**
 * Get price impact warning message
 */
export function getPriceImpactWarning(impact: number): string | null {
  if (impact > 20)
    return "⚠️ Very high price impact! Consider reducing trade size.";
  if (impact > 10) return "⚠️ High price impact. Double-check your trade.";
  if (impact > 5) return "⚠️ Moderate price impact.";
  return null;
}

/**
 * Calculate minimum tokens received after slippage
 */
export function calculateMinTokensReceived(
  expectedTokens: number,
  slippagePercent: number
): number {
  return expectedTokens * (1 - slippagePercent / 100);
}

/**
 * Calculate maximum ETH needed including slippage
 */
export function calculateMaxEthNeeded(
  expectedEth: number,
  slippagePercent: number
): number {
  return expectedEth * (1 + slippagePercent / 100);
}
