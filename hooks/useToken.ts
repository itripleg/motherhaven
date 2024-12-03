export {};
// // useToken.ts
// import { useState, useEffect, useMemo } from "react";
// import { useReadContracts } from "wagmi";
// import { formatEther, parseEther } from "viem";
// import {
//   collection,
//   doc,
//   onSnapshot,
//   query,
//   where,
//   orderBy,
//   limit,
// } from "firebase/firestore";
// import { db } from "@/firebase";
// import {
//   TokenData,
//   TokenContractState,
//   TokenMetrics,
//   TokenState,
//   TokenTrade
// } from "@/types";
// import { tokenEventEmitter } from "@/components/EventWatcher";
// import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";

// const TRADE_LIMIT = 50;

// interface UseTokenOptions {
//   address?: string;
//   includeMetrics?: boolean;
//   includeTrades?: boolean;
//   tradeLimit?: number;
// }

// interface UseTokenReturn {
//   // Combined token data
//   tokenData: TokenData | null;

//   // Recent trades (optional)
//   recentTrades: TokenTrade[];

//   // Loading states
//   loading: {
//     contract: boolean;
//     firestore: boolean;
//     trades: boolean;
//   };

//   // Errors
//   error: {
//     contract?: string;
//     firestore?: string;
//     trades?: string;
//   };

//   // Manual refresh function
//   refresh: () => Promise<void>;
// }

// export function useToken({
//   address,
//   includeMetrics = true,
//   includeTrades = false,
//   tradeLimit = TRADE_LIMIT,
// }: UseTokenOptions): UseTokenReturn {
//   // State
//   const [tokenData, setTokenData] = useState<TokenData | null>(null);
//   const [recentTrades, setRecentTrades] = useState<TokenTrade[]>([]);
//   const [loading, setLoading] = useState({
//     contract: true,
//     firestore: true,
//     trades: includeTrades,
//   });
//   const [error, setError] = useState<Record<string, string>>({});

//   // Contract state via wagmi
//   const { data: contractData, refetch } = useReadContracts({
//     contracts: address ? [
//       {
//         address: FACTORY_ADDRESS,
//         abi: FACTORY_ABI,
//         functionName: "getCurrentPrice",
//         args: [address as `0x${string}`],
//       },
//       {
//         address: FACTORY_ADDRESS,
//         abi: FACTORY_ABI,
//         functionName: "collateral",
//         args: [address as `0x${string}`],
//       },
//       {
//         address: FACTORY_ADDRESS,
//         abi: FACTORY_ABI,
//         functionName: "getTokenState",
//         args: [address as `0x${string}`],
//       },
//     ] : [],
//   });

//   // Parse contract data
//   const contractState = useMemo((): TokenContractState | null => {
//     if (!contractData) return null;

//     const [priceData, collateralData, stateData] = contractData;

//     return {
//       currentPrice: formatEther(priceData?.result || 0n),
//       collateral: formatEther(collateralData?.result || 0n),
//       state: Number(stateData?.result || 0) as TokenState,
//       totalSupply: "0", // TODO: Add ERC20 totalSupply call
//     };
//   }, [contractData]);

//   // Firestore subscription for token data
//   useEffect(() => {
//     if (!address) return;

//     const unsubscribe = onSnapshot(
//       doc(db, "tokens", address),
//       (snapshot) => {
//         if (!snapshot.exists()) {
//           setError(prev => ({ ...prev, firestore: "Token not found" }));
//           setLoading(prev => ({ ...prev, firestore: false }));
//           return;
//         }

//         const data = snapshot.data();
//         const baseTokenData: Partial<TokenData> = {
//           id: snapshot.id,
//           address: data.address,
//           name: data.name,
//           symbol: data.symbol,
//           creator: data.creator,
//           description: data.description,
//           imageUrl: data.imageUrl,
//           initialPrice: data.initialPrice,
//           maxSupply: data.maxSupply,
//           priceRate: data.priceRate,
//           tradeCooldown: data.tradeCooldown,
//           maxWalletPercentage: data.maxWalletPercentage,
//           createdAt: data.createdAt,
//           creationBlock: data.creationBlock,
//           transactionHash: data.transactionHash,
//         };

//         if (includeMetrics) {
//           const metrics: TokenMetrics = {
//             volumeETH24h: data.metrics?.volumeETH24h || "0",
//             tradeCount24h: data.metrics?.tradeCount24h || 0,
//             priceChange24h: data.metrics?.priceChange24h || 0,
//             highPrice24h: data.metrics?.highPrice24h || "0",
//             lowPrice24h: data.metrics?.lowPrice24h || "0",
//             totalVolumeETH: data.metrics?.totalVolumeETH || "0",
//             totalTradeCount: data.metrics?.totalTradeCount || 0,
//             uniqueHolders: data.metrics?.uniqueHolders || 0,
//             marketCap: data.metrics?.marketCap || "0",
//             buyPressure24h: data.metrics?.buyPressure24h || 0,
//             lastTradeTimestamp: data.metrics?.lastTradeTimestamp || "",
//             timeToGoal: data.metrics?.timeToGoal,
//           };
//           baseTokenData.metrics = metrics;
//         }

//         if (contractState) {
//           baseTokenData.contractState = contractState;
//         }

//         setTokenData(baseTokenData as TokenData);
//         setLoading(prev => ({ ...prev, firestore: false }));
//       },
//       (err) => {
//         console.error("Error fetching token:", err);
//         setError(prev => ({ ...prev, firestore: "Failed to load token data" }));
//         setLoading(prev => ({ ...prev, firestore: false }));
//       }
//     );

//     return () => unsubscribe();
//   }, [address, includeMetrics, contractState]);

//   // Trades subscription
//   useEffect(() => {
//     if (!address || !includeTrades) return;

//     const tradesQuery = query(
//       collection(db, "trades"),
//       where("token", "==", address),
//       orderBy("timestamp", "desc"),
//       limit(tradeLimit)
//     );

//     const unsubscribe = onSnapshot(
//       tradesQuery,
//       (snapshot) => {
//         const trades = snapshot.docs.map(doc => {
//           const data = doc.data();
//           return {
//             timestamp: data.timestamp,
//             type: data.type,
//             price: data.pricePerToken,
//             amount: data.tokenAmount,
//             ethAmount: data.ethAmount,
//             trader: data.trader,
//           };
//         });

//         setRecentTrades(trades);
//         setLoading(prev => ({ ...prev, trades: false }));
//       },
//       (err) => {
//         console.error("Error fetching trades:", err);
//         setError(prev => ({ ...prev, trades: "Failed to load trade data" }));
//         setLoading(prev => ({ ...prev, trades: false }));
//       }
//     );

//     return () => unsubscribe();
//   }, [address, includeTrades, tradeLimit]);

//   // Event listener for updates
//   useEffect(() => {
//     if (!address) return;

//     const handleTokenEvent = async (event: { eventName: string; data: any }) => {
//       if (["TokensPurchased", "TokensSold"].includes(event.eventName)) {
//         await refetch();
//       }
//     };

//     const eventKey = address.toLowerCase();
//     tokenEventEmitter.addEventListener(eventKey, handleTokenEvent);

//     return () => {
//       tokenEventEmitter.removeEventListener(eventKey, handleTokenEvent);
//     };
//   }, [address, refetch]);

//   // Refresh function
//   const refresh = async () => {
//     await refetch();
//   };

//   return {
//     tokenData,
//     recentTrades,
//     loading,
//     error,
//     refresh,
//   };
// }

// // Specialized hooks
// export function useTokenMetrics(address?: string) {
//   const { tokenData, loading, error } = useToken({
//     address,
//     includeMetrics: true,
//     includeTrades: false
//   });
//   return {
//     metrics: tokenData?.metrics || null,
//     loading: loading.firestore || loading.contract,
//     error: error.firestore || error.contract,
//   };
// }

// export function useTokenTrades(address?: string, limit?: number) {
//   return useToken({
//     address,
//     includeMetrics: false,
//     includeTrades: true,
//     tradeLimit: limit
//   });
// }

// export function useTokenBase(address?: string) {
//   return useToken({
//     address,
//     includeMetrics: false,
//     includeTrades: false
//   });
// }
