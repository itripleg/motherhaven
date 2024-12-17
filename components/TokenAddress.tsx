"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { truncateAddress, getExplorerUrl } from "../utils/tokenUtils";

interface TokenAddressProps {
  address: string;
  network: string;
}

export function TokenAddress({ address, network }: TokenAddressProps) {
  const [copied, setCopied] = useState(false);

  const explorerUrl =
    address === "native"
      ? getExplorerUrl(network, "")
      : getExplorerUrl(network, address);

  const copyToClipboard = () => {
    if (address !== "native") {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (address === "native") {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-sm text-indigo-400 dark:text-indigo-300">
            Native Token
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0.5 text-muted-foreground hover:text-primary"
                asChild
              >
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">View on explorer</span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View on Explorer</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-sm text-indigo-400 dark:text-indigo-300">
          {truncateAddress(address)}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className="h-6 w-6 p-0.5 text-muted-foreground hover:text-primary"
            >
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy address</span>
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
              className="h-6 w-6 p-0.5 text-muted-foreground hover:text-primary"
              asChild
            >
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">View on explorer</span>
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View on Explorer</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
