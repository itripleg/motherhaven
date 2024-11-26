"use client";
import React from "react";
import { useWatchContractEvent } from "wagmi";
import abi from "./TokenFactory_abi.json";

type Props = {};

export default function Page({}: Props) {
  return (
    <div>
      <EventWatcher />
    </div>
  );
}

function EventWatcher() {
  useWatchContractEvent({
    address: "0x7713A39875A5335dc4Fc4f9359908afb55984b1F",
    abi: abi,
    eventName: "TokenCreated",
    onLogs(logs) {
      console.log("TokenCreated LOG!!!!", logs);
    },
  });

  return null;
}
