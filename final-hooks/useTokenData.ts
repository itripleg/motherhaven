// final-hooks/useTokenData.ts
import { useState, useEffect, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { Address } from "viem";
import { Token, TokenState } from "@/types";
import { useFactoryConfigContext } from "@/contexts/FactoryConfigProvider";
import { useFactoryContract } from "./useFactoryContract";

/**
 * Unified token data hook that combines Firestore metadata with real-time contract data
 * This replaces useToken, useTokenStats, and useTokenDetails
 */
export function useTokenData(tokenAddress?: Address) {
  const { config: factoryConfig } = useFactoryConfigContext();
  const { useTokenDetails } = useFactoryContract();

  // Get real-time contract data
  const {
    price,
    priceFormatted,
    collateral,
    collateralFormatted,
    state: contractState,
    isLoading: contractLoading,
    error: contractError,
    refetchAll,
  } = useTokenDetails(tokenAddress);

  // Firestore data state
  const [firestoreData, setFirestoreData] = useState<any>(null);
  const [firestoreLoading, setFirestoreLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Subscribe to Firestore document
  useEffect(() => {
    if (!tokenAddress) {
      setFirestoreLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "tokens", tokenAddress.toLowerCase()),
      (doc) => {
        if (doc.exists()) {
          setFirestoreData(doc.data());
          setFirestoreError(null);
        } else {
          setFirestoreData(null);
          setFirestoreError("Token not found");
        }
        setFirestoreLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setFirestoreError(error.message);
        setFirestoreLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tokenAddress]);

  // Combine and format all data
  const token = useMemo((): Token | null => {
    if (!tokenAddress || !factoryConfig || !firestoreData) {
      return null;
    }

    // Map contract state to our enum
    const mapTokenState = (state: number): TokenState => {
      switch (state) {
        case 0:
          return TokenState.NOT_CREATED;
        case 1:
          return TokenState.TRADING;
        case 2:
          return TokenState.GOAL_REACHED;
        case 3:
          return TokenState.HALTED;
        case 4:
          return TokenState.RESUMED;
        default:
          return TokenState.NOT_CREATED;
      }
    };

    return {
      // Basic info from Firestore
      address: tokenAddress,
      name: firestoreData.name || "Unknown Token",
      symbol: firestoreData.symbol || "UNKNOWN",
      imageUrl: firestoreData.imageUrl || "",
      description: firestoreData.description || "",
      creator: firestoreData.creator || "0x0",
      burnManager: firestoreData.burnManager || "0x0",

      // Contract state (real-time)
      state: mapTokenState(contractState),
      currentPrice: priceFormatted,
      collateral: collateralFormatted,

      // Factory constants
      ...factoryConfig,

      // Metadata
      createdAt: firestoreData.createdAt || new Date().toISOString(),
      blockNumber: firestoreData.blockNumber || 0,
      transactionHash: firestoreData.transactionHash || "",
      fundingGoal: firestoreData.fundingGoal || "0",

      // Contract data that should be fetched from contract (not stored values)
      virtualSupply: "0", // TODO: Add to contract reads if needed
      totalSupply: "0", // TODO: Add to contract reads if needed

      // Image positioning
      imagePosition: firestoreData.imagePosition || {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
      },
      lastUpdated: firestoreData.lastUpdated,
      updatedBy: firestoreData.updatedBy,
    };
  }, [
    tokenAddress,
    factoryConfig,
    firestoreData,
    contractState,
    priceFormatted,
    collateralFormatted,
  ]);

  // Statistics from Firestore (aggregated data)
  const statistics = useMemo(() => {
    if (!firestoreData?.statistics) {
      return {
        totalSupply: "0",
        currentPrice: priceFormatted,
        volumeETH: "0",
        tradeCount: 0,
        uniqueHolders: 0,
      };
    }

    return {
      ...firestoreData.statistics,
      currentPrice: priceFormatted, // Always use real-time price
    };
  }, [firestoreData?.statistics, priceFormatted]);

  const isLoading = firestoreLoading || contractLoading;
  const error = firestoreError || contractError?.message || null;

  return {
    // Main token data
    token,
    statistics,

    // Raw contract data
    rawPrice: price,
    rawCollateral: collateral,
    contractState,

    // Loading states
    isLoading,
    firestoreLoading,
    contractLoading,

    // Errors
    error,
    firestoreError,
    contractError,

    // Actions
    refetchContract: refetchAll,

    // Helper flags
    exists: !!token,
    hasFirestoreData: !!firestoreData,
    hasContractData: !!price,
  };
}

/**
 * Simplified hook for basic token info (lighter than full useTokenData)
 */
export function useTokenInfo(tokenAddress?: Address) {
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    symbol: string;
    imageUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenAddress) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "tokens", tokenAddress.toLowerCase()),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setTokenInfo({
            name: data.name || "Unknown",
            symbol: data.symbol || "UNKNOWN",
            imageUrl: data.imageUrl || "",
          });
        } else {
          setTokenInfo(null);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tokenAddress]);

  return {
    tokenInfo,
    loading,
  };
}
