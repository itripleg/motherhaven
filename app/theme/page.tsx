// app/theme/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/craft";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useColorTheme } from "@/contexts/ColorThemeProvider";
import {
  Palette,
  RotateCcw,
  Sparkles,
  Eye,
  Monitor,
  Save,
  CloudOff,
  Cloud,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeColor {
  name: string;
  label: string;
  description: string;
  hue: number;
  saturation: number;
  lightness: number;
  cssVar: string;
}

// Preset themes with Metal Gear Solid / Kojima inspiration - exported for use in other components
export const presetThemes = [
  {
    name: "MotherHaven",
    description: "The original Mother Haven",
    colors: [
      { hue: 263, saturation: 60, lightness: 50 },
      { hue: 240, saturation: 5, lightness: 11 },
      { hue: 240, saturation: 6, lightness: 5 },
      { hue: 0, saturation: 0, lightness: 95 },
    ],
  },
  {
    name: "FOXHOUND",
    description: "Elite unit stealth operations",
    colors: [
      { hue: 25, saturation: 85, lightness: 55 },
      { hue: 30, saturation: 8, lightness: 12 },
      { hue: 45, saturation: 75, lightness: 20 },
      { hue: 30, saturation: 10, lightness: 90 },
    ],
  },
  {
    name: "Shadow Moses",
    description: "Arctic infiltration protocol",
    colors: [
      { hue: 200, saturation: 80, lightness: 55 },
      { hue: 210, saturation: 15, lightness: 12 },
      { hue: 180, saturation: 70, lightness: 10 },
      { hue: 200, saturation: 15, lightness: 85 },
    ],
  },
  {
    name: "Snake Eater",
    description: "Jungle survival operations",
    colors: [
      { hue: 85, saturation: 35, lightness: 40 },
      { hue: 30, saturation: 25, lightness: 15 },
      { hue: 120, saturation: 20, lightness: 25 },
      { hue: 60, saturation: 10, lightness: 80 },
    ],
  },
  {
    name: "Liquid Red",
    description: "Revolutionary war machine",
    colors: [
      { hue: 0, saturation: 70, lightness: 45 },
      { hue: 10, saturation: 8, lightness: 12 },
      { hue: 350, saturation: 60, lightness: 25 },
      { hue: 0, saturation: 5, lightness: 90 },
    ],
  },
];

const ThemeCustomizer = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { colors, applyColors, resetToDefault } = useColorTheme();

  // Local state
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [localColors, setLocalColors] = useState(colors);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync with global colors
  useEffect(() => {
    setLocalColors(colors);
  }, [colors]);

  const updateColor = (
    index: number,
    property: "hue" | "saturation" | "lightness",
    value: number
  ) => {
    const newColors = [...localColors];
    newColors[index] = { ...newColors[index], [property]: value };
    setLocalColors(newColors);

    // Apply immediately to global theme
    applyColors(newColors);
  };

  const applyPreset = (preset: (typeof presetThemes)[0]) => {
    const newColors = localColors.map((color, index) => ({
      ...color,
      ...preset.colors[index],
    }));
    setLocalColors(newColors);
    applyColors(newColors);
  };

  const resetToDefaults = () => {
    resetToDefault();
  };

  // Save theme to Firebase
  const saveTheme = async () => {
    if (!address || !isConnected) {
      toast({
        title: "Not Connected",
        description: "Connect your wallet to save themes",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", address.toLowerCase());

      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : {};

      const themeData = {
        colors: localColors,
        lastUpdated: new Date(),
      };

      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          theme: themeData,
          lastActive: new Date(),
        });
      } else {
        await setDoc(userDocRef, {
          address: address.toLowerCase(),
          theme: themeData,
          createdTokens: [],
          lastActive: new Date(),
        });
      }

      setLastSaved(new Date());

      toast({
        title: "Theme Saved! 🎨",
        description: "Your custom theme is now saved to your account",
      });
    } catch (error) {
      console.error("Error saving theme:", error);
      toast({
        title: "Save Failed",
        description: "Could not save theme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen animated-bg floating-particles">
        <Container className="py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Palette className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground text-lg">
                Loading Theme Studio...
              </p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg floating-particles md:pt-20">
      <Container className="py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
              <Palette className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gradient">Theme Studio</h1>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Live Preview
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Customize the core colors that define your entire interface. Changes
            apply instantly across all components.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-between"
        >
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge
                variant="outline"
                className="text-green-400 border-green-400/30"
              >
                <Cloud className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-gray-400 border-gray-400/30"
              >
                <CloudOff className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Last Saved */}
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}

            <Button
              onClick={saveTheme}
              disabled={!isConnected || isSaving}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Theme"}
            </Button>

            <Button
              onClick={resetToDefaults}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Color Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preset Themes */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="unified-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Quick Themes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {presetThemes.map((preset, index) => (
                      <motion.div
                        key={preset.name}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() => applyPreset(preset)}
                          variant="outline"
                          className="w-full h-auto p-4 flex flex-col items-start gap-2"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex gap-1">
                              {preset.colors.map((color, i) => (
                                <div
                                  key={i}
                                  className="w-4 h-4 rounded-full border border-border/50"
                                  style={{
                                    backgroundColor: `hsl(${color.hue}deg ${color.saturation}% ${color.lightness}%)`,
                                  }}
                                />
                              ))}
                            </div>
                            <span className="font-medium">{preset.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground text-left">
                            {preset.description}
                          </span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Color Customization */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="unified-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-primary" />
                    Color Customization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {localColors.map((color, index) => (
                    <motion.div
                      key={color.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="space-y-4"
                    >
                      {/* Color Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg border border-border/50 shadow-sm"
                            style={{
                              backgroundColor: `hsl(${color.hue}deg ${color.saturation}% ${color.lightness}%)`,
                            }}
                          />
                          <div>
                            <h3 className="font-semibold">{color.label}</h3>
                            <p className="text-sm text-muted-foreground">
                              {color.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          hsl({color.hue}°, {color.saturation}%,{" "}
                          {color.lightness}%)
                        </div>
                      </div>

                      {/* Sliders */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <Label>Hue</Label>
                            <span>{color.hue}°</span>
                          </div>
                          <Slider
                            value={[color.hue]}
                            onValueChange={([value]) =>
                              updateColor(index, "hue", value)
                            }
                            min={0}
                            max={360}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <Label>Saturation</Label>
                            <span>{color.saturation}%</span>
                          </div>
                          <Slider
                            value={[color.saturation]}
                            onValueChange={([value]) =>
                              updateColor(index, "saturation", value)
                            }
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <Label>Lightness</Label>
                            <span>{color.lightness}%</span>
                          </div>
                          <Slider
                            value={[color.lightness]}
                            onValueChange={([value]) =>
                              updateColor(index, "lightness", value)
                            }
                            min={5}
                            max={95}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Live Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <Card className="unified-card">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sample Components */}
                <div className="space-y-3">
                  <Button className="w-full">Primary Button</Button>
                  <Button variant="secondary" className="w-full">
                    Secondary Button
                  </Button>
                  <Button variant="outline" className="w-full">
                    Outline Button
                  </Button>
                </div>

                <Card className="unified-card">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Sample Card</h4>
                    <p className="text-sm text-muted-foreground">
                      This card shows how your theme affects nested components.
                    </p>
                  </CardContent>
                </Card>

                <div className="p-4 bg-accent/20 rounded-lg border border-accent/30">
                  <h4 className="font-semibold text-accent-foreground mb-2">
                    Accent Section
                  </h4>
                  <p className="text-sm text-accent-foreground/80">
                    Special highlighted content area.
                  </p>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                  <h4 className="font-semibold text-foreground mb-2">
                    Text Color Preview
                  </h4>
                  <p className="text-sm text-foreground/80">
                    This text uses the foreground color variable and will change with your theme.
                  </p>
                </div>

                <Badge className="bg-primary/20 text-primary border-primary/30">
                  Primary Badge
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Container>
    </div>
  );
};

export default ThemeCustomizer;