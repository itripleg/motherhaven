// app/factory/components/editor/FactoryImageUploadWithEditor.tsx
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Upload,
  Image as ImageIcon,
  Camera,
  FileText,
  Crown,
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingDescription, setEditingDescription] = useState(description);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create preview URL from file
  React.useEffect(() => {
    if (!imageFile) {
      setImageUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(imageFile);

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageFile, imageUrl]);

  // Update description when prop changes
  React.useEffect(() => {
    setEditingDescription(description);
  }, [description]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file); // Debug log
    if (file) {
      // Simple validation
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        alert("File size must be less than 10MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      console.log("Calling onImageChange with file:", file); // Debug log
      onImageChange(file);
      // Reset position when new image is uploaded
      onPositionChange({ x: 0, y: 0, scale: 1, rotation: 0, fit: "cover" });
    }
  };

  const handleUploadClick = () => {
    console.log("Upload button clicked"); // Debug log
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    onImageChange(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEditSave = () => {
    onDescriptionChange(editingDescription);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditingDescription(description);
    setIsEditing(false);
  };

  const canEdit = !!(imageFile && imageUrl);

  return (
    <div className="space-y-6">
      {/* Token Header Preview with Editor - Like main dex token header */}
      <Card className="h-80 relative overflow-hidden unified-card border-primary/20">
        <AnimatePresence mode="wait">
          {isEditing && imageUrl ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FactoryImagePositionEditor
                position={imagePosition}
                onPositionChange={onPositionChange}
                description={editingDescription}
                onDescriptionChange={setEditingDescription}
                onSave={handleEditSave}
                onCancel={handleEditCancel}
                isUpdating={false}
                imageUrl={imageUrl}
              />
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Background */}
              <FactoryEditorBackground
                imageUrl={imageUrl}
                position={imagePosition}
                overlayOpacity={0.6}
              />

              {/* Hidden file input - moved to be accessible from header buttons */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Content like TokenHeaderContent */}
              <div className="relative z-10 flex flex-col justify-between h-full p-4 lg:p-6">
                {/* Top Bar */}
                <div className="flex justify-between items-start mb-4 lg:mb-0">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-white/80 font-mono">
                      0x1234...5678
                    </div>
                  </div>

                  <div className="flex items-center gap-2 lg:gap-3 ml-2 flex-shrink-0">
                    <Badge
                      className="bg-emerald-500 text-white border-0 text-xs lg:text-sm"
                      variant="outline"
                    >
                      Trading
                    </Badge>

                    {/* Creator controls - always show since this is factory */}
                    <div className="flex items-center gap-1 lg:gap-2 p-1 lg:p-1.5 bg-black/30 border border-primary/40 rounded-lg backdrop-blur-sm">
                      {canEdit && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsEditing(true)}
                              className="text-white hover:text-primary hover:bg-primary/20 h-6 w-6 lg:h-7 lg:w-7 border border-white/40 hover:border-primary/50 transition-all duration-200"
                            >
                              <Camera className="h-3 w-3 lg:h-4 lg:w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit photo position</TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsEditing(true)}
                            className="text-white hover:text-primary hover:bg-primary/20 h-6 w-6 lg:h-7 lg:w-7 border border-white/40 hover:border-primary/50 transition-all duration-200"
                          >
                            <FileText className="h-3 w-3 lg:h-4 lg:w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit description</TooltipContent>
                      </Tooltip>

                      {imageFile && (
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
                          <TooltipContent>Change image</TooltipContent>
                        </Tooltip>
                      )}

                      {!imageFile && (
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
                          <TooltipContent>Upload image</TooltipContent>
                        </Tooltip>
                      )}

                      {imageFile && (
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

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-1 lg:p-1.5 bg-primary/20 border border-primary/40 rounded-md">
                            <Crown className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          You are creating this token
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Token Info */}
                <div className="space-y-4 lg:space-y-6 flex-1">
                  <div className="space-y-2 lg:space-y-3">
                    <h1 className="text-2xl lg:text-4xl font-bold text-white leading-tight">
                      {tokenName || "Your Token"}
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

                    {!description && (
                      <p className="text-white/50 text-sm lg:text-base max-w-2xl italic">
                        No description provided
                      </p>
                    )}
                  </div>

                  {/* Preview stats */}
                  <div className="backdrop-blur-sm bg-white/10 p-3 lg:p-4 rounded-lg lg:rounded-xl border border-white/20 max-w-xs">
                    <div className="text-white/80 text-sm mb-1">
                      Current Price
                    </div>
                    <p className="text-white text-lg lg:text-xl font-bold">
                      0.001234{" "}
                      <span className="text-white/70 text-sm lg:text-base">
                        AVAX
                      </span>
                    </p>
                  </div>

                  {/* Preview Note */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-200 text-xs">
                      Preview - Real data will appear after creation
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          {!imageFile
            ? "Upload an image above to see your token header preview"
            : canEdit
            ? "Use the camera button to adjust image position and the text button to edit description"
            : "Your token header preview"}
        </p>
      </div>
    </div>
  );
};
