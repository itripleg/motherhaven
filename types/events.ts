// /types/events.ts
import { Hex } from "viem";

export type TokenCreatedEvent = {
  tokenAddress: Hex;
  name: string;
  symbol: string;
  imageUrl: string;
  creator: Hex;
  fundingGoal: bigint;
  burnManager: Hex;
};

export type TokensPurchasedEvent = {
  token: Hex;
  buyer: Hex;
  amount: bigint;
  price: bigint;
  fee: bigint;
};

export type TokensSoldEvent = {
  token: Hex;
  seller: Hex;
  tokenAmount: bigint;
  ethAmount: bigint;
  fee: bigint;
};

export type TradingHaltedEvent = {
  token: Hex;
  collateral: bigint;
};
