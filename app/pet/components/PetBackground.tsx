// pet/components/PetBackground.tsx
"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface BackgroundElement {
  id: string;
  type: "falling" | "floating" | "static";
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  rotation: number;
  rotationEnd: number;
  size?: "small" | "medium" | "large" | "xl";
  opacity?: number;
}

interface PetBackgroundProps {
  variant?: "alive" | "dead" | "minimal";
  intensity?: "low" | "medium" | "high";
  petIsAlive?: boolean; // Override variant based on pet status
  holiday?: "none" | "christmas" | "halloween" | "valentine"; // Future holiday support
}

export const PetBackground: React.FC<PetBackgroundProps> = ({
  variant = "alive",
  intensity = "medium",
  petIsAlive = true,
  holiday = "none",
}) => {
  // Auto-determine variant based on pet status
  const effectiveVariant = petIsAlive === false ? "dead" : variant;

  // Generate background elements based on variant and intensity
  const backgroundElements = useMemo(() => {
    const elements: BackgroundElement[] = [];
    const intensityMultiplier =
      intensity === "low" ? 0.6 : intensity === "high" ? 1.4 : 1;

    // Holiday override (future feature)
    if (holiday !== "none") {
      // Future holiday themes can be added here
      // For now, just return regular variant
    }

    if (effectiveVariant === "minimal") {
      // Just a few subtle floating elements (doubled count)
      const floating = Array.from({
        length: Math.ceil(4 * intensityMultiplier),
      }).map((_, i) => ({
        id: `float-${i}`,
        type: "floating" as const,
        emoji: "🦴",
        left: Math.random() * 90 + 5, // Spread across full width
        delay: i * 20,
        duration: 30,
        rotation: Math.random() * 360,
        rotationEnd: Math.random() * 360 + 180,
        size: "medium" as const,
        opacity: 0.05,
      }));
      return floating;
    }

    if (effectiveVariant === "dead") {
      // Spooky dead pet background
      const deadElements: BackgroundElement[] = [];

      // Falling spooky elements (mobile-responsive count)
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const fallingCount = isMobile
        ? Math.ceil(3 * intensityMultiplier)
        : Math.ceil(6 * intensityMultiplier);

      const fallingSpooky = Array.from({
        length: fallingCount,
      }).map((_, i) => {
        // Every 5th element (1/5) is ridiculously big
        const isGiant = i % 5 === 0;

        return {
          id: `spooky-fall-${i}`,
          type: "falling" as const,
          emoji: ["💀", "👻", "🦴", "⚰️", "🪦", "☠️"][i % 6],
          left: Math.random() * 90 + 5, // Spread across full width
          delay: i * 10 + Math.random() * 5,
          duration: 35 + Math.random() * 10,
          rotation: Math.random() * 360,
          rotationEnd: Math.random() * 360 + 360,
          size: isGiant
            ? "giant"
            : (["medium", "large", "medium"][i % 3] as any),
          opacity: isGiant ? 0.1 : 0.2, // Increased from 0.06/0.12
        };
      });

      // Floating spirits (doubled count)
      const floatingSpirits = Array.from({
        length: Math.ceil(4 * intensityMultiplier),
      }).map((_, i) => {
        // Create grid positions to avoid overlap
        const gridCols = 2;
        const gridRows = 2;
        const col = i % gridCols;
        const row = Math.floor(i / gridCols) % gridRows;
        const baseLeft = 25 + col * 50; // 25%, 75%
        const baseTop = 30 + row * 40; // 30%, 70%

        return {
          id: `spirit-${i}`,
          type: "floating" as const,
          emoji: ["👻", "💀", "🌫️", "☠️"][i % 4],
          left: baseLeft + (Math.random() * 10 - 5), // ±5% variation
          top: baseTop + (Math.random() * 10 - 5), // ±5% variation
          delay: i * 15 + Math.random() * 8,
          duration: 45 + Math.random() * 15,
          rotation: Math.random() * 360,
          rotationEnd: Math.random() * 360 + 180,
          size: "large" as const,
          opacity: 0.1,
        };
      });

      deadElements.push(...fallingSpooky, ...floatingSpirits);

      // Add static spooky elements for atmosphere
      if (intensity !== "low") {
        const staticSpooky = [
          { emoji: "⚰️", left: 15, opacity: 0.06 },
          { emoji: "🪦", left: 85, opacity: 0.06 },
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
        deadElements.push(...staticSpooky);
      }

      return deadElements;
    }

    // Default "alive" variant - healthy, active pet
    const aliveElements: BackgroundElement[] = [];

    // Main falling elements (mobile-responsive count)
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const fallingCount = isMobile
      ? Math.ceil(4 * intensityMultiplier)
      : Math.ceil(8 * intensityMultiplier);

    const fallingTreats = Array.from({
      length: fallingCount,
    }).map((_, i) => {
      // Every 5th element (1/5) is ridiculously big
      const isGiant = i % 5 === 0;

      return {
        id: `alive-fall-${i}`,
        type: "falling" as const,
        emoji: ["🦴", "🍖", "❤️", "🥎", "🍗"][i % 5], // Removed 🐾 from falling
        left: Math.random() * 90 + 5, // Spread across full width
        delay: i * 8 + Math.random() * 5,
        duration: 35 + Math.random() * 10,
        rotation: Math.random() * 360,
        rotationEnd: Math.random() * 360 + 360,
        size: isGiant
          ? "giant"
          : (["large", "xl", "medium", "large"][i % 4] as any),
        opacity: isGiant ? 0.12 : 0.25, // Increased from 0.08/0.15
      };
    });

    // Floating elements (doubled count)
    const floatingLove = Array.from({
      length: Math.ceil(6 * intensityMultiplier),
    }).map((_, i) => {
      // Create grid-like positions to avoid overlap
      const gridCols = 3;
      const gridRows = 2;
      const col = i % gridCols;
      const row = Math.floor(i / gridCols) % gridRows;
      const baseLeft = 15 + col * 30; // 15%, 45%, 75%
      const baseTop = 25 + row * 40; // 25%, 65%

      return {
        id: `alive-float-${i}`,
        type: "floating" as const,
        emoji: ["🐾", "❤️", "🦴"][i % 3], // 🐾 only in floating/static now
        left: baseLeft + (Math.random() * 10 - 5), // ±5% variation
        top: baseTop + (Math.random() * 10 - 5), // ±5% variation
        delay: i * 12 + Math.random() * 8,
        duration: 40 + Math.random() * 15,
        rotation: Math.random() * 360,
        rotationEnd: Math.random() * 360 + 180,
        size: ["large", "xl", "medium"][i % 3] as any,
        opacity: 0.12,
      };
    });

    aliveElements.push(...fallingTreats, ...floatingLove);
    return aliveElements;
  }, [effectiveVariant, intensity, holiday]);

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
        return "text-[20rem]"; // Ridiculously big - 20x larger
      default:
        return "text-6xl";
    }
  };

  const getStaticElements = () => {
    if (effectiveVariant === "dead") {
      return (
        <>
          <div className="absolute top-[10%] left-[10%] text-3xl opacity-5 blur-sm rotate-12">
            💀
          </div>
          <div className="absolute top-[35%] right-[15%] text-4xl opacity-5 blur-sm -rotate-12">
            👻
          </div>
          <div className="absolute bottom-[20%] left-[20%] text-2xl opacity-5 blur-sm rotate-45">
            ⚰️
          </div>
          <div className="absolute bottom-[30%] right-[10%] text-3xl opacity-5 blur-sm -rotate-45">
            🪦
          </div>
        </>
      );
    }

    // Default alive static elements - positioned to avoid floating element areas
    if (effectiveVariant !== "minimal") {
      return (
        <>
          <div className="absolute top-[10%] left-[10%] text-3xl opacity-5 blur-sm rotate-12">
            🐾
          </div>
          <div className="absolute top-[35%] right-[15%] text-4xl opacity-5 blur-sm -rotate-12">
            🐕
          </div>
          <div className="absolute bottom-[20%] left-[20%] text-2xl opacity-5 blur-sm rotate-45">
            🍖
          </div>
          <div className="absolute bottom-[30%] right-[10%] text-3xl opacity-5 blur-sm -rotate-45">
            🥎
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay for depth - varies by variant */}
      <div
        className={`absolute inset-0 ${
          effectiveVariant === "dead"
            ? "bg-gradient-to-b from-red-900/10 via-gray-900/10 to-purple-900/15"
            : "bg-gradient-to-b from-transparent via-background/5 to-background/20"
        }`}
      />

      {/* Animated elements */}
      {backgroundElements.map((element) => {
        if (element.type === "falling") {
          return (
            <motion.div
              key={element.id}
              className={`absolute ${getSizeClass(
                element.size || "medium"
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
              {element.emoji}
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
                top: `${(element as any).top || 20}%`,
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
              {element.emoji}
            </motion.div>
          );
        }

        if (element.type === "static") {
          return (
            <div
              key={element.id}
              className={`absolute ${getSizeClass(
                element.size || "medium"
              )} blur-sm`}
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
          length: effectiveVariant === "dead" ? 6 : 4,
        }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className={`absolute w-1 h-1 rounded-full ${
              effectiveVariant === "dead" ? "bg-red-500/20" : "bg-primary/20"
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

      {/* Additional random static paw prints */}
      {effectiveVariant === "alive" && (
        <div className="absolute inset-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`static-paw-${i}`}
              className="absolute text-4xl opacity-5 blur-sm"
              style={{
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              🐾
            </div>
          ))}
        </div>
      )}

      {/* Static decorative elements */}
      {getStaticElements()}
    </div>
  );
};

// Convenience components for specific states
export const PetBackgroundDead: React.FC = () => {
  return <PetBackground variant="dead" intensity="medium" petIsAlive={false} />;
};

export const PetBackgroundMinimal: React.FC = () => {
  return <PetBackground variant="minimal" intensity="low" petIsAlive={true} />;
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
