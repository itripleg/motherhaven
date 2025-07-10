// app/dex/components/OptimizedTokenTradeCard.tsx - Simplified
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { ConnectWalletView } from "./trading/ConnectWalletView";
import { GoalReachedView } from "./trading/GoalReachedView";
import { TradingInterface } from "./trading/TradingInterface";
import { Token, TokenState } from "@/types";

interface OptimizedTokenTradeCardProps {
  tokenData: Token;
  isConnected?: boolean;
}

export function OptimizedTokenTradeCard({
  tokenData,
  isConnected: isConnectedProp,
}: OptimizedTokenTradeCardProps) {
  const { isConnected } = useAccount();
  const effectivelyConnected = isConnected || isConnectedProp;

  // Check token state
  const isGoalReached = tokenData?.currentState === TokenState.GOAL_REACHED;
  const isTrading =
    tokenData?.currentState === TokenState.TRADING ||
    tokenData?.currentState === TokenState.RESUMED;

  const renderContent = () => {
    if (isGoalReached) {
      return <GoalReachedView token={tokenData} />;
    }

    if (isTrading && effectivelyConnected) {
      return <TradingInterface token={tokenData} />;
    }

    return <ConnectWalletView tokenSymbol={tokenData?.symbol} />;
  };

  return (
    <Card className="unified-card border-primary/20 overflow-hidden">
      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${isGoalReached}-${isTrading}-${effectivelyConnected}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
