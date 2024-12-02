"use client";

import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { getTokenMetadata } from "@/utils/tokenUtils";
import { formatEther } from "viem";

export default function SimpleTestPage() {
  const publicClient = usePublicClient();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function test() {
      if (!publicClient) return;

      try {
        setLoading(true);
        const data = await getTokenMetadata(
          "0x5862c9c0b2b90053aae075b6cfa584d849243ddc",
          publicClient
        );
        setResult(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    test();
  }, [publicClient]);

  if (!publicClient) return <div className="p-4">Initializing wagmi...</div>;
  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!result) return <div className="p-4">No data found</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Token Metadata Test</h1>
      <div className="space-y-2">
        <div>
          <span className="font-bold">Name:</span> {result.name}
        </div>
        <div>
          <span className="font-bold">Symbol:</span> {result.symbol}
        </div>
        <div>
          <span className="font-bold">Image URL:</span> {result.imageUrl}
        </div>
        <div>
          <span className="font-bold">Funding Goal:</span>{" "}
          {formatEther(BigInt(result.fundingGoal))} AVAX
        </div>
        <div>
          <span className="font-bold">Created At:</span>{" "}
          {new Date(Number(result.createdAt) * 1000).toLocaleString()}
        </div>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">Raw Data:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
