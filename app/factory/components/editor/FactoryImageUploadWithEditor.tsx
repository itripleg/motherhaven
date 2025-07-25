// app/factory/components/editor/FactoryImageUploadWithEditor.tsx - FIXED: Inline editing for text, overlay only for image positioning
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Upload,
  Camera,
  Crown,
  MessageSquare,
  Type,
  Hash,
  Check,
  Edit3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FactoryImagePositionEditor } from "./ImagePositionEditor";
import { FactoryEditorBackground } from "./FactoryEditorBackground";
import { ImagePosition } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FactoryImageUploadWithEditorProps {
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

export const FactoryImageUploadWithEditor: React.FC<
  FactoryImageUploadWithEditorProps
> = ({
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
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState({
    name: tokenName,
    symbol: tokenSymbol,
    description: description,
  });
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
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

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === "Escape") {
      handleCancelEdit();
    } else if (
      e.key === "Enter" &&
      (e.metaKey || e.ctrlKey || field !== "description")
    ) {
      handleSaveField(field);
    }
  };

  return (
    <Card className="h-80 relative overflow-hidden unified-card border-primary/20">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {isEditingImage ? (
          <FactoryImagePositionEditor
            position={imagePosition}
            onPositionChange={onPositionChange}
            description={description}
            onDescriptionChange={onDescriptionChange}
            onTokenInfoChange={onTokenInfoChange}
            onSave={() => setIsEditingImage(false)}
            onCancel={() => setIsEditingImage(false)}
            isUpdating={false}
            imageUrl={imageUrl}
            tokenName={tokenName}
            tokenSymbol={tokenSymbol}
            initialMode="position"
          />
        ) : (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <FactoryEditorBackground
              imageUrl={imageUrl}
              position={imagePosition}
              overlayOpacity={0.6}
            />

            {/* Content Layer */}
            <div className="relative z-10 flex flex-col justify-between h-full p-4 lg:p-6">
              {/* Top Bar */}
              <div className="flex justify-between items-start mb-4 lg:mb-0">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-white/80 font-mono">
                    0x1234...5678
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:gap-3 ml-2 flex-shrink-0">
                  <div className="flex items-center gap-1 lg:gap-2 p-1 lg:p-1.5 bg-black/30 border border-white/40 rounded-lg backdrop-blur-sm">
                    {/* Image Position Edit Button - Only if image exists */}
                    {imageUrl && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsEditingImage(true)}
                            className="text-white hover:text-primary hover:bg-primary/20 h-6 w-6 lg:h-7 lg:w-7 border border-white/40 hover:border-primary/50 transition-all duration-200"
                          >
                            <Camera className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit photo position</TooltipContent>
                      </Tooltip>
                    )}

                    {/* Upload Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleUploadClick}
                          className="text-white hover:text-primary hover:bg-primary/20 h-6 w-6 lg:h-7 lg:w-7 border border-white/40 hover:border-primary/50 transition-all duration-200"
                        >
                          <Upload className="h-3 w-3 lg:h-4 lg:w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {imageUrl ? "Change image" : "Upload image"}
                      </TooltipContent>
                    </Tooltip>

                    {/* Remove Image Button */}
                    {imageUrl && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={removeImage}
                            className="text-white hover:text-red-400 hover:bg-red-500/20 h-6 w-6 lg:h-7 lg:w-7 border border-white/40 hover:border-red-400/50 transition-all duration-200"
                          >
                            <X className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove image</TooltipContent>
                      </Tooltip>
                    )}

                    {/* Creator Badge */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-1 lg:p-1.5 bg-primary/20 border border-primary/40 rounded-md">
                          <Crown className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>You are the creator</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Token Info with Inline Editing */}
              <div className="space-y-4 lg:space-y-6 flex-1">
                <div className="space-y-2 lg:space-y-3">
                  {/* Token Name - Inline Editing */}
                  {editingField === "name" ? (
                    <div className="space-y-2">
                      <Input
                        value={tempValues.name}
                        onChange={(e) =>
                          setTempValues({ ...tempValues, name: e.target.value })
                        }
                        onKeyDown={(e) => handleKeyDown(e, "name")}
                        placeholder="Token Name"
                        maxLength={32}
                        className="text-lg lg:text-4xl font-bold bg-black/40 border-primary/30 text-white placeholder:text-white/50 h-12 lg:h-16"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="text-white/80 hover:bg-red-500/20"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveField("name")}
                          className="text-primary hover:bg-primary/20"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group flex items-start gap-2">
                      <h1 className="text-2xl lg:text-4xl font-bold text-white leading-tight flex-1">
                        {tokenName}
                        {tokenSymbol && (
                          <span className="text-lg lg:text-2xl text-white/70 ml-2 lg:ml-3">
                            ({tokenSymbol})
                          </span>
                        )}
                      </h1>
                      {onTokenInfoChange && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingField("name")}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/20 flex-shrink-0"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Token Symbol - Inline Editing */}
                  {editingField === "symbol" && onTokenInfoChange ? (
                    <div className="space-y-2">
                      <Input
                        value={tempValues.symbol}
                        onChange={(e) =>
                          setTempValues({
                            ...tempValues,
                            symbol: e.target.value.toUpperCase(),
                          })
                        }
                        onKeyDown={(e) => handleKeyDown(e, "symbol")}
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
                          className="text-white/80 hover:bg-red-500/20"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveField("symbol")}
                          className="text-primary hover:bg-primary/20"
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
                          Symbol: ${tokenSymbol}
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

                  {/* Description - Inline Editing */}
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
                        onKeyDown={(e) => handleKeyDown(e, "description")}
                        placeholder="Describe your token..."
                        maxLength={280}
                        className="min-h-[80px] resize-none bg-black/40 border-primary/30 text-white placeholder:text-white/50"
                        autoFocus
                      />
                      <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                        <span>Press Esc to cancel, Ctrl+Enter to save</span>
                        <span>{tempValues.description.length}/280</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="text-white/80 hover:bg-red-500/20"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveField("description")}
                          className="text-primary hover:bg-primary/20"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group flex items-start gap-2">
                      <p className="text-white/70 text-sm lg:text-base max-w-2xl line-clamp-2 flex-1">
                        {description ? (
                          `"${description}"`
                        ) : (
                          <span className="italic text-white/50">
                            Click to add description
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
                <div className="backdrop-blur-sm bg-white/10 p-3 lg:p-4 rounded-lg lg:rounded-xl border border-white/20 max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white/80 text-sm">Current Price</span>
                  </div>
                  <p className="text-white text-lg lg:text-xl font-bold">
                    0.00001{" "}
                    <span className="text-white/70 text-sm lg:text-base">
                      AVAX
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
