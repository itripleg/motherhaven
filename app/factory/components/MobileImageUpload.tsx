// app/factory/components/MobileImageUpload.tsx
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Camera, Edit3, Check, Crown, Sparkles } from "lucide-react";
import { ImagePosition } from "./editor/types";

interface MobileImageUploadProps {
  imageFile: File | null;
  imagePosition: ImagePosition;
  description: string;
  onImageChange: (file: File | null) => void;
  onPositionChange: (position: ImagePosition) => void;
  onDescriptionChange: (description: string) => void;
  onTokenInfoChange?: (info: { name?: string; ticker?: string }) => void;
  tokenName?: string;
  tokenSymbol?: string;
}

export const MobileImageUpload: React.FC<MobileImageUploadProps> = ({
  imageFile,
  imagePosition,
  description,
  onImageChange,
  onPositionChange,
  onDescriptionChange,
  onTokenInfoChange,
  tokenName = "Your Token",
  tokenSymbol = "TOKEN",
}) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState({
    name: tokenName,
    symbol: tokenSymbol,
    description: description,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create preview URL from file
  React.useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(undefined);
    }
  }, [imageFile]);

  // Update temp values when props change
  React.useEffect(() => {
    setTempValues({
      name: tokenName,
      symbol: tokenSymbol,
      description: description,
    });
  }, [tokenName, tokenSymbol, description]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      onImageChange(file);
    }
    e.target.value = "";
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveField = (field: string) => {
    switch (field) {
      case "name":
        if (onTokenInfoChange && tempValues.name !== tokenName) {
          onTokenInfoChange({ name: tempValues.name });
        }
        break;
      case "symbol":
        if (onTokenInfoChange && tempValues.symbol !== tokenSymbol) {
          onTokenInfoChange({ ticker: tempValues.symbol });
        }
        break;
      case "description":
        if (tempValues.description !== description) {
          onDescriptionChange(tempValues.description);
        }
        break;
    }
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setTempValues({
      name: tokenName,
      symbol: tokenSymbol,
      description: description,
    });
    setEditingField(null);
  };

  // Get background style matching TokenHeaderBackground
  const getBackgroundStyle = () => {
    if (!imageUrl) return {};

    const { x, y, scale, rotation, fit = "cover" } = imagePosition;
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
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Token Header Preview - Matches TokenHeader exactly */}
      <Card className="h-80 relative overflow-hidden border-primary/20">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          {imageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={getBackgroundStyle()}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60 opacity-60" />
        </div>

        {/* Content Layer - Matches TokenHeaderContent */}
        <div className="relative z-10 flex flex-col justify-between h-full p-4">
          {/* Top Bar */}
          <div className="flex justify-between items-start mb-4">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-white/80 font-mono">
                0x1234...5678
              </div>
            </div>

            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              <div className="flex items-center gap-1 p-1 bg-black/30 border border-white/40 rounded-lg backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUploadClick}
                  className="text-white hover:text-primary hover:bg-primary/20 h-6 w-6 border border-white/40 hover:border-primary/50"
                >
                  <Camera className="h-3 w-3" />
                </Button>

                {imageFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeImage}
                    className="text-white hover:text-red-400 hover:bg-red-500/20 h-6 w-6 border border-white/40 hover:border-red-400/50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}

                <div className="p-1 bg-primary/20 border border-primary/40 rounded-md">
                  <Crown className="h-3 w-3 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Token Info */}
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              {/* Token Name */}
              {editingField === "name" ? (
                <div className="space-y-2">
                  <Input
                    value={tempValues.name}
                    onChange={(e) =>
                      setTempValues({ ...tempValues, name: e.target.value })
                    }
                    placeholder="Token Name"
                    maxLength={32}
                    className="text-lg font-bold bg-black/40 border-primary/30 text-white placeholder:text-white/50"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="flex-1 text-white/80 hover:bg-red-500/20"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveField("name")}
                      className="flex-1 text-primary hover:bg-primary/20"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="group flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white leading-tight">
                    {tokenName || "Your Token"}
                    {tokenSymbol && (
                      <span className="text-lg text-white/70 ml-2">
                        ({tokenSymbol})
                      </span>
                    )}
                  </h1>
                  {onTokenInfoChange && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingField("name")}
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/20"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}

              {/* Token Symbol */}
              {editingField === "symbol" ? (
                <div className="space-y-2">
                  <Input
                    value={tempValues.symbol}
                    onChange={(e) =>
                      setTempValues({
                        ...tempValues,
                        symbol: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="TOKEN"
                    maxLength={8}
                    className="text-base bg-black/40 border-primary/30 text-white placeholder:text-white/50"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="flex-1 text-white/80 hover:bg-red-500/20"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveField("symbol")}
                      className="flex-1 text-primary hover:bg-primary/20"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                onTokenInfoChange && (
                  <div className="group flex items-center gap-2">
                    <p className="text-white/70 text-sm">
                      Tap symbol to edit: ${tokenSymbol}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingField("symbol")}
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/20"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                )
              )}

              {/* Description */}
              {editingField === "description" ? (
                <div className="space-y-2">
                  <Textarea
                    value={tempValues.description}
                    onChange={(e) =>
                      setTempValues({
                        ...tempValues,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe your token..."
                    maxLength={280}
                    className="min-h-[80px] resize-none bg-black/40 border-primary/30 text-white placeholder:text-white/50"
                    autoFocus
                  />
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{tempValues.description.length}/280</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="flex-1 text-white/80 hover:bg-red-500/20"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveField("description")}
                      className="flex-1 text-primary hover:bg-primary/20"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="group flex items-start gap-2">
                  <p className="text-white/70 text-sm max-w-2xl line-clamp-2">
                    {description ? (
                      `"${description}"`
                    ) : (
                      <span className="italic text-white/50">
                        Tap to add description
                      </span>
                    )}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingField("description")}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/20 flex-shrink-0"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Price Card - Static for preview */}
            <div className="backdrop-blur-sm bg-white/10 p-3 rounded-lg border border-white/20 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-white/80 text-sm">Current Price</div>
              </div>
              <p className="text-white text-lg font-bold">
                0.00001 <span className="text-white/70 text-sm">AVAX</span>
              </p>
            </div>
          </div>
        </div>

        {/* Upload Prompt Overlay (when no image) */}
        {!imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div
              onClick={handleUploadClick}
              className="bg-black/60 backdrop-blur-sm p-6 rounded-xl border border-white/20 text-center cursor-pointer hover:bg-black/70 transition-colors active:scale-95"
            >
              <div className="flex items-center gap-2 mb-3">
                <Upload className="h-6 w-6 text-white" />
                <Camera className="h-6 w-6 text-white" />
              </div>
              <p className="text-white text-lg font-medium mb-2">
                Add Token Image
              </p>
              <p className="text-white/70 text-sm">
                Tap to upload or take photo
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Upload Status */}
      {imageFile && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm flex-1 min-w-0 mr-3">
              <div className="font-medium text-foreground truncate">
                {imageFile.name}
              </div>
              <div className="text-muted-foreground">
                {(imageFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
              <Check className="h-3 w-3 mr-1" />
              Uploaded
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};
