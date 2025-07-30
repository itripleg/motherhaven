// app/not-found.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// TypeScript interface definitions
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "outline";
  [key: string]: any;
}

interface IconProps {
  className?: string;
}

// Simple Button component
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className = "",
  variant = "default",
  ...props
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 text-lg ${
      variant === "outline"
        ? "border-2 border-border bg-secondary/20 hover:bg-secondary/40 text-secondary-foreground backdrop-blur-sm"
        : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105"
    } ${
      disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Icon components
const Home: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m0-11 4 4m0 0v8a1 1 0 0 0 1 1h3m0-11 4 4"
    />
  </svg>
);

const ArrowLeft: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const Search: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

const RefreshCw: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

// Animated Background Component (same as before)
interface BackgroundElement {
  id: string;
  type: "falling" | "floating" | "static";
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  rotation: number;
  rotationEnd: number;
  size: "small" | "medium" | "large" | "xl" | "giant";
  opacity: number;
  top?: number;
}

const NotFoundBackground: React.FC = () => {
  const backgroundElements = useMemo(() => {
    const elements: BackgroundElement[] = [];

    // Falling 404s and question marks (mobile-responsive count)
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const fallingCount = isMobile ? 4 : 8;

    const fallingItems = Array.from({ length: fallingCount }).map((_, i) => {
      const isGiant = i % 6 === 0;

      return {
        id: `falling-${i}`,
        type: "falling" as const,
        emoji: ["❓", "❗", "🔍", "🗺️", "🧭", "📍"][i % 6],
        left: Math.random() * 90 + 5,
        delay: i * 8 + Math.random() * 5,
        duration: 30 + Math.random() * 10,
        rotation: Math.random() * 360,
        rotationEnd: Math.random() * 360 + 360,
        size: isGiant ? "giant" : (["medium", "large", "xl"][i % 3] as any),
        opacity: isGiant ? 0.08 : 0.15,
      };
    });

    // Floating lost elements
    const floatingLost = Array.from({ length: 6 }).map((_, i) => {
      const gridCols = 3;
      const gridRows = 2;
      const col = i % gridCols;
      const row = Math.floor(i / gridCols) % gridRows;
      const baseLeft = 15 + col * 30;
      const baseTop = 25 + row * 40;

      return {
        id: `floating-${i}`,
        type: "floating" as const,
        emoji: ["👻", "🔮", "⭐", "💫", "🌟", "✨"][i % 6],
        left: baseLeft + (Math.random() * 10 - 5),
        top: baseTop + (Math.random() * 10 - 5),
        delay: i * 15 + Math.random() * 8,
        duration: 40 + Math.random() * 15,
        rotation: Math.random() * 360,
        rotationEnd: Math.random() * 360 + 180,
        size: ["large", "xl", "medium"][i % 3] as any,
        opacity: 0.1,
      };
    });

    elements.push(...fallingItems, ...floatingLost);
    return elements;
  }, []);

  const getSizeClass = (size: string) => {
    switch (size) {
      case "small":
        return "text-4xl";
      case "medium":
        return "text-6xl";
      case "large":
        return "text-8xl";
      case "xl":
        return "text-9xl";
      case "giant":
        return "text-[20rem]";
      default:
        return "text-6xl";
    }
  };

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 via-orange-900/5 to-yellow-900/5" />

      {/* Animated elements */}
      {backgroundElements.map((element) => {
        if (element.type === "falling") {
          return (
            <motion.div
              key={element.id}
              className={`absolute ${getSizeClass(element.size)} blur-sm`}
              style={{
                left: `${element.left}%`,
                opacity: element.opacity,
              }}
              initial={{
                y: "-200vh",
                opacity: 0,
                rotate: element.rotation,
              }}
              animate={{
                y: "200vh",
                rotate: element.rotationEnd,
                opacity: [0, element.opacity, element.opacity, 0],
              }}
              transition={{
                duration: element.duration,
                repeat: Infinity,
                delay: element.delay,
                ease: "linear",
                times: [0, 0.1, 0.9, 1],
              }}
            >
              {element.emoji}
            </motion.div>
          );
        }

        if (element.type === "floating") {
          return (
            <motion.div
              key={element.id}
              className={`absolute ${getSizeClass(element.size)} blur-sm`}
              style={{
                left: `${element.left}%`,
                top: `${element.top || 20}%`,
                opacity: element.opacity,
              }}
              animate={{
                y: [-20, 20, -20],
                x: [-10, 10, -10],
                rotate: [
                  element.rotation,
                  element.rotationEnd,
                  element.rotation,
                ],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: element.duration,
                repeat: Infinity,
                delay: element.delay,
                ease: "easeInOut",
              }}
            >
              {element.emoji}
            </motion.div>
          );
        }

        return null;
      })}

      {/* Particle effects */}
      <div className="absolute inset-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-orange-500/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Main 404 Component - Simplified
export default function NotFoundPage() {
  const [mounted, setMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavigation = async (path: string) => {
    setIsNavigating(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    window.location.href = path;
  };

  const handleGoBack = () => {
    window.history.back();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Animated Background */}
      <NotFoundBackground />

      {/* Simple Centered Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-8 max-w-2xl mx-auto">
          {/* 404 Hero - Clean and Simple */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Animated 404 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
              className="relative"
            >
              <div className="text-8xl md:text-9xl font-black bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4">
                404
              </div>

              {/* Floating question mark */}
              <motion.div
                className="absolute -top-4 -right-8 text-6xl"
                animate={{
                  y: [-10, 10, -10],
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                ❓
              </motion.div>
            </motion.div>

            {/* Simple Message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="space-y-4"
            >
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">
                Page Not Found
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                Looks like you&apos;ve wandered into uncharted territory!
                Don&apos;t worry, it happens to the best of us.
              </p>
            </motion.div>
          </motion.div>

          {/* Action Buttons - Same Size */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              onClick={() => handleNavigation("/")}
              disabled={isNavigating}
              className="w-full sm:w-auto group"
            >
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span>Take Me Home</span>
                {isNavigating && (
                  <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                )}
              </div>
            </Button>

            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
