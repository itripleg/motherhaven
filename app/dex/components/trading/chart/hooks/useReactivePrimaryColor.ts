// components/trading/chart/hooks/useReactivePrimaryColor.ts
import { useState, useEffect } from "react";
import { useColorTheme } from "@/contexts/ColorThemeProvider";

/**
 * Hook to get reactive primary color that updates when theme changes
 * This ensures charts stay in sync with the current theme
 */
export function useReactivePrimaryColor(): string {
  const { colors } = useColorTheme();
  const [primaryColor, setPrimaryColor] = useState("#8b5cf6"); // Fallback

  useEffect(() => {
    const updatePrimaryColor = () => {
      if (typeof window !== "undefined") {
        // First try to get from CSS custom property (most reliable)
        const root = document.documentElement;
        const hsl = getComputedStyle(root).getPropertyValue("--primary").trim();

        if (hsl) {
          // Convert HSL to hex for recharts
          const hslMatch = hsl.match(
            /(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/
          );
          if (hslMatch) {
            const [, h, s, l] = hslMatch;
            const color = `hsl(${h}deg ${s}% ${l}%)`;
            setPrimaryColor(color);
            return;
          }
        }

        // Fallback: use ColorThemeProvider colors if available
        if (colors && colors[0]) {
          const { hue, saturation, lightness } = colors[0];
          setPrimaryColor(`hsl(${hue}deg ${saturation}% ${lightness}%)`);
        }
      }
    };

    // Update immediately
    updatePrimaryColor();

    // Set up observer for CSS changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style"
        ) {
          updatePrimaryColor();
        }
      });
    });

    if (typeof window !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }

    return () => observer.disconnect();
  }, [colors]); // Re-run when colors from ColorThemeProvider change

  return primaryColor;
}
