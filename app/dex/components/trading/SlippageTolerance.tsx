// components/SlippageTolerance.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlippageToleranceProps {
  value: number; // Current slippage percentage (0.1, 0.5, 1.0, etc.)
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

const PRESET_VALUES = [0.1, 0.5, 1.0, 3.0]; // Common slippage percentages

export function SlippageTolerance({
  value,
  onChange,
  disabled = false,
  className,
}: SlippageToleranceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Check if current value is a preset or custom
  useEffect(() => {
    const isPreset = PRESET_VALUES.includes(value);
    setIsCustomMode(!isPreset);
    if (!isPreset) {
      setCustomValue(value.toString());
    }
  }, [value]);

  const handlePresetSelect = (preset: number) => {
    onChange(preset);
    setIsCustomMode(false);
    setCustomValue("");
  };

  const handleCustomSubmit = () => {
    const numValue = parseFloat(customValue);
    if (!isNaN(numValue) && numValue >= 0.01 && numValue <= 50) {
      onChange(numValue);
      setIsOpen(false);
    }
  };

  const handleCustomInputChange = (inputValue: string) => {
    // Only allow numbers and one decimal point
    const cleanValue = inputValue.replace(/[^0-9.]/g, "");
    const parts = cleanValue.split(".");
    if (parts.length > 2) return; // More than one decimal point

    setCustomValue(cleanValue);
  };

  const getSlippageColor = (slippage: number) => {
    if (slippage > 5) return "text-red-500";
    if (slippage > 1) return "text-yellow-500";
    return "text-green-500";
  };

  const getSlippageWarning = (slippage: number) => {
    if (slippage > 10) return "Very high slippage! Your transaction may fail.";
    if (slippage > 5) return "High slippage tolerance.";
    if (slippage < 0.1) return "Very low slippage. Transaction may fail.";
    return null;
  };

  return (
    <div className={cn("", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              "h-8 gap-2 text-xs",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Settings className="h-3 w-3" />
            {value}%
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-4" align="end">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Slippage Tolerance</Label>
              <div
                className={cn("text-xs font-medium", getSlippageColor(value))}
              >
                {value}%
              </div>
            </div>

            {/* Warning if applicable */}
            {getSlippageWarning(value) && (
              <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-600">
                  {getSlippageWarning(value)}
                </p>
              </div>
            )}

            {/* Preset Values */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Quick Select
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_VALUES.map((preset) => (
                  <Button
                    key={preset}
                    variant={
                      value === preset && !isCustomMode ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handlePresetSelect(preset)}
                    className="h-8 text-xs"
                  >
                    {preset}%
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Custom</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="0.50"
                    value={customValue}
                    onChange={(e) => handleCustomInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCustomSubmit();
                      }
                    }}
                    className="h-8 text-xs pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    %
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={handleCustomSubmit}
                  disabled={!customValue || isNaN(parseFloat(customValue))}
                  className="h-8 px-3"
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a value between 0.01% and 50%
              </p>
            </div>

            {/* Info */}
            <div className="p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                Slippage tolerance is the maximum difference between your
                expected price and the actual price.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
