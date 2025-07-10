// app/factory/components/editor/ImagePositionEditor.tsx
"use client";
import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Type,
  Hash,
} from "lucide-react";
import { ImagePosition } from "./types";

interface FactoryImagePositionEditorProps {
  position: ImagePosition;
  onPositionChange: (position: ImagePosition) => void;
  description?: string;
  onDescriptionChange?: (description: string) => void;
  onTokenInfoChange?: (info: { name?: string; ticker?: string }) => void;
  onSave: () => void;
  onCancel: () => void;
  isUpdating?: boolean;
  imageUrl?: string;
  tokenName?: string;
  tokenSymbol?: string;
  initialMode?: "position" | "description" | "name" | "ticker" | null;
}

const FIT_MODES = {
  cover: { icon: Maximize, label: "Cover" },
  contain: { icon: Minimize, label: "Contain" },
  fill: { icon: Square, label: "Fill" },
} as const;

export const FactoryImagePositionEditor: React.FC<
  FactoryImagePositionEditorProps
> = ({
  position,
  onPositionChange,
  description = "",
  onDescriptionChange,
  onTokenInfoChange,
  onSave,
  onCancel,
  isUpdating = false,
  imageUrl,
  tokenName = "Your Token",
  tokenSymbol = "TOKEN",
  initialMode = null,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showDescription, setShowDescription] = useState(
    initialMode === "description"
  );
  const [showNameEdit, setShowNameEdit] = useState(initialMode === "name");
  const [showTickerEdit, setShowTickerEdit] = useState(
    initialMode === "ticker"
  );
  const [descriptionValue, setDescriptionValue] = useState(description);
  const [nameValue, setNameValue] = useState(tokenName);
  const [tickerValue, setTickerValue] = useState(tokenSymbol);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Update local values when props change
  React.useEffect(() => {
    setDescriptionValue(description);
  }, [description]);

  React.useEffect(() => {
    setNameValue(tokenName);
  }, [tokenName]);

  React.useEffect(() => {
    setTickerValue(tokenSymbol);
  }, [tokenSymbol]);

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
      if (
        position.fit === "fill" ||
        showDescription ||
        showNameEdit ||
        showTickerEdit ||
        !imageUrl
      )
        return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [position.fit, showDescription, showNameEdit, showTickerEdit, imageUrl]
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
    if (
      onTokenInfoChange &&
      (nameValue !== tokenName || tickerValue !== tokenSymbol)
    ) {
      onTokenInfoChange({
        name: nameValue !== tokenName ? nameValue : undefined,
        ticker: tickerValue !== tokenSymbol ? tickerValue : undefined,
      });
    }
    onSave();
  };

  const handleCancel = () => {
    setDescriptionValue(description);
    setNameValue(tokenName);
    setTickerValue(tokenSymbol);
    setShowDescription(false);
    setShowNameEdit(false);
    setShowTickerEdit(false);
    onCancel();
  };

  // Handle saves for individual editors
  const handleDescriptionSave = () => {
    if (onDescriptionChange) {
      onDescriptionChange(descriptionValue);
    }
    setShowDescription(false);
  };

  const handleNameSave = () => {
    if (onTokenInfoChange) {
      onTokenInfoChange({ name: nameValue });
    }
    setShowNameEdit(false);
  };

  const handleTickerSave = () => {
    if (onTokenInfoChange) {
      onTokenInfoChange({ ticker: tickerValue });
    }
    setShowTickerEdit(false);
  };

  // Handle keyboard shortcuts in editors
  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setDescriptionValue(description);
      setShowDescription(false);
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleDescriptionSave();
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setNameValue(tokenName);
      setShowNameEdit(false);
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleNameSave();
    }
  };

  const handleTickerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setTickerValue(tokenSymbol);
      setShowTickerEdit(false);
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleTickerSave();
    }
  };

  // Mouse wheel for scaling
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (
        position.fit === "fill" ||
        showDescription ||
        showNameEdit ||
        showTickerEdit ||
        !imageUrl
      )
        return;
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      adjustValue("scale", delta);
    },
    [
      position.fit,
      showDescription,
      showNameEdit,
      showTickerEdit,
      imageUrl,
      adjustValue,
    ]
  );

  React.useEffect(() => {
    const container = imageContainerRef.current;
    if (container && !showDescription && !showNameEdit && !showTickerEdit) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel, showDescription, showNameEdit, showTickerEdit]);

  const getBackgroundStyle = () => {
    if (!imageUrl) {
      return {
        backgroundColor: "#1a1a1a",
      };
    }

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
            position.fit !== "fill" &&
            !showDescription &&
            !showNameEdit &&
            !showTickerEdit &&
            imageUrl
              ? "move"
              : "default",
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={getBackgroundStyle()}
        />
        <div className="absolute inset-0 bg-black/60" />

        {/* Crosshair Guide - only show when not editing anything and have image */}
        {!showDescription &&
          !showNameEdit &&
          !showTickerEdit &&
          position.fit !== "fill" &&
          imageUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
              <div className="w-px h-12 bg-white" />
              <div className="w-12 h-px bg-white absolute" />
            </div>
          )}

        {/* Drag Instructions */}
        {!showDescription &&
          !showNameEdit &&
          !showTickerEdit &&
          position.fit !== "fill" &&
          imageUrl && (
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
        <div className="absolute inset-0 flex items-center justify-center p-6 z-30">
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
              onKeyDown={handleDescriptionKeyDown}
              placeholder="Describe your token..."
              maxLength={280}
              className="min-h-[100px] resize-none bg-black/40 border-primary/30 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary/20 mb-3"
              autoFocus
            />

            <div className="flex items-center justify-between text-xs text-white/60 mb-4">
              <span>Press ⌘+Enter to save, Esc to cancel</span>
              <span>{descriptionValue.length}/280</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDescriptionValue(description);
                  setShowDescription(false);
                }}
                className="flex-1 text-white/80 hover:bg-red-500/20 hover:text-red-300"
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDescriptionSave}
                className="flex-1 text-primary hover:bg-primary/20"
              >
                Save
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Token Name Editor Overlay */}
      {showNameEdit && onTokenInfoChange && (
        <div className="absolute inset-0 flex items-center justify-center p-6 z-30">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/90 backdrop-blur-md rounded-xl border border-white/20 p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-2 mb-4">
              <Type className="h-4 w-4 text-primary" />
              <h3 className="text-white font-medium">Edit Token Name</h3>
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="tokenName" className="text-white text-sm">
                Token Name
              </Label>
              <Input
                id="tokenName"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={handleNameKeyDown}
                placeholder="My Awesome Token"
                maxLength={32}
                className="bg-black/40 border-primary/30 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary/20"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between text-xs text-white/60 mb-4">
              <span>Press ⌘+Enter to save, Esc to cancel</span>
              <span>{nameValue.length}/32</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNameValue(tokenName);
                  setShowNameEdit(false);
                }}
                className="flex-1 text-white/80 hover:bg-red-500/20 hover:text-red-300"
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNameSave}
                className="flex-1 text-primary hover:bg-primary/20"
              >
                Save
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Token Symbol Editor Overlay */}
      {showTickerEdit && onTokenInfoChange && (
        <div className="absolute inset-0 flex items-center justify-center p-6 z-30">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/90 backdrop-blur-md rounded-xl border border-white/20 p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-2 mb-4">
              <Hash className="h-4 w-4 text-primary" />
              <h3 className="text-white font-medium">Edit Token Symbol</h3>
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="tokenSymbol" className="text-white text-sm">
                Token Symbol
              </Label>
              <Input
                id="tokenSymbol"
                value={tickerValue}
                onChange={(e) => setTickerValue(e.target.value.toUpperCase())}
                onKeyDown={handleTickerKeyDown}
                placeholder="TOKEN"
                maxLength={8}
                className="bg-black/40 border-primary/30 text-white placeholder:text-white/50 focus:border-primary focus:ring-primary/20"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between text-xs text-white/60 mb-4">
              <span>Press ⌘+Enter to save, Esc to cancel</span>
              <span>{tickerValue.length}/8</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTickerValue(tokenSymbol);
                  setShowTickerEdit(false);
                }}
                className="flex-1 text-white/80 hover:bg-red-500/20 hover:text-red-300"
              >
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTickerSave}
                className="flex-1 text-primary hover:bg-primary/20"
              >
                Save
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Inline Controls in Top Bar */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 p-2">
          {/* Edit Controls */}
          <div className="flex items-center gap-1">
            {/* Token Name Edit Button */}
            {onTokenInfoChange && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNameEdit(!showNameEdit)}
                    className={`h-7 w-7 text-white hover:bg-white/20 ${
                      showNameEdit ? "bg-primary/30" : ""
                    }`}
                  >
                    <Type className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Token Name</TooltipContent>
              </Tooltip>
            )}

            {/* Token Symbol Edit Button */}
            {onTokenInfoChange && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowTickerEdit(!showTickerEdit)}
                    className={`h-7 w-7 text-white hover:bg-white/20 ${
                      showTickerEdit ? "bg-primary/30" : ""
                    }`}
                  >
                    <Hash className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Token Symbol</TooltipContent>
              </Tooltip>
            )}

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
          </div>

          {/* Fit Mode Toggle - only show when not editing and have image */}
          {!showDescription && !showNameEdit && !showTickerEdit && imageUrl && (
            <div className="flex items-center gap-1 border-l border-white/20 pl-2">
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

          {/* Quick Controls - only show when not editing and have image */}
          {!showDescription &&
            !showNameEdit &&
            !showTickerEdit &&
            position.fit !== "fill" &&
            imageUrl && (
              <div className="flex items-center gap-1 border-l border-white/20 pl-2">
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

          {/* Reset - only show when not editing and have image */}
          {!showDescription && !showNameEdit && !showTickerEdit && imageUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetPosition}
                  className="h-7 w-7 text-white hover:bg-white/20 border-l border-white/20 pl-2 ml-1"
                >
                  <RotateCw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset Position</TooltipContent>
            </Tooltip>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1 border-l border-white/20 pl-2">
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
    </div>
  );
};
