import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddressComponent } from "@/components/AddressComponent";
import { TokenCreationInfo } from "@/types";
import {
  Rocket,
  Upload,
  Flame,
  Zap,
  CheckCircle,
  Trophy,
  ArrowRight,
  AlertTriangle,
  Clock,
  Sparkles,
  Star,
  Crown,
  Users,
  TrendingUp,
  Shield,
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
    initialSupply: number;
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
  const getButtonState = () => {
    if (uploadingImage)
      return { text: "Uploading Image...", icon: Upload, disabled: true };
    if (isPending || isCreating)
      return { text: "Creating Token...", icon: Flame, disabled: true };
    if (isConfirming)
      return { text: "Confirming...", icon: Zap, disabled: true };
    if (!isFormValid)
      return {
        text: "Complete Form to Launch",
        icon: AlertTriangle,
        disabled: true,
      };
    return { text: "Launch Token", icon: Rocket, disabled: false };
  };

  const buttonState = getButtonState();
  const ButtonIcon = buttonState.icon;

  return (
    <div className="space-y-8">
      {/* Main Launch Card */}
      <Card className="unified-card border-primary/20 overflow-hidden">
        <CardContent className="p-8 text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-6">
            {/* Animated Rocket */}
            <motion.div
              animate={{
                rotate: isCreating ? 360 : 0,
                scale: isCreating ? [1, 1.1, 1] : 1,
              }}
              transition={{
                rotate: { duration: 2, repeat: isCreating ? Infinity : 0 },
                scale: { duration: 1, repeat: isCreating ? Infinity : 0 },
              }}
              className="relative"
            >
              <div className="p-8 unified-card border-primary/30 w-fit mx-auto bg-gradient-to-br from-primary/10 to-primary/5">
                <Rocket className="h-20 w-20 text-primary" />

                {/* Launch Trail Effect */}
                {isCreating && (
                  <motion.div
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <div className="flex space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-4 bg-orange-400 rounded-full"
                          animate={{ y: [0, 10, 0] }}
                          transition={{
                            duration: 0.5,
                            delay: i * 0.1,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Dynamic Title */}
            <div className="space-y-3">
              <motion.h3
                key={isCreating ? "creating" : "ready"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-gradient"
              >
                {isCreating
                  ? "🚀 Launching..."
                  : receipt
                  ? "🎉 Launch Successful!"
                  : isFormValid
                  ? "Ready for Launch!"
                  : "Complete Your Token"}
              </motion.h3>

              <motion.p
                key={isFormValid ? "valid" : "invalid"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg text-muted-foreground max-w-2xl mx-auto"
              >
                {isCreating
                  ? "Your token is being deployed to the blockchain..."
                  : receipt
                  ? "Your token is now live and ready for trading!"
                  : isFormValid
                  ? "All systems go! Your token is ready to launch."
                  : "Fill out all required fields to proceed with token creation."}
              </motion.p>
            </div>

            {/* Form Validation Status */}
            {!isFormValid && !receipt && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 unified-card border-yellow-400/30 bg-yellow-400/10"
              >
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  Required Fields
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {[
                    { label: "Token Name", completed: !!tokenInfo.name },
                    { label: "Symbol", completed: !!tokenInfo.ticker },
                    {
                      label: "Description",
                      completed: !!tokenInfo.description,
                    },
                    {
                      label: "Image",
                      completed: !!tokenInfo.image,
                      optional: true,
                    },
                  ].map((field) => (
                    <div
                      key={field.label}
                      className={`flex items-center gap-2 p-2 rounded ${
                        field.completed
                          ? "text-green-400 bg-green-400/10"
                          : field.optional
                          ? "text-blue-400 bg-blue-400/10"
                          : "text-yellow-400 bg-yellow-400/10"
                      }`}
                    >
                      {field.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      <span className="text-xs">
                        {field.label}
                        {field.optional && !field.completed
                          ? " (Optional)"
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Success Status */}
            {isFormValid && !receipt && !isCreating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 unified-card border-primary/30 bg-primary/10"
              >
                <div className="flex items-center justify-center gap-3 text-primary">
                  <CheckCircle className="h-6 w-6" />
                  <span className="font-semibold text-lg">
                    All systems go! Ready to launch
                  </span>
                  <Sparkles className="h-5 w-5" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Launch Button */}
          <motion.div
            whileHover={!buttonState.disabled ? { scale: 1.02 } : {}}
            whileTap={!buttonState.disabled ? { scale: 0.98 } : {}}
          >
            <Button
              onClick={onLaunch}
              disabled={buttonState.disabled}
              className={`
                px-16 py-6 text-xl font-bold rounded-2xl transition-all duration-500 group relative overflow-hidden
                ${
                  !buttonState.disabled
                    ? "btn-primary hover:shadow-2xl hover:shadow-primary/25 border-2 border-primary/50"
                    : "bg-muted text-muted-foreground cursor-not-allowed border-2 border-muted"
                }
              `}
            >
              {/* Button Background Animation */}
              {!buttonState.disabled && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={buttonState.text}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 relative z-10"
                >
                  <ButtonIcon
                    className={`h-6 w-6 ${
                      isCreating || isPending || isConfirming
                        ? "animate-pulse"
                        : !buttonState.disabled
                        ? "group-hover:translate-y-[-2px] transition-transform duration-300"
                        : ""
                    }`}
                  />
                  {buttonState.text}
                  {!buttonState.disabled && !isCreating && (
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
                  )}
                </motion.div>
              </AnimatePresence>
            </Button>
          </motion.div>

          {/* Transaction Status Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 unified-card border-red-400/30 bg-red-400/10"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-400 mb-2">
                      Launch Failed
                    </h4>
                    <p className="text-sm text-red-300">
                      {error.message ||
                        "An unexpected error occurred. Please try again."}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {receipt && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="p-8 unified-card border-green-400/30 bg-green-400/10"
              >
                <div className="space-y-6">
                  {/* Success Header */}
                  <div className="flex items-center justify-center gap-3 text-green-400">
                    <Trophy className="h-8 w-8" />
                    <h3 className="text-2xl font-bold">
                      Token Created Successfully!
                    </h3>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, ease: "linear" }}
                    >
                      <Star className="h-6 w-6" />
                    </motion.div>
                  </div>

                  {/* Token Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground">
                        Token Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium text-foreground">
                            {tokenInfo.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Symbol:</span>
                          <span className="font-medium text-foreground">
                            {tokenInfo.ticker}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Image:</span>
                          <span className="font-medium text-foreground">
                            {tokenInfo.image ? "✅ Included" : "❌ None"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground">
                        Economics
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Funding Goal:
                          </span>
                          <span className="font-medium text-foreground">
                            {tokenomics.fundingGoal} AVAX
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Max Supply:
                          </span>
                          <span className="font-medium text-foreground">
                            {tokenomics.maxSupply.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Curve Type:
                          </span>
                          <span className="font-medium text-foreground capitalize">
                            {tokenomics.bondingCurve}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="pt-6 border-t border-green-400/20">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        Transaction Hash:
                      </span>
                      <AddressComponent hash={`${transactionData}`} type="tx" />
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="pt-4 border-t border-green-400/20">
                    <h4 className="font-semibold text-foreground mb-3 text-center">
                      🎯 What's Next?
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                        <div className="font-medium text-foreground">
                          Share with Community
                        </div>
                        <div className="text-muted-foreground text-xs mt-1">
                          Get early adopters
                        </div>
                      </div>
                      <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
                        <div className="font-medium text-foreground">
                          Monitor Trading
                        </div>
                        <div className="text-muted-foreground text-xs mt-1">
                          Track your token's progress
                        </div>
                      </div>
                      <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <Crown className="h-6 w-6 text-primary mx-auto mb-2" />
                        <div className="font-medium text-foreground">
                          Reach Funding Goal
                        </div>
                        <div className="text-muted-foreground text-xs mt-1">
                          Graduate to Uniswap
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Features Showcase */}
      {!receipt && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: Zap,
              title: "Instant Trading",
              description:
                "Your token is immediately tradeable with built-in liquidity",
              color: "text-blue-400",
              bgColor: "bg-blue-400/10",
              borderColor: "border-blue-400/30",
            },
            {
              icon: Users,
              title: "Community Driven",
              description:
                "Bonding curves ensure fair price discovery for all participants",
              color: "text-green-400",
              bgColor: "bg-green-400/10",
              borderColor: "border-green-400/30",
            },
            {
              icon: Shield,
              title: "Built-in Safety",
              description:
                "Anti-MEV protection and whale limits built into every token",
              color: "text-purple-400",
              bgColor: "bg-purple-400/10",
              borderColor: "border-purple-400/30",
            },
          ].map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card
                  className={`unified-card text-center h-full ${feature.borderColor}`}
                >
                  <CardContent className="p-6 space-y-4">
                    <div
                      className={`p-4 ${feature.bgColor} rounded-xl ${feature.borderColor} border w-fit mx-auto`}
                    >
                      <FeatureIcon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
