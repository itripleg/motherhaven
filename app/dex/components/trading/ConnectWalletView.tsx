// app/dex/components/trading/ConnectWalletView.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { useConnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { CreditCard, ShieldCheck } from "lucide-react";

interface ConnectWalletViewProps {
  tokenSymbol?: string;
}

export function ConnectWalletView({
  tokenSymbol = "tokens",
}: ConnectWalletViewProps) {
  const { connect, connectors } = useConnect();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-8 space-y-6"
    >
      <div className="space-y-3">
        <div className="text-4xl">👋</div>
        <h3 className="text-xl font-bold text-foreground">
          Connect Your Wallet
        </h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Connect your wallet to start trading {tokenSymbol}
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        {connectors.map((connector) => (
          <motion.div
            key={connector.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => connect({ connector })}
              className="w-full btn-primary py-3 font-medium"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Connect {connector.name}
            </Button>
          </motion.div>
        ))}
      </div>

      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 max-w-sm mx-auto">
        <div className="flex items-center gap-2 text-sm text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span>Secure • Non-custodial</span>
        </div>
      </div>
    </motion.div>
  );
}
