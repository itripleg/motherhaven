// components/trading/chart/types.ts
export type TimeFrame = "1h" | "4h" | "1d" | "7d" | "30d" | "all";

export interface ChartPoint {
  price: number;
  formattedPrice: string;
  timeLabel: string;
  timestamp: number;
  isGenesis?: boolean;
}

export interface ChartData {
  points: ChartPoint[];
  timeFrame: TimeFrame;
  tickInterval: number;
}
