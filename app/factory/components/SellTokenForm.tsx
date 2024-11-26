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
import tokenFactoryABI from "@/contracts/token-factory/TokenFactory_abi.json";
import { db } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";

export function SellTokenForm() {
  const FACTORY_ADDRESS = "0x7713A39875A5335dc4Fc4f9359908afb55984b1F";

  const pathname = usePathname();
  const tokenAddress = pathname.split("/").pop() || "";

  const [amount, setAmount] = useState("");
  const [receiptDetails, setReceiptDetails] = useState<{
    pricePaid?: string;
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
        abi: tokenFactoryABI,
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

  useEffect(() => {
    if (receipt) {
      const tokensSold = amount;

      const avaxReceivedLog = receipt.logs?.find(
        (log) =>
          log.topics[0] ===
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
      );

      if (avaxReceivedLog) {
        const avaxReceived = BigInt(avaxReceivedLog.data).toString();
        setReceiptDetails({
          pricePaid: (Number(avaxReceived) / 1e18).toFixed(4),
          tokensSold,
        });

        toast({
          title: "Sale Confirmed",
          description: `You sold ${tokensSold} tokens for ${(
            Number(avaxReceived) / 1e18
          ).toFixed(4)} AVAX.`,
        });

        // Save to Firestore
        const saveTradeToFirestore = async () => {
          const userId = "currentUserId"; // Replace with the logged-in user's ID
          const tradeId = `${transactionData}-${Date.now()}`; // Unique ID for trade
          const tradeData = {
            userId,
            tokenAddress,
            pricePaid: (Number(avaxReceived) / 1e18).toFixed(4),
            tokensSold,
            timestamp: new Date(),
            transactionHash: transactionData,
            type: "sell",
          };

          try {
            await setDoc(doc(db, "trades", tradeId), tradeData);
            console.log("Trade saved to Firestore:", tradeData);
          } catch (err) {
            console.error("Error saving trade to Firestore:", err);
          }
        };

        saveTradeToFirestore();
      } else {
        toast({
          title: "Error",
          description: "Unable to retrieve AVAX received.",
          variant: "destructive",
        });
      }
    }
  }, [receipt, amount, toast, tokenAddress, transactionData]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid w-full items-center gap-4">
        {/* <AddressComponent hash={tokenAddress} type="address" /> */}
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="amount">Amount (Tokens)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            className="text-center pr-2"
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
            <li>AVAX Received: {receiptDetails.pricePaid} AVAX</li>
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
