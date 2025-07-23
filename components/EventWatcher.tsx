// components/EventWatcher.tsx
"use client";

import React, { useCallback, useRef } from "react";
import { useWatchContractEvent } from "wagmi";
import { Log } from "viem";
import { formatEther } from "viem";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { AddressComponent } from "./AddressComponent";
import {
  ExternalLink,
  Coins,
  TrendingUp,
  TrendingDown,
  Plus,
  Pause,
  Bell,
} from "lucide-react";

// Event types
type LogWithArgs = Log & {
  args: Record<string, any>;
  eventName: string | string[];
};

type TokenEvent = {
  eventName: string;
  tokenAddress: string;
  data: any;
  transactionHash?: string;
};

// Create a custom event bus
export const tokenEventEmitter = {
  listeners: new Map<string, Set<(event: TokenEvent) => void>>(),

  addEventListener(
    tokenAddress: string,
    callback: (event: TokenEvent) => void
  ) {
    if (!this.listeners.has(tokenAddress)) {
      this.listeners.set(tokenAddress, new Set());
    }
    this.listeners.get(tokenAddress)?.add(callback);
  },

  removeEventListener(
    tokenAddress: string,
    callback: (event: TokenEvent) => void
  ) {
    this.listeners.get(tokenAddress)?.delete(callback);
    if (this.listeners.get(tokenAddress)?.size === 0) {
      this.listeners.delete(tokenAddress);
    }
  },

  emit(event: TokenEvent) {
    this.listeners
      .get(event.tokenAddress)
      ?.forEach((callback) => callback(event));
  },
};

export function EventWatcher() {
  const { toast } = useToast();
  const lastToastTime = useRef<number>(0);
  const TOAST_COOLDOWN = 10000; // 10 seconds

  const showEventToast = useCallback(
    (event: TokenEvent) => {
      const now = Date.now();

      if (now - lastToastTime.current < TOAST_COOLDOWN) {
        return; // Skip toast if within cooldown period
      }
      lastToastTime.current = now;

      const { eventName, data, transactionHash } = event;

      // Format address for display (you can enhance this with vanity names later)
      const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
      };

      // Format numbers for display
      const formatNumber = (value: string, decimals: number = 4) => {
        const num = parseFloat(value);
        if (num === 0) return "0";
        if (num < 0.0001) return num.toExponential(2);
        if (num < 1) return num.toFixed(decimals);
        if (num < 1000) return num.toFixed(2);
        return num.toFixed(0);
      };

      // Get event-specific details
      let title = "";
      let description = "";
      let variant: "default" | "success" | "destructive" | "warning" | "info" = "default";

      switch (eventName) {
        case "TokenCreated":
          title = (
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-500" />
              New Token Created!
            </div>
          );
          description = `${formatAddress(data.creator)} created ${data.name} (${
            data.symbol
          })`;
          variant = "success";
          break;

        case "TokensPurchased":
          const ethAmountPurchased = data.price ? formatEther(data.price) : "0";
          const tokenAmountPurchased = data.amount
            ? formatEther(data.amount)
            : "0";
          title = (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Token Purchase
            </div>
          );
          description = `${formatAddress(data.buyer)} bought ${formatNumber(
            tokenAmountPurchased
          )} tokens for ${formatNumber(ethAmountPurchased)} AVAX`;
          variant = "success";
          break;

        case "TokensSold":
          const ethSold = data.ethAmount ? formatEther(data.ethAmount) : "0";
          const tokensSold = data.tokenAmount
            ? formatEther(data.tokenAmount)
            : "0";
          title = (
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Token Sale
            </div>
          );
          description = `${formatAddress(data.seller)} sold ${formatNumber(
            tokensSold
          )} tokens for ${formatNumber(ethSold)} AVAX`;
          variant = "destructive";
          break;

        case "TradingHalted":
          title = (
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-yellow-500" />
              Trading Halted
            </div>
          );
          description = `Trading halted for token ${formatAddress(
            data.token || data.tokenAddress
          )}`;
          variant = "warning";
          break;

        default:
          title = (
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Factory Event
            </div>
          );
          description = `Event: ${eventName}`;
          variant = "info";
      }

      toast({
        title,
        description: (
          <div className="space-y-2">
            <p className="text-sm">{description}</p>
            {transactionHash && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                <button
                  onClick={() => {
                    window.open(
                      `https://testnet.snowtrace.dev/tx/${transactionHash}`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  View Transaction
                </button>
              </div>
            )}
          </div>
        ),
        variant,
        duration: 6000, // Show for 6 seconds
      });
    },
    [toast]
  );

  const handleEvents = useCallback(
    (logs: any) => {
      logs.forEach((log: LogWithArgs) => {
        const { eventName, args, transactionHash } = log;
        console.log(`Event ${eventName}:`, args);

        // Get token address based on event type
        let tokenAddress = "";
        if ("token" in args) {
          tokenAddress = args.token.toLowerCase();
        } else if ("tokenAddress" in args) {
          tokenAddress = args.tokenAddress.toLowerCase();
        }

        const event: TokenEvent = {
          eventName: eventName as string,
          tokenAddress,
          data: args,
          transactionHash: transactionHash || undefined,
        };

        // Emit to event bus
        if (tokenAddress) {
          tokenEventEmitter.emit(event);
        }

        // Show toast notification
        showEventToast(event);
      });
    },
    [showEventToast]
  );

  useWatchContractEvent({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    // @ts-expect-error works
    eventName: [
      "TokenCreated",
      "TokensPurchased",
      "TokensSold",
      "TradingHalted",
    ],
    onLogs: handleEvents,
    pollingInterval: 5000,
  });

  return null;
}