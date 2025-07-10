// app/factory/components/FactoryTabs.tsx
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
import { FactoryImageUploadWithEditor } from "./editor/FactoryImageUploadWithEditor";
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
} from "lucide-react";

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
  // Calculate completion status for each tab
  const getTabStatus = (tabId: string) => {
    switch (tabId) {
      case "info":
        if (tokenInfo.name && tokenInfo.ticker && tokenInfo.image) {
          return "complete";
        } else if (tokenInfo.name || tokenInfo.ticker) {
          return "partial";
        }
        return "empty";
      case "tokenomics":
        return "complete"; // Tokenomics are pre-configured
      case "preview":
        return tokenInfo.name && tokenInfo.ticker ? "complete" : "disabled";
      default:
        return "empty";
    }
  };

  // Handle image position changes
  const handleImagePositionChange = (position: ImagePosition) => {
    onTokenInfoChange({
      ...tokenInfo,
      imagePosition: position,
    });
  };

  // Handle description changes
  const handleDescriptionChange = (description: string) => {
    onTokenInfoChange({
      ...tokenInfo,
      description,
    });
  };

  // Handle token info changes (for basic form fields)
  const handleTokenInfoFormChange = (basicTokenInfo: TokenCreationInfo) => {
    onTokenInfoChange({
      ...basicTokenInfo,
      imagePosition: tokenInfo.imagePosition,
      description: tokenInfo.description,
    });
  };

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
          {/* Token Information Tab */}
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
                  Give your token personality and make it unforgettable
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {/* Basic Token Information Form Only */}
                <TokenInfoForm
                  tokenInfo={tokenInfo}
                  onTokenInfoChange={handleTokenInfoFormChange}
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
                            1,000,000,000
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Max Supply
                          </div>
                        </div>
                        <div className="text-center p-4 bg-secondary/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            0.00001
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

          {/* Preview Tab */}
          {activeTab === "preview" && (
            <Card className="unified-card border-primary/20">
              <CardHeader className="text-center border-b border-border/50">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                  <Star className="h-7 w-7 text-primary" />
                  Token Preview & Visual Editor
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                    <Eye className="h-3 w-3 mr-1" />
                    Live Preview
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Upload your image, edit positioning, add description, and see
                  exactly how your token will appear
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Token Header Preview with Editor - Combined like main dex */}
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
                  onImageChange={(file) => {
                    console.log("FactoryTabs received image change:", file);
                    onTokenInfoChange({ ...tokenInfo, image: file });
                  }}
                  onPositionChange={handleImagePositionChange}
                  onDescriptionChange={handleDescriptionChange}
                  tokenName={tokenInfo.name || "Your Token"}
                  tokenSymbol={tokenInfo.ticker || "TOKEN"}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Token Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      Token Details
                    </h4>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Name",
                          value: tokenInfo.name || "Not set",
                          status: !!tokenInfo.name,
                        },
                        {
                          label: "Symbol",
                          value: tokenInfo.ticker || "Not set",
                          status: !!tokenInfo.ticker,
                        },
                        {
                          label: "Image",
                          value: tokenInfo.image
                            ? "✓ Uploaded"
                            : "Not uploaded",
                          status: !!tokenInfo.image,
                        },
                        {
                          label: "Description",
                          value: tokenInfo.description
                            ? "✓ Added"
                            : "Not added",
                          status: !!tokenInfo.description,
                        },
                        {
                          label: "Purchase Option",
                          value: tokenInfo.purchase.enabled
                            ? `${tokenInfo.purchase.amount} AVAX`
                            : "Not enabled",
                          status: tokenInfo.purchase.enabled,
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg"
                        >
                          <span className="text-muted-foreground">
                            {item.label}:
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${
                                item.status
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {item.value}
                            </span>
                            {item.status ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Economics Summary */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Economics
                    </h4>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Funding Goal",
                          value: `${tokenomics.fundingGoal} AVAX`,
                        },
                        {
                          label: "Max Supply",
                          value: tokenomics.maxSupply.toLocaleString(),
                        },
                        {
                          label: "Initial Price",
                          value: `${tokenomics.initialPrice.toFixed(8)} AVAX`,
                        },
                        {
                          label: "Bonding Curve",
                          value:
                            tokenomics.bondingCurve.charAt(0).toUpperCase() +
                            tokenomics.bondingCurve.slice(1),
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg"
                        >
                          <span className="text-muted-foreground">
                            {item.label}:
                          </span>
                          <span className="font-medium text-foreground">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Readiness Check */}
                <div className="p-6 unified-card border-primary/20 bg-primary/5">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">
                        Launch Readiness Check
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          {tokenInfo.name ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-400" />
                          )}
                          <span>Token name provided</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {tokenInfo.ticker ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-400" />
                          )}
                          <span>Symbol configured</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {tokenInfo.image ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-400" />
                          )}
                          <span>Image uploaded (optional)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {tokenInfo.description ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-400" />
                          )}
                          <span>Description added (optional)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>Economics configured</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {tokenInfo.imagePosition ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-400" />
                          )}
                          <span>Image position set (optional)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  );
}
