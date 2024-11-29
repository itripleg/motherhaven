export interface CryptoAddress {
  id?: string; // Optional, as it will be assigned by Firestore
  name: string;
  address: string;
  blockchain: string;
}

export interface FirebaseError {
  code: string;
  message: string;
}

export interface Token {
  id: string;
  name: string;
  symbol: string;
  address: string;
  currentPrice: number;
  createdAt: Date;
  imageUrl?: string;
}

import { Timestamp } from "firebase/firestore";

export interface TokenData {
  id: string;
  name: string;
  symbol: string;
  address: string;
  description?: string;
  creationTimestamp?: Timestamp;
  creationBlock?: number;
  imageUrl?: string;
  marketCap?: number;
  currentPrice?: number;
  creator?: string;
  transactionHash: string;
}

import tokenFactoryMetadata from "@/contracts/token-factory/artifacts/TokenFactory_metadata.json";
import tokenMetadata from "@/contracts/token-factory/artifacts/Token_metadata.json";
export const FACTORY_ADDRESS = "0x7713A39875A5335dc4Fc4f9359908afb55984b1F";
export const FACTORY_ABI = tokenFactoryMetadata.output.abi;
export const TOKEN_ADDRESS = "0x7713A39875A5335dc4Fc4f9359908afb55984b1F";
export const TOKEN_ABI = tokenMetadata.output.abi;
