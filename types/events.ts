// /types/events.ts

import { Address } from "viem";

// Updated to match GrandFactory.sol TokenCreated event
export type TokenCreatedEvent = {
  tokenAddress: Address;
  name: string;
  symbol: string;
  imageUrl: string;
  creator: Address;
  fundingGoal: bigint;
  burnManager: Address;
  creatorTokens: bigint; // NEW: tokens minted to creator
  ethSpent: bigint; // NEW: ETH spent during creation
};

// Updated to match GrandFactory.sol TokensPurchased event
export type TokensPurchasedEvent = {
  token: Address;
  buyer: Address;
  amount: bigint;
  price: bigint;
  fee: bigint;
};

// Updated to match GrandFactory.sol TokensSold event
export type TokensSoldEvent = {
  token: Address;
  seller: Address;
  tokenAmount: bigint;
  ethAmount: bigint;
  fee: bigint;
};

// Updated to match GrandFactory.sol TradingHalted event
export type TradingHaltedEvent = {
  token: Address;
  collateral: bigint;
};

// Updated to match GrandFactory.sol TradingResumed event
export type TradingResumedEvent = {
  token: Address;
};
