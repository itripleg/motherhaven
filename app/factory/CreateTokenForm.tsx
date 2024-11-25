"use client";

import React, { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import tf_metadata from "@/contracts/token-factory/TokenFactory_metadata.json";

const tokenFactoryABI = tf_metadata.output.abi;
const FACTORY_ADDRESS = "0x5CefB1c5efc02aba182242D593554AAEf30f2631";

type TokenDetails = {
  name: string;
  symbol: string;
  address?: string;
  blockNumber?: number;
  timestamp?: string;
  transactionHash?: string;
};

export function CreateTokenForm() {
  const { toast } = useToast();

  // Manage writeContract interaction
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  // Manage transaction receipt
  const { isLoading: isConfirming, data: receipt } =
    useWaitForTransactionReceipt({
      hash: hash,
    });

  // Local state for token details
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const symbol = formData.get("symbol") as string;

    if (!name || !symbol) {
      toast({
        title: "Error",
        description: "Name and symbol are required.",
        variant: "destructive",
      });
      return;
    }

    // Set initial token details
    setTokenDetails({ name, symbol: symbol });

    writeContract({
      address: FACTORY_ADDRESS,
      abi: tokenFactoryABI,
      functionName: "createToken",
      args: [name, symbol],
    });
  }

  useEffect(() => {
    if (receipt && tokenDetails && !tokenDetails.address) {
      const tokenCreatedEvent = receipt.logs?.find((log: any) => log.address);

      if (!tokenCreatedEvent) {
        toast({
          title: "Error",
          description: "Failed to retrieve token address.",
          variant: "destructive",
        });
        return;
      }

      const address = tokenCreatedEvent.address;
      const blockNumber = Number(receipt.blockNumber);
      const transactionHash = receipt.transactionHash;

      // Fetch timestamp only once
      const timestamp = new Date().toISOString();

      // Update state with token details
      setTokenDetails((prev) => ({
        ...prev!,
        address,
        blockNumber,
        timestamp,
        transactionHash,
      }));

      // Save to Firestore
      const tokenDocRef = doc(db, "tokens", address);
      setDoc(tokenDocRef, {
        name: tokenDetails.name,
        symbol: tokenDetails.symbol,
        address,
        blockNumber,
        timestamp,
        transactionHash,
        createdAt: new Date().toISOString(),
      })
        .then(() => {
          toast({
            title: "Token Created",
            description: `Token Address: ${address}`,
          });
        })
        .catch((err) => {
          console.error("Firestore Error:", err);
          toast({
            title: "Error",
            description: "Failed to save token details.",
            variant: "destructive",
          });
        });
    }
  }, [receipt, toast]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Token Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="My Awesome Token"
            required
          />
        </div>
        <div>
          <Label htmlFor="symbol">Token Ticker</Label>
          <Input id="symbol" name="symbol" placeholder="MAT" required />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Confirming..." : "Create Token"}
      </Button>
      {hash && <div>Transaction Hash: {hash}</div>}
      {isConfirming && <div>Waiting for confirmation...</div>}

      {/* Display token details */}
      {tokenDetails?.address && (
        <div className="mt-4 space-y-2">
          <div>Token Name: {tokenDetails.name}</div>
          <div>Token Symbol: {tokenDetails.symbol}</div>
          <div>Token Address: {tokenDetails.address}</div>
          <div>Block Number: {tokenDetails.blockNumber}</div>
          <div>Timestamp: {tokenDetails.timestamp}</div>
          <div>Transaction Hash: {tokenDetails.transactionHash}</div>
        </div>
      )}
      {error && <div>Error: {error.message}</div>}
    </form>
  );
}
