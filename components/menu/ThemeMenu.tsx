// components/menu/ThemeMenu.tsx
"use client";

import { Check, Palette } from "lucide-react";
import Link from "next/link";
import { useColorTheme } from "@/contexts/ColorThemeProvider";
import { getCurrentThemeName, applyThemePreset } from "./menuUtils";
import { presetThemes } from "@/app/theme/presetThemes";
import { cn } from "@/lib/utils";

interface ThemeMenuProps {
  isDesktop?: boolean;
}

export function ThemeMenu({ isDesktop = false }: ThemeMenuProps) {
  const { colors, applyColors } = useColorTheme();
  const currentThemeName = getCurrentThemeName(colors);

  const handleThemeChange = (preset: (typeof presetThemes)[0]) => {
    applyThemePreset(preset, colors, applyColors);
  };

  const ThemeContent = () => (
    <>
      <div className="flex items-center gap-2 px-3 py-2 w-full">
        <Palette className="h-4 w-4 text-primary" />
        <div className="flex-1">
          <div className="font-medium">Themes</div>
          <Link
            href="/theme"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Check out the editor
          </Link>
        </div>
      </div>
      <div
        className={cn(
          "border-t",
          isDesktop ? "border-border/50" : "border-border"
        )}
      />

      {presetThemes.map((preset) => (
        <div
          key={preset.name}
          onClick={() => handleThemeChange(preset)}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 cursor-pointer",
            "hover:bg-accent rounded-md transition-colors",
            isDesktop && "hover:bg-accent/80"
          )}
        >
          <div className="flex gap-1">
            {preset.colors.slice(0, 3).map((color, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border border-border/50"
                style={{
                  backgroundColor: `hsl(${color.hue}deg ${color.saturation}% ${color.lightness}%)`,
                }}
              />
            ))}
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">{preset.name}</div>
            <div className="text-xs text-muted-foreground">
              {preset.description}
            </div>
          </div>
          {currentThemeName === preset.name && (
            <Check className="h-3 w-3 text-primary" />
          )}
        </div>
      ))}
    </>
  );

  return (
    <div
      className={cn(
        "rounded-xl shadow-xl z-[110]",
        isDesktop
          ? "border-border/50 bg-background/95 backdrop-blur-md w-64"
          : "w-64"
      )}
    >
      <ThemeContent />
    </div>
  );
}
