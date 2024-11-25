"use client";

import React, { useEffect, useState } from "react";
import { getTransactionReceipt } from "@wagmi/core";
import { config } from "@/wagmi-config";

type Props = {};

export default function Page({}: Props) {
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [initialSupply, setInitialSupply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceipt() {
      try {
        const receipt = await getTransactionReceipt(config, {
          hash: "0x0d5fdd714ba560a95160e188ee6f4515f3b607e662df16a970e16d6d31f6c457",
        });

        console.log("Transaction Receipt:", receipt);

        // Extract block number
        setBlockNumber(
          receipt?.blockNumber ? Number(receipt.blockNumber) : null
        );

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
      }
    }

    fetchReceipt();
  }, []);

  return (
    <div>
      {blockNumber !== null ? (
        <div>Block Number: {blockNumber}</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <div>Loading Block Number...</div>
      )}
      {tokenAddress !== null ? (
        <div>Token Address: {tokenAddress}</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <div>Loading Token Address...</div>
      )}
      {initialSupply !== null ? (
        <div>Initial Supply: {initialSupply}</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <div>Loading Initial Supply...</div>
      )}
    </div>
  );
}
