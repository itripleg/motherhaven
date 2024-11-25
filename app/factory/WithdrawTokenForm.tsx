"use client";
import { useState } from "react";
import { useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
// import tk_metadata from "@/contracts/token-factory/Token_metadata.json";
// import tf_metadata from "@/contracts/token-factory/TokenFactory_metadata.json";
import { config } from "@/wagmi-config";
import tokenABI from "@/contracts/token-factory/Token_abi.json";
import tokenFactoryABI from "@/contracts/token-factory/TokenFactory_abi.json";

export function WithdrawTokenForm() {
  const isLoading = false;

  const FACTORY_ADDRESS = "0x7713A39875A5335dc4Fc4f9359908afb55984b1F";
  const [tokenAddress, setTokenAddress] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const { toast } = useToast();

  const { writeContract } = useWriteContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await writeContract({
        abi: tokenFactoryABI,
        address: "0xYourTokenFactoryAddress",
        functionName: "withdraw",
        args: [tokenAddress, withdrawAddress],
      });
      toast({
        title: "Withdrawal Initiated",
        description: `Transaction hash: ${result}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to withdraw tokens. Please try again.",
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
          <Label htmlFor="withdrawAddress">Withdraw To</Label>
          <Input
            id="withdrawAddress"
            value={withdrawAddress}
            onChange={(e) => setWithdrawAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
      </div>
      <Button type="submit" className="mt-4">
        Withdraw Tokens
      </Button>
    </form>
  );
}
