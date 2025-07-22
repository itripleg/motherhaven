// pet/components/PetBackground.tsx
"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface BackgroundElement {
  id: string;
  type: "falling" | "floating" | "static" | "spiral";
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  rotation: number;
  rotationEnd: number;
  size?: "small" | "medium" | "large" | "xl" | "giant";
  opacity?: number;
}

interface PetBackgroundProps {
  variant?: "alive" | "dead" | "happy" | "sick" | "minimal";
  intensity?: "low" | "medium" | "high";
  petIsAlive?: boolean; // Override variant based on pet status
}

export const PetBackground: React.FC<PetBackgroundProps> = ({
  variant = "alive",
  intensity = "medium",
  petIsAlive = true,
}) => {
  // Auto-determine variant based on pet status if provided
  const effectiveVariant = petIsAlive === false ? "dead" : variant;

  // Generate background elements based on variant and intensity
  const backgroundElements = useMemo(() => {
    const elements: BackgroundElement[] = [];
    const intensityMultiplier = 
      intensity === "low" ? 0.6 : intensity === "high" ? 1.4 : 1;
    
    if (effectiveVariant === "minimal") {
      // Just a few subtle floating elements
      const floating = Array.from({ length: Math.ceil(3 * intensityMultiplier) }).map((_, i) => ({
        id: `float-${i}`,
        type: "floating" as const,
        emoji: "🦴",
        left: [25, 50, 75][i] || 50,
        delay: i * 15,
        duration: 30,
        rotation: [0, 120, 240][i] || 0,
        rotationEnd: [60, 180, 300][i] || 60,
        size: "medium" as const,
        opacity: 0.05,
      }));
      return floating;
    }

    if (effectiveVariant === "dead") {
      // Spooky dead pet background with skulls, ghosts, etc.
      const spookyElements: BackgroundElement[] = [];
      
      // Falling skulls and bones
      const fallingSpooky = Array.from({ length: Math.ceil(4 * intensityMultiplier) }).map((_, i) => ({
        id: `spooky-fall-${i}`,
        type: "falling" as const,
        emoji: ["💀", "👻", "🦴", "⚰️"][i % 4],
        left: [15, 35, 65, 85][i] || Math.random() * 80 + 10,
        delay: i * 8 + Math.random() * 5,
        duration: 25 + Math.random() * 10,
        rotation: Math.random() * 360,
        rotationEnd: Math.random() * 360 + 360,
        size: ["medium", "large", "small", "medium"][i % 4] as any,
        opacity: 0.15,
      }));

      // Floating ghosts and spirits
      const floatingSpirits = Array.from({ length: Math.ceil(3 * intensityMultiplier) }).map((_, i) => ({
        id: `spirit-${i}`,
        type: "floating" as const,
        emoji: ["👻", "🌫️", "💀"][i % 3],
        left: [20, 50, 80][i] || 50,
        delay: i * 12 + 3,
        duration: 40 + Math.random() * 15,
        rotation: [0, 120, 240][i] || 0,
        rotationEnd: [30, 150, 270][i] || 30,
        size: "large" as const,
        opacity: 0.12,
      }));

      // Spiral smoke/mist effect
      const spiralMist = Array.from({ length: Math.ceil(2 * intensityMultiplier) }).map((_, i) => ({
        id: `mist-${i}`,
        type: "spiral" as const,
        emoji: "🌫️",
        left: [30, 70][i] || 50,
        delay: i * 20 + 5,
        duration: 50,
        rotation: 0,
        rotationEnd: 720, // Two full rotations
        size: "xl" as const,
        opacity: 0.08,
      }));

      spookyElements.push(...fallingSpooky, ...floatingSpirits, ...spiralMist);

      // Add some static tombstones and crosses
      if (intensity !== "low") {
        const staticSpooky = [
          { emoji: "⚰️", left: 10, opacity: 0.06 },
          { emoji: "🪦", left: 90, opacity: 0.06 },
          { emoji: "⚱️", left: 75, opacity: 0.05 },
        ].map((item, i) => ({
          id: `static-spooky-${i}`,
          type: "static" as const,
          emoji: item.emoji,
          left: item.left,
          delay: 0,
          duration: 0,
          rotation: Math.random() * 30 - 15,
          rotationEnd: 0,
          size: "large" as const,
          opacity: item.opacity,
        }));
        spookyElements.push(...staticSpooky);
      }

      return spookyElements;
    }

    if (effectiveVariant === "happy") {
      // Happy, energetic background
      const happyElements: BackgroundElement[] = [];

      // Bouncing treats and toys - more variety!
      const bouncingTreats = Array.from({ length: Math.ceil(6 * intensityMultiplier) }).map((_, i) => ({
        id: `happy-bounce-${i}`,
        type: "floating" as const,
        emoji: ["🦴", "🍖", "❤️", "✨", "🎉", "🎈", "🌈"][i % 7],
        left: [8, 20, 32, 44, 56, 68, 80, 92][i] || Math.random() * 80 + 10,
        delay: i * 5,
        duration: 18 + Math.random() * 12,
        rotation: 0,
        rotationEnd: 360,
        size: ["xl", "large", "xl", "large", "medium", "xl", "large"][i % 7] as any,
        opacity: 0.18,
      }));

      // Sparkling hearts and stars
      const sparkles = Array.from({ length: Math.ceil(5 * intensityMultiplier) }).map((_, i) => ({
        id: `sparkle-${i}`,
        type: "falling" as const,
        emoji: ["✨", "💖", "⭐", "🌟", "💫", "🎆"][i % 6],
        left: Math.random() * 100,
        delay: i * 6 + Math.random() * 8,
        duration: 25,
        rotation: 0,
        rotationEnd: 720,
        size: ["large", "xl", "medium", "large", "xl", "giant"][i % 6] as any,
        opacity: 0.2,
      }));

      happyElements.push(...bouncingTreats, ...sparkles);
      return happyElements;
    }

    if (effectiveVariant === "sick") {
      // Sick/low health background - darker, slower
      const sickElements: BackgroundElement[] = [];

      // Slow falling pills and thermometers
      const medicalItems = Array.from({ length: Math.ceil(3 * intensityMultiplier) }).map((_, i) => ({
        id: `sick-${i}`,
        type: "falling" as const,
        emoji: ["🩹", "💊", "🌡️"][i % 3],
        left: [20, 50, 80][i] || 50,
        delay: i * 15,
        duration: 45, // Slower
        rotation: [0, 120, 240][i] || 0,
        rotationEnd: [90, 210, 330][i] || 90,
        size: "medium" as const,
        opacity: 0.1,
      }));

      // Floating worry clouds
      const worryClouds = Array.from({ length: Math.ceil(2 * intensityMultiplier) }).map((_, i) => ({
        id: `worry-${i}`,
        type: "floating" as const,
        emoji: "☁️",
        left: [30, 70][i] || 50,
        delay: i * 20 + 10,
        duration: 50,
        rotation: 0,
        rotationEnd: 30,
        size: "large" as const,
        opacity: 0.08,
      }));

      sickElements.push(...medicalItems, ...worryClouds);
      return sickElements;
    }

    // Default "alive" variant - healthy, active pet
    const aliveElements: BackgroundElement[] = [];

    // Main falling bones and treats - NO DOGS!
    const fallingTreats = Array.from({ length: Math.ceil(5 * intensityMultiplier) }).map((_, i) => ({
      id: `alive-fall-${i}`,
      type: "falling" as const,
      emoji: ["🦴", "🍖", "🥎", "🍗"][i % 4],
      left: [12, 25, 38, 51, 64, 77, 90][i] || Math.random() * 80 + 10,
      delay: i * 10 + Math.random() * 5,
      duration: 30 + Math.random() * 15,
      rotation: [0, 45, 90, 135, 180, 225, 270, 315][i] || 0,
      rotationEnd: [120, 165, 210, 255, 300, 345, 30, 75][i] || 120,
      size: ["large", "xl", "medium", "large"][i % 4] as any,
      opacity: 0.15,
    }));

    // Floating paw prints and hearts
    const floatingLove = Array.from({ length: Math.ceil(4 * intensityMultiplier) }).map((_, i) => ({
      id: `alive-float-${i}`,
      type: "floating" as const,
      emoji: ["🐾", "❤️", "💖"][i % 3],
      left: [18, 35, 52, 68, 82][i] || 50,
      delay: i * 15 + 5,
      duration: 35 + Math.random() * 20,
      rotation: [0, 90, 180, 270][i % 4] || 0,
      rotationEnd: [60, 150, 240, 330][i % 4] || 60,
      size: ["xl", "large", "xl"][i % 3] as any,
      opacity: 0.12,
    }));

    // GIANT occasional elements for visual impact
    const giantElements = Array.from({ length: Math.ceil(2 * intensityMultiplier) }).map((_, i) => ({
      id: `giant-${i}`,
      type: "floating" as const,
      emoji: ["🦴", "🍖", "❤️"][i % 3],
      left: [30, 70][i] || 50,
      delay: i * 25 + 10,
      duration: 60,
      rotation: 0,
      rotationEnd: 180,
      size: "giant" as const,
      opacity: 0.06,
    }));

    aliveElements.push(...fallingTreats, ...floatingLove, ...giantElements);
    return aliveElements;
  }, [effectiveVariant, intensity]);

  const getSizeClass = (size: string) => {
    switch (size) {
      case "small":
        return "text-4xl"; // Doubled from 2xl
      case "medium":
        return "text-6xl"; // Doubled from 4xl
      case "large":
        return "text-8xl"; // Doubled from 6xl
      case "xl":
        return "text-9xl"; // Doubled from 8xl
      case "giant":
        return "text-[12rem]"; // GIANT size for occasional impact
      default:
        return "text-6xl"; // Default is now larger
    }
  };

  const getStaticElements = () => {
    if (effectiveVariant === "dead") {
      return (
        <>
          <div className="absolute top-20 left-10 text-3xl opacity-5 blur-sm rotate-12">💀</div>
          <div className="absolute top-1/3 right-20 text-4xl opacity-5 blur-sm -rotate-12">👻</div>
          <div className="absolute bottom-20 left-1/4 text-2xl opacity-5 blur-sm rotate-45">⚰️</div>
          <div className="absolute bottom-1/3 right-10 text-3xl opacity-5 blur-sm -rotate-45">🪦</div>
          <div className="absolute top-1/2 left-1/2 text-6xl opacity-3 blur-lg -rotate-12">💀</div>
        </>
      );
    }
    
    if (effectiveVariant === "happy") {
      return (
        <>
          <div className="absolute top-10 left-10 text-3xl opacity-8 blur-sm rotate-12">🎉</div>
          <div className="absolute top-1/3 right-20 text-4xl opacity-8 blur-sm -rotate-12">✨</div>
          <div className="absolute bottom-20 left-1/4 text-2xl opacity-8 blur-sm rotate-45">🌈</div>
          <div className="absolute bottom-1/3 right-10 text-3xl opacity-8 blur-sm -rotate-45">⭐</div>
        </>
      );
    }

    // Default alive static elements
    if (effectiveVariant !== "minimal") {
      return (
        <>
          <div className="absolute top-10 left-10 text-3xl opacity-5 blur-sm rotate-12">🐾</div>
          <div className="absolute top-1/3 right-20 text-4xl opacity-5 blur-sm -rotate-12">🐕</div>
          <div className="absolute bottom-20 left-1/4 text-2xl opacity-5 blur-sm rotate-45">🍖</div>
          <div className="absolute bottom-1/3 right-10 text-3xl opacity-5 blur-sm -rotate-45">🎾</div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay for depth - varies by variant */}
      <div className={`absolute inset-0 ${
        effectiveVariant === "dead" 
          ? "bg-gradient-to-b from-red-900/10 via-gray-900/10 to-purple-900/20"
          : effectiveVariant === "happy"
          ? "bg-gradient-to-b from-yellow-300/5 via-pink-300/5 to-blue-300/10"
          : effectiveVariant === "sick"
          ? "bg-gradient-to-b from-gray-500/10 via-blue-500/5 to-gray-600/15"
          : "bg-gradient-to-b from-transparent via-background/5 to-background/20"
      }`} />

      {/* Animated elements */}
      {backgroundElements.map((element) => {
        if (element.type === "falling") {
          return (
            <motion.div
              key={element.id}
              className={`absolute ${getSizeClass(element.size || "medium")} blur-sm`}
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
                opacity: [0, element.opacity || 0.15, element.opacity || 0.15, 0],
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
              className={`absolute ${getSizeClass(element.size || "medium")} blur-sm`}
              style={{
                left: `${element.left}%`,
                top: "20%",
                opacity: element.opacity || 0.1,
              }}
              animate={{
                y: [-20, 20, -20],
                x: [-10, 10, -10],
                rotate: [element.rotation, element.rotationEnd, element.rotation],
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

        if (element.type === "spiral") {
          return (
            <motion.div
              key={element.id}
              className={`absolute ${getSizeClass(element.size || "large")} blur-sm`}
              style={{
                left: `${element.left}%`,
                top: "40%",
                opacity: element.opacity || 0.08,
              }}
              animate={{
                rotate: [0, element.rotationEnd],
                scale: [0.8, 1.2, 0.8],
                y: [-30, 30, -30],
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

        if (element.type === "static") {
          return (
            <div
              key={element.id}
              className={`absolute ${getSizeClass(element.size || "medium")} blur-sm`}
              style={{
                left: `${element.left}%`,
                bottom: "10%",
                opacity: element.opacity || 0.05,
                transform: `rotate(${element.rotation}deg)`,
              }}
            >
              {element.emoji}
            </div>
          );
        }

        return null;
      })}

      {/* Subtle particle effects */}
      <div className="absolute inset-0">
        {Array.from({ 
          length: effectiveVariant === "happy" ? 8 : effectiveVariant === "dead" ? 6 : 4 
        }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className={`absolute w-1 h-1 rounded-full ${
              effectiveVariant === "dead" 
                ? "bg-red-500/20" 
                : effectiveVariant === "happy"
                ? "bg-yellow-400/30"
                : "bg-primary/20"
            }`}
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

      {/* Static decorative elements */}
      {getStaticElements()}
    </div>
  );
};

// Alternative themed backgrounds for specific states
export const PetBackgroundDead: React.FC = () => {
  return <PetBackground variant="dead" intensity="medium" petIsAlive={false} />;
};

export const PetBackgroundHappy: React.FC = () => {
  return <PetBackground variant="happy" intensity="high" petIsAlive={true} />;
};

export const PetBackgroundSick: React.FC = () => {
  return <PetBackground variant="sick" intensity="low" petIsAlive={true} />;
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