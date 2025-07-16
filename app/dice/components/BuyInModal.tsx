"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Wallet,
  CreditCard,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { DICE_ABI, DICE_CONTRACT_ADDRESS } from "../types";

// Contract ABI for buyIn function - now imported from types
const buyInABI = [
  {
    inputs: [],
    name: "buyIn",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

interface BuyInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BuyInModal({ isOpen, onClose }: BuyInModalProps) {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  const [buyAmount, setBuyAmount] = useState("0.01");
  const [step, setStep] = useState<"input" | "confirm" | "success">("input");

  // Get user's AVAX balance
  const { data: avaxBalance } = useBalance({
    address: address,
  });

  // Contract interaction
  const {
    writeContract,
    data: buyHash,
    error: buyError,
    isPending: isBuyPending,
  } = useWriteContract();

  const { isLoading: isBuyConfirming, data: buyReceipt } =
    useWaitForTransactionReceipt({
      hash: buyHash,
    });

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep("input");
      setBuyAmount("0.01");
    }
  }, [isOpen]);

  // Handle transaction success
  useEffect(() => {
    if (buyReceipt) {
      setStep("success");
      toast({
        title: "🎉 Purchase Successful!",
        description: `You bought ${buyAmount} DICE points!`,
        duration: 5000,
      });
    }
  }, [buyReceipt, buyAmount, toast]);

  // Handle transaction errors
  useEffect(() => {
    if (buyError) {
      console.error("Buy error:", buyError);
      toast({
        title: "Purchase Failed",
        description: "Failed to buy DICE points. Please try again.",
        variant: "destructive",
      });
    }
  }, [buyError, toast]);

  const handleBuyIn = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy DICE points.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(buyAmount);
    if (amount < 0.001) {
      toast({
        title: "Invalid Amount",
        description: "Minimum purchase is 0.001 AVAX.",
        variant: "destructive",
      });
      return;
    }

    if (avaxBalance && parseEther(buyAmount) > avaxBalance.value) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough AVAX for this purchase.",
        variant: "destructive",
      });
      return;
    }

    try {
      writeContract({
        address: DICE_CONTRACT_ADDRESS,
        abi: buyInABI,
        functionName: "buyIn",
        value: parseEther(buyAmount),
      });

      setStep("confirm");
    } catch (error) {
      console.error("Buy error:", error);
      toast({
        title: "Purchase Failed",
        description: "Failed to initiate purchase. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (step === "confirm" && (isBuyPending || isBuyConfirming)) {
      return; // Don't close while transaction is pending
    }
    setStep("input");
    onClose();
  };

  const setMaxAmount = () => {
    if (avaxBalance) {
      // Leave some AVAX for gas fees
      const maxAmount = Math.max(
        0,
        parseFloat(formatEther(avaxBalance.value)) - 0.005
      );
      setBuyAmount(maxAmount.toFixed(4));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Buy DICE Points
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Info Card */}
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground mb-1">
                        1:1 Exchange Rate
                      </p>
                      <p className="text-muted-foreground">
                        1 AVAX = 1 DICE Point. Minimum purchase: 0.001 AVAX
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Buy Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="buyAmount" className="text-base font-semibold">
                  Amount (AVAX)
                </Label>
                <div className="relative">
                  <Input
                    id="buyAmount"
                    type="number"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    step="0.001"
                    min="0.001"
                    className="text-center pr-16"
                    placeholder="0.01"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={setMaxAmount}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                  >
                    MAX
                  </Button>
                </div>

                {/* Balance Display */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Available:</span>
                  <span>
                    {avaxBalance
                      ? formatEther(avaxBalance.value).slice(0, 8)
                      : "0"}{" "}
                    AVAX
                  </span>
                </div>
              </div>

              {/* Preview */}
              <Card className="bg-secondary/30 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">
                      You'll receive:
                    </span>
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-lg">
                        {buyAmount} DICE Points
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      <span>{buyAmount} AVAX</span>
                      <ArrowRight className="h-4 w-4" />
                      <Coins className="h-4 w-4" />
                      <span>{buyAmount} DICE</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBuyIn}
                  className="flex-1 btn-primary"
                  disabled={!isConnected || parseFloat(buyAmount) < 0.001}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
              </div>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 text-center"
            >
              <div className="space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center"
                >
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </motion.div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isBuyPending
                      ? "Confirming Transaction..."
                      : "Processing Purchase..."}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {isBuyPending
                      ? "Please confirm the transaction in your wallet"
                      : "Your purchase is being processed on the blockchain"}
                  </p>
                </div>
              </div>

              {/* Transaction Details */}
              <Card className="bg-secondary/30 border-border/50">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">{buyAmount} AVAX</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        You'll receive:
                      </span>
                      <span className="font-medium">
                        {buyAmount} DICE Points
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="text-xs text-muted-foreground">
                This window will close automatically when the transaction is
                complete.
              </p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6 text-center"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </motion.div>

                <div>
                  <h3 className="text-xl font-bold text-green-500 mb-2">
                    Purchase Successful!
                  </h3>
                  <p className="text-muted-foreground">
                    You've successfully bought {buyAmount} DICE points!
                  </p>
                </div>
              </div>

              {/* Success Details */}
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchased:</span>
                      <span className="font-medium text-green-500">
                        {buyAmount} DICE Points
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="font-medium">{buyAmount} AVAX</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleClose} className="w-full btn-primary">
                Start Playing!
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
