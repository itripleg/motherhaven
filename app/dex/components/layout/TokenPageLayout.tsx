// app/dex/components/layout/TokenPageLayout.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Token } from "@/types";
import { TokenHeader } from "../token-header/TokenHeader";
import { TokenMainArea } from "./TokenMainArea";
import { TokenSidebar } from "./TokenSidebar";
import { MobileChatModal } from "../MobileChatModal";
import { TokenRoadmap } from "../roadmap/TokenRoadmap";
import { useAccount } from "wagmi";

interface TokenPageLayoutProps {
  token: Token;
}

export function TokenPageLayout({ token }: TokenPageLayoutProps) {
  const [showRoadmap, setShowRoadmap] = useState(false);
  const { address } = useAccount();

  const isCreator =
    address &&
    token?.creator &&
    address.toLowerCase() === token.creator.toLowerCase();

  console.log(
    "TokenPageLayout - isCreator:",
    isCreator,
    "address:",
    address,
    "token.creator:",
    token?.creator
  );

  const handleRoadmapClick = () => {
    console.log("Roadmap click triggered, current showRoadmap:", showRoadmap);
    setShowRoadmap(!showRoadmap);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-20 p-4">
        {/* Token Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <TokenHeader
            address={token.address}
            onRoadmapClick={handleRoadmapClick}
          />
        </motion.div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt-8">
          {/* Left Column - Charts/Trading OR Roadmap */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="xl:col-span-3 space-y-8"
          >
            <AnimatePresence mode="wait">
              {showRoadmap ? (
                <motion.div
                  key="roadmap"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  {/* Simple header with just back button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowRoadmap(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                      >
                        ← Back to Trading
                      </motion.button>
                    </div>
                  </div>

                  <TokenRoadmap
                    tokenAddress={token.address}
                    creatorAddress={token.creator}
                    isCreator={!!isCreator}
                    compact={false}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="trading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <TokenMainArea
                    token={token}
                    onRoadmapClick={handleRoadmapClick}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Sidebar - Desktop Only */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="hidden xl:flex xl:flex-col gap-6"
          >
            <TokenSidebar token={token} />
          </motion.div>
        </div>

        {/* Mobile Chat Modal */}
        <div className="xl:hidden">
          <MobileChatModal
            tokenAddress={token.address}
            creatorAddress={token.creator}
          />
        </div>
      </div>
    </div>
  );
}
