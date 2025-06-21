"use client";

import React, { useCallback } from "react";
import { useWatchContractEvent } from "wagmi";
import { Log } from "viem";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";

// export const FACTORY_ADDRESS = "0x7713A39875A5335dc4Fc4f9359908afb55984b1F";

// Event types
type LogWithArgs = Log & {
  args: Record<string, any>;
  eventName: string | string[];
};

type TokenEvent = {
  eventName: string;
  tokenAddress: string;
  data: any;
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
  console.log("EventWatcher");
  const handleEvents = useCallback((logs: any) => {
    logs.forEach((log: LogWithArgs) => {
      const { eventName, args } = log;
      console.log(`Event ${eventName}:`, args);

      // Get token address based on event type
      let tokenAddress = "";
      if ("token" in args) {
        tokenAddress = args.token.toLowerCase();
      } else if ("tokenAddress" in args) {
        tokenAddress = args.tokenAddress.toLowerCase();
      }

      if (tokenAddress) {
        tokenEventEmitter.emit({
          eventName: eventName as string,
          tokenAddress,
          data: args,
        });
      }
    });
  }, []);

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
