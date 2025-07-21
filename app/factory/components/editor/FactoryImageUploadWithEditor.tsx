// app/factory/components/editor/FactoryImageUploadWithEditor.tsx - FIXED: Unified with DEX version
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Upload,
  Camera,
  Crown,
  MessageSquare,
  Type,
  Hash,
  Sparkles,
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
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<
    "position" | "description" | "name" | "ticker" | null
  >(null);
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

  const handleEditSave = () => {
    setIsEditing(false);
    setEditMode(null);
    // Note: Position changes are handled immediately via onPositionChange
    // No need to save to Firebase here - that happens during token creation
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditMode(null);
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
        {isEditing ? (
          <FactoryImagePositionEditor
            position={imagePosition}
            onPositionChange={onPositionChange}
            description={description}
            onDescriptionChange={onDescriptionChange}
            onTokenInfoChange={onTokenInfoChange}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
            isUpdating={false}
            imageUrl={imageUrl}
            tokenName={tokenName}
            tokenSymbol={tokenSymbol}
            initialMode={editMode}
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

            {/* Content Layer - Matches DEX TokenHeaderContent exactly */}
            <div className="relative z-10 flex flex-col justify-between h-full p-4 lg:p-6">
              {/* Top Bar */}
              <div className="flex justify-between items-start mb-4 lg:mb-0">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-white/80 font-mono">0x1234...5678</div>
                </div>

                <div className="flex items-center gap-2 lg:gap-3 ml-2 flex-shrink-0">
                  <Badge
                    className="bg-emerald-500/80 text-white border-0 text-xs lg:text-sm"
                    variant="outline"
                  >
                    <Sparkles className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                    Trading
                  </Badge>

                  {/* Icon group - always visible */}
                  <div className="flex items-center gap-1 lg:gap-2 p-1 lg:p-1.5 bg-black/30 border border-white/40 rounded-lg backdrop-blur-sm">
                    {/* Token Name Edit Button */}
                    {onTokenInfoChange && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditMode("name");
                              setIsEditing(true);
                            }}
                            className="text-white hover:text-primary hover:bg-primary/20 h-6 w-6 lg:h-7 lg:w-7 border border-white/40 hover:border-primary/50 transition-all duration-200"
                          >
                            <Type className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit token name</TooltipContent>
                      </Tooltip>
                    )}

                    {/* Token Symbol Edit Button */}
                    {onTokenInfoChange && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditMode("ticker");
                              setIsEditing(true);
                            }}
                            className="text-white hover:text-primary hover:bg-primary/20 h-6 w-6 lg:h-7 lg:w-7 border border-white/40 hover:border-primary/50 transition-all duration-200"
                          >
                            <Hash className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit token symbol</TooltipContent>
                      </Tooltip>
                    )}

                    {/* Description Edit Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditMode("description");
                            setIsEditing(true);
                          }}
                          className="text-white hover:text-primary hover:bg-primary/20 h-6 w-6 lg:h-7 lg:w-7 border border-white/40 hover:border-primary/50 transition-all duration-200"
                        >
                          <MessageSquare className="h-3 w-3 lg:h-4 lg:w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit description</TooltipContent>
                    </Tooltip>

                    {/* Image Position Edit Button */}
                    {imageUrl && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditMode("position");
                              setIsEditing(true);
                            }}
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

              {/* Token Info */}
              <div className="space-y-4 lg:space-y-6 flex-1">
                <div className="space-y-2 lg:space-y-3">
                  <h1 className="text-2xl lg:text-4xl font-bold text-white leading-tight">
                    {tokenName}
                    {tokenSymbol && (
                      <span className="text-lg lg:text-2xl text-white/70 ml-2 lg:ml-3">
                        ({tokenSymbol})
                      </span>
                    )}
                  </h1>

                  {description && (
                    <p className="text-white/70 text-sm lg:text-base max-w-2xl line-clamp-2">
                      "{description}"
                    </p>
                  )}
                </div>

                {/* Price Card - Static for preview */}
                <div className="backdrop-blur-sm bg-white/10 p-3 lg:p-4 rounded-lg lg:rounded-xl border border-white/20 max-w-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white/80 text-sm">Current Price</span>
                  </div>
                  <p className="text-white text-lg lg:text-xl font-bold">
                    0.00001 <span className="text-white/70 text-sm lg:text-base">AVAX</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Upload prompt when no image */}
            {!imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div
                  onClick={handleUploadClick}
                  className="bg-black/60 backdrop-blur-sm p-6 lg:p-8 rounded-xl border border-white/20 text-center cursor-pointer hover:bg-black/70 transition-colors active:scale-95"
                >
                  <Upload className="h-8 w-8 lg:h-12 lg:w-12 text-white mx-auto mb-3 lg:mb-4" />
                  <p className="text-white text-base lg:text-lg font-medium mb-2">
                    Upload Token Image
                  </p>
                  <p className="text-white/70 text-sm lg:text-base">
                    Click to add a background image
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};