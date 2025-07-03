"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

interface ThemeColor {
  name: string;
  label: string;
  description: string;
  hue: number;
  saturation: number;
  lightness: number;
  cssVar: string;
}

interface ColorThemeContextType {
  colors: ThemeColor[];
  isLoading: boolean;
  applyColors: (colors: ThemeColor[]) => void;
  resetToDefault: () => void;
}

const defaultColors: ThemeColor[] = [
  {
    name: "primary",
    label: "Primary",
    description: "Main brand color - buttons, links, highlights",
    hue: 263,
    saturation: 70,
    lightness: 50,
    cssVar: "--primary",
  },
  {
    name: "secondary",
    label: "Secondary",
    description: "Supporting color - cards, sections, backgrounds",
    hue: 240,
    saturation: 5,
    lightness: 11,
    cssVar: "--secondary",
  },
  {
    name: "accent",
    label: "Accent",
    description: "Special highlights and call-to-actions",
    hue: 200,
    saturation: 60,
    lightness: 50,
    cssVar: "--accent",
  },
];

const ColorThemeContext = createContext<ColorThemeContextType>({
  colors: defaultColors,
  isLoading: false,
  applyColors: () => {},
  resetToDefault: () => {},
});

export const useColorTheme = () => {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error("useColorTheme must be used within a ColorThemeProvider");
  }
  return context;
};

interface ColorThemeProviderProps {
  children: React.ReactNode;
}

export const ColorThemeProvider: React.FC<ColorThemeProviderProps> = ({
  children,
}) => {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [colors, setColors] = useState<ThemeColor[]>(defaultColors);
  const [isLoading, setIsLoading] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply colors to CSS variables
  const applyColorsToCSS = (themeColors: ThemeColor[]) => {
    if (!mounted) return;

    const root = document.documentElement;

    themeColors.forEach((color) => {
      root.style.setProperty(
        color.cssVar,
        `${color.hue} ${color.saturation}% ${color.lightness}%`
      );
    });
  };

  // Load user's saved colors from Firebase
  useEffect(() => {
    const loadUserColors = async () => {
      if (!address || !isConnected || !mounted) return;

      setIsLoading(true);
      try {
        const userDocRef = doc(db, "users", address.toLowerCase());
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.theme && userData.theme.colors) {
            console.log("🎨 Loading saved colors for user:", address);

            const savedColors = userData.theme.colors;
            setColors(savedColors);
            applyColorsToCSS(savedColors);
          } else {
            console.log("🎨 No saved colors found, using defaults");
            applyColorsToCSS(colors);
          }
        } else {
          console.log("🎨 No user document found, using defaults");
          applyColorsToCSS(colors);
        }
      } catch (error) {
        console.error("Error loading colors:", error);
        applyColorsToCSS(colors);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserColors();
  }, [address, isConnected, mounted]);

  // Apply default colors on mount if no user is connected
  useEffect(() => {
    if (mounted && !isConnected) {
      console.log("🎨 No wallet connected, applying default colors");
      applyColorsToCSS(colors);
    }
  }, [mounted, isConnected, colors]);

  // Programmatic color application (for theme customizer)
  const applyColors = (newColors: ThemeColor[]) => {
    setColors(newColors);
    applyColorsToCSS(newColors);
  };

  // Reset to default colors
  const resetToDefault = () => {
    setColors(defaultColors);
    applyColorsToCSS(defaultColors);
  };

  // Don't render children until mounted (prevents hydration issues)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading colors...</p>
        </div>
      </div>
    );
  }

  const contextValue: ColorThemeContextType = {
    colors,
    isLoading,
    applyColors,
    resetToDefault,
  };

  return (
    <ColorThemeContext.Provider value={contextValue}>
      {children}
    </ColorThemeContext.Provider>
  );
};
