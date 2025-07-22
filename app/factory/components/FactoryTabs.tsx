// app/factory/components/FactoryTabs.tsx - UPDATED: Added dedicated Purchase tab
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TokenInfoForm } from "./TokenInfoForm";
import { TokenomicsForm } from "./TokenomicsForm";
import { PurchaseTab } from "./PurchaseTab";
import { FactoryImageUploadWithEditor } from "./editor/FactoryImageUploadWithEditor";
import { MobileImageUpload } from "./MobileImageUpload";
import { TokenCreationInfo } from "@/types";
import { FactoryConfig } from "@/contexts/FactoryConfigProvider";
import { ImagePosition } from "./editor/types";
import {
  Wand2,
  Coins,
  Info,
  Settings,
  DollarSign,
  Eye,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Star,
  Smartphone,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface FactoryTabsProps {
  activeTab: string;
  tokenInfo: TokenCreationInfo & {
    imagePosition?: ImagePosition;
    description?: string;
  };
  onTokenInfoChange: (
    tokenInfo: TokenCreationInfo & {
      imagePosition?: ImagePosition;
      description?: string;
    }
  ) => void;
  tokenomics: {
    fundingGoal: number;
    maxSupply: number;
    initialPrice: number;
    maxWalletPercentage: number;
    tradingFee: number;
    minPurchase: number;
    maxPurchase: number;
    priceRate: string;
    bondingCurve: string;
    liquidityPool: string;
  };
  backgroundImage: string | null;
  factoryConfig: FactoryConfig | null;
  configLoading: boolean;
}

export function FactoryTabs({
  activeTab,
  tokenInfo,
  onTokenInfoChange,
  tokenomics,
  backgroundImage,
  factoryConfig,
  configLoading,
}: FactoryTabsProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate completion status for each tab
  const getTabStatus = (tabId: string) => {
    switch (tabId) {
      case "info":
        if (tokenInfo.name && tokenInfo.ticker) {
          return "complete";
        } else if (tokenInfo.name || tokenInfo.ticker) {
          return "partial";
        }
        return "empty";
      case "purchase":
        // Purchase is valid if disabled OR enabled with amount > 0
        const isPurchaseValid =
          !tokenInfo.purchase.enabled ||
          (tokenInfo.purchase.enabled &&
            parseFloat(tokenInfo.purchase.amount || "0") > 0);
        return isPurchaseValid ? "complete" : "partial";
      case "tokenomics":
        return "complete"; // Tokenomics are pre-configured
      case "preview":
        return "complete"; // Always accessible - users can customize anytime
      default:
        return "empty";
    }
  };

  // Individual handlers to prevent conflicts
  const handleImagePositionChange = useCallback(
    (position: ImagePosition) => {
      console.log(
        "FactoryTabs: handleImagePositionChange called with:",
        position
      );
      onTokenInfoChange({
        ...tokenInfo,
        imagePosition: position,
      });
    },
    [tokenInfo, onTokenInfoChange]
  );

  const handleDescriptionChange = useCallback(
    (description: string) => {
      console.log(
        "FactoryTabs: handleDescriptionChange called with:",
        description
      );
      onTokenInfoChange({
        ...tokenInfo,
        description,
      });
    },
    [tokenInfo, onTokenInfoChange]
  );

  const handleImageChange = useCallback(
    (file: File | null) => {
      console.log("FactoryTabs: handleImageChange called with:", file);
      onTokenInfoChange({
        ...tokenInfo,
        image: file,
        // Reset position when changing image to avoid conflicts
        imagePosition: file
          ? { x: 0, y: 0, scale: 1, rotation: 0, fit: "cover" as const }
          : tokenInfo.imagePosition,
      });
    },
    [tokenInfo, onTokenInfoChange]
  );

  const handleTokenInfoUpdateFromPreview = useCallback(
    (info: { name?: string; ticker?: string }) => {
      console.log(
        "FactoryTabs: handleTokenInfoUpdateFromPreview called with:",
        info
      );
      onTokenInfoChange({
        ...tokenInfo,
        ...(info.name !== undefined && { name: info.name }),
        ...(info.ticker !== undefined && { ticker: info.ticker }),
      });
    },
    [tokenInfo, onTokenInfoChange]
  );

  // Direct pass-through handler for token info form to prevent overwrites
  const handleTokenInfoFormChange = useCallback(
    (basicTokenInfo: TokenCreationInfo) => {
      console.log(
        "FactoryTabs: handleTokenInfoFormChange called with:",
        basicTokenInfo
      );

      // CRITICAL: Only update the fields that changed, preserve everything else
      const fieldsToUpdate: any = {};

      if (basicTokenInfo.name !== tokenInfo.name) {
        fieldsToUpdate.name = basicTokenInfo.name;
      }
      if (basicTokenInfo.ticker !== tokenInfo.ticker) {
        fieldsToUpdate.ticker = basicTokenInfo.ticker;
      }
      if (basicTokenInfo.description !== tokenInfo.description) {
        fieldsToUpdate.description = basicTokenInfo.description;
      }
      if (basicTokenInfo.burnManager !== tokenInfo.burnManager) {
        fieldsToUpdate.burnManager = basicTokenInfo.burnManager;
      }

      console.log("FactoryTabs: Only updating changed fields:", fieldsToUpdate);

      if (Object.keys(fieldsToUpdate).length > 0) {
        onTokenInfoChange({
          ...tokenInfo,
          ...fieldsToUpdate,
        });
      }
    },
    [tokenInfo, onTokenInfoChange]
  );

  // NEW: Purchase handler
  const handlePurchaseChange = useCallback(
    (purchase: any) => {
      console.log("FactoryTabs: handlePurchaseChange called with:", purchase);
      onTokenInfoChange({
        ...tokenInfo,
        purchase,
      });
    },
    [tokenInfo, onTokenInfoChange]
  );

  return (
    <TooltipProvider delayDuration={100}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Token Information Tab - Simplified, no purchase */}
          {activeTab === "info" && (
            <Card className="unified-card border-primary/20">
              <CardHeader className="text-center border-b border-border/50">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                  <Wand2 className="h-7 w-7 text-primary" />
                  Token Information
                  {getTabStatus("info") === "complete" && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
                      Complete
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-base">
                  Essential token details - name, symbol, and description
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <TokenInfoForm
                  tokenInfo={tokenInfo}
                  onTokenInfoChange={handleTokenInfoFormChange}
                />
              </CardContent>
            </Card>
          )}

          {/* NEW: Purchase Tab */}
          {activeTab === "purchase" && (
            <Card className="unified-card border-primary/20">
              <CardHeader className="text-center border-b border-border/50">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                  <ShoppingCart className="h-7 w-7 text-primary" />
                  Initial Purchase
                  {getTabStatus("purchase") === "complete" ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ready
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Configure
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-base">
                  Set up your initial token purchase (optional but recommended)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <PurchaseTab
                  purchaseOption={tokenInfo.purchase}
                  onPurchaseChange={handlePurchaseChange}
                  tokenName={tokenInfo.name || "Your Token"}
                  tokenSymbol={tokenInfo.ticker || "TOKEN"}
                />
              </CardContent>
            </Card>
          )}

          {/* Tokenomics Tab */}
          {activeTab === "tokenomics" && (
            <Card className="unified-card border-primary/20">
              <CardHeader className="text-center border-b border-border/50">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                  <Coins className="h-7 w-7 text-primary" />
                  Tokenomics Configuration
                  <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
                    Pre-configured
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Your token&apos;s economic foundation is optimized for fair
                  launch
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {configLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mr-3" />
                    <span className="text-muted-foreground">
                      Loading factory configuration...
                    </span>
                  </div>
                ) : (
                  <>
                    <TokenomicsForm tokenomics={tokenomics} />

                    {/* Enhanced Info Section with Real Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 unified-card border-primary/20 bg-primary/5">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">
                              Fair Launch Mechanics
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>
                                • Linear bonding curve for natural price
                                discovery
                              </li>
                              <li>• No pre-mine or insider allocations</li>
                              <li>
                                • Automatic Uniswap listing at{" "}
                                {tokenomics.fundingGoal} AVAX goal
                              </li>
                              <li>
                                • Built-in MEV protection with curve design
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 unified-card border-primary/20 bg-primary/5">
                        <div className="flex items-start gap-3">
                          <Settings className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">
                              Safety Features
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              <li>
                                • {tokenomics.maxWalletPercentage}% maximum
                                wallet limit
                              </li>
                              <li>
                                • {tokenomics.tradingFee}% trading fee for
                                sustainability
                              </li>
                              <li>• Anti-bot measures with purchase limits</li>
                              <li>
                                • Gradual supply release via bonding curve
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Real Economics Display */}
                    <div className="p-6 unified-card border-border/30">
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Economic Overview (Live Factory Configuration)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-secondary/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {tokenomics.fundingGoal}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            AVAX Goal
                          </div>
                        </div>
                        <div className="text-center p-4 bg-secondary/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            1B
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Max Supply
                          </div>
                        </div>
                        <div className="text-center p-4 bg-secondary/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            .00001
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Initial Price
                          </div>
                        </div>
                        <div className="text-center p-4 bg-secondary/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {tokenomics.tradingFee}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Trading Fee
                          </div>
                        </div>
                      </div>

                      {/* Additional Real Config Details */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex justify-between p-3 bg-secondary/20 rounded">
                          <span className="text-muted-foreground">
                            Initial Price:
                          </span>
                          <span className="font-medium">0.00001 AVAX</span>
                        </div>
                        <div className="flex justify-between p-3 bg-secondary/20 rounded">
                          <span className="text-muted-foreground">
                            Max Wallet:
                          </span>
                          <span className="font-medium">
                            {tokenomics.maxWalletPercentage}% of supply
                          </span>
                        </div>
                        <div className="flex justify-between p-3 bg-secondary/20 rounded">
                          <span className="text-muted-foreground">
                            Price Rate:
                          </span>
                          <span className="font-medium">
                            {tokenomics.priceRate}
                          </span>
                        </div>
                        <div className="flex justify-between p-3 bg-secondary/20 rounded">
                          <span className="text-muted-foreground">
                            Min Purchase:
                          </span>
                          <span className="font-medium">
                            {tokenomics.minPurchase} AVAX
                          </span>
                        </div>
                        <div className="flex justify-between p-3 bg-secondary/20 rounded">
                          <span className="text-muted-foreground">
                            Max Purchase:
                          </span>
                          <span className="font-medium">
                            {tokenomics.maxPurchase} AVAX
                          </span>
                        </div>
                        <div className="flex justify-between p-3 bg-secondary/20 rounded">
                          <span className="text-muted-foreground">
                            Curve Type:
                          </span>
                          <span className="font-medium capitalize">
                            {tokenomics.bondingCurve}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Preview Tab - Visual customization */}
          {activeTab === "preview" && (
            <Card className="unified-card border-primary/20">
              <CardHeader className="text-center border-b border-border/50">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                  <Star className="h-7 w-7 text-primary" />
                  Customize & Preview
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                    <Eye className="h-3 w-3 mr-1" />
                    Live Preview
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Upload image, edit text, and see how your token will appear
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {isMobile ? (
                  <MobileImageUpload
                    imageFile={tokenInfo.image}
                    imagePosition={
                      tokenInfo.imagePosition || {
                        x: 0,
                        y: 0,
                        scale: 1,
                        rotation: 0,
                        fit: "cover",
                      }
                    }
                    description={tokenInfo.description || ""}
                    onImageChange={handleImageChange}
                    onPositionChange={handleImagePositionChange}
                    onDescriptionChange={handleDescriptionChange}
                    onTokenInfoChange={handleTokenInfoUpdateFromPreview}
                    tokenName={tokenInfo.name || "Your Token"}
                    tokenSymbol={tokenInfo.ticker || "TOKEN"}
                  />
                ) : (
                  <FactoryImageUploadWithEditor
                    imageFile={tokenInfo.image}
                    imagePosition={
                      tokenInfo.imagePosition || {
                        x: 0,
                        y: 0,
                        scale: 1,
                        rotation: 0,
                        fit: "cover",
                      }
                    }
                    description={tokenInfo.description || ""}
                    onImageChange={handleImageChange}
                    onPositionChange={handleImagePositionChange}
                    onDescriptionChange={handleDescriptionChange}
                    onTokenInfoChange={handleTokenInfoUpdateFromPreview}
                    tokenName={tokenInfo.name || "Your Token"}
                    tokenSymbol={tokenInfo.ticker || "TOKEN"}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  );
}
