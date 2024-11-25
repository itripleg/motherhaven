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
import streamlineABI from "@/contracts/token-factory/StreamlineABI.json";

export function BuyTokenForm() {
  const FACTORY_ADDRESS = "0x5CefB1c5efc02aba182242D593554AAEf30f2631";

  const pathname = usePathname();

  // Extract tokenAddress from the URL
  const tokenAddress = pathname.split("/").pop() || "";

  const [amount, setAmount] = useState("");
  const [receiptDetails, setReceiptDetails] = useState<{
    pricePaid?: string;
    tokensReceived?: string;
  }>({});

  const { toast } = useToast();

  // Manage contract interaction
  const {
    data: transactionData,
    error,
    isPending,
    writeContract,
  } = useWriteContract();

  // Manage transaction receipt
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
        abi: streamlineABI,
        address: FACTORY_ADDRESS,
        functionName: "buy",
        args: [tokenAddress],
        value: parseEther(amount || "1"),
      });
      toast({
        title: "Transaction Submitted",
        description: "Waiting for confirmation...",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to purchase tokens. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (receipt) {
      console.log("Transaction Receipt:", receipt); // Debugging
      const pricePaid = amount;

      const tokensReceivedLog = receipt.logs?.find(
        (log) =>
          log.topics[0] ===
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" // ERC-20 Transfer event
      );

      if (tokensReceivedLog) {
        const tokensReceived = BigInt(tokensReceivedLog.data).toString();
        console.log("Tokens Received:", tokensReceived); // Debugging
        setReceiptDetails({
          pricePaid,
          tokensReceived,
        });

        toast({
          title: "Purchase Confirmed",
          description: `You purchased ${tokensReceived} tokens for ${pricePaid} AVAX.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Unable to retrieve tokens received.",
          variant: "destructive",
        });
      }
    }
  }, [receipt, amount, toast]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid w-full items-center gap-4">
        <div className="max-w-2">{/* <Label>Token Details</Label> */}</div>
        <AddressComponent hash={tokenAddress} type="address" />
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="amount">Amount (ETH)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            className="text-right pr-2"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="mt-4"
        disabled={isPending || !tokenAddress}
      >
        {isPending ? "Processing..." : "Buy Tokens"}
      </Button>

      {/* Display transaction details */}
      {isConfirming && <div>Waiting for confirmation...</div>}
      {receiptDetails.tokensReceived && (
        <div className="mt-4">
          <p>Transaction Receipt:</p>
          <ul>
            <li>Price Paid: {receiptDetails.pricePaid} AVAX</li>
            <li>Tokens Received: {receiptDetails.tokensReceived}</li>
            <li>
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
