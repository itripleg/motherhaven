// pet/components/PetEventWatcher.tsx
"use client";

import React, { useCallback } from "react";
import { useWatchContractEvent } from "wagmi";
import { Log } from "viem";
import { useToast } from "@/hooks/use-toast";

const PET_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_PET_CONTRACT_ADDRESS as `0x${string}`) ||
  "0x821a3AE43bc36a103c67f6C3B4DFDDF8847457b8";

const PET_CONTRACT_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "feeder", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "healthGained", type: "uint256" },
      { name: "newHealth", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
    name: "PetFed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { name: "timestamp", type: "uint256" },
      { name: "message", type: "string" },
      { name: "deathCount", type: "uint256" },
    ],
    name: "PetDied",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "reviver", type: "address" },
      { indexed: true, name: "newOwner", type: "address" },
      { name: "revivalCost", type: "uint256" },
      { name: "timestamp", type: "uint256" },
      { name: "deathCount", type: "uint256" },
    ],
    name: "PetRevived",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { name: "oldName", type: "string" },
      { name: "newName", type: "string" },
      { name: "timestamp", type: "uint256" },
    ],
    name: "PetRenamed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "previousCaretaker", type: "address" },
      { indexed: true, name: "newCaretaker", type: "address" },
    ],
    name: "PetCaretakerChanged",
    type: "event",
  },
] as const;

// Event types
type LogWithArgs = Log & {
  args: Record<string, any>;
  eventName: string | string[];
};

type PetEvent = {
  eventName: string;
  data: any;
};

// Create a custom event bus for pet events
export const petEventEmitter = {
  listeners: new Set<(event: PetEvent) => void>(),

  addEventListener(callback: (event: PetEvent) => void) {
    this.listeners.add(callback);
  },

  removeEventListener(callback: (event: PetEvent) => void) {
    this.listeners.delete(callback);
  },

  emit(event: PetEvent) {
    this.listeners.forEach((callback) => callback(event));
  },
};

export function PetEventWatcher() {
  const { toast } = useToast();

  const handleEvents = useCallback(
    (logs: any) => {
      logs.forEach((log: LogWithArgs) => {
        const { eventName, args } = log;
        console.log(`Pet Event ${eventName}:`, args);

        // Emit to event bus
        petEventEmitter.emit({
          eventName: eventName as string,
          data: args,
        });

        // Show toast notifications
        switch (eventName) {
          case "PetFed":
            toast({
              title: "🍖 Pet Fed!",
              description: `Someone fed the pet! Health: ${args.newHealth}`,
            });
            break;
          case "PetDied":
            toast({
              title: "😢 Pet Died",
              description: args.message,
              variant: "destructive",
            });
            break;
          case "PetRevived":
            toast({
              title: "🎉 Pet Revived!",
              description: `Pet was revived by ${args.reviver.slice(
                0,
                6
              )}...${args.reviver.slice(-4)}`,
            });
            break;
          case "PetRenamed":
            toast({
              title: "🏷️ Pet Renamed",
              description: `Pet renamed from "${args.oldName}" to "${args.newName}"`,
            });
            break;
          case "PetCaretakerChanged":
            toast({
              title: "👑 New Caretaker",
              description: `Caretaker changed to ${args.newCaretaker.slice(
                0,
                6
              )}...${args.newCaretaker.slice(-4)}`,
            });
            break;
        }
      });
    },
    [toast]
  );

  useWatchContractEvent({
    address: PET_CONTRACT_ADDRESS,
    abi: PET_CONTRACT_ABI,
    // @ts-expect-error works
    eventName: [
      "PetFed",
      "PetDied",
      "PetRevived",
      "PetRenamed",
      "PetCaretakerChanged",
    ],
    onLogs: handleEvents,
    pollingInterval: 10000, // 10 seconds
  });

  return null;
}
