// app/dex/components/layout/TokenMainArea.tsx
"use client";

import React from "react";
import { BarChart3, TrendingUp, Map } from "lucide-react";
import { motion } from "framer-motion";
import { Token } from "@/types";
import { TokenPriceCharts } from "../trading/TokenPriceCharts";
import { OptimizedTokenTradeCard } from "../OptimizedTokenTradeCard";

interface TokenMainAreaProps {
  token: Token;
  onRoadmapClick?: () => void;
}

export function TokenMainArea({ token, onRoadmapClick }: TokenMainAreaProps) {
  return (
    <>
      {/* Roadmap Button */}
      {onRoadmapClick && (
        <div className="flex justify-end mb-6 animate-pulse">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRoadmapClick}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors border border-primary/30"
          >
            <Map className="h-4 w-4" />
            View Roadmap
          </motion.button>
        </div>
      )}

      {/* Price Charts Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Price Analysis
            </h2>
            <p className="text-sm text-muted-foreground">
              Real-time market data and trends
            </p>
          </div>
        </div>
        <TokenPriceCharts address={token.address} />
      </div>

      {/* Trading Interface Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Trade {token.symbol}
            </h2>
            <p className="text-sm text-muted-foreground">
              Buy and sell with instant execution
            </p>
          </div>
        </div>
        <OptimizedTokenTradeCard tokenData={token} isConnected={true} />
      </div>
    </>
  );
}
