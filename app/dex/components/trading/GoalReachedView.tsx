// app/dex/components/trading/GoalReachedView.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Token } from "@/types";

interface GoalReachedViewProps {
  token: Token;
}

export function GoalReachedView({ token }: GoalReachedViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center space-y-6 p-8"
    >
      <div className="space-y-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-green-400 mb-2">
            Funding Goal Reached!
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            This token has successfully reached its funding goal of{" "}
            <span className="font-semibold text-green-400">
              {token?.fundingGoal || "0"} AVAX
            </span>
            . Trading is temporarily halted.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
