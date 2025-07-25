// components/trading/chart/ChartCore.tsx - Pure chart rendering
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
} from "recharts";
import { ChartData } from "./types";
import { formatChartPrice } from "@/utils/tokenPriceFormatter";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

// Enhanced custom tooltip component
const CustomTooltip = ({ active, payload, label, primaryColor }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const formattedPrice = dataPoint.formattedPrice;
    const isGenesis = dataPoint.isGenesis;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 bg-background/95 backdrop-blur-md border border-primary/20 rounded-xl shadow-xl"
      >
        <p className="text-sm font-medium text-muted-foreground mb-2">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
          <p className="text-lg font-bold text-primary">
            {formattedPrice} AVAX
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          {isGenesis ? "Initial price" : "Trade execution price"}
        </p>
      </motion.div>
    );
  }
  return null;
};

interface ChartCoreProps {
  data: ChartData;
  primaryColor: string;
  height?: string;
}

export const ChartCore = ({
  data,
  primaryColor,
  height = "h-80 lg:h-96",
}: ChartCoreProps) => {
  return (
    <div className={`${height} p-6`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data.points}
          margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
        >
          <CartesianGrid
            strokeDasharray="2 2"
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.1}
          />

          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={primaryColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="timeLabel"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval={data.tickInterval}
            angle={-45}
            textAnchor="end"
            height={40}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />

          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatChartPrice(Number(value))}
            domain={["dataMin", "dataMax"]}
            width={80}
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />

          <Tooltip
            content={(props) => (
              <CustomTooltip {...props} primaryColor={primaryColor} />
            )}
          />

          <Area
            type="monotone"
            dataKey="price"
            stroke="none"
            fill="url(#priceGradient)"
            fillOpacity={1}
          />

          <Line
            type="monotone"
            dataKey="price"
            stroke={primaryColor}
            strokeWidth={3}
            dot={false}
            activeDot={(props: any) => {
              if (props.payload?.isGenesis) {
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={8}
                    fill={primaryColor}
                    stroke="hsl(var(--background))"
                    strokeWidth={3}
                    opacity={1}
                    style={{ filter: `drop-shadow(0 0 8px ${primaryColor})` }}
                  />
                );
              }
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={6}
                  fill="hsl(var(--background))"
                  stroke={primaryColor}
                  strokeWidth={3}
                  style={{ filter: `drop-shadow(0 0 6px ${primaryColor})` }}
                />
              );
            }}
            style={{ filter: `drop-shadow(0 2px 4px ${primaryColor}40)` }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
