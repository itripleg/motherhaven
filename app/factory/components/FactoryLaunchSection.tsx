// app/factory/components/FactoryLaunchSection.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddressComponent } from "@/components/AddressComponent";
import { TokenCreationInfo } from "@/types";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Rocket,
  Upload,
  Flame,
  Zap,
  AlertTriangle,
  Trophy,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  Loader2,
  Sparkles,
  Target,
  Crown,
  Coins,
  TrendingUp,
  Heart,
  Gift,
  XCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface FactoryLaunchSectionProps {
  isFormValid: boolean;
  isCreating: boolean;
  uploadingImage: boolean;
  isPending: boolean;
  isConfirming: boolean;
  error: any;
  receipt: any;
  tokenInfo: TokenCreationInfo;
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
  transactionData: string | undefined;
  onLaunch: () => void;
  onRetry?: () => void;
}

export function FactoryLaunchSection({
  isFormValid,
  isCreating,
  uploadingImage,
  isPending,
  isConfirming,
  error,
  receipt,
  tokenInfo,
  tokenomics,
  transactionData,
  onLaunch,
  onRetry,
}: FactoryLaunchSectionProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simplified ready-to-launch animations - only when ready
  useEffect(() => {
    if (isFormValid && !isCreating && !isPending && !isConfirming && !error) {
      const button = buttonRef.current;
      const container = containerRef.current;

      if (button) {
        // Gentle glow effect
        gsap.to(button, {
          boxShadow:
            "0 0 20px rgba(var(--primary-rgb), 0.4), 0 0 40px rgba(var(--primary-rgb), 0.2)",
          duration: 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (container) {
        // Subtle border animation
        gsap.to(container, {
          borderColor: "rgba(var(--primary-rgb), 0.4)",
          duration: 2.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      return () => {
        if (button) gsap.killTweensOf(button);
        if (container) gsap.killTweensOf(container);
      };
    }
  }, [isFormValid, isCreating, isPending, isConfirming, error]);

  // Parse error message for better user experience
  const parseErrorMessage = (
    error: any
  ): { title: string; message: string; code?: string } => {
    if (!error) return { title: "", message: "" };

    const errorObj = error as any;

    if (typeof error === "string") {
      return {
        title: "Transaction Failed",
        message: error,
      };
    }

    if (errorObj?.cause?.reason) {
      return {
        title: "Smart Contract Error",
        message: errorObj.cause.reason,
        code: errorObj.cause.code,
      };
    }

    if (errorObj?.cause?.shortMessage) {
      return {
        title: "Transaction Error",
        message: errorObj.cause.shortMessage,
        code: errorObj.cause.code,
      };
    }

    if (errorObj?.shortMessage) {
      return {
        title: "Transaction Error",
        message: errorObj.shortMessage,
        code: errorObj.code,
      };
    }

    if (errorObj?.message) {
      let message = errorObj.message;
      let title = "Transaction Failed";

      if (message.includes("insufficient funds")) {
        title = "Insufficient Funds";
        message = "You don't have enough AVAX to complete this transaction.";
      } else if (message.includes("user rejected")) {
        title = "Transaction Rejected";
        message = "You cancelled the transaction in your wallet.";
      } else if (message.includes("gas")) {
        title = "Gas Error";
        message = "Transaction failed due to gas estimation issues.";
      } else if (message.includes("nonce")) {
        title = "Nonce Error";
        message = "Transaction nonce conflict. Please try again.";
      } else if (
        message.includes("already exists") ||
        message.includes("duplicate")
      ) {
        title = "Token Already Exists";
        message = "A token with this name or symbol already exists.";
      }

      return {
        title,
        message,
        code: errorObj.code,
      };
    }

    return {
      title: "Unknown Error",
      message: "An unexpected error occurred. Please try again.",
      code: errorObj?.code,
    };
  };

  const getButtonState = () => {
    if (uploadingImage)
      return {
        text: "Uploading...",
        icon: null,
        disabled: true,
        variant: "loading",
        description: "Preparing your token's visual identity",
      };
    if (isCreating)
      return {
        text: "Deploying...",
        icon: null,
        disabled: true,
        variant: "loading",
        description: "Forging your token on the blockchain",
      };
    if (isPending)
      return {
        text: "Submitting...",
        icon: null,
        disabled: true,
        variant: "loading",
        description: "Waiting for blockchain confirmation",
      };
    if (isConfirming)
      return {
        text: "Finalizing...",
        icon: null,
        disabled: true,
        variant: "loading",
        description: "Almost there! Final confirmation in progress",
      };
    if (error)
      return {
        text: "Retry Launch",
        icon: RefreshCw,
        disabled: false,
        variant: "retry",
        description: "Something went wrong. Click to try again",
      };
    if (!isFormValid)
      return {
        text: "Complete Form to Launch",
        icon: AlertTriangle,
        disabled: true,
        variant: "disabled",
        description: "Fill out the required fields above",
      };
    return {
      text: "Launch Token",
      icon: Rocket,
      disabled: false,
      variant: "ready",
      description: "All systems go! Ready to deploy your token",
    };
  };

  const buttonState = getButtonState();
  const ButtonIcon = buttonState.icon;
  const errorDetails = parseErrorMessage(error);

  const handleButtonClick = () => {
    if (error && onRetry) {
      onRetry();
    } else {
      onLaunch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Launch Card */}
      <Card
        ref={containerRef}
        className={`unified-card transition-all duration-1000 relative overflow-hidden ${
          error
            ? "border-red-400/40 bg-red-500/5"
            : receipt
            ? "border-primary/40 bg-primary/5"
            : isCreating || isPending || isConfirming
            ? "border-primary/40 bg-primary/5"
            : isFormValid
            ? "border-primary/40 bg-primary/10"
            : "border-border/30"
        }`}
      >
        <CardContent className="p-4 md:p-8 relative z-10">
          {/* Success State */}
          {receipt ? (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="text-center space-y-6"
            >
              {/* Success Header */}
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="text-center"
                >
                  <motion.h3
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl md:text-4xl font-bold text-foreground mb-2"
                  >
                    🎉 Token Created! 🎉
                  </motion.h3>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground text-base md:text-lg mb-6"
                  >
                    Your token is now live and trading!
                  </motion.p>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={() => {
                        const tokenAddress =
                          receipt?.logs?.[0]?.address || transactionData;
                        if (tokenAddress) {
                          window.open(`/dex/${tokenAddress}`, "_blank");
                        }
                      }}
                      className="btn-primary px-6 md:px-8 py-3 text-base md:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group w-full md:w-auto"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <span>View on DEX</span>
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        </motion.div>
                      </div>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>

              {/* Token Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"
              >
                <div className="unified-card border-primary/30 bg-primary/10 p-4 md:p-6">
                  <h4 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Token Details
                  </h4>
                  <div className="space-y-2 md:space-y-3">
                    {[
                      { label: "Name", value: tokenInfo.name },
                      { label: "Symbol", value: tokenInfo.ticker },
                      {
                        label: "Image",
                        value: tokenInfo.image ? "✅ Uploaded" : "❌ None",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center py-2 border-b border-primary/20 last:border-0"
                      >
                        <span className="text-muted-foreground text-sm md:text-base">
                          {item.label}:
                        </span>
                        <span className="font-medium text-foreground text-sm md:text-base">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="unified-card border-primary/30 bg-primary/10 p-4 md:p-6">
                  <h4 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-primary" />
                    Economics
                  </h4>
                  <div className="space-y-2 md:space-y-3">
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
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center py-2 border-b border-primary/20 last:border-0"
                      >
                        <span className="text-muted-foreground text-sm md:text-base">
                          {item.label}:
                        </span>
                        <span className="font-medium text-foreground text-sm md:text-base">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {transactionData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="unified-card border-primary/30 bg-primary/5 p-3 md:p-4"
                >
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-xs md:text-sm text-muted-foreground">
                      Transaction Hash:
                    </span>
                    <AddressComponent hash={transactionData} type="tx" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* Launch Interface */
            <div className="text-center space-y-6 md:space-y-8 relative">
              {/* Status Header */}
              <motion.div
                key={`${isCreating}-${isPending}-${isConfirming}-${isFormValid}-${error}-${errorDetails.title}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4 md:space-y-6 relative z-10"
              >
                <div className="text-center">
                  {error ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-3">
                        <XCircle className="h-8 md:h-10 w-8 md:w-10 text-red-400" />
                        <h3 className="text-2xl md:text-3xl font-bold text-red-400">
                          {errorDetails.title}
                        </h3>
                      </div>
                      <p className="text-red-400/80 text-base md:text-lg max-w-md mx-auto">
                        {errorDetails.message}
                      </p>
                      {errorDetails.code && (
                        <p className="text-red-400/60 text-sm">
                          Error Code: {errorDetails.code}
                        </p>
                      )}
                    </div>
                  ) : isCreating || isPending || isConfirming ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 2,
                            ease: "linear",
                            repeat: Infinity,
                          }}
                        >
                          <Loader2 className="h-8 md:h-10 w-8 md:w-10 text-primary" />
                        </motion.div>
                        <h3 className="text-2xl md:text-3xl font-bold text-primary">
                          {uploadingImage
                            ? "Uploading Image..."
                            : isCreating
                            ? "Creating Token..."
                            : isPending
                            ? "Transaction Pending..."
                            : "Confirming..."}
                        </h3>
                      </div>
                      <p className="text-primary/80 text-base md:text-lg">
                        {uploadingImage
                          ? "Preparing your token's visual identity"
                          : isCreating
                          ? "Forging your token on the blockchain"
                          : isPending
                          ? "Waiting for blockchain confirmation"
                          : "Almost there! Final confirmation in progress"}
                      </p>
                    </div>
                  ) : isFormValid ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            y: [0, -5, 0],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Rocket className="h-10 md:h-12 w-10 md:w-12 text-primary" />
                        </motion.div>
                        <h3 className="text-3xl md:text-4xl font-bold text-gradient bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
                          Ready for Launch
                        </h3>
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Flame className="h-10 md:h-12 w-10 md:w-12 text-orange-400" />
                        </motion.div>
                      </div>
                      <p className="text-primary/90 text-lg md:text-xl font-medium">
                        🚀 {buttonState.description} 🚀
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-3">
                        <Clock className="h-8 md:h-10 w-8 md:w-10 text-muted-foreground" />
                        <h3 className="text-2xl md:text-3xl font-bold text-muted-foreground">
                          Complete Your Token
                        </h3>
                      </div>
                      <p className="text-muted-foreground/80 text-base md:text-lg">
                        {buttonState.description}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Launch Button - Mobile Optimized */}
              <motion.div
                whileHover={!buttonState.disabled ? { scale: 1.02 } : {}}
                whileTap={!buttonState.disabled ? { scale: 0.98 } : {}}
                className="flex justify-center relative px-4"
              >
                <Button
                  ref={buttonRef}
                  onClick={handleButtonClick}
                  disabled={buttonState.disabled}
                  className={`
                    w-full max-w-md px-6 md:px-16 py-6 md:py-8 text-lg md:text-2xl font-bold rounded-2xl transition-all duration-500 relative overflow-hidden group
                    ${
                      buttonState.variant === "ready"
                        ? "btn-primary border-2 border-primary/50 text-white shadow-2xl"
                        : buttonState.variant === "loading"
                        ? "bg-primary/20 text-primary border-2 border-primary/30 cursor-wait"
                        : buttonState.variant === "retry"
                        ? "bg-red-500/20 text-red-400 border-2 border-red-400/30 hover:bg-red-500/30 hover:border-red-400/50"
                        : "bg-muted text-muted-foreground border-2 border-muted cursor-not-allowed"
                    }
                  `}
                >
                  {/* Ready state shimmer effect */}
                  {buttonState.variant === "ready" && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ["-120%", "120%"] }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={buttonState.text}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center justify-center gap-3 md:gap-4 relative z-10"
                    >
                      {ButtonIcon && (
                        <ButtonIcon
                          className={`h-6 w-6 md:h-8 md:w-8 ${
                            buttonState.variant === "loading"
                              ? "animate-spin"
                              : buttonState.variant === "ready" ||
                                buttonState.variant === "retry"
                              ? "group-hover:scale-110 transition-transform duration-300"
                              : ""
                          }`}
                        />
                      )}
                      <span className="whitespace-nowrap">
                        {buttonState.text}
                      </span>
                      {(buttonState.variant === "ready" ||
                        buttonState.variant === "retry") && (
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="h-6 w-6 md:h-8 md:w-8" />
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>
          )}

          {/* Enhanced Error Details */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <div className="unified-card border-red-400/30 bg-red-400/5 p-4 md:p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <h4 className="font-semibold text-red-400 text-base md:text-lg">
                      {errorDetails.title}
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-red-950/20 rounded-lg border border-red-400/20">
                      <p className="text-red-300/90 text-sm leading-relaxed">
                        {errorDetails.message}
                      </p>
                    </div>

                    {errorDetails.code && (
                      <div className="flex items-center gap-2 text-xs text-red-400/70">
                        <span>Error Code:</span>
                        <code className="bg-red-950/30 px-2 py-1 rounded font-mono">
                          {errorDetails.code}
                        </code>
                      </div>
                    )}

                    {transactionData && (
                      <div className="flex items-center gap-2 pt-2 border-t border-red-400/20 flex-wrap">
                        <ExternalLink className="h-4 w-4 text-red-400/70" />
                        <span className="text-xs text-red-400/70">
                          Failed Transaction:
                        </span>
                        <AddressComponent hash={transactionData} type="tx" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
