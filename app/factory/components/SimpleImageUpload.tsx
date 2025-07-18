// app/factory/components/SimpleImageUpload.tsx
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { X, Upload, Image as ImageIcon } from "lucide-react";
// import { FactoryPreview } from "./FactoryPreview";

interface SimpleImageUploadProps {
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
  tokenName?: string;
  tokenSymbol?: string;
  description?: string;
}

export const SimpleImageUpload: React.FC<SimpleImageUploadProps> = ({
  imageFile,
  onImageChange,
  tokenName = "Your Token",
  tokenSymbol = "TOKEN",
  description,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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

      onImageChange(file);
    }
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

  return (
    <div className="space-y-6">
      {/* Upload Controls */}
      <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-primary" />
              <div>
                <Label className="text-base font-semibold text-foreground">
                  Token Image
                </Label>
                <p className="text-sm text-muted-foreground">
                  Optional (PNG, JPG, GIF up to 10MB)
                </p>
              </div>
            </div>
            {imageFile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeImage}
                className="text-red-400 hover:text-red-300 border-red-400/30"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload area */}
          {!imageFile ? (
            <div
              onClick={handleUploadClick}
              className="w-full h-32 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Upload className="h-8 w-8 text-primary mb-2" />
              <p className="text-primary font-medium">Click to upload image</p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="text-sm">
                <div className="font-medium text-foreground">
                  {imageFile.name}
                </div>
                <div className="text-muted-foreground">
                  {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
                className="border-primary/20 hover:bg-primary/10"
              >
                Change Image
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
