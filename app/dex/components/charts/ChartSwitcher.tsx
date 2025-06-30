"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  RotateCcw,
  BarChart,
  Globe,
} from "lucide-react";
import { Trade, Token } from "@/types";
import { TVChart } from "./TVChart";
import TokenBarChart from "./RechartsBarChart";
import TradingViewWidget from "./TradingViewWidget";
import { cn } from "@/lib/utils";

interface ChartSwitcherProps {
  trades: Trade[];
  token: Token;
  loading: boolean;
}

type ChartType = "tv-line" | "tv-candlestick" | "recharts-ohlc" | "tradingview";

interface ChartOption {
  id: ChartType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
}

const chartOptions: ChartOption[] = [
  {
    id: "tv-line",
    label: "Line Chart",
    icon: TrendingUp,
    description: "Clean line chart with price history",
    badge: "Default",
  },
  {
    id: "tv-candlestick",
    label: "Candlestick",
    icon: BarChart3,
    description: "OHLC candlestick chart for detailed analysis",
    badge: "Pro",
  },
  {
    id: "recharts-ohlc",
    label: "OHLC + Volume",
    icon: BarChart,
    description: "Combined OHLC lines with volume bars",
    badge: "Advanced",
  },
  {
    id: "tradingview",
    label: "Market Context",
    icon: Globe,
    description: "AVAX reference chart for market context",
    badge: "Reference",
  },
];

export function ChartSwitcher({ trades, token, loading }: ChartSwitcherProps) {
  const [activeChart, setActiveChart] = useState<ChartType>("tv-line");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Add a small delay to show the refresh animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const renderChart = () => {
    switch (activeChart) {
      case "tv-line":
        return (
          <TVChart
            trades={trades}
            token={token}
            chartType="line"
            height={350}
          />
        );
      case "tv-candlestick":
        return (
          <TVChart
            trades={trades}
            token={token}
            chartType="candlestick"
            height={350}
          />
        );
      case "recharts-ohlc":
        return (
          <TokenBarChart trades={trades} token={token} loading={loading} />
        );
      case "tradingview":
        return <TradingViewWidget height={350} />;
      default:
        return (
          <TVChart
            trades={trades}
            token={token}
            chartType="line"
            height={350}
          />
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Price Charts</CardTitle>
            <Badge variant="outline" className="text-xs">
              {trades.length} trade{trades.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Chart Type Switcher */}
            <div className="flex items-center rounded-lg border border-border/50 p-1 bg-muted/30">
              {chartOptions.map((option) => {
                const Icon = option.icon;
                const isActive = activeChart === option.id;

                return (
                  <Button
                    key={option.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveChart(option.id)}
                    className={cn(
                      "relative text-xs px-3 py-1.5 h-auto",
                      isActive ? "bg-background shadow-sm" : "hover:bg-muted/50"
                    )}
                    title={option.description}
                  >
                    <Icon className="h-3 w-3 mr-1.5" />
                    {option.label}
                    {option.badge && isActive && (
                      <Badge
                        variant="secondary"
                        className="ml-1.5 text-[10px] px-1 py-0 h-4"
                      >
                        {option.badge}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="h-8 w-8 p-0"
            >
              <RotateCcw
                className={cn(
                  "h-3 w-3",
                  (isRefreshing || loading) && "animate-spin"
                )}
              />
            </Button>
          </div>
        </div>

        {/* Chart Description */}
        <div className="text-sm text-muted-foreground">
          {chartOptions.find((opt) => opt.id === activeChart)?.description}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        {/* Chart Container */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading chart data...</span>
              </div>
            </div>
          )}

          <div className="min-h-[350px] w-full">{renderChart()}</div>
        </div>

        {/* Chart Stats */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-muted-foreground text-xs">Total Trades</div>
              <div className="font-semibold">{trades.length}</div>
            </div>

            <div className="text-center">
              <div className="text-muted-foreground text-xs">Chart Type</div>
              <div className="font-semibold capitalize">
                {activeChart === "tv-line"
                  ? "Line Chart"
                  : activeChart === "tv-candlestick"
                  ? "Candlestick"
                  : activeChart === "recharts-ohlc"
                  ? "OHLC + Volume"
                  : "Market Context"}
              </div>
            </div>

            <div className="text-center">
              <div className="text-muted-foreground text-xs">Data Points</div>
              <div className="font-semibold">
                {
                  activeChart === "tv-candlestick"
                    ? Math.ceil(trades.length / 4) // Approximate candles
                    : activeChart === "recharts-ohlc"
                    ? Math.ceil(trades.length / 2) // 30-min intervals
                    : activeChart === "tradingview"
                    ? "External" // TradingView data
                    : trades.length + 1 // +1 for genesis point
                }
              </div>
            </div>

            <div className="text-center">
              <div className="text-muted-foreground text-xs">Status</div>
              <div className="flex items-center justify-center gap-1">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    loading ? "bg-yellow-500" : "bg-green-500"
                  )}
                />
                <span className="font-semibold text-xs">
                  {loading ? "Updating" : "Live"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
