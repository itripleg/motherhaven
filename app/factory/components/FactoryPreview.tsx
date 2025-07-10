// app/factory/components/FactoryPreview.tsx - Fixed Imports
"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ImagePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fit?: "cover" | "contain" | "fill";
}

interface FactoryPreviewProps {
  tokenName: string;
  tokenSymbol: string;
  description?: string;
  imageFile?: File | null;
  imageUrl?: string;
  imagePosition?: ImagePosition;
  className?: string;
  height?: string;
}

const TokenHeaderBackground: React.FC<{
  imageUrl?: string;
  position?: ImagePosition;
  showOverlay?: boolean;
  overlayOpacity?: number;
  className?: string;
}> = ({
  imageUrl,
  position = { x: 0, y: 0, scale: 1, rotation: 0, fit: "cover" },
  showOverlay = true,
  overlayOpacity = 0.6,
  className = "",
}) => {
  const getBackgroundStyle = () => {
    if (!imageUrl) return {};

    const { x, y, scale, rotation, fit = "cover" } = position;
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
    <div className={`absolute inset-0 z-0 ${className}`}>
      {imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={getBackgroundStyle()}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
      )}
      {showOverlay && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60"
          style={{ opacity: overlayOpacity }}
        />
      )}
    </div>
  );
};

export const FactoryPreview: React.FC<FactoryPreviewProps> = ({
  tokenName = "Your Token",
  tokenSymbol = "TOKEN",
  description,
  imageFile,
  imageUrl,
  imagePosition,
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
          position={imagePosition}
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
                  &quot;{description}&quot;
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
