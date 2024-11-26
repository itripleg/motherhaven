"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Connector {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

interface WalletConnectorProps {
  connectors?: Connector[];
  onConnect: (index: number) => void;
  isLoading: boolean;
}

export function WalletConnector({
  connectors,
  onConnect,
  isLoading,
}: WalletConnectorProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
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
            className="w-full h-16 text-lg font-semibold relative overflow-hidden"
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
              className="flex items-center justify-center space-x-2"
              initial={{ y: 0 }}
              animate={{ y: isLoading ? -30 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {connector.icon && <span className="mr-2">{connector.icon}</span>}
              <span>{connector.name}</span>
            </motion.div>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ y: 30 }}
              animate={{ y: isLoading ? 0 : 30 }}
              transition={{ duration: 0.3 }}
            >
              {/* <Loader2 className="w-6 h-6 animate-spin" /> */}
            </motion.div>
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
}
