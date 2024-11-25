"use client";
import * as React from "react";
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

export function CreateTokenForm() {
  const { toast } = useToast();

  const {
    data: transactionHash,
    isPending,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: transactionHash,
    });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const ticker = formData.get("ticker") as string;

    writeContract({
      address: FACTORY_ADDRESS,
      abi: tokenFactoryABI,
      functionName: "createToken",
      args: [name, ticker],
      async onSuccess(data) {
        toast({
          title: "Transaction Submitted",
          description: `Transaction hash: ${data}`,
        });

        // Wait for confirmation and extract token address from event
        const receipt = await data.wait();
        const tokenCreatedEvent = receipt.events?.find(
          (event) => event.event === "TokenCreated"
        );

        if (!tokenCreatedEvent) {
          toast({
            title: "Error",
            description: "Failed to retrieve token address.",
            variant: "destructive",
          });
          return;
        }

        const tokenAddress = tokenCreatedEvent.args?.[0]; // Extract token address
        const transaction = data.from; // Creator address from the transaction

        toast({
          title: "Token Created",
          description: `Token Address: ${tokenAddress}`,
        });

        // Save token details to Firestore
        const tokenDocRef = doc(db, "tokens", tokenAddress);
        await setDoc(tokenDocRef, {
          name,
          ticker,
          logo: "", // Placeholder for logo
          creator: transaction, // Save the creator's address
          transactionHash: transactionHash, // Save the transaction hash
          createdAt: new Date().toISOString(),
        });
      },
      onError(err) {
        console.error("Error:", err);
        toast({
          title: "Error",
          description: "Failed to create token.",
          variant: "destructive",
        });
      },
    });
  }

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
          <Label htmlFor="ticker">Token Ticker</Label>
          <Input id="ticker" name="ticker" placeholder="MAT" required />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Confirming..." : "Create Token"}
      </Button>
      {transactionHash && <div>Transaction Hash: {transactionHash}</div>}
      {isConfirming && <div>Waiting for confirmation...</div>}
      {isConfirmed && <div>Transaction confirmed.</div>}
    </form>
  );
}
