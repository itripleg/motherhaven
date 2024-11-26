"use client";

import React, { useState } from "react";
import { getTransactionReceipt } from "@wagmi/core";
import { config } from "@/wagmi-config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export default function Page() {
  const [txHash, setTxHash] = useState<any>();
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [initialSupply, setInitialSupply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();

  async function fetchReceipt() {
    setIsLoading(true);
    setError(null);
    setBlockNumber(null);
    setTokenAddress(null);
    setInitialSupply(null);

    try {
      const receipt = await getTransactionReceipt(config, {
        hash: txHash,
      });

      console.log("Transaction Receipt:", receipt);

      // Extract block number
      setBlockNumber(receipt?.blockNumber ? Number(receipt.blockNumber) : null);

      // Extract token address from logs[0].address
      const address = receipt?.logs?.[0]?.address;
      if (address) {
        setTokenAddress(address);
      }

      // Extract initial supply from logs[1].data (hexadecimal to decimal)
      const supplyHex = receipt?.logs?.[1]?.data;
      if (supplyHex) {
        const supplyDecimal = BigInt(supplyHex).toString(); // Convert hex to bigint, then to string
        setInitialSupply(supplyDecimal);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Transaction Explorer</CardTitle>
          <CardDescription>
            Enter a transaction hash to view details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Input
              placeholder="Enter transaction hash"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
            />
            <Button onClick={fetchReceipt} disabled={isLoading}>
              {isLoading ? "Loading..." : "Fetch"}
            </Button>
          </div>
          {error && <div className="text-red-500 mb-2">Error: {error}</div>}
          {blockNumber !== null && (
            <div className="mb-2">Block Number: {blockNumber}</div>
          )}
          {tokenAddress !== null && (
            <div className="mb-2">Token Address: {tokenAddress}</div>
          )}
          {initialSupply !== null && (
            <div className="mb-2">Initial Supply: {initialSupply}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
