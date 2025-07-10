// app/factory/components/editor/FactoryImageUploadWithEditor.tsx
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Upload, Camera, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FactoryImagePositionEditor } from "./ImagePositionEditor";
import { FactoryEditorBackground } from "./FactoryEditorBackground";
import { ImagePosition } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface FactoryImageUploadWithEditorProps {
  imageFile: File | null;
  imagePosition: ImagePosition;
  description: string;
  onImageChange: (file: File | null) => void;
  onPositionChange: (position: ImagePosition) => void;
  onDescriptionChange: (description: string) => void;
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
  tokenName = "Your Token",
  tokenSymbol = "TOKEN",
}) => {
  console.log(
    "FactoryImageUploadWithEditor received imageFile prop:",
    imageFile
  );

  const [isEditing, setIsEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create preview URL from file
  React.useEffect(() => {
    console.log("imageFile changed:", imageFile);
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      console.log("Created URL:", url);
      setImageUrl(url);
      return () => {
        console.log("Cleaning up URL:", url);
        URL.revokeObjectURL(url);
      };
    } else {
      console.log("No imageFile, setting imageUrl to undefined");
      setImageUrl(undefined);
    }
  }, [imageFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected in editor:", file);
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      console.log("Calling onImageChange with:", file);
      onImageChange(file);
      onPositionChange({ x: 0, y: 0, scale: 1, rotation: 0, fit: "cover" });
    }
    // Reset the input value so the same file can be selected again
    e.target.value = "";
  };

  const handleUploadClick = () => {
    console.log("Upload button clicked, current imageUrl:", imageUrl);
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    console.log("Remove image clicked");
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEditSave = () => {
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  return (
    <Card className="h-80 relative overflow-hidden border-primary/20">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {isEditing && imageUrl ? (
          <FactoryImagePositionEditor
            position={imagePosition}
            onPositionChange={onPositionChange}
            description={description}
            onDescriptionChange={onDescriptionChange}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
            isUpdating={false}
            imageUrl={imageUrl}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <FactoryEditorBackground
              imageUrl={imageUrl}
              position={imagePosition}
              overlayOpacity={0.6}
            />

            <div className="relative z-10 flex flex-col justify-between h-full p-6">
              {/* Top Bar */}
              <div className="flex justify-between items-start">
                <div className="text-xs text-white/80 font-mono">
                  0x1234...5678
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500 text-white border-0">
                    Trading
                  </Badge>

                  {/* Controls */}
                  <div className="flex items-center gap-1 p-1 bg-black/30 border border-primary/40 rounded-lg">
                    {imageUrl && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsEditing(true)}
                            className="text-white hover:text-primary h-6 w-6"
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit position</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleUploadClick}
                          className="text-white hover:text-primary h-6 w-6"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {imageUrl ? "Change image" : "Upload image"}
                      </TooltipContent>
                    </Tooltip>

                    {imageUrl && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={removeImage}
                            className="text-white hover:text-red-400 h-6 w-6"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove image</TooltipContent>
                      </Tooltip>
                    )}

                    <div className="p-1 bg-primary/20 border border-primary/40 rounded-md">
                      <Crown className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Token Info */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl font-bold text-white">
                    {tokenName}
                    {tokenSymbol && (
                      <span className="text-2xl text-white/70 ml-3">
                        ({tokenSymbol})
                      </span>
                    )}
                  </h1>

                  {description && (
                    <p className="text-white/70 text-base mt-2">
                      &ldquo;{description}&rdquo;
                    </p>
                  )}
                </div>

                <div className="bg-white/10 p-4 rounded-xl border border-white/20 max-w-xs">
                  <div className="text-white/80 text-sm">Current Price</div>
                  <p className="text-white text-xl font-bold">
                    0.001234{" "}
                    <span className="text-white/70 text-base">AVAX</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Upload prompt when no image */}
            {!imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  onClick={handleUploadClick}
                  className="bg-black/60 backdrop-blur-sm p-8 rounded-xl border border-white/20 text-center cursor-pointer hover:bg-black/70 transition-colors"
                >
                  <Upload className="h-12 w-12 text-white mx-auto mb-4" />
                  <p className="text-white text-lg font-medium mb-2">
                    Upload Token Image
                  </p>
                  <p className="text-white/70">
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
