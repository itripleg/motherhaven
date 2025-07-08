// pet/components/PetBackground.tsx
"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface BackgroundBone {
  id: string;
  type: "falling" | "floating" | "static";
  left: number;
  delay: number;
  duration: number;
  rotation: number;
  rotationEnd: number;
  size?: "small" | "medium" | "large";
  opacity?: number;
}

interface PetBackgroundProps {
  variant?: "default" | "minimal" | "festive" | "calm";
  intensity?: "low" | "medium" | "high";
}

export const PetBackground: React.FC<PetBackgroundProps> = ({
  variant = "default",
  intensity = "medium",
}) => {
  // Generate background elements based on variant and intensity
  const backgroundElements = useMemo(() => {
    const elements: BackgroundBone[] = [];

    if (variant === "minimal") {
      // Just a few subtle floating bones
      const floating = Array.from({ length: 2 }).map((_, i) => ({
        id: `float-${i}`,
        type: "floating" as const,
        left: [25, 75][i],
        delay: i * 15,
        duration: 25,
        rotation: [0, 180][i],
        rotationEnd: [360, 540][i],
        size: "medium" as const,
        opacity: 0.08,
      }));

      return floating;
    }

    if (variant === "calm") {
      // Slow, gentle animations
      const calm = Array.from({ length: 3 }).map((_, i) => ({
        id: `calm-${i}`,
        type: "floating" as const,
        left: [20, 50, 80][i],
        delay: i * 20,
        duration: 40,
        rotation: [0, 120, 240][i],
        rotationEnd: [60, 180, 300][i],
        size: "medium" as const,
        opacity: 0.1,
      }));

      return calm;
    }

    if (variant === "festive") {
      // More active with different elements
      const festive: BackgroundBone[] = [];

      // Falling bones
      const falling = Array.from({ length: 4 }).map((_, i) => ({
        id: `fall-${i}`,
        type: "falling" as const,
        left: [10, 35, 65, 90][i],
        delay: i * 12 + 3,
        duration: 30,
        rotation: [0, 90, 180, 270][i],
        rotationEnd: [90, 180, 270, 360][i],
        size: "large" as const,
        opacity: 0.12,
      }));

      // Floating hearts and treats
      const floating = Array.from({ length: 3 }).map((_, i) => ({
        id: `heart-${i}`,
        type: "floating" as const,
        left: [15, 50, 85][i],
        delay: i * 18 + 8,
        duration: 35,
        rotation: [0, 120, 240][i],
        rotationEnd: [360, 480, 600][i],
        size: "small" as const,
        opacity: 0.15,
      }));

      return [...falling, ...floating];
    }

    // Default variant - balanced animation
    const intensity_multiplier =
      intensity === "low" ? 0.7 : intensity === "high" ? 1.3 : 1;
    const bone_count = Math.floor(3 * intensity_multiplier);

    // Main falling bones
    const falling = Array.from({ length: bone_count }).map((_, i) => ({
      id: `fall-${i}`,
      type: "falling" as const,
      left: bone_count === 3 ? [15, 50, 85][i] : [25, 75][i] || 50,
      delay: i * 20 + 5,
      duration: 35,
      rotation: [0, 120, 240][i] || 0,
      rotationEnd: [60, 180, 300][i] || 60,
      size: "large" as const,
      opacity: 0.15,
    }));

    // Add some floating elements for richness
    if (intensity !== "low") {
      const floating = Array.from({ length: 2 }).map((_, i) => ({
        id: `float-${i}`,
        type: "floating" as const,
        left: [30, 70][i],
        delay: i * 25 + 15,
        duration: 45,
        rotation: [0, 180][i],
        rotationEnd: [360, 540][i],
        size: "medium" as const,
        opacity: 0.08,
      }));

      return [...falling, ...floating];
    }

    return falling;
  }, [variant, intensity]);

  const getElementEmoji = (id: string, size: string) => {
    if (id.includes("heart")) return "❤️";
    if (id.includes("treat")) return "🦴";
    return "🦴"; // Default to bone
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case "small":
        return "text-[4rem]";
      case "medium":
        return "text-[6rem]";
      case "large":
        return "text-[8rem]";
      default:
        return "text-[6rem]";
    }
  };

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/5 to-background/20" />

      {/* Animated elements */}
      {backgroundElements.map((element) => {
        if (element.type === "falling") {
          return (
            <motion.div
              key={element.id}
              className={`absolute ${getSizeClass(
                element.size || "large"
              )} blur-sm`}
              style={{
                left: `${element.left}%`,
                opacity: element.opacity || 0.15,
              }}
              initial={{
                y: "-200vh",
                opacity: 0,
                rotate: element.rotation,
              }}
              animate={{
                y: "200vh",
                rotate: element.rotationEnd,
                opacity: [
                  0,
                  element.opacity || 0.15,
                  element.opacity || 0.15,
                  0,
                ],
              }}
              transition={{
                duration: element.duration,
                repeat: Infinity,
                delay: element.delay,
                ease: "linear",
                times: [0, 0.1, 0.9, 1],
              }}
            >
              {getElementEmoji(element.id, element.size || "large")}
            </motion.div>
          );
        }

        if (element.type === "floating") {
          return (
            <motion.div
              key={element.id}
              className={`absolute ${getSizeClass(
                element.size || "medium"
              )} blur-sm`}
              style={{
                left: `${element.left}%`,
                top: "20%",
                opacity: element.opacity || 0.1,
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
              {getElementEmoji(element.id, element.size || "medium")}
            </motion.div>
          );
        }

        return null;
      })}

      {/* Subtle particle effects */}
      <div className="absolute inset-0">
        {Array.from({ length: variant === "festive" ? 8 : 4 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
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

      {/* Static decorative elements for depth */}
      {variant !== "minimal" && (
        <>
          <div className="absolute top-10 left-10 text-4xl opacity-5 blur-sm rotate-12">
            🐾
          </div>
          <div className="absolute top-1/3 right-20 text-6xl opacity-5 blur-sm -rotate-12">
            🐕
          </div>
          <div className="absolute bottom-20 left-1/4 text-3xl opacity-5 blur-sm rotate-45">
            🍖
          </div>
          <div className="absolute bottom-1/3 right-10 text-4xl opacity-5 blur-sm -rotate-45">
            🎾
          </div>
          {variant === "festive" && (
            <>
              <div className="absolute top-20 right-1/3 text-5xl opacity-5 blur-sm rotate-90">
                🎉
              </div>
              <div className="absolute bottom-10 right-1/2 text-3xl opacity-5 blur-sm -rotate-90">
                ✨
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

// Alternative themed backgrounds
export const PetBackgroundStatic: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

      {/* Static decorative pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 text-8xl transform rotate-12 blur-sm">
          🦴
        </div>
        <div className="absolute top-3/4 right-1/4 text-6xl transform -rotate-12 blur-sm">
          🐾
        </div>
        <div className="absolute bottom-1/4 left-1/3 text-5xl transform rotate-45 blur-sm">
          ❤️
        </div>
      </div>
    </div>
  );
};

// Loading state background
export const PetBackgroundLoading: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />

      {/* Gentle pulsing elements */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`loading-${i}`}
          className="absolute text-6xl opacity-10 blur-sm"
          style={{
            left: `${[25, 50, 75][i]}%`,
            top: `${[30, 60, 40][i]}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        >
          🐕
        </motion.div>
      ))}
    </div>
  );
};

// Error state background
export const PetBackgroundError: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5" />

      {/* Subtle sad elements */}
      <div className="absolute top-1/3 left-1/3 text-8xl opacity-5 blur-sm">
        😵
      </div>
      <div className="absolute bottom-1/3 right-1/3 text-6xl opacity-5 blur-sm">
        💔
      </div>
    </div>
  );
};
