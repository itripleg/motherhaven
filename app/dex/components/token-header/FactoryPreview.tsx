// app/dex/components/token-header/FactoryPreview.tsx
"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { TokenHeaderBackground } from "./TokenHeaderBackground";
import type { TokenHeaderData } from "./types";

interface FactoryPreviewProps {
  tokenName: string;
  tokenSymbol: string;
  description?: string;
  imageFile?: File | null;
  imageUrl?: string;
  className?: string;
  height?: string;
}

export const FactoryPreview: React.FC<FactoryPreviewProps> = ({
  tokenName = "Your Token",
  tokenSymbol = "TOKEN",
  description,
  imageFile,
  imageUrl,
  className = "",
  height = "h-48 lg:h-64",
}) => {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Create preview URL from file
  React.useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(imageFile);

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [imageFile, previewUrl]);

  const displayImageUrl = previewUrl || imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`${height} relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 ${className}`}
      >
        <TokenHeaderBackground
          imageUrl={displayImageUrl}
          overlayOpacity={0.7}
        />

        {/* Preview Content - Compact and responsive */}
        <div className="relative z-10 p-3 lg:p-4 h-full flex flex-col">
          {/* Top Bar - Minimal */}
          <div className="flex justify-between items-center mb-3 flex-shrink-0">
            <div className="text-xs text-white/80 font-mono">0x1234...5678</div>
            <Badge className="bg-emerald-500 text-white border-0 px-2 py-1 text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Trading
            </Badge>
          </div>

          {/* Token Info - Flexible */}
          <div className="flex-1 flex flex-col justify-center min-h-0">
            <div className="space-y-2">
              <h1 className="text-lg lg:text-2xl font-bold text-white leading-tight">
                {tokenName || "Your Token"}
                {tokenSymbol && (
                  <span className="text-sm lg:text-lg text-white/70 ml-2">
                    ${tokenSymbol}
                  </span>
                )}
              </h1>

              {description && (
                <p className="text-white/80 text-xs lg:text-sm leading-relaxed line-clamp-2 max-w-lg">
                  "{description}"
                </p>
              )}
            </div>

            {/* Preview Note */}
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-200 text-xs">
                <Sparkles className="h-3 w-3" />
                Preview - Real data will appear after creation
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
