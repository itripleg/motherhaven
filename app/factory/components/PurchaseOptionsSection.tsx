// app/dex/factory/components/PurchaseOptionsSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ShoppingCart, Info } from "lucide-react";
import { FACTORY_CONSTANTS } from "@/types";

interface PurchaseOption {
  enabled: boolean;
  amount: string;
  minTokensOut: string;
}

interface PurchaseOptionsSectionProps {
  purchaseOption: PurchaseOption;
  onPurchaseChange: (purchase: PurchaseOption) => void;
  userBalance?: string;
}

export const PurchaseOptionsSection: React.FC<PurchaseOptionsSectionProps> = ({
  purchaseOption,
  onPurchaseChange,
  userBalance = "0",
}) => {
  const [estimatedTokens, setEstimatedTokens] = useState("0");

  // Simple estimation based on initial price
  useEffect(() => {
    if (
      purchaseOption.enabled &&
      purchaseOption.amount &&
      parseFloat(purchaseOption.amount) > 0
    ) {
      try {
        const ethAmount = parseFloat(purchaseOption.amount);
        const initialPrice = parseFloat(FACTORY_CONSTANTS.INITIAL_PRICE);
        const tradingFee = FACTORY_CONSTANTS.TRADING_FEE / 10000; // Convert basis points to decimal

        // Simple calculation: (ethAmount * (1 - fee)) / initialPrice
        const afterFee = ethAmount * (1 - tradingFee);
        const tokens = afterFee / initialPrice;

        setEstimatedTokens(tokens.toFixed(2));
      } catch (error) {
        setEstimatedTokens("0");
      }
    } else {
      setEstimatedTokens("0");
    }
  }, [purchaseOption.amount, purchaseOption.enabled]);

  const handleAmountChange = (value: string) => {
    onPurchaseChange({
      ...purchaseOption,
      amount: value,
    });
  };

  const handleMinTokensChange = (value: string) => {
    onPurchaseChange({
      ...purchaseOption,
      minTokensOut: value,
    });
  };

  const setMaxAmount = () => {
    const maxAllowed = parseFloat(FACTORY_CONSTANTS.MAX_PURCHASE);
    const available = parseFloat(userBalance);
    const amount = Math.min(maxAllowed, available * 0.95).toFixed(6); // Leave some for gas
    handleAmountChange(amount);
  };

  return (
    <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <div>
              <Label className="text-base font-semibold text-foreground">
                Initial Purchase
              </Label>
              <p className="text-sm text-muted-foreground">
                Buy tokens when creating
              </p>
            </div>
          </div>
          <Switch
            checked={purchaseOption.enabled}
            onCheckedChange={(enabled) =>
              onPurchaseChange({ ...purchaseOption, enabled })
            }
          />
        </div>

        {purchaseOption.enabled && (
          <div className="space-y-4 pl-8 border-l-2 border-primary/20">
            {/* Purchase Amount */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="purchaseAmount" className="text-foreground">
                  Amount (AVAX)
                </Label>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Balance: {parseFloat(userBalance).toFixed(4)} AVAX
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={setMaxAmount}
                    className="h-6 px-2 text-primary hover:text-primary/80 hover:bg-primary/10"
                  >
                    Max
                  </Button>
                </div>
              </div>
              <Input
                id="purchaseAmount"
                type="number"
                value={purchaseOption.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.0"
                step="0.001"
                min={FACTORY_CONSTANTS.MIN_PURCHASE}
                max={FACTORY_CONSTANTS.MAX_PURCHASE}
                className="text-center bg-background border-border focus:border-primary focus:ring-primary focus:ring-1 focus:ring-offset-0 focus-visible:ring-primary focus-visible:border-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Min: {FACTORY_CONSTANTS.MIN_PURCHASE} AVAX</span>
                <span>Max: {FACTORY_CONSTANTS.MAX_PURCHASE} AVAX</span>
              </div>
            </div>

            {/* Estimated tokens */}
            {/* {purchaseOption.amount && parseFloat(purchaseOption.amount) > 0 && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    Estimated Tokens:
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {estimatedTokens}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Based on initial price of {FACTORY_CONSTANTS.INITIAL_PRICE}{" "}
                  AVAX per token
                  <br />
                </div>
              </div>
            )} */}

            {/* Minimum tokens out (slippage protection) */}
            {/* <div className="">
              <Label htmlFor="minTokensOut" className="text-foreground">
                Minimum Tokens Expected (Slippage Protection)
              </Label>
              <Input
                id="minTokensOut"
                type="number"
                value={purchaseOption.minTokensOut}
                onChange={(e) => handleMinTokensChange(e.target.value)}
                placeholder="0"
                step="0.001"
                min="0"
                className="text-center bg-background border-border focus:border-primary focus:ring-primary focus:ring-1 focus:ring-offset-0 focus-visible:ring-primary focus-visible:border-primary"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Set to 0 to disable slippage protection (not recommended)
              </div>
            </div> */}

            {/* Auto-fill suggestion */}
            {/* {estimatedTokens !== "0" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const estimated = parseFloat(estimatedTokens);
                  const withSlippage = estimated * 0.99; // 1% slippage tolerance
                  handleMinTokensChange(withSlippage.toFixed(6));
                }}
                className="w-full border-primary/20 hover:bg-primary/10 hover:border-primary/30 text-foreground"
              >
                Set to {(parseFloat(estimatedTokens) * 0.99).toFixed(2)} (99% of
                estimated)
              </Button>
            )} */}

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-secondary/50 border border-border rounded-lg">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <strong>Note:</strong> Your purchase will be included in the
                token creation transaction. This makes you the first buyer and
                prevents sniping.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
