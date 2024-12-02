"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";
import { AddressComponent } from "@/components/AddressComponent";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types";

export function SellTokenForm() {
  const pathname = usePathname();
  const tokenAddress = pathname.split("/").pop() || "";

  const [amount, setAmount] = useState("");
  const [receiptDetails, setReceiptDetails] = useState<{
    avaxReceived?: string;
    tokensSold?: string;
  }>({});

  const { toast } = useToast();

  const {
    data: transactionData,
    error,
    isPending,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, data: receipt } =
    useWaitForTransactionReceipt({
      hash: transactionData,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenAddress) {
      toast({
        title: "Error",
        description: "Token address is not available.",
        variant: "destructive",
      });
      return;
    }

    try {
      writeContract({
        abi: FACTORY_ABI,
        address: FACTORY_ADDRESS,
        functionName: "sell",
        args: [tokenAddress, parseEther(amount || "0")],
      });
      toast({
        title: "Transaction Submitted",
        description: "Waiting for confirmation...",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to sell tokens. Please try again.",
        variant: "destructive",
      });
    }
  };

  const [hasHandledReceipt, setHasHandledReceipt] = useState(false);
  useEffect(() => {
    if (receipt && !hasHandledReceipt) {
      const tokensSold = amount;
      const sellEvent = receipt.logs?.find(
        (log) =>
          log.topics[0] ===
          "0x697c42d55a5e1fed3f464ec6f38b32546a0bd368dc8068b065c67566d73f3290"
      );

      if (sellEvent) {
        const avaxReceived = BigInt(sellEvent.data).toString();
        const formattedAvax = (Number(avaxReceived) / 1e18).toFixed(4);

        setReceiptDetails({
          avaxReceived: formattedAvax,
          tokensSold,
        });

        toast({
          title: "Sale Confirmed",
          description: `You sold ${tokensSold} tokens for ${formattedAvax} AVAX.`,
        });

        setHasHandledReceipt(true);
      }
    }
  }, [receipt, hasHandledReceipt, amount, toast]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="amount">Amount (Tokens)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onWheel={(e) => e.currentTarget.blur()}
            className="text-center pr-2 dark:bg-black/80"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="mt-4"
        disabled={isPending || !tokenAddress}
      >
        {isPending ? "Processing..." : "Sell Tokens"}
      </Button>

      {isConfirming && <div>Waiting for confirmation...</div>}
      {receiptDetails.tokensSold && (
        <div className="mt-4">
          <p>Transaction Receipt:</p>
          <ul>
            <li>Tokens Sold: {receiptDetails.tokensSold}</li>
            <li>AVAX Received: {receiptDetails.avaxReceived} AVAX</li>
            <li className="flex justify-center items-center">
              Transaction:{" "}
              <AddressComponent hash={`${transactionData}`} type="tx" />
            </li>
          </ul>
        </div>
      )}
      {error && (
        <div className="mt-4 text-red-600">
          Error: {error.message || "An error occurred"}
        </div>
      )}
    </form>
  );
}
