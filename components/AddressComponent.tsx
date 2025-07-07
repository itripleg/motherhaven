// components/AddressComponent.tsx
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
import { cn } from "@/lib/utils";

interface TransactionHashProps {
  hash: string;
  type: "tx" | "address";
  className?: string;
  compact?: boolean; // New prop for compact display
  showActions?: boolean; // New prop to show/hide action buttons
}

// Updated URL - use the correct testnet URL
const SNOWTRACE_TESTNET_URL = "https://testnet.snowtrace.dev";

export function AddressComponent({
  hash,
  type,
  className,
  compact = false,
  showActions = true,
}: TransactionHashProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate hash before using it
  const isValidHash =
    hash &&
    hash !== "0x0000000000000000000000000000000000000000" &&
    hash.length > 0;

  const explorerUrl = isValidHash
    ? `${SNOWTRACE_TESTNET_URL}/${type}/${hash}`
    : "#";

  const copyToClipboard = async () => {
    if (!isValidHash) return;

    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const truncateHash = (hash: string) => {
    if (!hash || hash === "0x0000000000000000000000000000000000000000") {
      return "Invalid address";
    }
    if (compact) {
      return `${hash.slice(0, 4)}...${hash.slice(-4)}`;
    }
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const handleExternalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isValidHash) {
      console.warn("Cannot open explorer: invalid hash", hash);
      return;
    }

    window.open(explorerUrl, "_blank", "noopener,noreferrer");
  };

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className={cn("flex items-center", className)}>
        <span className="text-current font-mono text-sm">
          {truncateHash(hash)}
        </span>
      </div>
    );
  }

  // If hash is invalid, show a warning
  if (!isValidHash) {
    return (
      <div className={cn("flex items-center", className)}>
        <span className="text-destructive text-sm">No address available</span>
      </div>
    );
  }

  // Compact version for use in lists/tables
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={copyToClipboard}
              className={cn(
                "font-mono text-sm hover:text-primary transition-colors cursor-pointer",
                className
              )}
            >
              {truncateHash(hash)}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? "Copied!" : "Click to copy"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full version with action buttons
  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        {/* Address text */}
        <span className="text-current font-mono text-sm truncate">
          {truncateHash(hash)}
        </span>

        {showActions && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToClipboard}
                  className="h-6 w-6 text-current hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? "Copied!" : "Copy to clipboard"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleExternalClick}
                  className="h-6 w-6 text-current hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View on Snowtrace</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
