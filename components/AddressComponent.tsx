"use client";

import { useState } from "react";
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

  // Debug: Add logging to see what's being passed
  console.log("AddressComponent received:", { hash, type });

  // Validate hash
  if (!hash || hash === "0x0000000000000000000000000000000000000000") {
    console.warn("Invalid hash received:", hash);
    return <span className="text-red-500">Invalid Address</span>;
  }

  const explorerUrl = `${SNOWTRACE_TESTNET_URL}/${type}/${hash}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateHash = (hash: string, type: "tx" | "address") => {
    if (!hash) return "";

    // Always truncate for display, regardless of type
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const displayHash = truncateHash(hash, type);

  return (
    <TooltipProvider>
      <motion.div
        className="flex items-center space-x-2 p-0 rounded-md text-center justify-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-white/80 transition-colors duration-200"
          whileHover={{ scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            // Debug: Log what's actually being clicked
            console.log("Link clicked:", { href: explorerUrl, hash });
          }}
        >
          {displayHash}
        </motion.a>
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
                className="h-8 w-8 text-primary hover:text-white/80 hover:bg-primary/20"
                asChild
              >
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    // Debug: Log what's actually being clicked
                    console.log("External link clicked:", {
                      href: explorerUrl,
                      hash,
                    });
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
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
