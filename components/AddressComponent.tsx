"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransactionHashProps {
  hash: string;
  type: "tx" | "address";
}

const SNOWTRACE_TESTNET_URL = "https://43113.testnet.snowtrace.dev";

export function AddressComponent({ hash, type }: TransactionHashProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  const explorerUrl = `${SNOWTRACE_TESTNET_URL}/${type}/${hash}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const truncateHash = (hash: string, isTx: boolean = true) => {
    if (!hash) return "";
    if (isTx) {
      return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
    }
    return hash;
  };

  const handleExternalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(explorerUrl, "_blank", "noopener,noreferrer");
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="flex items-center space-x-2 p-2 rounded-md text-center justify-center">
        <span className="text-primary">{truncateHash(hash)}</span>
        <div className="h-8 w-8"></div>
        <div className="h-8 w-8"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        className="flex items-center space-x-2 p-2 rounded-md text-center justify-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          onClick={handleExternalClick}
          className="text-primary hover:text-white/80 transition-colors duration-200 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {truncateHash(hash)}
        </motion.button>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyToClipboard}
                className="h-8 w-8 text-primary hover:text-white/80 hover:bg-primary/20"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? "Copied!" : "Copy to clipboard"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExternalClick}
                className="h-8 w-8 text-primary hover:text-white/80 hover:bg-primary/20"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>View on Snowtrace</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  );
}
