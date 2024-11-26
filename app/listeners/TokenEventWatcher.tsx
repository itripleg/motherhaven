"use client";

import { useEffect } from "react";
import { watchContractEvent } from "@wagmi/core";
import { config } from "@/wagmi-config";
import abi from "./TokenFactory_abi.json";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/firebase"; // Your Firebase config

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
            // await addDoc(collection(db, "tokens"), {
            //   tokenAddress: log.args.tokenAddress,
            //   name: log.args.name,
            //   ticker: log.args.ticker,
            //   creator: log.args.creator,
            //   timestamp: new Date(),
            // });
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
