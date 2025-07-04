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
} from "lucide-react";

interface FactoryProgressProps {
  completionPercentage: number;
}

const progressSteps = [
  {
    id: "info",
    label: "Token Details",
    icon: Lightbulb,
    description: "Name, symbol & image",
    threshold: 25,
  },
  {
    id: "tokenomics",
    label: "Economics",
    icon: TrendingUp,
    description: "Funding & supply",
    threshold: 50,
  },
  {
    id: "preview",
    label: "Preview",
    icon: Star,
    description: "Review & verify",
    threshold: 75,
  },
  {
    id: "launch",
    label: "Launch",
    icon: Rocket,
    description: "Deploy to blockchain",
    threshold: 100,
  },
];

export function FactoryProgress({
  completionPercentage,
}: FactoryProgressProps) {
  const getStepStatus = (threshold: number) => {
    if (completionPercentage >= threshold) return "completed";
    if (completionPercentage >= threshold - 25) return "current";
    return "pending";
  };

  const getProgressColor = () => {
    if (completionPercentage === 100) return "from-green-500 to-emerald-400";
    if (completionPercentage >= 75) return "from-blue-500 to-primary";
    if (completionPercentage >= 50) return "from-yellow-500 to-orange-400";
    if (completionPercentage >= 25) return "from-purple-500 to-primary";
    return "from-gray-500 to-gray-400";
  };

  const getProgressMessage = () => {
    if (completionPercentage === 100) return "🚀 Ready for launch!";
    if (completionPercentage >= 75) return "📋 Almost there! Review your token";
    if (completionPercentage >= 50) return "💰 Configure tokenomics";
    if (completionPercentage >= 25) return "✨ Add more details";
    return "🏗️ Start building your token";
  };

  return (
    <Card className="unified-card border-primary/30 overflow-hidden">
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: completionPercentage === 100 ? 360 : 0 }}
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
            key={completionPercentage}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Badge
              variant="outline"
              className={`
                px-4 py-2 text-base font-bold border-2 transition-all duration-500
                ${
                  completionPercentage === 100
                    ? "bg-green-500/20 text-green-400 border-green-400/50 shadow-green-400/20 shadow-lg"
                    : "bg-primary/20 text-primary border-primary/50"
                }
              `}
            >
              {completionPercentage}% Complete
            </Badge>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-secondary/50 rounded-full h-4 overflow-hidden border border-border/50">
            <motion.div
              className={`h-full bg-gradient-to-r ${getProgressColor()} relative`}
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {/* Shimmer Effect */}
              {completionPercentage > 0 && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}
            </motion.div>
          </div>

          {/* Progress Markers */}
          <div className="flex justify-between mt-2 px-1">
            {[0, 25, 50, 75, 100].map((mark) => (
              <div
                key={mark}
                className={`text-xs transition-colors duration-300 ${
                  completionPercentage >= mark
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {mark}%
              </div>
            ))}
          </div>
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {progressSteps.map((step, index) => {
            const status = getStepStatus(step.threshold);
            const StepIcon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-300
                  ${
                    status === "completed"
                      ? "bg-primary/10 border-primary/50 shadow-primary/20 shadow-sm"
                      : status === "current"
                      ? "bg-primary/5 border-primary/30 shadow-primary/10 shadow-sm"
                      : "bg-secondary/30 border-border/30"
                  }
                `}
              >
                {/* Step Header */}
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`
                    p-2 rounded-lg border transition-all duration-300
                    ${
                      status === "completed"
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
                        status === "completed" || status === "current"
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
                          status === "current"
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
                    font-semibold text-sm transition-colors duration-300
                    ${
                      status === "completed" || status === "current"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  `}
                  >
                    {step.label}
                  </h4>
                  <p
                    className={`
                    text-xs mt-1 transition-colors duration-300
                    ${
                      status === "completed" || status === "current"
                        ? "text-muted-foreground"
                        : "text-muted-foreground/70"
                    }
                  `}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Current Step Pulse */}
                {status === "current" && (
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

                {/* Completion Celebration */}
                {status === "completed" &&
                  completionPercentage === 100 &&
                  index === progressSteps.length - 1 && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                    >
                      <div className="absolute top-1 right-1">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, ease: "linear" }}
                        >
                          ✨
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
              </motion.div>
            );
          })}
        </div>

        {/* Quick Tips */}
        {completionPercentage < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <div className="p-1 bg-primary/20 rounded">
                <Target className="h-3 w-3 text-primary" />
              </div>
              <div className="text-sm">
                <p className="text-foreground font-medium mb-1">💡 Quick Tip</p>
                <p className="text-muted-foreground">
                  {completionPercentage === 0 &&
                    "Start by giving your token a memorable name and symbol."}
                  {completionPercentage === 25 &&
                    "Add a compelling description to attract investors."}
                  {completionPercentage === 50 &&
                    "Upload an eye-catching image to make your token stand out."}
                  {completionPercentage === 75 &&
                    "Review all details carefully before launching."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
