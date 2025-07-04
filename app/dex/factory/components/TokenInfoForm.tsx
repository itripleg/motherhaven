// app/dex/factory/TokenInfoForm.tsx
"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAddress } from "viem";
import { useBalance, useAccount } from "wagmi";
import { SimpleImageUpload } from "./SimpleImageUpload";
import { PurchaseOptionsSection } from "./PurchaseOptionsSection";

interface PurchaseOption {
  enabled: boolean;
  amount: string;
  minTokensOut: string;
}

interface TokenInfo {
  name: string;
  ticker: string;
  image: File | null;
  burnManager?: `0x${string}`;
  purchase: PurchaseOption;
}

interface TokenInfoFormProps {
  tokenInfo: TokenInfo;
  onTokenInfoChange: (tokenInfo: TokenInfo) => void;
}

export function TokenInfoForm({
  tokenInfo,
  onTokenInfoChange,
}: TokenInfoFormProps) {
  const [burnManagerError, setBurnManagerError] = useState<string>("");

  // Wagmi hooks for balance
  const { address } = useAccount();
  const { data: balanceData } = useBalance({ address });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      if (name === "burnManager") {
        if (!value) {
          setBurnManagerError("");
          onTokenInfoChange({ ...tokenInfo, burnManager: undefined });
          return;
        }

        if (!value.startsWith("0x")) {
          setBurnManagerError("Address must start with 0x");
        } else if (!isAddress(value)) {
          setBurnManagerError("Invalid address");
        } else {
          setBurnManagerError("");
        }
      }

      onTokenInfoChange({ ...tokenInfo, [name]: value });
    },
    [tokenInfo, onTokenInfoChange]
  );

  const handlePurchaseChange = useCallback(
    (purchase: PurchaseOption) => {
      onTokenInfoChange({ ...tokenInfo, purchase });
    },
    [tokenInfo, onTokenInfoChange]
  );

  const handleImageChange = useCallback(
    (image: File | null) => {
      onTokenInfoChange({ ...tokenInfo, image });
    },
    [tokenInfo, onTokenInfoChange]
  );

  return (
    <div className="space-y-6">
      {/* Basic Token Info */}
      <div className="grid w-full items-center gap-4">
        <div>
          <Label htmlFor="name" className="text-foreground">
            Token Name *
          </Label>
          <Input
            id="name"
            name="name"
            value={tokenInfo.name}
            onChange={handleChange}
            placeholder="My Awesome Token"
            maxLength={32}
            required
            className="bg-background/80 border-border/50"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Max 32 characters
          </div>
        </div>

        <div>
          <Label htmlFor="ticker" className="text-foreground">
            Symbol *
          </Label>
          <Input
            id="ticker"
            name="ticker"
            value={tokenInfo.ticker}
            onChange={handleChange}
            placeholder="MAT"
            maxLength={8}
            style={{ textTransform: "uppercase" }}
            required
            className="bg-background/80 border-border/50"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Max 8 characters
          </div>
        </div>

        <div>
          <Label htmlFor="burnManager" className="text-foreground">
            Burn Manager (Optional)
          </Label>
          <Input
            id="burnManager"
            name="burnManager"
            value={tokenInfo.burnManager || ""}
            onChange={handleChange}
            placeholder="0x... (leave empty for none)"
            className={`bg-background/80 border-border/50 ${
              burnManagerError ? "border-red-500" : ""
            }`}
          />
          {burnManagerError && (
            <p className="text-sm text-red-400 mt-1">{burnManagerError}</p>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            Address with burn privileges
          </div>
        </div>
      </div>

      {/* Image Upload Component */}
      <SimpleImageUpload
        imageFile={tokenInfo.image}
        onImageChange={handleImageChange}
        tokenName={tokenInfo.name || "Your Token"}
        tokenSymbol={tokenInfo.ticker || "TOKEN"}
      />

      {/* Purchase Options Component */}
      <PurchaseOptionsSection
        purchaseOption={tokenInfo.purchase}
        onPurchaseChange={handlePurchaseChange}
        userBalance={balanceData?.formatted || "0"}
      />
    </div>
  );
}
