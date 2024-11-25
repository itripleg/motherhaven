// /app/factory/[tokenAddress]/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TokenPriceChart from "../TokenPriceChart";
import { BuyTokenForm } from "../BuyTokenForm";
import { readContract } from "wagmi"; // Assumes you're using wagmi to interact with contracts
import streamlineABI from "@/contracts/token-factory/StreamlineABI.json";
import { db } from "@/firebase"; // Import Firestore from Firebase config
import { doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";

export default function TokenPage() {
  const router = useRouter();
  // const { tokenAddress } = router.query;
  const tokenAddress = "0x0000000000000000000000000000000000000000";

  const [tokenSupply, setTokenSupply] = useState(0);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenAddress) return;

    // Fetch Token Information
    async function fetchTokenData() {
      try {
        // Assuming we have some contract method to get total supply
        const tokenSupply = await readContract({
          address: tokenAddress as string,
          abi: streamlineABI, // Use your correct ABI
          functionName: "totalSupply",
        });

        // Fetching trades could be based on events or an API. For now, we'll mock it
        const tradesData = [
          // Example data, replace with real data fetching logic
          {
            supply: tokenSupply,
            price: 0.002,
            timestamp: new Date().toISOString(),
          },
          {
            supply: tokenSupply * 1.1,
            price: 0.0025,
            timestamp: new Date().toISOString(),
          },
        ];

        setTokenSupply(Number(tokenSupply));
        setTrades(tradesData);
      } catch (error) {
        console.error("Failed to fetch token data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTokenData();
  }, [tokenAddress]);

  if (loading) return <div>Loading token data...</div>;
  if (!tokenAddress) return <div>Token address not found</div>;

  return (
    <div className="container mx-auto p-4">
      <TokenPriceChart
        tokenSupply={tokenSupply}
        trades={trades}
        maxSupply={1_000_000_000}
        initialPrice={0.001}
        priceRate={100}
        initialMint={200_000_000}
      />
      <BuyTokenForm tokenAddress={tokenAddress as string} />
    </div>
  );
}
