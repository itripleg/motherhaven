// app/factory/components/editor/FactoryEditorBackground.tsx
"use client";
import React from "react";
import { ImagePosition } from "./types";

interface FactoryEditorBackgroundProps {
  imageUrl?: string;
  position?: ImagePosition;
  showOverlay?: boolean;
  overlayOpacity?: number;
  className?: string;
}

export const FactoryEditorBackground: React.FC<
  FactoryEditorBackgroundProps
> = ({
  imageUrl,
  position = { x: 0, y: 0, scale: 1, rotation: 0, fit: "cover" },
  showOverlay = true,
  overlayOpacity = 0.6,
  className = "",
}) => {
  const getBackgroundStyle = () => {
    if (!imageUrl) return {};

    const { x, y, scale, rotation, fit = "cover" } = position;
    const baseStyle = {
      backgroundImage: `url(${imageUrl})`,
      backgroundRepeat: "no-repeat",
      transform: `rotate(${rotation}deg)`,
      transformOrigin: "center center",
      transition:
        "transform 0.2s ease-out, background-position 0.2s ease-out, background-size 0.2s ease-out",
    };

    if (fit === "fill") {
      return {
        ...baseStyle,
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
      };
    }

    return {
      ...baseStyle,
      backgroundSize: `${100 * scale}% auto`,
      backgroundPosition: `${50 + x}% ${50 + y}%`,
    };
  };

  return (
    <div className={`absolute inset-0 z-0 ${className}`}>
      {imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={getBackgroundStyle()}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
      )}
      {showOverlay && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60"
          style={{ opacity: overlayOpacity }}
        />
      )}
    </div>
  );
};
