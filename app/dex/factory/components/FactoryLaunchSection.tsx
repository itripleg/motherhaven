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
}: FactoryLaunchSectionProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const readyIndicatorRef = useRef<HTMLDivElement>(null);

  // Elegant ready-to-launch animations
  useEffect(() => {
    if (isFormValid && !isCreating && !isPending && !isConfirming && !error) {
      const button = buttonRef.current;
      const container = containerRef.current;
      const indicator = readyIndicatorRef.current;

      if (button) {
        // Subtle breathing glow
        gsap.to(button, {
          boxShadow:
            "0 8px 32px rgba(var(--primary-rgb), 0.25), 0 0 0 1px rgba(var(--primary-rgb), 0.1)",
          duration: 2.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (container) {
        // Very subtle border pulse
        gsap.to(container, {
          borderColor: "rgba(var(--primary-rgb), 0.3)",
          duration: 3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }

      if (indicator) {
        // Rotating sparkle effect
        gsap.to(indicator, {
          rotation: 360,
          duration: 8,
          ease: "none",
          repeat: -1,
        });
      }

      return () => {
        if (button) gsap.killTweensOf(button);
        if (container) gsap.killTweensOf(container);
        if (indicator) gsap.killTweensOf(indicator);
      };
    }
  }, [isFormValid, isCreating, isPending, isConfirming, error]);

  const getButtonState = () => {
    if (uploadingImage)
      return {
        text: "Uploading Image...",
        icon: Upload,
        disabled: true,
        variant: "loading",
      };
    if (isCreating)
      return {
        text: "Creating Token...",
        icon: Flame,
        disabled: true,
        variant: "loading",
      };
    if (isPending)
      return {
        text: "Transaction Pending...",
        icon: Clock,
        disabled: true,
        variant: "loading",
      };
    if (isConfirming)
      return {
        text: "Confirming...",
        icon: Zap,
        disabled: true,
        variant: "loading",
      };
    if (!isFormValid)
      return {
        text: "Complete Form to Launch",
        icon: AlertTriangle,
        disabled: true,
        variant: "disabled",
      };
    return {
      text: "Launch Token",
      icon: Rocket,
      disabled: false,
      variant: "ready",
    };
  };

  const buttonState = getButtonState();
  const ButtonIcon = buttonState.icon;

  return (
    <div className="space-y-6">
      {/* Main Launch Card */}
      <Card
        ref={containerRef}
        className={`unified-card border-primary/20 transition-all duration-1000 ${
          error
            ? "border-red-400/30 bg-red-400/5"
            : receipt
            ? "border-green-400/30 bg-green-400/5"
            : isCreating || isPending || isConfirming
            ? "border-blue-400/30 bg-blue-400/5"
            : isFormValid
            ? "border-primary/30 bg-primary/5"
            : ""
        }`}
      >
        <CardContent className="p-8">
          {/* Success State */}
          {receipt ? (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="text-center space-y-8"
            >
              {/* Success Header */}
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="inline-flex items-center justify-center gap-4"
                >
                  <div className="p-4 unified-card border-green-400/30 bg-green-400/10">
                    <Trophy className="h-12 w-12 text-green-400" />
                  </div>

                  <div className="text-center">
                    <h3 className="text-3xl font-bold text-gradient bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                      Token Created Successfully!
                    </h3>
                    <p className="text-green-400/80 mt-2">
                      Your token is now live on the blockchain
                    </p>
                  </div>

                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                    className="p-4 unified-card border-green-400/30 bg-green-400/10"
                  >
                    <Star className="h-12 w-12 text-green-400" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Token Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="unified-card border-green-400/20 bg-green-400/5 p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      Token Details
                    </h4>
                    <div className="space-y-3">
                      {[
                        { label: "Name", value: tokenInfo.name },
                        { label: "Symbol", value: tokenInfo.ticker },
                        {
                          label: "Image",
                          value: tokenInfo.image ? "✅ Included" : "❌ None",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between items-center py-2 border-b border-green-400/10 last:border-0"
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

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-400" />
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
                          label: "Curve Type",
                          value:
                            tokenomics.bondingCurve.charAt(0).toUpperCase() +
                            tokenomics.bondingCurve.slice(1),
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between items-center py-2 border-b border-green-400/10 last:border-0"
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

                {transactionData && (
                  <div className="pt-6 mt-6 border-t border-green-400/20">
                    <div className="flex items-center justify-center gap-3">
                      <Zap className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-muted-foreground">
                        Transaction Hash:
                      </span>
                      <AddressComponent hash={transactionData} type="tx" />
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          ) : (
            /* Launch Interface */
            <div className="text-center space-y-8">
              {/* Status Header */}
              <div className="relative">
                {/* Background Animation Layer */}
                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                  {isFormValid &&
                    !isCreating &&
                    !isPending &&
                    !isConfirming &&
                    !error && (
                      <>
                        {/* Animated Flames */}
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute bottom-0"
                            style={{
                              left: `${15 + i * 12}%`,
                              width: "16px",
                              height: "32px",
                            }}
                            animate={{
                              height: [24, 40, 28, 36, 24],
                              opacity: [0.4, 0.8, 0.6, 0.9, 0.5],
                              scale: [0.9, 1.2, 1.0, 1.1, 0.9],
                            }}
                            transition={{
                              duration: 1.5 + Math.random() * 0.8,
                              repeat: Infinity,
                              delay: i * 0.15,
                              ease: "easeInOut",
                            }}
                          >
                            <div className="w-full h-full bg-gradient-to-t from-orange-500/70 via-red-500/60 to-yellow-400/50 rounded-full blur-[1px]" />
                          </motion.div>
                        ))}

                        {/* Floating Embers */}
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={`ember-${i}`}
                            className="absolute w-1 h-1 bg-orange-400/80 rounded-full"
                            style={{
                              left: `${20 + Math.random() * 60}%`,
                              bottom: "20px",
                            }}
                            animate={{
                              y: [-5, -60, -45, -80],
                              x: [
                                (Math.random() - 0.5) * 15,
                                (Math.random() - 0.5) * 25,
                              ],
                              opacity: [0.8, 0.6, 0.3, 0],
                              scale: [1, 1.1, 0.7, 0],
                            }}
                            transition={{
                              duration: 2.5 + Math.random() * 1.5,
                              repeat: Infinity,
                              delay: Math.random() * 2,
                              ease: "easeOut",
                            }}
                          />
                        ))}

                        {/* Energy Waves */}
                        <motion.div
                          className="absolute inset-0 opacity-15"
                          animate={{
                            background: [
                              "radial-gradient(ellipse at 25% 100%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)",
                              "radial-gradient(ellipse at 75% 100%, rgba(147, 51, 234, 0.15) 0%, transparent 60%)",
                              "radial-gradient(ellipse at 50% 100%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)",
                              "radial-gradient(ellipse at 25% 100%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)",
                            ],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      </>
                    )}

                  {/* Error state background */}
                  {error && (
                    <motion.div
                      className="absolute inset-0 opacity-25"
                      animate={{
                        background: [
                          "radial-gradient(ellipse at 50% 100%, rgba(239, 68, 68, 0.1) 0%, transparent 70%)",
                          "radial-gradient(ellipse at 50% 100%, rgba(239, 68, 68, 0.2) 0%, transparent 70%)",
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

                <motion.div
                  key={`${isCreating}-${isPending}-${isConfirming}-${isFormValid}-${error}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6 relative z-10"
                >
                  {/* Status Title */}
                  <div className="text-center">
                    {error ? (
                      <>
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <AlertTriangle className="h-8 w-8 text-red-400" />
                          <h3 className="text-3xl font-bold text-red-400">
                            Launch Failed
                          </h3>
                        </div>
                        <p className="text-red-400/80">
                          There was an issue with token creation
                        </p>
                      </>
                    ) : isCreating || isPending || isConfirming ? (
                      <>
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 2,
                              ease: "linear",
                              repeat: Infinity,
                            }}
                          >
                            <Loader2 className="h-8 w-8 text-blue-400" />
                          </motion.div>
                          <h3 className="text-3xl font-bold text-blue-400">
                            {isCreating
                              ? "Creating Token..."
                              : isPending
                              ? "Transaction Pending..."
                              : "Confirming..."}
                          </h3>
                        </div>
                        <p className="text-blue-400/80">
                          Deploying to blockchain...
                        </p>
                      </>
                    ) : isFormValid ? (
                      <>
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Rocket className="h-8 w-8 text-primary" />
                          </motion.div>
                          <h3 className="text-4xl font-bold text-gradient bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
                            Ready for Launch
                          </h3>
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <Flame className="h-8 w-8 text-orange-400" />
                          </motion.div>
                        </div>
                        <p className="text-primary/80 text-lg font-medium">
                          🔥 All systems go! Your token is ready to ignite! 🔥
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <Clock className="h-8 w-8 text-muted-foreground" />
                          <h3 className="text-3xl font-bold text-muted-foreground">
                            Complete Your Token
                          </h3>
                        </div>
                        <p className="text-muted-foreground/80">
                          Fill out the form to proceed
                        </p>
                      </>
                    )}
                  </div>

                  {/* Ready Animation Dots */}
                  {isFormValid &&
                    !isCreating &&
                    !isPending &&
                    !isConfirming &&
                    !error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-center gap-2"
                      >
                        {[0, 1, 2].map((index) => (
                          <motion.div
                            key={index}
                            className="w-3 h-3 bg-gradient-to-t from-orange-500 to-yellow-400 rounded-full"
                            animate={{
                              scale: [1, 1.4, 1],
                              opacity: [0.6, 1, 0.6],
                              boxShadow: [
                                "0 0 10px rgba(251, 191, 36, 0.3)",
                                "0 0 20px rgba(251, 191, 36, 0.8)",
                                "0 0 10px rgba(251, 191, 36, 0.3)",
                              ],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: index * 0.3,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </motion.div>
                    )}
                </motion.div>
              </div>

              {/* Launch Button */}
              <motion.div
                whileHover={!buttonState.disabled ? { scale: 1.02 } : {}}
                whileTap={!buttonState.disabled ? { scale: 0.98 } : {}}
                className="flex justify-center"
              >
                <Button
                  ref={buttonRef}
                  onClick={onLaunch}
                  disabled={buttonState.disabled}
                  className={`
                    px-12 py-6 text-xl font-bold rounded-2xl transition-all duration-500 relative overflow-hidden group
                    ${
                      buttonState.variant === "ready"
                        ? "btn-primary border-2 border-primary/50 text-white shadow-xl"
                        : buttonState.variant === "loading"
                        ? "bg-primary/20 text-primary border-2 border-primary/30 cursor-wait"
                        : "bg-muted text-muted-foreground border-2 border-muted cursor-not-allowed"
                    }
                  `}
                >
                  {/* Ready state background effect */}
                  {buttonState.variant === "ready" && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  )}

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={buttonState.text}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-3 relative z-10"
                    >
                      <ButtonIcon
                        className={`h-6 w-6 ${
                          buttonState.variant === "loading"
                            ? "animate-spin"
                            : buttonState.variant === "ready"
                            ? "group-hover:scale-110 transition-transform duration-300"
                            : ""
                        }`}
                      />
                      {buttonState.text}
                      {buttonState.variant === "ready" && (
                        <motion.div
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="h-6 w-6" />
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>
          )}

          {/* Error Details */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <div className="unified-card border-red-400/30 bg-red-400/5 p-4">
                  <div className="text-sm">
                    <div className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Error Details
                    </div>
                    <div className="text-red-300/90 font-mono text-xs break-all bg-red-950/20 p-3 rounded border border-red-400/20">
                      {typeof error === "string"
                        ? error
                        : error?.message ||
                          error?.reason ||
                          JSON.stringify(error, null, 2)}
                    </div>
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
