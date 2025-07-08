// pet/components/LoadingState.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Heart, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingStateProps } from "../types";

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading your pet...",
}) => {
  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            {/* Animated Pet Avatar */}
            <motion.div
              className="relative mx-auto w-24 h-24 flex items-center justify-center"
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="text-6xl">🐕</div>

              {/* Floating hearts animation */}
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{
                  y: [-5, -15, -5],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Heart className="h-4 w-4 text-pink-400 fill-current" />
              </motion.div>

              <motion.div
                className="absolute -bottom-1 -left-2"
                animate={{
                  y: [5, -5, 5],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              >
                <Sparkles className="h-3 w-3 text-yellow-400" />
              </motion.div>
            </motion.div>

            {/* Loading Text */}
            <div className="space-y-3">
              <motion.h2
                className="text-xl font-bold text-foreground"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {message}
              </motion.h2>

              <motion.p
                className="text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Connecting to the blockchain and fetching pet data...
              </motion.p>
            </div>

            {/* Animated Loading Spinner */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </motion.div>

            {/* Loading Steps */}
            <motion.div
              className="space-y-2 text-xs text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <LoadingStep
                text="Connecting to contract"
                delay={0}
                duration={1.5}
              />
              <LoadingStep
                text="Reading pet status"
                delay={1.5}
                duration={1.5}
              />
              <LoadingStep
                text="Calculating health decay"
                delay={3}
                duration={1.5}
              />
              <LoadingStep
                text="Loading community stats"
                delay={4.5}
                duration={1.5}
              />
            </motion.div>

            {/* Pet Care Tip */}
            <motion.div
              className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <div className="flex items-start gap-2">
                <div className="text-lg">💡</div>
                <div className="text-left">
                  <div className="font-medium text-blue-700 dark:text-blue-300 text-sm">
                    Pro Tip
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                    Pets lose 1 health point every hour. Feed them regularly to
                    keep them happy and healthy!
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Animated Progress Bar */}
            <motion.div
              className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// Helper component for individual loading steps
const LoadingStep: React.FC<{
  text: string;
  delay: number;
  duration: number;
}> = ({ text, delay, duration }) => {
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{
        delay,
        duration,
        repeat: Infinity,
        repeatDelay: 2,
      }}
    >
      <motion.div
        className="w-1.5 h-1.5 bg-primary rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{
          delay: delay + 0.2,
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: duration + 1.4,
        }}
      />
      <span>{text}</span>
    </motion.div>
  );
};

// Alternative minimal loading state for quick loads
export const MinimalLoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
}) => {
  return (
    <motion.div
      className="flex items-center justify-center gap-3 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="text-2xl"
        animate={{
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        🐕
      </motion.div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{message}</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 bg-primary rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Skeleton loading state for specific sections
export const PetSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full" />
            <div className="space-y-2">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32" />
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status skeleton */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-40" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="h-16 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Stats skeleton */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-300 dark:bg-gray-700 rounded"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
