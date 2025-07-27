// components/BondingCurveVisualizer.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Activity,
  Info,
  Zap,
  Target,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

type CurveType = "linear" | "exponential" | "logarithmic";

interface CurveConfig {
  type: CurveType;
  maxSupply: number;
  initialPrice: number;
  fundingGoal: number;
  intervals: number;
  steepness: number; // Controls how steep the curve is
}

const DEFAULT_CONFIG: CurveConfig = {
  type: "linear",
  maxSupply: 1000000000, // 1B tokens
  initialPrice: 0.00001,
  fundingGoal: 25,
  intervals: 50,
  steepness: 2000, // Similar to PRICE_RATE in your contract
};

const CURVE_TYPES = {
  linear: {
    name: "Linear",
    description: "Steady price increase - most predictable",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  exponential: {
    name: "Exponential",
    description: "Accelerating price growth - rewards early buyers",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  logarithmic: {
    name: "Logarithmic",
    description: "Slowing price growth - more accessible later",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
} as const;

export function BondingCurveVisualizer() {
  const [config, setConfig] = useState<CurveConfig>(DEFAULT_CONFIG);

  const generateCurveData = () => {
    const data = [];
    const { type, maxSupply, initialPrice, intervals, steepness } = config;

    for (let i = 0; i <= intervals; i++) {
      const progress = i / intervals;
      const supply = Math.floor(maxSupply * progress);
      let price;

      // Calculate price based on supply using bonding curve formulas
      // Similar to how your GrandFactory contract calculates prices
      switch (type) {
        case "exponential":
          // Price grows exponentially with supply
          price = initialPrice * (1 + (supply / steepness) ** 1.5);
          break;
        case "logarithmic":
          // Price grows logarithmically with supply
          price =
            supply === 0
              ? initialPrice
              : initialPrice * (1 + Math.log(1 + supply / steepness));
          break;
        case "linear":
        default:
          // Linear growth: price = initialPrice + (supply / steepness)
          price = initialPrice + supply / steepness;
          break;
      }

      data.push({
        supply,
        price: Number(price.toFixed(8)),
        supplyFormatted:
          supply >= 1e6
            ? `${(supply / 1e6).toFixed(1)}M`
            : supply.toLocaleString(),
        priceFormatted: `${price.toFixed(6)} AVAX`,
        marketCap: supply * price, // Total value of all tokens
      });
    }
    return data;
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const updateConfig = (updates: Partial<CurveConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const curveData = generateCurveData();
  const currentCurve = CURVE_TYPES[config.type];

  // Calculate key metrics
  const finalPrice = curveData[curveData.length - 1]?.price || 0;
  const supplyAtGoal =
    curveData.find((point) => point.marketCap >= config.fundingGoal)?.supply ||
    0;
  const priceAtGoal =
    curveData.find((point) => point.marketCap >= config.fundingGoal)?.price ||
    0;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Bonding Curve Explorer
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Understand how token prices evolve with different bonding curve
              models. Experiment with parameters to see their impact on price
              discovery.
            </p>
          </motion.div>
        </div>

        {/* Chart - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="unified-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {currentCurve.name} Bonding Curve
                </div>
                <Badge
                  className={`${currentCurve.bgColor} ${currentCurve.color} border-0`}
                >
                  {curveData.length} Points
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={curveData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="2 2"
                      stroke="hsl(var(--muted-foreground))"
                      strokeOpacity={0.1}
                    />
                    <XAxis
                      dataKey="supplyFormatted"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value.toFixed(4)}`}
                    />
                    <RechartsTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background/95 backdrop-blur-md border border-primary/20 rounded-lg p-3 shadow-xl">
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                Supply: {data.supplyFormatted}
                              </p>
                              <p className="text-lg font-bold text-primary">
                                {data.priceFormatted}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Market Cap: {data.marketCap.toFixed(2)} AVAX
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <defs>
                      <linearGradient
                        id="priceGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fill="url(#priceGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Controls - Three Column Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Curve Type Selection */}
          <Card className="unified-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Curve Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(CURVE_TYPES).map(([key, curve]) => (
                <motion.button
                  key={key}
                  onClick={() => updateConfig({ type: key as CurveType })}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                    config.type === key
                      ? `${curve.bgColor} ${curve.borderColor}`
                      : "border-border/30 hover:border-border/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {curve.name}
                      </span>
                      {config.type === key && (
                        <Badge
                          className={`${curve.bgColor} ${curve.color} border-0`}
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {curve.description}
                    </p>
                  </div>
                </motion.button>
              ))}
            </CardContent>
          </Card>

          {/* Price Settings */}
          <Card className="unified-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Price Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="initialPrice" className="text-sm font-medium">
                    Initial Price
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Starting price when the first token is minted
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="initialPrice"
                  type="number"
                  step="0.000001"
                  value={config.initialPrice}
                  onChange={(e) =>
                    updateConfig({ initialPrice: Number(e.target.value) })
                  }
                  className="text-center"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="steepness" className="text-sm font-medium">
                    Curve Steepness
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Controls how quickly price increases with supply
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="steepness"
                  type="number"
                  value={config.steepness}
                  onChange={(e) =>
                    updateConfig({ steepness: Number(e.target.value) })
                  }
                  className="text-center"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fundingGoal" className="text-sm font-medium">
                    Funding Goal
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      AVAX needed to reach graduation to DEX
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="fundingGoal"
                  type="number"
                  value={config.fundingGoal}
                  onChange={(e) =>
                    updateConfig({ fundingGoal: Number(e.target.value) })
                  }
                  className="text-center"
                />
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card className="unified-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                Advanced
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Chart Resolution: {config.intervals}
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Number of data points in the visualization
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Slider
                  value={[config.intervals]}
                  onValueChange={([value]) =>
                    updateConfig({ intervals: value })
                  }
                  min={20}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maxSupply" className="text-sm font-medium">
                    Max Supply
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Maximum number of tokens that can be minted
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="maxSupply"
                  type="number"
                  value={config.maxSupply}
                  onChange={(e) =>
                    updateConfig({ maxSupply: Number(e.target.value) })
                  }
                  className="text-center"
                />
              </div>

              <Button
                onClick={resetToDefaults}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats - Three Column Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="unified-card border-primary/20 bg-primary/5">
            <CardContent className="p-4 text-center">
              <div className="space-y-2">
                <Zap className="h-8 w-8 text-primary mx-auto" />
                <div className="text-2xl font-bold text-primary">
                  {config.initialPrice.toFixed(6)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Starting Price (AVAX)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="unified-card border-primary/20 bg-primary/5">
            <CardContent className="p-4 text-center">
              <div className="space-y-2">
                <Target className="h-8 w-8 text-primary mx-auto" />
                <div className="text-2xl font-bold text-primary">
                  {priceAtGoal > 0 ? priceAtGoal.toFixed(6) : "N/A"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Price at Goal (AVAX)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="unified-card border-primary/20 bg-primary/5">
            <CardContent className="p-4 text-center">
              <div className="space-y-2">
                <TrendingUp className="h-8 w-8 text-primary mx-auto" />
                <div className="text-2xl font-bold text-primary">
                  {finalPrice.toFixed(6)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Final Price (AVAX)
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
