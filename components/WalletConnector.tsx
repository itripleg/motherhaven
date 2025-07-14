// components/WalletConnector.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";

interface Connector {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

interface WalletConnectorProps {
  connectors?: readonly Connector[];
  onConnect: (index: number) => void;
  isLoading: boolean;
}

// Function to get proper wallet name from connector
function getWalletName(connector: Connector): string {
  return connector.name || connector.id;
}

export function WalletConnector({
  connectors,
  onConnect,
  isLoading,
}: WalletConnectorProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Connect Your Wallet
          <Zap className="h-5 w-5 text-primary" />
        </CardTitle>
        <CardDescription>
          Choose a wallet to connect. You'll be automatically switched to
          Avalanche Fuji Testnet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {connectors?.map((connector, index) => (
            <motion.div
              key={connector.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                className="w-full h-20 font-semibold relative overflow-hidden text-sm"
                onClick={() => onConnect(index)}
                disabled={isLoading}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <motion.div
                  className="absolute inset-0 bg-primary/10"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: hoveredIndex === index ? 1 : 0,
                    opacity: hoveredIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="flex flex-col items-center justify-center space-y-1"
                  initial={{ y: 0 }}
                  animate={{ y: isLoading ? -30 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="font-medium">
                    {getWalletName(connector)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    + Auto Network Switch
                  </span>
                </motion.div>
                <motion.div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  initial={{ y: 30 }}
                  animate={{ y: isLoading ? 0 : 30 }}
                  transition={{ duration: 0.3 }}
                >
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs mt-1">Connecting...</span>
                </motion.div>
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Network Info */}
        <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-primary font-medium">Target Network:</span>
            <span className="text-muted-foreground">
              Avalanche Fuji Testnet
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your wallet will automatically switch to the correct network after
            connection.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
