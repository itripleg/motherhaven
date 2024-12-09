import { Address } from "viem";

// /types/enums.ts
export enum TokenState {
  NOT_CREATED = 0,
  TRADING = 1,
  HALTED = 2, // Single state for when goal is reached/trading halted
}

export type Token = {
  id: string;
  state: TokenState;
  address: Address;
};
