// app/factory/components/PurchaseTab.tsx - New dedicated purchase tab
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PurchaseOptionsSection } from "./PurchaseOptionsSection";
import { Badge } from "@/components/ui/badge";
import { useBalance, useAccount } from "wagmi";
import {
  ShoppingCart,
  Info,
  TrendingUp,
  Zap,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface PurchaseOption {
  enabled: boolean;
  amount: string;
  minTokensOut: string;
}

interface PurchaseTabProps {
  purchaseOption: PurchaseOption;
  onPurchaseChange: (purchase: PurchaseOption) => void;
  tokenName: string;
  tokenSymbol: string;
}

export function PurchaseTab({
  purchaseOption,
  onPurchaseChange,
  tokenName,
  tokenSymbol,
}: PurchaseTabProps) {
  const { address } = useAccount();
  const { data: balanceData } = useBalance({ address });

  const isPurchaseValid =
    !purchaseOption.enabled ||
    (purchaseOption.enabled && parseFloat(purchaseOption.amount || "0") > 0);

  const getStatusBadge = () => {
    if (!isPurchaseValid) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-400/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Needs Attention
        </Badge>
      );
    }
    if (
      purchaseOption.enabled &&
      parseFloat(purchaseOption.amount || "0") > 0
    ) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ready to Purchase
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
        <CheckCircle className="h-3 w-3 mr-1" />
        Launch Only
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Main Purchase Section */}
      <PurchaseOptionsSection
        purchaseOption={purchaseOption}
        onPurchaseChange={onPurchaseChange}
        userBalance={balanceData?.formatted || "0"}
      />

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="unified-card border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Why Buy at Launch?
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Get the best possible price (initial rate)</li>
                  <li>• Support your token's initial liquidity</li>
                  <li>• Demonstrate confidence as the creator</li>
                  <li>• Help establish the opening market price</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="unified-card border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Purchase Benefits
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Instant token allocation</li>
                  <li>• No additional transaction fees</li>
                  <li>• Automatic price discovery</li>
                  <li>• Immediate trading capability</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Confirmation */}
      {purchaseOption.enabled &&
        parseFloat(purchaseOption.amount || "0") > 0 && (
          <Card className="unified-card border-green-400/30 bg-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-3">
                    Initial Purchase Configured
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-400/20">
                      <div className="text-lg font-bold text-green-400">
                        {purchaseOption.amount} AVAX
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Purchase Amount
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-400/20">
                      <div className="text-lg font-bold text-green-400">
                        At Launch
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Execution Time
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Your purchase will be executed automatically when the token
                    is created.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Disabled State Info */}
      {!purchaseOption.enabled && (
        <Card className="unified-card border-blue-400/30 bg-blue-500/5">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <CheckCircle className="h-5 w-5 text-blue-400" />
              <h4 className="font-semibold text-foreground">
                Launch Only Mode
              </h4>
            </div>
            <p className="text-muted-foreground mb-4">
              Your token will be created without an initial purchase. You can
              buy tokens after launch at the market price.
            </p>
            <div className="text-sm text-blue-400 bg-blue-500/10 p-3 rounded-lg border border-blue-400/20">
              This is perfectly fine! Many successful tokens launch this way.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
