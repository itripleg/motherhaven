// utils/tokenAddressExtractor.ts - Utility to extract token address from transaction receipt

import { decodeEventLog, type TransactionReceipt } from "viem";
import { FACTORY_ABI } from "@/types";

/**
 * Extracts the token address from a TokenCreated event in a transaction receipt
 */
export function extractTokenAddressFromReceipt(
  receipt: TransactionReceipt
): string | null {
  try {
    // Look for TokenCreated event logs
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: FACTORY_ABI,
          data: log.data,
          topics: log.topics,
        });

        // Check if this is a TokenCreated event
        if (decoded.eventName === "TokenCreated") {
          const args = decoded.args as any;
          return args.tokenAddress as string;
        }
      } catch (error) {
        // This log doesn't match our ABI, continue to next log
        continue;
      }
    }

    console.warn("TokenCreated event not found in transaction receipt");
    return null;
  } catch (error) {
    console.error("Error extracting token address from receipt:", error);
    return null;
  }
}

/**
 * Alternative method: extract from contract creation if the token contract was created directly
 */
export function extractTokenAddressFromContractCreation(
  receipt: TransactionReceipt
): string | null {
  // If a contract was created in this transaction, it might be the token
  if (receipt.contractAddress) {
    return receipt.contractAddress;
  }
  return null;
}

/**
 * Comprehensive token address extraction with fallback methods
 */
export function getTokenAddressFromReceipt(
  receipt: TransactionReceipt
): string | null {
  // Method 1: Try to find TokenCreated event (most reliable)
  const addressFromEvent = extractTokenAddressFromReceipt(receipt);
  if (addressFromEvent) {
    return addressFromEvent;
  }

  // Method 2: Check if this was a contract creation transaction
  const addressFromCreation = extractTokenAddressFromContractCreation(receipt);
  if (addressFromCreation) {
    return addressFromCreation;
  }

  console.error("Could not extract token address from transaction receipt");
  return null;
}

/**
 * Type guard to check if a receipt is valid for token extraction
 */
export function isValidTokenCreationReceipt(
  receipt: TransactionReceipt | undefined
): receipt is TransactionReceipt {
  return !!(
    receipt &&
    receipt.logs &&
    receipt.logs.length > 0 &&
    receipt.status === "success"
  );
}
