// app/factory/components/TokenInfoForm.tsx - SIMPLIFIED: Removed purchase options
"use client";

import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isAddress } from "viem";

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

  // Simple handlers without useCallback to avoid stale closure issues
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onTokenInfoChange({
      ...tokenInfo,
      name: value,
    });
  };

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    onTokenInfoChange({
      ...tokenInfo,
      ticker: value,
    });
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    console.log("Description input detected:", value);
    onTokenInfoChange({
      ...tokenInfo,
      description: value,
    });
  };

  const handleBurnManagerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

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

    onTokenInfoChange({ ...tokenInfo, burnManager: value as `0x${string}` });
  };

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
          onChange={handleNameChange}
          placeholder="FOXHOUND"
          maxLength={32}
          required
          className="mt-2 focus:border-primary focus:ring-primary focus:ring-2 focus:ring-offset-0"
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
          onChange={handleTickerChange}
          placeholder="FOX"
          maxLength={8}
          required
          className="mt-2 focus:border-primary focus:ring-primary focus:ring-2 focus:ring-offset-0"
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
          onChange={handleDescriptionChange}
          placeholder="Describe your token's purpose, features, or community..."
          maxLength={280}
          className="mt-2 min-h-[100px] focus:border-primary focus:ring-primary focus:ring-2 focus:ring-offset-0"
          autoComplete="off"
          spellCheck="true"
        />
        <div className="text-xs text-muted-foreground mt-1 flex justify-between">
          <span>{(tokenInfo.description || "").length}/280</span>
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
          onChange={handleBurnManagerChange}
          placeholder="0x... (leave empty for none)"
          className={`mt-2 focus:border-primary focus:ring-primary focus:ring-2 focus:ring-offset-0 ${
            burnManagerError
              ? "border-destructive focus:border-destructive focus:ring-destructive"
              : ""
          }`}
        />
        {burnManagerError && (
          <p className="text-sm text-destructive mt-1">{burnManagerError}</p>
        )}
        <div className="text-xs text-muted-foreground mt-1">
          Optional: Address that can burn tokens (creates deflationary
          mechanics)
        </div>
      </div>
    </div>
  );
}
