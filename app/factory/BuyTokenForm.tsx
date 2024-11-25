"use client";
import { useState } from "react";
import { useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import tk_metadata from "@/contracts/token-factory/Token_metadata.json";
// import tf_metadata from "@/contracts/token-factory/TokenFactory_metadata.json";
import streamlineABI from "@/contracts/token-factory/StreamlineABI.json";

import { config } from "@/wagmi-config";

export function BuyTokenForm() {
  const tokenABI = tk_metadata.output.abi;
  const tokenFactoryABI = streamlineABI;
  const isLoading = false;

  const FACTORY_ADDRESS = "0x5CefB1c5efc02aba182242D593554AAEf30f2631";
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const { writeContract } = useWriteContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Token Address: ", tokenAddress);
    console.log("Amount in AVAX: ", amount);

    try {
      const result = await writeContract({
        abi: tokenFactoryABI,
        address: FACTORY_ADDRESS,
        functionName: "buy",
        args: [tokenAddress],
        value: parseEther(amount || "1"),
      });
      toast({
        title: "Token Purchase Initiated",
        description: `Transaction hash: ${result}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to purchase tokens. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="tokenAddress">Token Address</Label>
          <Input
            id="tokenAddress"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="amount">Amount (ETH)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
          />
        </div>
      </div>
      <Button type="submit" className="mt-4">
        Buy Tokens
      </Button>
    </form>
  );
}
