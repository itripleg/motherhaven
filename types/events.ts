// /types/events.ts
import { Hex } from "viem";

export type TokenCreatedEvent = {
  tokenAddress: Hex;
  name: string;
  symbol: string;
  imageUrl: string;
  creator: Hex;
  fundingGoal: bigint;
};

export type TokensPurchasedEvent = {
  token: Hex;
  buyer: Hex;
  amount: bigint;
  price: bigint;
};

export type TokensSoldEvent = {
  token: Hex;
  seller: Hex;
  tokenAmount: bigint;
  ethAmount: bigint;
};

export type TradingHaltedEvent = {
  token: Hex;
  collateral: bigint;
};