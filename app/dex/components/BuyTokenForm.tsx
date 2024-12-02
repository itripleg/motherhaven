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

export function BuyTokenForm({ onAmountChange, maxAmount }: any) {
  const pathname = usePathname();
  const tokenAddress = pathname.split("/").pop() || "";

  const [amount, setAmount] = useState("");
  const [receiptDetails, setReceiptDetails] = useState<{
    pricePaid?: string;
    tokensReceived?: string;
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

  const [hasHandledReceipt, setHasHandledReceipt] = useState(false);

  useEffect(() => {
    if (receipt && !hasHandledReceipt) {
      const pricePaid = amount;
      const tokensReceivedLog = receipt.logs?.find(
        (log: any) =>
          log.topics[0] ===
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
      );

      if (tokensReceivedLog) {
        const tokensReceived = BigInt(tokensReceivedLog.data).toString();
        setReceiptDetails({
          pricePaid,
          tokensReceived,
        });

        toast({
          title: "Purchase Confirmed",
          description: `You purchased ${(Number(tokensReceived) / 1e18).toFixed(
            2
          )} tokens for ${pricePaid} AVAX.`,
        });

        setHasHandledReceipt(true);
      }
    }
  }, [receipt, hasHandledReceipt, amount, toast]);

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="amount">Amount (AVAX)</Label>
              <span
                className="text-sm text-muted-foreground cursor-pointer hover:text-primary"
                onClick={() => {
                  setAmount(maxAmount);
                  onAmountChange(maxAmount);
                }}
              >
                Max
              </span>
            </div>
            <Input
              id="amount"
              onScroll={(e) => e.stopPropagation()}
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                onAmountChange(e.target.value);
              }}
              onWheel={(e) => e.currentTarget.blur()}
              className="text-center pr-2 dark:bg-black/80"
            />
          </div>
        </div>
        <Button
          type="submit"
          className="mt-4 w-full"
          disabled={isPending || !tokenAddress}
        >
          {isPending ? "Processing..." : "Buy Tokens"}
        </Button>

        {isConfirming && (
          <div className="mt-2 text-center">Waiting for confirmation...</div>
        )}
        {receiptDetails.tokensReceived && (
          <div className="mt-4">
            <p className="font-semibold">Transaction Receipt:</p>
            <ul className="mt-2 space-y-1">
              <li>Price Paid: {receiptDetails.pricePaid} AVAX</li>
              <li>
                Tokens Received:{" "}
                {(Number(receiptDetails.tokensReceived) / 1e18).toFixed(2)}
              </li>
              <li className="flex items-center">
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
    </>
  );
}
