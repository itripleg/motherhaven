// components/trading/chart/ChartLoading.tsx
"use client";
import React from "react";
import { motion } from "framer-motion";

interface ChartLoadingProps {
  height?: string;
}

export function ChartLoading({ height = "h-80 lg:h-96" }: ChartLoadingProps) {
  return (
    <div
      className={`flex items-center justify-center ${height} text-center space-y-4`}
    >
      <div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"
        />
        <p className="text-muted-foreground">Loading Chart Data...</p>
      </div>
    </div>
  );
}
