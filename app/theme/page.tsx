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
import { presetThemes } from "./presetThemes";
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
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
  animate,
} from "framer-motion";

interface ThemeColor {
  name: string;
  label: string;
  description: string;
  hue: number;
  saturation: number;
  lightness: number;
  cssVar: string;
}

interface AnimatedSliderProps {
  value: number;
  targetValue: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  label: string;
  suffix?: string;
}

// Shake animation for tactile feedback on tap/click
const tapShakeVariants = {
  tap: {
    x: [0, -2, 2, -2, 2, -1, 1, 0],
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  idle: {
    x: 0,
  },
};

// Enhanced shake for primary demo buttons on tap/click
const primaryTapShakeVariants = {
  tap: {
    x: [0, -3, 3, -2, 2, -1, 1, 0],
    y: [0, -1, 1, -1, 1, 0],
    scale: [1, 0.95, 1],
    transition: {
      duration: 0.4,
      ease: "easeInOut",
    },
  },
  idle: {
    x: 0,
    y: 0,
    scale: 1,
  },
};

const AnimatedSlider: React.FC<AnimatedSliderProps> = ({
  value,
  targetValue,
  min,
  max,
  step,
  onValueChange,
  label,
  suffix = "",
}) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (Math.abs(targetValue - currentValue) > 0.1) {
      setIsAnimating(true);
      const controls = animate(currentValue, targetValue, {
        duration: 0.8,
        ease: [0.23, 1, 0.32, 1],
        onUpdate: (latest) => {
          setCurrentValue(Math.round(latest));
        },
        onComplete: () => {
          setCurrentValue(targetValue);
          setIsAnimating(false);
        },
      });
      return controls.stop;
    }
  }, [targetValue, currentValue]);

  const handleValueChange = (newValues: number[]) => {
    const newValue = newValues[0];
    setCurrentValue(newValue);
    onValueChange(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <Label className={isAnimating ? "text-primary" : ""}>{label}</Label>
        <motion.span
          className={`font-mono ${isAnimating ? "text-primary" : ""}`}
          animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {currentValue}
          {suffix}
        </motion.span>
      </div>
      <motion.div
        animate={isAnimating ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <Slider
          value={[currentValue]}
          onValueChange={handleValueChange}
          min={min}
          max={max}
          step={step}
          className={`w-full transition-all duration-300 ${
            isAnimating ? "ring-2 ring-primary/30" : ""
          }`}
        />
      </motion.div>
    </div>
  );
};

const ThemeCustomizer = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { colors, applyColors, resetToDefault } = useColorTheme();

  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [localColors, setLocalColors] = useState(colors);
  const [targetColors, setTargetColors] = useState(colors);
  const [isPresetAnimating, setIsPresetAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalColors(colors);
    setTargetColors(colors);
  }, [colors]);

  const updateColor = (
    index: number,
    property: "hue" | "saturation" | "lightness",
    value: number
  ) => {
    const newColors = [...localColors];
    newColors[index] = { ...newColors[index], [property]: value };
    setLocalColors(newColors);
    setTargetColors(newColors);
    applyColors(newColors);
  };

  const applyPreset = (preset: (typeof presetThemes)[0]) => {
    setIsPresetAnimating(true);
    const newColors = localColors.map((color, index) => ({
      ...color,
      ...preset.colors[index],
    }));

    setTargetColors(newColors);

    setTimeout(() => {
      setLocalColors(newColors);
      applyColors(newColors);
    }, 100);

    setTimeout(() => {
      setIsPresetAnimating(false);
      toast({
        title: `${preset.name} Applied! 🎨`,
        description: preset.description,
      });
    }, 1000);
  };

  const resetToDefaults = () => {
    setIsPresetAnimating(true);
    const defaultColors = [
      { hue: 263, saturation: 60, lightness: 50 },
      { hue: 240, saturation: 5, lightness: 11 },
      { hue: 240, saturation: 6, lightness: 5 },
      { hue: 0, saturation: 0, lightness: 95 },
    ];

    const newColors = localColors.map((color, index) => ({
      ...color,
      ...defaultColors[index],
    }));

    setTargetColors(newColors);

    setTimeout(() => {
      resetToDefault();
      setIsPresetAnimating(false);
    }, 100);
  };

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
            <motion.div
              className="p-3 bg-primary/20 rounded-xl border border-primary/30"
              animate={
                isPresetAnimating
                  ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }
                  : {}
              }
              transition={{ duration: 0.8 }}
            >
              <Palette className="h-8 w-8 text-primary" />
            </motion.div>
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
              className="flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
            >
              <motion.div
                animate={isSaving ? { rotate: 360 } : {}}
                transition={{
                  duration: 1,
                  repeat: isSaving ? Infinity : 0,
                  ease: "linear",
                }}
              >
                <Save className="h-4 w-4" />
              </motion.div>
              {isSaving ? "Saving..." : "Save Theme"}
            </Button>

            <Button
              onClick={resetToDefaults}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20"
              disabled={isPresetAnimating}
            >
              <motion.div
                animate={isPresetAnimating ? { rotate: 360 } : {}}
                transition={{ duration: 0.8 }}
                whileHover={{ rotate: 15 }}
              >
                <RotateCcw className="h-4 w-4" />
              </motion.div>
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: index * 0.1,
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <Button
                          onClick={() => applyPreset(preset)}
                          variant="outline"
                          className="w-full h-auto p-4 flex flex-col items-start gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/50 group"
                          disabled={isPresetAnimating}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex gap-1">
                              {preset.colors.map((color, i) => (
                                <motion.div
                                  key={i}
                                  className="w-4 h-4 rounded-full border border-border/50"
                                  style={{
                                    backgroundColor: `hsl(${color.hue}deg ${color.saturation}% ${color.lightness}%)`,
                                  }}
                                  whileHover={{
                                    scale: 1.3,
                                    rotate: 10,
                                  }}
                                  transition={{
                                    duration: 0.2,
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 25,
                                  }}
                                />
                              ))}
                            </div>
                            <span className="font-medium">{preset.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground text-left group-hover:text-foreground/80 transition-colors duration-300">
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
                          <motion.div
                            className="w-8 h-8 rounded-lg border border-border/50 shadow-sm"
                            style={{
                              backgroundColor: `hsl(${color.hue}deg ${color.saturation}% ${color.lightness}%)`,
                            }}
                            animate={
                              isPresetAnimating
                                ? {
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 10, -10, 0],
                                  }
                                : {}
                            }
                            transition={{
                              duration: 0.8,
                              delay: index * 0.1,
                            }}
                          />
                          <div>
                            <h3 className="font-semibold">{color.label}</h3>
                            <p className="text-sm text-muted-foreground">
                              {color.description}
                            </p>
                          </div>
                        </div>
                        <motion.div
                          className="text-xs text-muted-foreground font-mono"
                          animate={
                            isPresetAnimating ? { scale: [1, 1.05, 1] } : {}
                          }
                          transition={{ duration: 0.6, delay: index * 0.05 }}
                        >
                          hsl({color.hue}°, {color.saturation}%,{" "}
                          {color.lightness}%)
                        </motion.div>
                      </div>

                      {/* Animated Sliders */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <AnimatedSlider
                          value={color.hue}
                          targetValue={targetColors[index]?.hue || color.hue}
                          min={0}
                          max={360}
                          step={1}
                          onValueChange={(value) =>
                            updateColor(index, "hue", value)
                          }
                          label="Hue"
                          suffix="°"
                        />
                        <AnimatedSlider
                          value={color.saturation}
                          targetValue={
                            targetColors[index]?.saturation || color.saturation
                          }
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(value) =>
                            updateColor(index, "saturation", value)
                          }
                          label="Saturation"
                          suffix="%"
                        />
                        <AnimatedSlider
                          value={color.lightness}
                          targetValue={
                            targetColors[index]?.lightness || color.lightness
                          }
                          min={5}
                          max={95}
                          step={1}
                          onValueChange={(value) =>
                            updateColor(index, "lightness", value)
                          }
                          label="Lightness"
                          suffix="%"
                        />
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
                  <motion.div
                    variants={primaryTapShakeVariants}
                    whileTap="tap"
                    animate="idle"
                  >
                    <Button className="w-full shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300">
                      Primary Button
                    </Button>
                  </motion.div>

                  <motion.div
                    variants={tapShakeVariants}
                    whileTap="tap"
                    animate="idle"
                  >
                    <Button
                      variant="secondary"
                      className="w-full hover:shadow-lg transition-all duration-300"
                    >
                      Secondary Button
                    </Button>
                  </motion.div>

                  <motion.div
                    variants={tapShakeVariants}
                    whileTap="tap"
                    animate="idle"
                  >
                    <Button
                      variant="outline"
                      className="w-full hover:shadow-lg hover:border-primary/50 transition-all duration-300"
                    >
                      Outline Button
                    </Button>
                  </motion.div>
                </div>

                <motion.div
                  animate={isPresetAnimating ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.8, delay: 0.1 }}
                >
                  <Card className="unified-card">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Sample Card</h4>
                      <p className="text-sm text-muted-foreground">
                        This card shows how your theme affects nested
                        components.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  className="p-4 bg-accent/20 rounded-lg border border-accent/30"
                  animate={isPresetAnimating ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <h4 className="font-semibold text-accent-foreground mb-2">
                    Accent Section
                  </h4>
                  <p className="text-sm text-accent-foreground/80">
                    Special highlighted content area.
                  </p>
                </motion.div>

                <motion.div
                  className="p-4 bg-background/50 rounded-lg border border-border/30"
                  animate={isPresetAnimating ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <h4 className="font-semibold text-foreground mb-2">
                    Text Color Preview
                  </h4>
                  <p className="text-sm text-foreground/80">
                    This text uses the foreground color variable and will change
                    with your theme.
                  </p>
                </motion.div>

                <motion.div
                  animate={isPresetAnimating ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    Primary Badge
                  </Badge>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Container>
    </div>
  );
};

export default ThemeCustomizer;
