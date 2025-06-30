import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  Settings,
  Eye,
  RotateCcw,
  Move,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Image from "next/image";
import { isAddress } from "viem";
import { motion, AnimatePresence } from "framer-motion";

interface ImagePosition {
  x: number; // -100 to 100 (percentage)
  y: number; // -100 to 100 (percentage)
  scale: number; // 0.5 to 3
  rotation: number; // -180 to 180 degrees
}

interface TokenInfo {
  name: string;
  ticker: string;
  description: string;
  image: File | null;
  imagePosition: ImagePosition;
  burnManager?: `0x${string}`;
}

interface TokenInfoFormProps {
  tokenInfo: TokenInfo;
  onTokenInfoChange: (tokenInfo: TokenInfo) => void;
}

const ImagePositioningControls: React.FC<{
  imageFile: File | null;
  position: ImagePosition;
  onPositionChange: (position: ImagePosition) => void;
  showPreview: boolean;
  onPreviewToggle: () => void;
}> = ({
  imageFile,
  position,
  onPositionChange,
  showPreview,
  onPreviewToggle,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !cropRef.current) return;

    const rect = cropRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    onPositionChange({
      ...position,
      x: Math.max(-100, Math.min(100, position.x + deltaX)),
      y: Math.max(-100, Math.min(100, position.y + deltaY)),
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetPosition = () => {
    onPositionChange({ x: 0, y: 0, scale: 1, rotation: 0 });
  };

  const getImageStyle = () => ({
    transform: `translate(${position.x}%, ${position.y}%) scale(${position.scale}) rotate(${position.rotation}deg)`,
    transformOrigin: "center center",
    transition: isDragging ? "none" : "transform 0.2s ease-out",
  });

  const getHeaderPreviewStyle = () => ({
    backgroundImage: `url(${previewUrl})`,
    backgroundSize: `${100 * position.scale}% ${100 * position.scale}%`,
    backgroundPosition: `${50 + position.x}% ${50 + position.y}%`,
    backgroundRepeat: "no-repeat",
    transform: `rotate(${position.rotation}deg)`,
    transformOrigin: "center center",
  });

  if (!previewUrl) return null;

  return (
    <div className="space-y-4">
      {/* Crop Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Position & Crop
          </Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPreviewToggle}
              className="flex items-center gap-1 text-xs"
            >
              <Eye className="h-3 w-3" />
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetPosition}
              className="flex items-center gap-1 text-xs"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>
        </div>

        <div
          ref={cropRef}
          className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-300 cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid Overlay */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-3 grid-rows-3 h-full">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/50" />
              ))}
            </div>
          </div>

          {/* Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={getImageStyle()}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY * -0.001;
              const newScale = Math.max(
                0.5,
                Math.min(3, position.scale + delta)
              );
              onPositionChange({ ...position, scale: newScale });
            }}
          >
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${previewUrl})` }}
            />
          </div>

          {/* Center Point */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 border-2 border-white/70 rounded-full bg-black/30" />
          </div>

          {/* Drag Indicator */}
          {isDragging && (
            <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Move className="h-3 w-3" />
              Dragging
            </div>
          )}
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Horizontal</span>
            <span>{position.x.toFixed(0)}%</span>
          </div>
          <Slider
            value={[position.x]}
            onValueChange={([value]) =>
              onPositionChange({ ...position, x: value })
            }
            min={-100}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Vertical</span>
            <span>{position.y.toFixed(0)}%</span>
          </div>
          <Slider
            value={[position.y]}
            onValueChange={([value]) =>
              onPositionChange({ ...position, y: value })
            }
            min={-100}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Scale</span>
            <span>{position.scale.toFixed(1)}x</span>
          </div>
          <Slider
            value={[position.scale]}
            onValueChange={([value]) =>
              onPositionChange({ ...position, scale: value })
            }
            min={0.5}
            max={3}
            step={0.1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Rotation</span>
            <span>{position.rotation.toFixed(0)}°</span>
          </div>
          <Slider
            value={[position.rotation]}
            onValueChange={([value]) =>
              onPositionChange({ ...position, rotation: value })
            }
            min={-180}
            max={180}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        {[
          { name: "Center", pos: { x: 0, y: 0, scale: 1, rotation: 0 } },
          { name: "Top", pos: { x: 0, y: -30, scale: 1.2, rotation: 0 } },
          { name: "Bottom", pos: { x: 0, y: 30, scale: 1.2, rotation: 0 } },
          { name: "Zoom", pos: { x: 0, y: 0, scale: 1.5, rotation: 0 } },
        ].map((preset) => (
          <Button
            key={preset.name}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPositionChange(preset.pos)}
            className="text-xs px-2 py-1"
          >
            {preset.name}
          </Button>
        ))}
      </div>

      {/* Token Header Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Token Header Preview
              </Label>
              <div className="relative overflow-hidden min-h-[200px] rounded-lg border">
                {/* Background Image Layer */}
                <div className="absolute inset-0 z-0">
                  <div
                    className="absolute inset-0 bg-no-repeat bg-cover bg-center transition-all duration-300"
                    style={getHeaderPreviewStyle()}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
                </div>

                {/* Content Layer */}
                <div className="relative z-10 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-xs text-gray-300">0x1234...5678</div>
                    <Badge className="bg-green-600/70 text-white">
                      Trading
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h1 className="text-white text-2xl font-bold flex items-center gap-3">
                        Sample Token
                        <span className="text-lg text-gray-300">(SAMPLE)</span>
                      </h1>
                    </div>

                    <div className="backdrop-blur-sm bg-white/10 p-3 rounded-lg">
                      <div className="text-gray-200 text-sm mb-1">
                        Current Price
                      </div>
                      <p className="text-white text-lg font-semibold">
                        0.001234 <span className="text-gray-300">AVAX</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function TokenInfoForm({
  tokenInfo,
  onTokenInfoChange,
}: TokenInfoFormProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [burnManagerError, setBurnManagerError] = useState<string>("");
  const [showImageControls, setShowImageControls] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (tokenInfo.image) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(tokenInfo.image);
      setShowImageControls(true);
    } else {
      setPreviewUrl(null);
      setShowImageControls(false);
    }
  }, [tokenInfo.image]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "burnManager") {
      // Clear error if field is empty
      if (!value) {
        setBurnManagerError("");
        onTokenInfoChange({ ...tokenInfo, burnManager: undefined });
        return;
      }

      // Validate Ethereum address
      if (!value.startsWith("0x")) {
        setBurnManagerError("Address must start with 0x");
        onTokenInfoChange({ ...tokenInfo, [name]: value as `0x${string}` });
        return;
      }

      if (!isAddress(value)) {
        setBurnManagerError("Invalid Ethereum address");
        onTokenInfoChange({ ...tokenInfo, [name]: value as `0x${string}` });
        return;
      }

      setBurnManagerError("");
    }

    onTokenInfoChange({ ...tokenInfo, [name]: value });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onTokenInfoChange({
        ...tokenInfo,
        image: e.dataTransfer.files[0],
        imagePosition: { x: 0, y: 0, scale: 1, rotation: 0 }, // Reset position for new image
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onTokenInfoChange({
        ...tokenInfo,
        image: e.target.files[0],
        imagePosition: { x: 0, y: 0, scale: 1, rotation: 0 }, // Reset position for new image
      });
    }
  };

  const removeImage = () => {
    onTokenInfoChange({
      ...tokenInfo,
      image: null,
      imagePosition: { x: 0, y: 0, scale: 1, rotation: 0 },
    });
    setPreviewUrl(null);
  };

  const handlePositionChange = (position: ImagePosition) => {
    onTokenInfoChange({ ...tokenInfo, imagePosition: position });
  };

  return (
    <div className="space-y-6">
      {/* Basic Token Info */}
      <div className="grid w-full items-center gap-4">
        <div>
          <Label htmlFor="name">Token Name</Label>
          <Input
            id="name"
            name="name"
            value={tokenInfo.name}
            onChange={handleChange}
            placeholder="Enter token name"
          />
        </div>

        <div>
          <Label htmlFor="ticker">Ticker</Label>
          <Input
            id="ticker"
            name="ticker"
            value={tokenInfo.ticker}
            onChange={handleChange}
            placeholder="Enter ticker symbol"
          />
        </div>

        <div>
          <Label htmlFor="description">Token Description</Label>
          <Textarea
            id="description"
            name="description"
            value={tokenInfo.description}
            onChange={handleChange}
            placeholder="Enter token description"
            rows={4}
            className="resize-none"
          />
        </div>

        <div>
          <Label htmlFor="burnManager">Burn Manager Address (Optional)</Label>
          <Input
            id="burnManager"
            name="burnManager"
            value={tokenInfo.burnManager || ""}
            onChange={handleChange}
            placeholder="0x..."
            className={burnManagerError ? "border-red-500" : ""}
          />
          {burnManagerError && (
            <p className="text-sm text-red-500 mt-1">{burnManagerError}</p>
          )}
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="space-y-4">
        <Label htmlFor="image">Token Image</Label>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400"
          } relative`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />

          {previewUrl ? (
            <div className="space-y-4">
              <div className="relative w-full aspect-video max-w-xs mx-auto">
                <Image
                  src={previewUrl}
                  alt="Token preview"
                  fill
                  className="object-contain rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 z-10 h-8 w-8"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageControls(!showImageControls)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {showImageControls ? "Hide" : "Show"} Position Controls
                  {showImageControls ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <label htmlFor="image" className="cursor-pointer">
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-12 h-12 text-gray-400" />
                <div>
                  <span className="text-sm font-medium">
                    Drag and drop or click to upload
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            </label>
          )}
        </div>

        {/* Image Positioning Controls */}
        <AnimatePresence>
          {showImageControls && previewUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <Card className="border-purple-200 bg-purple-50/30">
                <CardContent className="p-4">
                  <ImagePositioningControls
                    imageFile={tokenInfo.image}
                    position={tokenInfo.imagePosition}
                    onPositionChange={handlePositionChange}
                    showPreview={showPreview}
                    onPreviewToggle={() => setShowPreview(!showPreview)}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
