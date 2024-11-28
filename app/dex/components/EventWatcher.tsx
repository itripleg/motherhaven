"use client";
import React from "react";
import { useWatchContractEvent } from "wagmi";
import abi from "./TokenFactory_abi.json";

const FACTORY_ADDRESS = "0x7713A39875A5335dc4Fc4f9359908afb55984b1F";

export function EventWatcher() {
  // Watch for new token creation events
  useWatchContractEvent({
    address: FACTORY_ADDRESS,
    abi: abi,
    eventName: "TokenCreated",
    onLogs(logs) {
      console.log("Token Created!", logs);
      logs.forEach((log) => {
        const { tokenAddress, name, ticker, creator } = log.args;
        console.log(
          `New Token: ${name} (${ticker}) at ${tokenAddress} by ${creator}`
        );
      });
    },
  });

  // Watch for token purchase events
  useWatchContractEvent({
    address: FACTORY_ADDRESS,
    abi: abi,
    eventName: "TokensPurchased",
    onLogs(logs) {
      console.log("Tokens Purchased!", logs);
      logs.forEach((log) => {
        const { token, buyer, amount, price } = log.args;
        console.log(
          `Purchase: ${amount} tokens at ${price} AVAX by ${buyer} for token ${token}`
        );
      });
    },
  });

  // Watch for token sale events
  useWatchContractEvent({
    address: FACTORY_ADDRESS,
    abi: abi,
    eventName: "TokensSold",
    onLogs(logs) {
      console.log("Tokens Sold!", logs);
      logs.forEach((log) => {
        const { token, seller, tokenAmount, ethAmount } = log.args;
        console.log(
          `Sale: ${tokenAmount} tokens for ${ethAmount} AVAX by ${seller} for token ${token}`
        );
      });
    },
  });

  // Watch for trading halt events
  useWatchContractEvent({
    address: FACTORY_ADDRESS,
    abi: abi,
    eventName: "TradingHalted",
    onLogs(logs) {
      console.log("Trading Halted!", logs);
      logs.forEach((log) => {
        const { token, collateral } = log.args;
        console.log(
          `Trading Halted for token ${token} with total collateral: ${collateral} AVAX`
        );
      });
    },
  });

  return null;
}

// Helper types for better type safety
type TokenCreatedEvent = {
  tokenAddress: `0x${string}`;
  name: string;
  ticker: string;
  creator: `0x${string}`;
};

type TokensPurchasedEvent = {
  token: `0x${string}`;
  buyer: `0x${string}`;
  amount: bigint;
  price: bigint;
};

type TokensSoldEvent = {
  token: `0x${string}`;
  seller: `0x${string}`;
  tokenAmount: bigint;
  ethAmount: bigint;
};

type TradingHaltedEvent = {
  token: `0x${string}`;
  collateral: bigint;
};
