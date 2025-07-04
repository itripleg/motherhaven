// app/dex/components/CreateTokenForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { EventWatcher } from "@/components/EventWatcher";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types";
import { zeroAddress, parseEther } from "viem";

type TokenDetails = {
  name: string;
  symbol: string;
  imageUrl: string;
  burnManager: string;
  minTokensOut: string;
  address?: string;
  blockNumber?: number;
  timestamp?: string;
  transactionHash?: string;
  creator?: string;
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
  const [tokenDetails, setTokenDetails] = useState<TokenDetails>({
    name: "",
    symbol: "",
    imageUrl: "",
    burnManager: "",
    minTokensOut: "0",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const symbol = formData.get("symbol") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const burnManager = formData.get("burnManager") as string;
    const minTokensOut = formData.get("minTokensOut") as string;

    if (!name || !symbol) {
      toast({
        title: "Error",
        description: "Name and symbol are required.",
        variant: "destructive",
      });
      return;
    }

    // Set initial token details
    setTokenDetails({
      name,
      symbol,
      imageUrl: imageUrl || "",
      burnManager: burnManager || zeroAddress,
      minTokensOut: minTokensOut || "0",
    });

    try {
      writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "createToken",
        args: [
          name,
          symbol,
          imageUrl || "",
          (burnManager || zeroAddress) as `0x${string}`,
          parseEther(minTokensOut || "0"),
        ],
      });
    } catch (error) {
      console.error("Error creating token:", error);
      toast({
        title: "Error",
        description: "Failed to create token. Please try again.",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    console.log("[CreateTokenForm] Mounted");
    return () => console.log("[CreateTokenForm] Unmounted");
  }, []);

  useEffect(() => {
    if (receipt && tokenDetails.name && !tokenDetails.address) {
      // Look for TokenCreated event in the logs
      const tokenCreatedEvent = receipt.logs?.find((log: any) => {
        // Check if this is a TokenCreated event by looking for the right topic signature
        return (
          log.topics && log.topics[0] === "0x..." // You'll need the actual event signature here
        );
      });

      if (!tokenCreatedEvent) {
        toast({
          title: "Error",
          description: "Failed to retrieve token address from transaction.",
          variant: "destructive",
        });
        return;
      }

      // For now, we'll get the token address from the event data
      // You may need to decode this properly based on your event structure
      const address = tokenCreatedEvent.address;
      const blockNumber = Number(receipt.blockNumber);
      const transactionHash = receipt.transactionHash;
      const creator = receipt.from;
      const timestamp = new Date().toISOString();

      // Update state with token details including creator
      setTokenDetails((prev) => ({
        ...prev!,
        address,
        blockNumber,
        timestamp,
        transactionHash,
        creator,
      }));

      // Save to Firestore with creator
      const tokenDocRef = doc(db, "tokens", address);
      setDoc(tokenDocRef, {
        name: tokenDetails.name,
        symbol: tokenDetails.symbol,
        imageUrl: tokenDetails.imageUrl,
        burnManager: tokenDetails.burnManager,
        address,
        blockNumber,
        timestamp,
        transactionHash,
        creator,
        createdAt: new Date().toISOString(),
        // Add initial state
        currentState: 1, // TRADING state
        state: 1,
        fundingGoal: "25", // Default funding goal
        collateral: "0",
        virtualSupply: "0",
        lastPrice: "0.00001", // Initial price
        statistics: {
          currentPrice: "0.00001",
          volumeETH: "0",
          tradeCount: 0,
          uniqueHolders: 0,
        },
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
  }, [receipt, toast, tokenDetails]);

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
          <Label htmlFor="symbol">Token Symbol</Label>
          <Input id="symbol" name="symbol" placeholder="MAT" required />
        </div>
        <div>
          <Label htmlFor="imageUrl">Image URL (Optional)</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            placeholder="https://example.com/image.jpg or IPFS hash"
          />
        </div>
        <div>
          <Label htmlFor="burnManager">Burn Manager Address (Optional)</Label>
          <Input
            id="burnManager"
            name="burnManager"
            placeholder="0x... (leave empty for none)"
          />
        </div>
        <div>
          <Label htmlFor="minTokensOut">
            Minimum Tokens Out (if sending ETH)
          </Label>
          <Input
            id="minTokensOut"
            name="minTokensOut"
            type="number"
            step="0.000001"
            placeholder="0"
            defaultValue="0"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create Token"}
      </Button>

      {hash && <div>Transaction Hash: {hash}</div>}
      {isConfirming && <div>Waiting for confirmation...</div>}

      {/* Display token details */}
      {tokenDetails?.address && (
        <div className="mt-4 space-y-2">
          <div>Token Name: {tokenDetails.name}</div>
          <div>Token Symbol: {tokenDetails.symbol}</div>
          <div>Token Address: {tokenDetails.address}</div>
          <div>Image URL: {tokenDetails.imageUrl || "None"}</div>
          <div>Burn Manager: {tokenDetails.burnManager}</div>
          <div>Block Number: {tokenDetails.blockNumber}</div>
          <div>Timestamp: {tokenDetails.timestamp}</div>
          <div>Transaction Hash: {tokenDetails.transactionHash}</div>
          <div>Creator: {tokenDetails.creator}</div>
        </div>
      )}
      {error && <div>Error: {error.message}</div>}
    </form>
  );
}
