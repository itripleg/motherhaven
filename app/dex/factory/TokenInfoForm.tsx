// app/dex/factory/TokenInfoForm.tsx
"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  X,
  Upload,
  ShoppingCart,
  Info,
  Image as ImageIcon,
} from "lucide-react";
import { isAddress } from "viem";
import { useBalance, useAccount } from "wagmi";
import { FACTORY_CONSTANTS } from "@/types";

interface PurchaseOption {
  enabled: boolean;
  amount: string; // ETH amount
  minTokensOut: string; // Minimum tokens expected
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

// Purchase Options Component
const PurchaseOptionsSection: React.FC<{
  purchaseOption: PurchaseOption;
  onPurchaseChange: (purchase: PurchaseOption) => void;
  userBalance?: string;
}> = ({ purchaseOption, onPurchaseChange, userBalance = "0" }) => {
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
    <Card className="border-blue-200 bg-blue-50/30">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <div>
              <Label className="text-base font-semibold">
                Initial Purchase
              </Label>
              <p className="text-sm text-muted-foreground">
                Buy tokens immediately when creating
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
          <div className="space-y-4 pl-8 border-l-2 border-blue-200">
            {/* Purchase Amount */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label htmlFor="purchaseAmount">Amount (AVAX)</Label>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Balance: {parseFloat(userBalance).toFixed(4)} AVAX
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={setMaxAmount}
                    className="h-6 px-2"
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
                className="text-center"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Min: {FACTORY_CONSTANTS.MIN_PURCHASE} AVAX</span>
                <span>Max: {FACTORY_CONSTANTS.MAX_PURCHASE} AVAX</span>
              </div>
            </div>

            {/* Estimated tokens */}
            {purchaseOption.amount && parseFloat(purchaseOption.amount) > 0 && (
              <div className="p-3 bg-blue-100 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Estimated Tokens:</span>
                  <span className="text-sm font-bold">{estimatedTokens}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Based on initial price of {FACTORY_CONSTANTS.INITIAL_PRICE}{" "}
                  AVAX per token
                  <br />
                  (Final amount may vary due to slippage)
                </div>
              </div>
            )}

            {/* Minimum tokens out (slippage protection) */}
            <div>
              <Label htmlFor="minTokensOut">
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
                className="text-center"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Set to 0 to disable slippage protection (not recommended)
              </div>
            </div>

            {/* Auto-fill suggestion */}
            {estimatedTokens !== "0" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const estimated = parseFloat(estimatedTokens);
                  const withSlippage = estimated * 0.99; // 1% slippage tolerance
                  handleMinTokensChange(withSlippage.toFixed(6));
                }}
                className="w-full"
              >
                Set to {(parseFloat(estimatedTokens) * 0.99).toFixed(2)} (99% of
                estimated)
              </Button>
            )}

            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-700">
                <strong>Note:</strong> Your purchase will be included in the
                token creation transaction. This makes you the first trader and
                helps bootstrap initial liquidity.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Simple Image Upload Component
const SimpleImageUpload: React.FC<{
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
  tokenName?: string;
  tokenSymbol?: string;
}> = ({
  imageFile,
  onImageChange,
  tokenName = "Your Token",
  tokenSymbol = "TOKEN",
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simple validation
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        alert("File size must be less than 10MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      onImageChange(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-purple-600" />
            <div>
              <Label className="text-base font-semibold">Token Image</Label>
              <p className="text-sm text-muted-foreground">
                Optional image for your token (PNG, JPG, GIF up to 10MB)
              </p>
            </div>
          </div>
          {imageFile && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeImage}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload area or preview */}
        <div className="relative">
          {!previewUrl ? (
            <div
              onClick={handleUploadClick}
              className="w-full h-48 border-2 border-dashed border-purple-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-colors"
            >
              <Upload className="h-12 w-12 text-purple-400 mb-4" />
              <p className="text-purple-600 font-medium">
                Click to upload image
              </p>
              <p className="text-sm text-purple-500 mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Token Header Preview with Background Effect */}
              <div className="relative overflow-hidden min-h-[200px] rounded-lg border border-purple-200">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${previewUrl})`,
                      filter: "blur(1px)",
                      transform: "scale(1.1)",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xs text-gray-300">0x1234...5678</div>
                    <div className="px-2 py-1 bg-green-600/70 text-white text-xs rounded">
                      Trading
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-white text-3xl font-bold flex items-center gap-3">
                      {tokenName}
                      <span className="text-xl text-gray-300">
                        ({tokenSymbol})
                      </span>
                    </h1>
                    <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg max-w-xs border border-white/20">
                      <div className="text-gray-200 text-sm mb-1">
                        Current Price
                      </div>
                      <p className="text-white text-lg font-semibold">
                        0.001234 <span className="text-gray-300">AVAX</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* File info and change button */}
              <div className="flex items-center justify-between p-3 bg-purple-100 rounded-lg">
                <div className="text-sm">
                  <div className="font-medium text-purple-800">
                    {imageFile?.name}
                  </div>
                  <div className="text-purple-600">
                    {imageFile
                      ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`
                      : ""}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                >
                  Change Image
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Preview: Don&apos;t worry you can update this after creation.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

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
          <Label htmlFor="name">Token Name *</Label>
          <Input
            id="name"
            name="name"
            value={tokenInfo.name}
            onChange={handleChange}
            placeholder="Enter token name"
            maxLength={32}
            required
          />
          <div className="text-xs text-muted-foreground mt-1">
            Maximum 32 characters
          </div>
        </div>

        <div>
          <Label htmlFor="ticker">Token Symbol *</Label>
          <Input
            id="ticker"
            name="ticker"
            value={tokenInfo.ticker}
            onChange={handleChange}
            placeholder="Enter symbol (e.g., BTC)"
            maxLength={8}
            style={{ textTransform: "uppercase" }}
            required
          />
          <div className="text-xs text-muted-foreground mt-1">
            Maximum 8 characters, will be converted to uppercase
          </div>
        </div>

        <div>
          <Label htmlFor="burnManager">Burn Manager Address (Optional)</Label>
          <Input
            id="burnManager"
            name="burnManager"
            value={tokenInfo.burnManager || ""}
            onChange={handleChange}
            placeholder="0x... (leave empty for none)"
            className={burnManagerError ? "border-red-500" : ""}
          />
          {burnManagerError && (
            <p className="text-sm text-red-500 mt-1">{burnManagerError}</p>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            Optional address with special burn privileges
          </div>
        </div>
      </div>

      {/* Simple Image Upload */}
      <SimpleImageUpload
        imageFile={tokenInfo.image}
        onImageChange={handleImageChange}
        tokenName={tokenInfo.name || "Your Token"}
        tokenSymbol={tokenInfo.ticker || "TOKEN"}
      />

      {/* Purchase Options */}
      <PurchaseOptionsSection
        purchaseOption={tokenInfo.purchase}
        onPurchaseChange={handlePurchaseChange}
        userBalance={balanceData?.formatted || "0"}
      />
    </div>
  );
}
