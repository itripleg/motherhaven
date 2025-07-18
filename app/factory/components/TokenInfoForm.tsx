// app/factory/components/TokenInfoForm.tsx
"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isAddress } from "viem";
import { useBalance, useAccount } from "wagmi";
import { PurchaseOptionsSection } from "./PurchaseOptionsSection";

interface PurchaseOption {
  enabled: boolean;
  amount: string;
  minTokensOut: string;
}

interface TokenInfo {
  name: string;
  ticker: string;
  description?: string;
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
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  return (
    <div className="space-y-6">
      {/* Token Name */}
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
          className="mt-2"
        />
      </div>

      {/* Token Symbol */}
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
          className="mt-2"
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-foreground">
          Description (Optional)
        </Label>
        <Textarea
          id="description"
          name="description"
          value={tokenInfo.description || ""}
          onChange={handleChange}
          placeholder="Describe your token..."
          maxLength={280}
          className="mt-2 min-h-[100px]"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {(tokenInfo.description || "").length}/280
        </div>
      </div>

      {/* Burn Manager */}
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
          className={`mt-2 ${
            burnManagerError
              ? "border-destructive focus:border-destructive"
              : ""
          }`}
        />
        {burnManagerError && (
          <p className="text-sm text-destructive mt-1">{burnManagerError}</p>
        )}
      </div>

      {/* Purchase Options */}
      <PurchaseOptionsSection
        purchaseOption={tokenInfo.purchase}
        onPurchaseChange={handlePurchaseChange}
        userBalance={balanceData?.formatted || "0"}
      />
    </div>
  );
}
