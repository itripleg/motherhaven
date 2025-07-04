// app/dex/factory/components/SimpleImageUpload.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Image as ImageIcon, Sparkles } from "lucide-react";

interface SimpleImageUploadProps {
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
  tokenName?: string;
  tokenSymbol?: string;
}

export const SimpleImageUpload: React.FC<SimpleImageUploadProps> = ({
  imageFile,
  onImageChange,
  tokenName = "Your Token",
  tokenSymbol = "TOKEN",
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

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

        {/* Upload area or preview */}
        <div className="relative">
          {!previewUrl ? (
            <div
              onClick={handleUploadClick}
              className="w-full h-48 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Upload className="h-12 w-12 text-primary mb-4" />
              <p className="text-primary font-medium">Click to upload image</p>
              <p className="text-sm text-muted-foreground mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Token Header Preview with Background Effect */}
              <div className="relative overflow-hidden min-h-[200px] rounded-lg border border-primary/20">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${previewUrl})`,
                      filter: "blur(1px)",
                      transform: "scale(1.1)",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xs text-muted-foreground">
                      0x1234...5678
                    </div>
                    <Badge className="bg-green-600/70 text-green-100 border-green-400/30">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Trading
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-foreground text-3xl font-bold flex items-center gap-3">
                      {tokenName}
                      <span className="text-xl text-muted-foreground">
                        ({tokenSymbol})
                      </span>
                    </h1>
                    <div className="backdrop-blur-sm bg-background/20 p-4 rounded-lg max-w-xs border border-border/30">
                      <div className="text-muted-foreground text-sm mb-1">
                        Current Price
                      </div>
                      <p className="text-foreground text-lg font-semibold">
                        0.001234{" "}
                        <span className="text-muted-foreground">AVAX</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* File info and change button */}
              <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="text-sm">
                  <div className="font-medium text-foreground">
                    {imageFile?.name}
                  </div>
                  <div className="text-muted-foreground">
                    {imageFile
                      ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`
                      : ""}
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

              <p className="text-xs text-muted-foreground text-center">
                Preview: Don&apos;t worry you can update this after creation.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
