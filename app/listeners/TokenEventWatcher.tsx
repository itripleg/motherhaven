"use client";

import { useEffect } from "react";
import { watchContractEvent } from "@wagmi/core";
import { config } from "@/wagmi-config";
import abi from "./TokenFactory_abi.json";

export function TokenEventWatcher() {
  useEffect(() => {
    const unwatch = watchContractEvent(config, {
      address: "0x7713A39875A5335dc4Fc4f9359908afb55984b1F",
      abi,
      eventName: "TokenCreated",
      async onLogs(logs) {
        console.log("New logs!", logs);

        for (const log of logs) {
          try {
          } catch (error) {
            console.error("Error adding document: ", error);
          }
        }
      },
    });

    return () => unwatch();
  }, []);

  return null;
}
