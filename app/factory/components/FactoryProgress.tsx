// app/factory/components/FactoryProgress.tsx - UPDATED: Added Purchase tab to progress tracking
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  CheckCircle2,
  Circle,
  Lightbulb,
  TrendingUp,
  Star,
  Rocket,
  ShoppingCart,
} from "lucide-react";

interface PlatformStats {
  totalTokens: number;
  activeTraders: number;
  totalVolume: string;
  loading: boolean;
}

interface FactoryProgressProps {
  completionPercentage: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isFormValid: boolean;
  tokenInfo: {
    name: string;
    ticker: string;
    image: File | null;
    purchase?: {
      enabled: boolean;
      amount: string;
      minTokensOut: string;
    };
  };
}

const progressSteps = [
  {
    id: "info",
    label: "Token Details",
    icon: Lightbulb,
    description: "Name & symbol",
    threshold: 20,
  },
  {
    id: "purchase",
    label: "Initial Purchase",
    icon: ShoppingCart,
    description: "Set purchase options",
    threshold: 40,
  },
  {
    id: "tokenomics",
    label: "Economics",
    icon: TrendingUp,
    description: "Funding & supply",
    threshold: 60,
  },
  {
    id: "preview",
    label: "Customize",
    icon: Star,
    description: "Image & description",
    threshold: 80,
  },
];

export function FactoryProgress({
  completionPercentage,
  activeTab,
  onTabChange,
  isFormValid,
  tokenInfo,
}: FactoryProgressProps) {
  // Check if there's a valid burn manager
  const hasValidBurnManager = false; // This would need to be passed down if needed

  // Check purchase step completion
  const isPurchaseComplete = () => {
    if (!tokenInfo.purchase) return false;
    if (!tokenInfo.purchase.enabled) return true; // Disabled = complete
    return (
      tokenInfo.purchase.enabled &&
      parseFloat(tokenInfo.purchase.amount || "0") > 0
    );
  };

  const getStepStatus = (stepId: string, threshold: number) => {
    // Token details completion
    if (stepId === "info") {
      if (tokenInfo.name && tokenInfo.ticker) return "completed";
      if (tokenInfo.name || tokenInfo.ticker) return "current";
      return "pending";
    }

    // Purchase step completion
    if (stepId === "purchase") {
      if (isPurchaseComplete()) return "completed";
      if (tokenInfo.purchase?.enabled !== undefined) return "current";
      return "pending";
    }

    // Tokenomics is always completed since it's pre-configured
    if (stepId === "tokenomics") return "completed";

    // Preview/Customize step - completed if has any customization
    if (stepId === "preview") {
      if (tokenInfo.image) return "completed";
      return "pending";
    }

    // Fallback to threshold-based logic
    if (completionPercentage >= threshold) return "completed";
    if (completionPercentage >= threshold - 20) return "current";
    return "pending";
  };

  const getProgressColor = () => {
    if (hasValidBurnManager) {
      return "from-orange-500 via-red-500 to-yellow-500"; // Burning colors
    }
    if (completionPercentage === 100) return "from-green-500 to-emerald-400";
    if (completionPercentage >= 75) return "from-blue-500 to-primary";
    if (completionPercentage >= 50) return "from-yellow-500 to-orange-400";
    if (completionPercentage >= 25) return "from-purple-500 to-primary";
    return "from-gray-500 to-gray-400";
  };

  const getProgressMessage = () => {
    if (hasValidBurnManager)
      return "🔥 Burn Manager Detected - Deflationary Token Ready!";
    if (completionPercentage >= 90) return "🚀 Ready for launch!";
    if (!isPurchaseComplete())
      return "💰 Set your initial purchase amount or disable";
    if (completionPercentage >= 75)
      return "🎨 Customize your token's appearance and add description";
    if (completionPercentage >= 50)
      return "✨ Add token name and symbol to continue";
    if (tokenInfo.name || tokenInfo.ticker)
      return "✨ Complete your token details";
    return "🏗️ Start by adding your token name and symbol";
  };

  const canAccessTab = (tabId: string) => {
    if (tabId === "info") return true;
    if (tabId === "purchase") return tokenInfo.name && tokenInfo.ticker; // Requires basic info
    if (tabId === "tokenomics") return true;
    if (tabId === "preview") return true; // Always accessible
    return false;
  };

  // Calculate updated completion percentage
  const calculateCompletionPercentage = () => {
    let completed = 0;

    // Info step (30%)
    if (tokenInfo.name && tokenInfo.ticker) {
      completed += 30;
    } else if (tokenInfo.name || tokenInfo.ticker) {
      completed += 15;
    }

    // Purchase step (25%)
    if (isPurchaseComplete()) {
      completed += 25;
    } else if (tokenInfo.purchase?.enabled !== undefined) {
      completed += 12;
    }

    // Tokenomics (25% - always complete)
    completed += 25;

    // Preview (20%)
    if (tokenInfo.image) {
      completed += 20;
    }

    return Math.min(completed, 100);
  };

  const actualCompletionPercentage = calculateCompletionPercentage();

  return (
    <Card className="unified-card border-primary/30 overflow-hidden">
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: actualCompletionPercentage === 100 ? 360 : 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="p-2 bg-primary/20 rounded-lg border border-primary/30"
            >
              <Target className="h-6 w-6 text-primary" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Token Creation Progress
              </h3>
              <p className="text-sm text-muted-foreground">
                {getProgressMessage()}
              </p>
            </div>
          </div>

          <motion.div
            key={actualCompletionPercentage}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Badge
              variant="outline"
              className={`
                px-4 py-2 text-base font-bold border-2 transition-all duration-500
                ${
                  hasValidBurnManager
                    ? "bg-orange-500/20 text-orange-400 border-orange-400/50 shadow-orange-400/20 shadow-lg animate-pulse"
                    : actualCompletionPercentage >= 90
                    ? "bg-green-500/20 text-green-400 border-green-400/50 shadow-green-400/20 shadow-lg"
                    : "bg-primary/20 text-primary border-primary/50"
                }
              `}
            >
              {hasValidBurnManager
                ? "🔥 Deflationary"
                : `${actualCompletionPercentage}%`}
            </Badge>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-secondary/50 rounded-full h-3 overflow-hidden border border-border/50 relative">
            <motion.div
              className={`h-full bg-gradient-to-r ${getProgressColor()} relative`}
              initial={{ width: 0 }}
              animate={{ width: `${actualCompletionPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {/* Shimmer Effect */}
              {actualCompletionPercentage > 0 && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ["-120%", "120%"],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.2, 0.8, 1],
                  }}
                />
              )}

              {/* Burn Animation */}
              {hasValidBurnManager && actualCompletionPercentage > 0 && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute top-0 w-1 bg-gradient-to-t from-orange-400 via-red-500 to-yellow-300 rounded-full"
                      style={{
                        left: `${10 + i * 10}%`,
                        height: "120%",
                        transformOrigin: "bottom",
                      }}
                      animate={{
                        scaleY: [0.8, 1.4, 1.0, 1.2, 0.9],
                        scaleX: [1, 0.8, 1.2, 0.9, 1],
                        opacity: [0.6, 1, 0.8, 0.9, 0.7],
                      }}
                      transition={{
                        duration: 1.5 + Math.random() * 0.8,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Clickable Step Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {progressSteps.map((step, index) => {
            const status = getStepStatus(step.id, step.threshold);
            const StepIcon = step.icon;
            const isActive = activeTab === step.id;
            const canAccess = canAccessTab(step.id);

            return (
              <motion.button
                key={step.id}
                onClick={() => canAccess && onTabChange(step.id)}
                disabled={!canAccess}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-300 text-left
                  ${
                    isActive
                      ? "bg-primary/20 border-primary/60 shadow-primary/20 shadow-lg"
                      : status === "completed"
                      ? "bg-primary/10 border-primary/50 shadow-primary/20 shadow-sm hover:bg-primary/15"
                      : status === "current"
                      ? "bg-primary/5 border-primary/30 shadow-primary/10 shadow-sm hover:bg-primary/10"
                      : !canAccess
                      ? "bg-secondary/30 border-border/30 opacity-50 cursor-not-allowed"
                      : "bg-secondary/30 border-border/30 hover:bg-secondary/50"
                  }
                `}
              >
                {/* Step Header */}
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`
                    p-2 rounded-lg border transition-all duration-300
                    ${
                      isActive
                        ? "bg-primary/30 border-primary/50"
                        : status === "completed"
                        ? "bg-primary/20 border-primary/40"
                        : status === "current"
                        ? "bg-primary/10 border-primary/30"
                        : "bg-secondary/50 border-border/50"
                    }
                  `}
                  >
                    <StepIcon
                      className={`
                      h-4 w-4 transition-colors duration-300
                      ${
                        isActive ||
                        status === "completed" ||
                        status === "current"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    `}
                    />
                  </div>

                  {/* Status Icon */}
                  <motion.div
                    key={status}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle
                        className={`
                        h-4 w-4 
                        ${
                          status === "current" || isActive
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      `}
                      />
                    )}
                  </motion.div>
                </div>

                {/* Step Content */}
                <div>
                  <h4
                    className={`
                    font-semibold text-sm transition-colors duration-300 mb-1
                    ${
                      isActive || status === "completed" || status === "current"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  `}
                  >
                    {step.label}
                  </h4>
                  <p
                    className={`
                    text-xs transition-colors duration-300
                    ${
                      isActive || status === "completed" || status === "current"
                        ? "text-muted-foreground"
                        : "text-muted-foreground/70"
                    }
                  `}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Active Tab Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -inset-1 bg-primary/20 rounded-lg border border-primary/40"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Current Step Pulse */}
                {status === "current" && !isActive && (
                  <motion.div
                    className="absolute -inset-1 bg-primary/20 rounded-lg border border-primary/40"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Desktop Only Tips */}
        {actualCompletionPercentage < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg hidden md:block"
          >
            <div className="flex items-start gap-3">
              <div className="p-1 bg-primary/20 rounded">
                <Target className="h-3 w-3 text-primary" />
              </div>
              <div className="text-sm">
                <p className="text-foreground font-medium mb-1">
                  💡 Quick Tips
                </p>
                <div className="text-muted-foreground space-y-2">
                  {!tokenInfo.name && !tokenInfo.ticker && (
                    <div>
                      <p className="mb-1">Getting started:</p>
                      <ul className="text-xs space-y-1 ml-4">
                        <li>
                          • Choose a memorable token name (e.g.,
                          &ldquo;FOXHOUND&rdquo;)
                        </li>
                        <li>
                          • Pick a 3-8 character symbol (e.g.,
                          &ldquo;FOX&rdquo;)
                        </li>
                        <li>• Set initial purchase amount or disable it</li>
                        <li>
                          • You can customize images and description anytime
                        </li>
                      </ul>
                    </div>
                  )}
                  {(tokenInfo.name || tokenInfo.ticker) &&
                    !isPurchaseComplete() && (
                      <div>
                        <p className="mb-1">Set purchase options:</p>
                        <ul className="text-xs space-y-1 ml-4">
                          <li>
                            • Enter amount in AVAX to buy tokens at launch
                          </li>
                          <li>
                            • Or disable initial purchase to launch without
                            buying
                          </li>
                          <li>
                            • This helps with initial liquidity and price
                            discovery
                          </li>
                        </ul>
                      </div>
                    )}
                  {isPurchaseComplete() &&
                    tokenInfo.purchase &&
                    !isFormValid && (
                      <div>
                        <p className="mb-1">Almost there:</p>
                        <ul className="text-xs space-y-1 ml-4">
                          <li>
                            • Complete both token name and symbol to unlock
                            launch
                          </li>
                          <li>
                            • Consider adding a description to explain your
                            token&apos;s purpose
                          </li>
                          <li>
                            • Upload an image to make your token stand out
                          </li>
                        </ul>
                      </div>
                    )}
                  {isFormValid && actualCompletionPercentage < 100 && (
                    <div>
                      <p className="mb-1">
                        Ready to launch or keep customizing:
                      </p>
                      <ul className="text-xs space-y-1 ml-4">
                        <li>
                          • Add a professional image and description for better
                          appeal
                        </li>
                        <li>
                          • Review tokenomics - everything is pre-configured for
                          fairness
                        </li>
                        <li>
                          • Your token will be tradable immediately after
                          creation
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
