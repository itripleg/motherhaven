// app/factory/components/PurchaseOptionsSection.tsx
"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ShoppingCart } from "lucide-react";
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
  const handleAmountChange = (value: string) => {
    onPurchaseChange({
      ...purchaseOption,
      amount: value,
    });
  };

  const setMaxAmount = () => {
    const maxAllowed = parseFloat(FACTORY_CONSTANTS.MAX_PURCHASE);
    const available = parseFloat(userBalance);
    const amount = Math.min(maxAllowed, available * 0.95).toFixed(6);
    handleAmountChange(amount);
  };

  // Check if purchase is valid (either disabled or has amount > 0)
  const isPurchaseValid =
    !purchaseOption.enabled ||
    (purchaseOption.enabled && parseFloat(purchaseOption.amount || "0") > 0);

  return (
    <Card
      className={`border-primary/20 ${
        !isPurchaseValid ? "border-red-400/40 bg-red-500/5" : ""
      }`}
    >
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
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="purchaseAmount" className="text-foreground">
                  Amount (AVAX) *
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
                    className="h-6 px-2 text-primary hover:text-primary/80"
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
                className={`text-center ${
                  purchaseOption.enabled &&
                  parseFloat(purchaseOption.amount || "0") === 0
                    ? "border-red-400 focus:border-red-400"
                    : ""
                }`}
                required={purchaseOption.enabled}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Min: {FACTORY_CONSTANTS.MIN_PURCHASE} AVAX</span>
                <span>Max: {FACTORY_CONSTANTS.MAX_PURCHASE} AVAX</span>
              </div>

              {purchaseOption.enabled &&
                parseFloat(purchaseOption.amount || "0") === 0 && (
                  <p className="text-sm text-red-400 mt-1">
                    Enter an amount or disable initial purchase to continue
                  </p>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
