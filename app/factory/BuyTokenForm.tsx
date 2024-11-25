"use client";
import { useState } from "react";
import { useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import tk_metadata from "@/contracts/token-factory/Token_metadata.json";
import tf_metadata from "@/contracts/token-factory/TokenFactory_metadata.json";
import { config } from "@/wagmi-config";

export function BuyTokenForm() {
  const tokenABI = tk_metadata.output.abi;
  const tokenFactoryABI = tf_metadata.output.abi;
  const isLoading = false;

  // const FACTORY_ADDRESS = "0x59A612625c2c7cad58159c4F5f136adc213d9537";
  // const FACTORY_ADDRESS = "0xb5cf4a81DCDB1e2e1df566DAEC536CE090960De3";
  const FACTORY_ADDRESS = "0x1AAF6086ecD61E2dAc4EA3Af1e512e5AA75f463c";
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const { writeContract } = useWriteContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await writeContract({
        abi: tokenFactoryABI,
        address: "0xYourTokenFactoryAddress",
        functionName: "buy",
        args: [tokenAddress, parseEther(amount || "0")],
        value: parseEther(amount || "0"),
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
