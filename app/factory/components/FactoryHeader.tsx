// app/factory/components/FactoryHeader.tsx - UPDATED: Contract stats only, no Firebase reads
import { motion } from "framer-motion";
import {
  Rocket,
  Sparkles,
  CheckCircle,
  Zap,
  Crown,
  Star,
  Coins,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface PlatformStats {
  totalTokens: number;
  loading: boolean;
}

interface FactoryHeaderProps {
  platformStats: PlatformStats;
}

export function FactoryHeader({ platformStats }: FactoryHeaderProps) {
  return (
    <div className="text-center space-y-8">
      {/* Main Hero Section */}
      <div className="relative">
        {/* Floating Icons Animation - Hidden on mobile for cleaner look */}
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-0 left-1/4 opacity-20"
          >
            <Star className="h-8 w-8 text-primary" />
          </motion.div>

          <motion.div
            animate={{
              y: [-10, 10, -10],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-10 right-1/4 opacity-20"
          >
            <Coins className="h-6 w-6 text-primary" />
          </motion.div>

          <motion.div
            animate={{
              x: [-5, 5, -5],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-0 left-1/3 opacity-20"
          >
            <TrendingUp className="h-7 w-7 text-primary" />
          </motion.div>
        </div>

        {/* Main Title Section */}
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center justify-center gap-6 mb-8"
          >
            {/* Title */}
            <div className="text-center">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-gradient bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
              >
                Grand Factory
              </motion.h1>
            </div>
          </motion.div>

          {/* Subtitle with Glow Effect */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-xl rounded-full" />
            <p className="relative text-sm md:text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed px-4">
              Launch your Tokenized Community in minutes with our no-code
              platform.
              <span className="text-primary font-semibold"> Fair launch</span>,
              <span className="text-primary font-semibold">
                {" "}
                instant liquidity
              </span>
              , and
              <span className="text-primary font-semibold">
                {" "}
                community-driven
              </span>{" "}
              tokenomics.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Feature Pills - Hidden on mobile for cleaner mobile experience */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="hidden md:flex flex-wrap items-center justify-center gap-4 md:gap-8"
      >
        {[
          {
            icon: CheckCircle,
            text: "Instant Launch",
            color: "text-green-400",
          },
          { icon: Zap, text: "Auto Liquidity", color: "text-blue-400" },
          { icon: Crown, text: "No Code Required", color: "text-purple-400" },
        ].map((feature, index) => (
          <motion.div
            key={feature.text}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.9 + index * 0.1,
              duration: 0.6,
              type: "spring",
              stiffness: 100,
            }}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.2 },
            }}
            className="group"
          >
            <div className="flex items-center gap-3 px-6 py-3 unified-card border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-300">
              <feature.icon
                className={`h-5 w-5 ${feature.color} group-hover:scale-110 transition-transform duration-300`}
              />
              <span className="text-foreground font-medium group-hover:text-primary transition-colors duration-300">
                {feature.text}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Contract-based Platform Stats - Just token count */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="flex justify-center"
      >
        {platformStats.loading ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 1.3,
              duration: 0.6,
              type: "spring",
            }}
            className="text-center"
          >
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
              {platformStats.totalTokens >= 1000
                ? `${(platformStats.totalTokens / 1000).toFixed(1)}K`
                : platformStats.totalTokens.toString()}
            </div>
            <div className="text-sm md:text-base text-muted-foreground">
              Tokens Created
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Call-to-Action Hint - Simplified for mobile */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="relative"
      >
        <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="w-2 h-2 bg-primary rounded-full" />
          </motion.div>
          <span className="text-xs md:text-sm text-primary font-medium">
            Ready to launch your token?
          </span>
        </div>

        {/* Subtle Arrow Pointing Down */}
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary/40" />
        </motion.div>
      </motion.div>
    </div>
  );
}
