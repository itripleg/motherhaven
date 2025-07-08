// app/dex/components/token-header/ImagePositionEditor.tsx
"use client";
import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import {
  Save,
  X,
  RotateCcw,
  Maximize,
  Minimize,
  Square,
  Move,
  Minus,
  Plus,
  RotateCw,
  MessageSquare,
} from "lucide-react";
import { ImagePosition } from "./types";

interface ImagePositionEditorProps {
  position: ImagePosition;
  onPositionChange: (position: ImagePosition) => void;
  description?: string;
  onDescriptionChange?: (description: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isUpdating?: boolean;
  imageUrl: string;
}

const FIT_MODES = {
  cover: { icon: Maximize, label: "Cover" },
  contain: { icon: Minimize, label: "Contain" },
  fill: { icon: Square, label: "Fill" },
} as const;

export const ImagePositionEditor: React.FC<ImagePositionEditorProps> = ({
  position,
  onPositionChange,
  description = "",
  onDescriptionChange,
  onSave,
  onCancel,
  isUpdating = false,
  imageUrl,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showDescription, setShowDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(description);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Update local description when prop changes
  React.useEffect(() => {
    setDescriptionValue(description);
  }, [description]);

  const resetPosition = useCallback(() => {
    onPositionChange({ ...position, x: 0, y: 0, scale: 1, rotation: 0 });
  }, [position, onPositionChange]);

  const setFitMode = useCallback(
    (fit: keyof typeof FIT_MODES) => {
      onPositionChange({
        ...position,
        fit,
        x: 0,
        y: 0,
        scale: 1,
      });
    },
    [position, onPositionChange]
  );

  const adjustValue = useCallback(
    (key: keyof ImagePosition, delta: number) => {
      const current = position[key] as number;
      let newValue: number;

      switch (key) {
        case "scale":
          newValue = Math.max(0.5, Math.min(3, current + delta));
          break;
        case "rotation":
          newValue = Math.max(-180, Math.min(180, current + delta));
          break;
        default: // x, y
          newValue = Math.max(-100, Math.min(100, current + delta));
      }

      onPositionChange({ ...position, [key]: newValue });
    },
    [position, onPositionChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (position.fit === "fill" || showDescription) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [position.fit, showDescription]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !imageContainerRef.current || position.fit === "fill")
        return;
      e.preventDefault();

      const rect = imageContainerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = -((e.clientY - dragStart.y) / rect.height) * 100;

      onPositionChange({
        ...position,
        x: Math.max(-100, Math.min(100, position.x + deltaX)),
        y: Math.max(-100, Math.min(100, position.y + deltaY)),
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart, position, onPositionChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSave = () => {
    if (onDescriptionChange && descriptionValue !== description) {
      onDescriptionChange(descriptionValue);
    }
    onSave();
  };

  const handleCancel = () => {
    setDescriptionValue(description);
    setShowDescription(false);
    onCancel();
  };

  // Mouse wheel for scaling
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (position.fit === "fill" || showDescription) return;
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      adjustValue("scale", delta);
    },
    [position.fit, showDescription, adjustValue]
  );

  React.useEffect(() => {
    const container = imageContainerRef.current;
    if (container && !showDescription) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel, showDescription]);

  const getBackgroundStyle = () => {
    const { x, y, scale, rotation, fit = "cover" } = position;
    const baseStyle = {
      backgroundImage: `url(${imageUrl})`,
      backgroundRepeat: "no-repeat",
      transform: `rotate(${rotation}deg)`,
      transformOrigin: "center center",
      transition: isDragging
        ? "none"
        : "transform 0.2s ease-out, background-position 0.2s ease-out, background-size 0.2s ease-out",
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
    <div className="absolute inset-0 z-10">
      {/* Interactive Image Area */}
      <div
        ref={imageContainerRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor:
            position.fit !== "fill" && !showDescription ? "move" : "default",
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={getBackgroundStyle()}
        />
        <div className="absolute inset-0 bg-black/60" />

        {/* Crosshair Guide - only show when not editing description */}
        {!showDescription && position.fit !== "fill" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <div className="w-px h-12 bg-white" />
            <div className="w-12 h-px bg-white absolute" />
          </div>
        )}

        {/* Drag Instructions */}
        {!showDescription && position.fit !== "fill" && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
              <p className="text-white text-xs flex items-center gap-2">
                <Move className="h-3 w-3" />
                Drag to reposition • Scroll to zoom
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Description Editor Overlay */}
      {showDescription && onDescriptionChange && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/90 backdrop-blur-md rounded-xl border border-white/20 p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-white font-medium">Edit Description</h3>
            </div>

            <Textarea
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              placeholder="Describe your token..."
              maxLength={280}
              className="min-h-[100px] resize-none bg-black/40 border-primary/30 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary/20 mb-3"
            />

            <div className="flex items-center justify-between text-xs text-white/60 mb-4">
              <span>Press ⌘+Enter to save, Esc to cancel</span>
              <span>{descriptionValue.length}/280</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDescription(false)}
                className="flex-1 text-white/80 hover:bg-red-500/20 hover:text-red-300"
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDescription(false)}
                className="flex-1 text-primary hover:bg-primary/20"
              >
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Inline Controls in Top Bar */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 p-2">
          {/* Description Edit Button */}
          {onDescriptionChange && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDescription(!showDescription)}
                  className={`h-7 w-7 text-white hover:bg-white/20 ${
                    showDescription ? "bg-primary/30" : ""
                  }`}
                >
                  <MessageSquare className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Description</TooltipContent>
            </Tooltip>
          )}

          {/* Fit Mode Toggle */}
          {!showDescription && (
            <div className="flex items-center gap-1 border-r border-white/20 pr-2">
              {Object.entries(FIT_MODES).map(
                ([mode, { icon: Icon, label }]) => (
                  <Tooltip key={mode}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setFitMode(mode as keyof typeof FIT_MODES)
                        }
                        className={`h-7 w-7 text-white hover:bg-white/20 ${
                          (position.fit || "cover") === mode
                            ? "bg-white/30"
                            : ""
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                )
              )}
            </div>
          )}

          {/* Quick Controls */}
          {!showDescription && position.fit !== "fill" && (
            <div className="flex items-center gap-1 border-r border-white/20 pr-2">
              {/* Scale Controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => adjustValue("scale", -0.1)}
                    className="h-7 w-7 text-white hover:bg-white/20"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>

              <div className="text-white text-xs min-w-[2rem] text-center">
                {position.scale.toFixed(1)}x
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => adjustValue("scale", 0.1)}
                    className="h-7 w-7 text-white hover:bg-white/20"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>

              {/* Rotation Controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => adjustValue("rotation", -15)}
                    className="h-7 w-7 text-white hover:bg-white/20"
                  >
                    <RotateCw className="h-3 w-3 scale-x-[-1]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rotate Left</TooltipContent>
              </Tooltip>

              <div className="text-white text-xs min-w-[2rem] text-center">
                {position.rotation}°
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => adjustValue("rotation", 15)}
                    className="h-7 w-7 text-white hover:bg-white/20"
                  >
                    <RotateCw className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rotate Right</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Reset */}
          {!showDescription && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetPosition}
                  className="h-7 w-7 text-white hover:bg-white/20 border-r border-white/20 pr-2 mr-1"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset</TooltipContent>
            </Tooltip>
          )}

          {/* Action Buttons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="h-7 w-7 text-red-400 hover:bg-red-500/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cancel</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={isUpdating}
                className="h-7 w-7 text-green-400 hover:bg-green-500/20"
              >
                {isUpdating ? (
                  <div className="h-3 w-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save Changes</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
