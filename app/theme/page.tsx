"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Container } from "@/components/craft";

interface ColorVariable {
  name: string;
  label: string;
  hue: number;
  saturation: number;
  lightness: number;
}

const ThemeCustomizer = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [colors, setColors] = useState<ColorVariable[]>([
    {
      name: "--card-background",
      label: "Card Background",
      hue: 240,
      saturation: 10,
      lightness: 3.9,
    },
    {
      name: "--card-accent",
      label: "Card Accent",
      hue: 240,
      saturation: 5.9,
      lightness: 10,
    },
    {
      name: "--primary",
      label: "Primary",
      hue: 240,
      saturation: 5.9,
      lightness: 10,
    },
    {
      name: "--secondary",
      label: "Secondary",
      hue: 240,
      saturation: 4.8,
      lightness: 95.9,
    },
    {
      name: "--accent",
      label: "Accent",
      hue: 240,
      saturation: 4.8,
      lightness: 95.9,
    },
    {
      name: "--chart-1",
      label: "Chart 1",
      hue: 12,
      saturation: 76,
      lightness: 61,
    },
    {
      name: "--chart-2",
      label: "Chart 2",
      hue: 173,
      saturation: 58,
      lightness: 39,
    },
  ]);

  const updateColor = (
    index: number,
    property: "hue" | "saturation" | "lightness",
    value: number
  ) => {
    const newColors = [...colors];
    newColors[index] = { ...newColors[index], [property]: value };
    setColors(newColors);

    // Update CSS variable
    const root = document.documentElement;
    const color = newColors[index];
    root.style.setProperty(
      color.name,
      `${color.hue} ${color.saturation}% ${color.lightness}%`
    );
  };

  // Preview card with current colors
  const PreviewCard = () => (
    <Card className="mt-6 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br"
        style={{
          background: `linear-gradient(to bottom right, 
          hsl(${colors[0].hue}deg ${colors[0].saturation}% ${colors[0].lightness}%),
          hsl(${colors[1].hue}deg ${colors[1].saturation}% ${colors[1].lightness}%))`,
        }}
      />
      <CardHeader className="relative z-10">
        <CardTitle className="text-white">Preview Card</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-white/80">
          This is how your card will look with the current colors.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <Container>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Theme Customizer</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="light">
            <TabsList>
              <TabsTrigger value="light" onClick={() => setTheme("light")}>
                Light
              </TabsTrigger>
              <TabsTrigger value="dark" onClick={() => setTheme("dark")}>
                Dark
              </TabsTrigger>
            </TabsList>

            <div className="space-y-6 mt-6">
              {colors.map((color, index) => (
                <div key={color.name} className="space-y-2">
                  <Label>{color.label}</Label>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Hue (0-360)</Label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={color.hue}
                        onChange={(e) =>
                          updateColor(index, "hue", parseInt(e.target.value))
                        }
                        className="w-full"
                      />
                      <span className="text-xs">{color.hue}</span>
                    </div>

                    <div>
                      <Label className="text-xs">Saturation (0-100)</Label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={color.saturation}
                        onChange={(e) =>
                          updateColor(
                            index,
                            "saturation",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                      <span className="text-xs">{color.saturation}%</span>
                    </div>

                    <div>
                      <Label className="text-xs">Lightness (0-100)</Label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={color.lightness}
                        onChange={(e) =>
                          updateColor(
                            index,
                            "lightness",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                      <span className="text-xs">{color.lightness}%</span>
                    </div>
                  </div>

                  <div
                    className="h-8 rounded-md"
                    style={{
                      backgroundColor: `hsl(${color.hue}deg ${color.saturation}% ${color.lightness}%)`,
                    }}
                  />
                </div>
              ))}

              {/* Live Preview */}
              <PreviewCard />
            </div>
          </Tabs>

          <button
            onClick={() => {
              const cssVars = colors
                .map(
                  (color) =>
                    `${color.name}: ${color.hue} ${color.saturation}% ${color.lightness}%;`
                )
                .join("\n");
              console.log(cssVars);
              navigator.clipboard.writeText(cssVars);
            }}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Copy CSS Variables
          </button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ThemeCustomizer;
