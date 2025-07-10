// app/dex/factory/components/FactoryLaunchSection.tsx
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
  onRetry?: () => void; // Add retry function
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
  const flamesRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  // Enhanced ready-to-launch animations
  useEffect(() => {
    if (isFormValid && !isCreating && !isPending && !isConfirming && !error) {
      const button = buttonRef.current;
      const container = containerRef.current;
      const flames = flamesRef.current;
      const pulse = pulseRef.current;

      if (button) {
        // Breathing glow effect
        gsap.to(button, {
          boxShadow:
            "0 0 40px rgba(var(--primary-rgb), 0.6), 0 0 80px rgba(var(--primary-rgb), 0.3)",
          duration: 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        // Subtle scale pulse
        gsap.to(button, {
          scale: 1.02,
          duration: 3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (container) {
        // Container border animation
        gsap.to(container, {
          borderColor: "rgba(var(--primary-rgb), 0.5)",
          duration: 2.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (pulse) {
        // Pulse rings
        gsap.fromTo(
          pulse.children,
          { scale: 0, opacity: 0.8 },
          {
            scale: 3,
            opacity: 0,
            duration: 2,
            ease: "power2.out",
            stagger: 0.3,
            repeat: -1,
          }
        );
      }

      return () => {
        if (button) gsap.killTweensOf(button);
        if (container) gsap.killTweensOf(container);
        if (pulse) gsap.killTweensOf(pulse);
      };
    }
  }, [isFormValid, isCreating, isPending, isConfirming, error]);

  // Parse error message for better user experience
  const parseErrorMessage = (
    error: any
  ): { title: string; message: string; code?: string } => {
    if (!error) return { title: "", message: "" };

    // Type-safe error parsing using 'any' to access dynamic properties
    const errorObj = error as any;

    // Handle different error types
    if (typeof error === "string") {
      return {
        title: "Transaction Failed",
        message: error,
      };
    }

    // Wagmi/Viem error structure
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

      // Common error patterns
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

    // Fallback for unknown errors
    return {
      title: "Unknown Error",
      message: "An unexpected error occurred. Please try again.",
      code: errorObj?.code,
    };
  };

  const getButtonState = () => {
    if (uploadingImage)
      return {
        text: "Uploading Image...",
        icon: Upload,
        disabled: true,
        variant: "loading",
        description: "Preparing your token's visual identity",
      };
    if (isCreating)
      return {
        text: "Creating Token...",
        icon: Flame,
        disabled: true,
        variant: "loading",
        description: "Forging your token on the blockchain",
      };
    if (isPending)
      return {
        text: "Transaction Pending...",
        icon: Clock,
        disabled: true,
        variant: "loading",
        description: "Waiting for blockchain confirmation",
      };
    if (isConfirming)
      return {
        text: "Confirming...",
        icon: Zap,
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
        <CardContent className="p-8 relative z-10">
          {/* Success State */}
          {receipt ? (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="text-center space-y-8"
            >
              {/* Celebration Effects */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Confetti */}
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded"
                    style={{
                      backgroundColor: [
                        "#3b82f6",
                        "#10b981",
                        "#f59e0b",
                        "#ef4444",
                        "#8b5cf6",
                      ][i % 5],
                      left: `${Math.random() * 100}%`,
                      top: `-10px`,
                    }}
                    animate={{
                      y: [0, 400],
                      x: [(Math.random() - 0.5) * 200],
                      rotate: [0, 360],
                      opacity: [1, 0],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      delay: Math.random() * 2,
                      ease: "easeOut",
                    }}
                  />
                ))}

                {/* Golden sparkles */}
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={`sparkle-${i}`}
                    className="absolute text-yellow-400"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      rotate: [0, 180],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: Math.random() * 3,
                      repeat: Infinity,
                      repeatDelay: Math.random() * 4,
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </div>

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
                    className="text-4xl font-bold text-foreground mb-2"
                  >
                    🎉 Token Created! 🎉
                  </motion.h3>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground text-lg mb-6"
                  >
                    Your token is now live and trading!
                  </motion.p>

                  {/* View on DEX Button */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={() => {
                        // Extract token address from receipt logs if available
                        const tokenAddress =
                          receipt?.logs?.[0]?.address || transactionData;
                        if (tokenAddress) {
                          window.open(`/dex/${tokenAddress}`, "_blank");
                        }
                      }}
                      className="btn-primary px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
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
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <div className="unified-card border-primary/30 bg-primary/10 p-6">
                  <h4 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Token Details
                  </h4>
                  <div className="space-y-3">
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

                <div className="unified-card border-primary/30 bg-primary/10 p-6">
                  <h4 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-primary" />
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
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center py-2 border-b border-primary/20 last:border-0"
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
              </motion.div>

              {transactionData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="unified-card border-primary/30 bg-primary/5 p-4"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Transaction Hash:
                    </span>
                    <AddressComponent hash={transactionData} type="tx" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* Launch Interface */
            <div className="text-center space-y-8 relative">
              {/* Background Effects */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                {/* Ready State: Rocket Flames and Energy */}
                {isFormValid &&
                  !isCreating &&
                  !isPending &&
                  !isConfirming &&
                  !error && (
                    <>
                      {/* Rocket Flames at Bottom */}
                      <div
                        ref={flamesRef}
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-16"
                      >
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute bottom-0"
                            style={{
                              left: `${10 + i * 12}%`,
                              width: "8px",
                              height: "24px",
                            }}
                            animate={{
                              height: [16, 32, 20, 28, 16],
                              opacity: [0.6, 1, 0.8, 0.9, 0.7],
                              scaleX: [0.8, 1.2, 1.0, 1.1, 0.9],
                            }}
                            transition={{
                              duration: 1.2 + Math.random() * 0.6,
                              repeat: Infinity,
                              delay: i * 0.1,
                              ease: "easeInOut",
                            }}
                          >
                            <div className="w-full h-full bg-gradient-to-t from-orange-500 via-red-500 to-yellow-400 rounded-full blur-[0.5px]" />
                          </motion.div>
                        ))}
                      </div>

                      {/* Energy Pulses */}
                      <div
                        ref={pulseRef}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-4 h-4 border-2 border-primary/30 rounded-full"
                          />
                        ))}
                      </div>

                      {/* Floating Icons */}
                      {[
                        {
                          Icon: Star,
                          position: "top-1/4 left-1/4",
                          delay: 0,
                          animation: "spin",
                        },
                        {
                          Icon: Coins,
                          position: "top-1/3 right-1/4",
                          delay: 0.5,
                          animation: "float",
                        },
                        {
                          Icon: Crown,
                          position: "bottom-1/3 left-1/5",
                          delay: 1,
                          animation: "pulse",
                        },
                        {
                          Icon: TrendingUp,
                          position: "bottom-1/4 right-1/3",
                          delay: 1.5,
                          animation: "float",
                        },
                      ].map(({ Icon, position, delay, animation }, i) => (
                        <motion.div
                          key={i}
                          className={`absolute ${position} opacity-20`}
                          animate={
                            animation === "spin"
                              ? { rotate: [0, 360] }
                              : animation === "pulse"
                              ? { scale: [1, 1.3, 1] }
                              : { y: [-5, 5, -5], rotate: [0, 10, -10, 0] }
                          }
                          transition={{
                            duration:
                              animation === "spin"
                                ? 6
                                : animation === "pulse"
                                ? 2
                                : 3 + Math.random(),
                            repeat: Infinity,
                            delay,
                            ease: animation === "spin" ? "linear" : "easeInOut",
                          }}
                        >
                          <Icon className="h-6 w-6 text-primary" />
                        </motion.div>
                      ))}
                    </>
                  )}

                {/* Loading State: Spinning Energy */}
                {(isCreating || isPending || isConfirming) && (
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    animate={{
                      background: [
                        "radial-gradient(ellipse at 50% 50%, rgba(var(--primary-rgb), 0.2) 0%, transparent 70%)",
                        "radial-gradient(ellipse at 30% 30%, rgba(var(--primary-rgb), 0.15) 0%, transparent 70%)",
                        "radial-gradient(ellipse at 70% 70%, rgba(var(--primary-rgb), 0.25) 0%, transparent 70%)",
                        "radial-gradient(ellipse at 50% 50%, rgba(var(--primary-rgb), 0.2) 0%, transparent 70%)",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                {/* Error State */}
                {error && (
                  <motion.div
                    className="absolute inset-0 opacity-30"
                    animate={{
                      background: [
                        "radial-gradient(ellipse at 50% 50%, rgba(239, 68, 68, 0.15) 0%, transparent 70%)",
                        "radial-gradient(ellipse at 50% 50%, rgba(239, 68, 68, 0.25) 0%, transparent 70%)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </div>

              {/* Status Header */}
              <motion.div
                key={`${isCreating}-${isPending}-${isConfirming}-${isFormValid}-${error}-${errorDetails.title}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6 relative z-10"
              >
                <div className="text-center">
                  {error ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-3">
                        <XCircle className="h-10 w-10 text-red-400" />
                        <h3 className="text-3xl font-bold text-red-400">
                          {errorDetails.title}
                        </h3>
                      </div>
                      <p className="text-red-400/80 text-lg max-w-md mx-auto">
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
                          <Loader2 className="h-10 w-10 text-primary" />
                        </motion.div>
                        <h3 className="text-3xl font-bold text-primary">
                          {buttonState.text}
                        </h3>
                      </div>
                      <p className="text-primary/80 text-lg">
                        {buttonState.description}
                      </p>

                      {/* Progress Dots */}
                      <div className="flex justify-center gap-2">
                        {[0, 1, 2].map((index) => (
                          <motion.div
                            key={index}
                            className="w-2 h-2 bg-primary rounded-full"
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: index * 0.2,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : isFormValid ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Rocket className="h-12 w-12 text-primary" />
                        </motion.div>
                        <h3 className="text-4xl font-bold text-gradient bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
                          Ready for Launch
                        </h3>
                        <motion.div
                          animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.2, 1],
                          }}
                          transition={{ duration: 2.5, repeat: Infinity }}
                        >
                          <Flame className="h-12 w-12 text-orange-400" />
                        </motion.div>
                      </div>
                      <p className="text-primary/90 text-xl font-medium">
                        🚀 {buttonState.description} 🚀
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-3">
                        <Clock className="h-10 w-10 text-muted-foreground" />
                        <h3 className="text-3xl font-bold text-muted-foreground">
                          Complete Your Token
                        </h3>
                      </div>
                      <p className="text-muted-foreground/80 text-lg">
                        {buttonState.description}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Launch Button */}
              <motion.div
                whileHover={!buttonState.disabled ? { scale: 1.02 } : {}}
                whileTap={!buttonState.disabled ? { scale: 0.98 } : {}}
                className="flex justify-center relative"
              >
                <Button
                  ref={buttonRef}
                  onClick={handleButtonClick}
                  disabled={buttonState.disabled}
                  className={`
                    px-16 py-8 text-2xl font-bold rounded-2xl transition-all duration-500 relative overflow-hidden group
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
                      className="flex items-center gap-4 relative z-10"
                    >
                      <ButtonIcon
                        className={`h-8 w-8 ${
                          buttonState.variant === "loading"
                            ? "animate-spin"
                            : buttonState.variant === "ready" ||
                              buttonState.variant === "retry"
                            ? "group-hover:scale-110 transition-transform duration-300"
                            : ""
                        }`}
                      />
                      {buttonState.text}
                      {(buttonState.variant === "ready" ||
                        buttonState.variant === "retry") && (
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="h-8 w-8" />
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
                <div className="unified-card border-red-400/30 bg-red-400/5 p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <h4 className="font-semibold text-red-400 text-lg">
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

                    {/* Common Solutions */}
                    <div className="space-y-2">
                      <h5 className="text-red-400 font-medium text-sm">
                        Possible Solutions:
                      </h5>
                      <ul className="text-red-300/80 text-xs space-y-1 ml-4">
                        {errorDetails.message.includes(
                          "insufficient funds"
                        ) && (
                          <>
                            <li>• Add more AVAX to your wallet</li>
                            <li>• Reduce the purchase amount</li>
                            <li>• Check if you have enough for gas fees</li>
                          </>
                        )}
                        {errorDetails.message.includes("user rejected") && (
                          <>
                            <li>• Try the transaction again</li>
                            <li>
                              • Check your wallet for pending transactions
                            </li>
                          </>
                        )}
                        {errorDetails.message.includes("gas") && (
                          <>
                            <li>• Wait a few minutes and try again</li>
                            <li>• Check network congestion</li>
                            <li>• Ensure you have enough AVAX for gas</li>
                          </>
                        )}
                        {errorDetails.message.includes("nonce") && (
                          <>
                            <li>• Reset your wallet's transaction history</li>
                            <li>• Wait a moment and try again</li>
                          </>
                        )}
                        {errorDetails.message.includes("already exists") && (
                          <>
                            <li>• Try a different token name</li>
                            <li>• Use a different symbol</li>
                            <li>• Check if the token already exists</li>
                          </>
                        )}
                        {!errorDetails.message.includes("insufficient funds") &&
                          !errorDetails.message.includes("user rejected") &&
                          !errorDetails.message.includes("gas") &&
                          !errorDetails.message.includes("nonce") &&
                          !errorDetails.message.includes("already exists") && (
                            <>
                              <li>• Check your wallet connection</li>
                              <li>• Ensure you're on the correct network</li>
                              <li>• Wait a moment and try again</li>
                              <li>• Contact support if the issue persists</li>
                            </>
                          )}
                      </ul>
                    </div>

                    {/* Transaction Hash for Failed Transactions */}
                    {transactionData && (
                      <div className="flex items-center gap-2 pt-2 border-t border-red-400/20">
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
