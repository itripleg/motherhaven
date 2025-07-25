// components/trading/chart/useChartData.ts - Data processing logic
import { useMemo } from "react";
import { Trade, Token, FACTORY_CONSTANTS } from "@/types";
import { TimeFrame, ChartPoint, ChartData } from "./types";
import { parseISO, format, isAfter, subHours, subDays } from "date-fns";
import { parseUnits } from "viem";
import { formatTokenPrice, priceToNumber } from "@/utils/tokenPriceFormatter";

// Validation function to filter out invalid trades
const validateTrade = (trade: Trade): boolean => {
  // Check for required fields
  if (!trade.pricePerToken || !trade.timestamp) {
    console.warn("Trade missing required fields:", trade);
    return false;
  }

  // Check for zero or negative prices
  const price = parseFloat(trade.pricePerToken);
  if (isNaN(price) || price <= 0) {
    console.warn("Trade has invalid price:", trade.pricePerToken);
    return false;
  }

  // Check for zero amounts (these shouldn't exist)
  if (trade.tokenAmount && trade.ethAmount) {
    const tokenAmount = parseFloat(trade.tokenAmount);
    const ethAmount = parseFloat(trade.ethAmount);

    if (tokenAmount <= 0 || ethAmount <= 0) {
      console.warn("Trade has zero amounts:", { tokenAmount, ethAmount });
      return false;
    }
  }

  // Check for reasonable timestamp
  const tradeTime = parseISO(trade.timestamp).getTime();
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

  if (tradeTime < oneYearAgo || tradeTime > now + 60000) {
    // Allow 1 minute future for clock skew
    console.warn("Trade has unreasonable timestamp:", trade.timestamp);
    return false;
  }

  return true;
};

// Function to calculate smart tick interval for X-axis
const calculateTickInterval = (dataLength: number): number => {
  if (dataLength <= 5) return 0; // Show all ticks
  if (dataLength <= 10) return 1; // Show every other tick
  if (dataLength <= 20) return Math.floor(dataLength / 10); // Show ~10 ticks
  if (dataLength <= 50) return Math.floor(dataLength / 8); // Show ~8 ticks
  return Math.floor(dataLength / 6); // Show ~6 ticks for large datasets
};

const TIME_FRAME_FILTERS = {
  "1h": (timestamp: number) => isAfter(timestamp, subHours(new Date(), 1)),
  "4h": (timestamp: number) => isAfter(timestamp, subHours(new Date(), 4)),
  "1d": (timestamp: number) => isAfter(timestamp, subDays(new Date(), 1)),
  "7d": (timestamp: number) => isAfter(timestamp, subDays(new Date(), 7)),
  "30d": (timestamp: number) => isAfter(timestamp, subDays(new Date(), 30)),
  all: () => true,
};

const TIME_FRAME_FORMATS = {
  "1h": "HH:mm",
  "4h": "HH:mm",
  "1d": "HH:mm",
  "7d": "MMM d, HH:mm",
  "30d": "MMM d",
  all: "MMM d, h:mm a",
};

export const useChartData = (
  trades: Trade[],
  token: Token,
  timeFrame: TimeFrame = "all"
) => {
  return useMemo(() => {
    // Filter and validate trades
    const validTrades = trades.filter(validateTrade);
    const now = Date.now();
    const filter = TIME_FRAME_FILTERS[timeFrame];
    const dateFormat = TIME_FRAME_FORMATS[timeFrame];

    // Filter trades by timeframe
    const filteredTrades = validTrades.filter((trade) => {
      const tradeTime = parseISO(trade.timestamp).getTime();
      return filter(tradeTime);
    });

    // Sort by timestamp
    const sortedTrades = filteredTrades.sort((a, b) => {
      return parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime();
    });

    // Convert to chart points
    const tradePoints: ChartPoint[] = sortedTrades.map((trade) => {
      const tradeTimestamp = parseISO(trade.timestamp).getTime();
      const priceInWei = parseUnits(trade.pricePerToken, 18);

      return {
        price: priceToNumber(priceInWei),
        formattedPrice: formatTokenPrice(trade.pricePerToken),
        timeLabel: format(tradeTimestamp, dateFormat),
        timestamp: tradeTimestamp,
        isGenesis: false,
      };
    });

    // Add genesis point if needed and within timeframe
    let allPoints = tradePoints;
    if (token.createdAt) {
      const creationTime = parseISO(token.createdAt).getTime();

      if (filter(creationTime)) {
        const initialPrice = parseFloat(FACTORY_CONSTANTS.INITIAL_PRICE);
        const genesisPoint: ChartPoint = {
          price: initialPrice,
          formattedPrice: formatTokenPrice(FACTORY_CONSTANTS.INITIAL_PRICE),
          timeLabel: format(creationTime, dateFormat),
          timestamp: creationTime,
          isGenesis: true,
        };
        allPoints = [genesisPoint, ...tradePoints].sort(
          (a, b) => a.timestamp - b.timestamp
        );
      }
    }

    // Calculate tick interval
    const tickInterval = calculateTickInterval(allPoints.length);

    return {
      points: allPoints,
      timeFrame,
      tickInterval,
    };
  }, [trades, token, timeFrame]);
};
