"use client";
import { useState } from "react";
import { useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import tf_metadata from "@/contracts/token-factory/TokenFactory_metadata.json";

const tokenFactoryABI = tf_metadata.output.abi;

// const FACTORY_ADDRESS = "0x59A612625c2c7cad58159c4F5f136adc213d9537";
const FACTORY_ADDRESS = "0xb5cf4a81DCDB1e2e1df566DAEC536CE090960De3";

export function CreateTokenForm() {
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const { toast } = useToast();

  const { writeContract, isPending, isSuccess, isError, error } =
    useWriteContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Trigger the write contract function
      writeContract(
        {
          abi: tokenFactoryABI,
          address: FACTORY_ADDRESS,
          functionName: "createToken",
          args: [name, ticker],
        },
        {
          onSuccess(data) {
            // Assuming data is the transaction hash
            toast({
              title: "Token Creation Initiated",
              description: `Transaction hash: ${data}`,
            });
          },
          onError(err) {
            console.error("Failed to create token:", err);
            toast({
              title: "Error",
              description: "Failed to create token. Please try again.",
              variant: "destructive",
            });
          },
        }
      );
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Token Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Awesome Token"
            required
          />
        </div>
        <div>
          <Label htmlFor="ticker">Token Ticker</Label>
          <Input
            id="ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="MAT"
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create Token"}
      </Button>
      {isSuccess && (
        <p className="text-green-600">Token created successfully!</p>
      )}
      {isError && (
        <p className="text-red-600">
          Error: {error?.message || "Failed to create token"}
        </p>
      )}
    </form>
  );
}
