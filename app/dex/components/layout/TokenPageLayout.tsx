// app/dex/components/layout/TokenPageLayout.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Token } from "@/types";
import { TokenHeader } from "../token-header/TokenHeader";
import { TokenMainArea } from "./TokenMainArea";
import { TokenSidebar } from "./TokenSidebar";
import { MobileChatModal } from "../MobileChatModal";

interface TokenPageLayoutProps {
  token: Token;
}

export function TokenPageLayout({ token }: TokenPageLayoutProps) {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-20 p-4">
        {/* Token Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <TokenHeader address={token.address} />
        </motion.div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mt-8">
          {/* Left Column - Charts and Trading */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="xl:col-span-3 space-y-8"
          >
            <TokenMainArea token={token} />
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
