// app/dex/components/layout/TokenSidebar.tsx - Fixed Import
"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageCircle, Activity, Sparkles } from "lucide-react";
import { Token } from "@/types";
import { ChatComponent } from "../ChatComponent";
import RecentTrades from "../trading/RecentTrades"; // Changed to default import

interface TokenSidebarProps {
  token: Token;
}

export function TokenSidebar({ token }: TokenSidebarProps) {
  return (
    <div className="sticky top-6 space-y-6 h-fit">
      {/* Chat Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Community Chat</h3>
            <p className="text-xs text-muted-foreground">
              Join the conversation
            </p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="ml-auto"
          >
            <Sparkles className="h-4 w-4 text-primary" />
          </motion.div>
        </div>
        <div className="h-[450px] unified-card rounded-xl border-primary/20 overflow-hidden">
          <ChatComponent
            tokenAddress={token.address}
            creatorAddress={token.creator}
          />
        </div>
      </div>

      {/* Recent Trades Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Recent Trades</h3>
            <p className="text-xs text-muted-foreground">
              Live market activity
            </p>
          </div>
        </div>
        <div className="h-[400px] unified-card rounded-xl border-primary/20 overflow-hidden">
          <RecentTrades tokenAddress={token.address} />
        </div>
      </div>
    </div>
  );
}
