import React, { useEffect, useState, useRef, useCallback, FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AddressComponent } from "@/components/AddressComponent";
import { Progress } from "@/components/ui/progress";
import { useTokenData } from "@/final-hooks/useTokenData";
import { useFactoryContract } from "@/final-hooks/useFactoryContract";
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import { Address, formatEther } from "viem";
import { useAccount } from "wagmi";
import { useImagePosition } from "@/hooks/useImagePosition";
import {
  Edit3,
  Save,
  X,
  RotateCcw,
  Crown,
  Maximize,
  Minimize,
  Square,
  User,
  TrendingUp,
  Target,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Type Definitions ---
interface TokenHeaderProps {
  address: string;
}

interface StateDisplay {
  text: string;
  color: string;
}

interface ImagePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fit?: "cover" | "contain" | "fill";
}

// --- Constants ---
const HEADER_HEIGHT = "h-80"; // Fixed height for consistency

const FIT_MODES = {
  cover: { icon: Maximize, label: "Cover" },
  contain: { icon: Minimize, label: "Contain" },
  fill: { icon: Square, label: "Fill" },
} as const;

const SLIDER_CONTROLS = [
  { key: "x", label: "Horizontal", min: -100, max: 100, step: 1, suffix: "%" },
  { key: "y", label: "Vertical", min: -100, max: 100, step: 1, suffix: "%" },
  { key: "scale", label: "Scale", min: 0.5, max: 3, step: 0.1, suffix: "x" },
  {
    key: "rotation",
    label: "Rotation",
    min: -180,
    max: 180,
    step: 1,
    suffix: "°",
  },
];

// --- Main Component ---
export const TokenHeaderStyled: FC<TokenHeaderProps> = ({ address }) => {
  // --- State and Refs ---
  const [isEditing, setIsEditing] = useState(false);
  const [position, setPosition] = useState<ImagePosition>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    fit: "cover",
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // --- Hooks ---
  const { address: userAddress } = useAccount();
  const { updatePosition, isUpdating } = useImagePosition();

  // Use unified token data hook that combines Firestore + contract data
  const { token, isLoading: loading } = useTokenData(address as Address);

  // Use consolidated factory contract hook
  const { useTokenState } = useFactoryContract();
  const { state } = useTokenState(address as Address);

  const isCreator =
    userAddress &&
    token?.creator &&
    userAddress.toLowerCase() === token.creator.toLowerCase();

  // --- Effects ---
  useEffect(() => {
    if (token?.imagePosition) {
      setPosition(token.imagePosition);
    }
  }, [token?.imagePosition]);

  // --- Callbacks for Editing Actions ---
  const savePosition = useCallback(async () => {
    if (!token?.address || !userAddress) return;
    const success = await updatePosition(token.address, position, userAddress);
    if (success) {
      setIsEditing(false);
    }
  }, [token?.address, userAddress, position, updatePosition]);

  const cancelEdit = useCallback(() => {
    setPosition(
      token?.imagePosition || {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        fit: "cover",
      }
    );
    setIsEditing(false);
  }, [token?.imagePosition]);

  const resetPosition = useCallback(() => {
    setPosition((prev) => ({ ...prev, x: 0, y: 0, scale: 1, rotation: 0 }));
  }, []);

  const setFitMode = useCallback((fit: keyof typeof FIT_MODES) => {
    setPosition((prev) => ({
      ...prev,
      fit,
      x: 0,
      y: 0,
      scale: 1,
    }));
  }, []);

  // --- Callbacks for Interactive Positioning ---
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (position.fit === "fill" || !isEditing) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [position.fit, isEditing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !imageContainerRef.current || position.fit === "fill")
        return;
      e.preventDefault();
      const rect = imageContainerRef.current.getBoundingClientRect();
      // Fixed: Only invert Y (vertical), keep X (horizontal) normal
      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = -((e.clientY - dragStart.y) / rect.height) * 100;
      setPosition((prev) => ({
        ...prev,
        x: Math.max(-100, Math.min(100, prev.x + deltaX)),
        y: Math.max(-100, Math.min(100, prev.y + deltaY)),
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart, position.fit]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // --- Scroll Lock Effect ---
  useEffect(() => {
    const container = imageContainerRef.current;

    const handleWheel = (e: WheelEvent) => {
      if (position.fit === "fill") return;
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      setPosition((prev) => ({
        ...prev,
        scale: Math.max(0.5, Math.min(3, prev.scale + delta)),
      }));
    };

    if (isEditing && container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        container.removeEventListener("wheel", handleWheel);
      };
    }
  }, [isEditing, position.fit]);

  // --- Style Generation ---
  const getBackgroundStyle = useCallback(() => {
    if (!token?.imageUrl) return {};
    const { x, y, scale, rotation, fit = "cover" } = position;
    const baseStyle = {
      backgroundImage: `url(${token.imageUrl})`,
      backgroundRepeat: "no-repeat",
      transform: `rotate(${rotation}deg)`,
      transformOrigin: "center center",
      transition: isDragging
        ? "none"
        : "transform 0.2s ease-out, background-position 0.2s ease-out, background-size 0.2s ease-out",
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
  }, [token?.imageUrl, position, isDragging]);

  // --- Render Logic ---
  if (loading || !token) {
    return (
      <Card
        className={`${HEADER_HEIGHT} flex items-center justify-center unified-card border-primary/20`}
      >
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
          />
          <p className="text-muted-foreground">Loading token data...</p>
        </div>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Card
        className={`${HEADER_HEIGHT} relative overflow-hidden unified-card border-primary/20`}
      >
        {isEditing ? (
          /* --- EDITING MODE RENDER --- */
          <div
            ref={imageContainerRef}
            className="absolute inset-0 z-10"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: position.fit !== "fill" ? "move" : "default" }}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={getBackgroundStyle()}
            />
            <div className="absolute inset-0 bg-black/60" />

            {/* Crosshair Center Guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
              <div className="w-px h-8 bg-white" />
              <div className="w-8 h-px bg-white absolute" />
            </div>

            {/* Edit Controls */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={cancelEdit}
                    className="bg-red-500/80 border-red-400 text-white hover:bg-red-600 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cancel</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={savePosition}
                    disabled={isUpdating}
                    className="bg-green-500/80 border-green-400 text-white hover:bg-green-600 h-8 w-8"
                  >
                    {isUpdating ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save Position</TooltipContent>
              </Tooltip>
            </div>

            {/* Edit Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-4 left-4 right-4 z-20"
            >
              <div className="bg-black/90 backdrop-blur-md rounded-xl p-4 border border-white/20 space-y-4 max-w-2xl mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">
                    Image Controls
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetPosition}
                    className="text-white hover:bg-white/20 h-8"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" /> Reset
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(FIT_MODES).map(
                    ([mode, { icon: Icon, label }]) => (
                      <Button
                        key={mode}
                        variant={
                          (position.fit || "cover") === mode
                            ? "secondary"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setFitMode(mode as keyof typeof FIT_MODES)
                        }
                        className="text-xs h-8"
                      >
                        <Icon className="h-3 w-3 mr-1" /> {label}
                      </Button>
                    )
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  {SLIDER_CONTROLS.map(
                    ({ key, label, min, max, step, suffix }) => {
                      const disabled =
                        position.fit === "fill" && key !== "rotation";
                      const value = position[
                        key as keyof ImagePosition
                      ] as number;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-xs text-white mb-1">
                            <span className={disabled ? "text-gray-500" : ""}>
                              {label}
                            </span>
                            <span className={disabled ? "text-gray-500" : ""}>
                              {key === "scale"
                                ? value.toFixed(1)
                                : value.toFixed(0)}
                              {suffix}
                            </span>
                          </div>
                          <Slider
                            value={[value]}
                            onValueChange={([val]) =>
                              setPosition((p) => ({ ...p, [key]: val }))
                            }
                            min={min}
                            max={max}
                            step={step}
                            disabled={disabled}
                            className="h-2"
                          />
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* --- DISPLAY MODE RENDER --- */
          <>
            <div className="absolute inset-0 z-0">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={getBackgroundStyle()}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full p-6">
              {/* Top Bar */}
              <div className="flex justify-between items-start">
                <AddressComponent hash={address} type="address" />
                <div className="flex items-center gap-3">
                  <TokenStatusBadge state={state} />
                  {isCreator ? (
                    <div className="flex items-center gap-2">
                      {token?.imageUrl && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setIsEditing(true)}
                              className="bg-black/30 border-white/20 text-white hover:bg-black/50 h-8 w-8"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit photo position</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-1.5 bg-yellow-500/20 border border-yellow-400/30 rounded-md">
                            <Crown className="h-4 w-4 text-yellow-400" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>You are the creator</TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    token?.creator && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-1.5 bg-gray-500/20 border border-gray-400/30 rounded-md">
                            <User className="h-4 w-4 text-gray-300" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Created by: {token.creator}
                        </TooltipContent>
                      </Tooltip>
                    )
                  )}
                </div>
              </div>

              {/* Token Info */}
              <TokenInfoDisplay token={token} />
            </div>
          </>
        )}
      </Card>
    </TooltipProvider>
  );
};

/* --- Sub-components --- */
const TokenStatusBadge: FC<{ state: number | undefined }> = ({ state }) => {
  const stateMap: Record<number, StateDisplay> = {
    0: { text: "Not Created", color: "bg-red-500/80" },
    1: { text: "Trading", color: "bg-green-600/70" },
    2: { text: "Goal Reached", color: "bg-yellow-500/80" },
    3: { text: "Halted", color: "bg-red-500/80" },
    4: { text: "Resumed", color: "bg-green-600/70" },
  };
  const display = stateMap[state as number] || {
    text: "Unknown",
    color: "bg-gray-500/80",
  };
  return (
    <Badge className={`${display.color} text-white border-0`} variant="outline">
      {display.text}
    </Badge>
  );
};

const TokenInfoDisplay: FC<{ token: any }> = ({ token }) => {
  const { useCollateral } = useFactoryContract();
  const { collateral: rawCollateral } = useCollateral(token.address as Address);
  const { formatted: formattedCurrentPrice, isLoading: priceLoading } =
    useUnifiedTokenPrice(token.address as Address);

  const [progress, setProgress] = useState(0);
  const formattedCollateral = rawCollateral
    ? formatTokenPrice(formatEther(rawCollateral))
    : "0.000000";
  const formattedFundingGoal = token.fundingGoal
    ? formatTokenPrice(token.fundingGoal)
    : "0.000000";

  useEffect(() => {
    if (token.fundingGoal && rawCollateral) {
      const goalAmount = parseFloat(token.fundingGoal);
      const collateralAmount = parseFloat(formatEther(rawCollateral));
      const percentage =
        goalAmount > 0 ? (collateralAmount / goalAmount) * 100 : 0;
      setProgress(Math.min(percentage, 100));
    }
  }, [token.fundingGoal, rawCollateral]);

  return (
    <div className="space-y-6">
      {/* Token Title & Description */}
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-white leading-tight">
          {token.name}
          {token.symbol && (
            <span className="text-2xl text-white/70 ml-3">
              ({token.symbol})
            </span>
          )}
        </h1>

        {/* Token Description */}
        {token.description ? (
          <blockquote className="text-white/80 text-lg italic leading-relaxed max-w-2xl">
            "{token.description}"
          </blockquote>
        ) : (
          <div className="text-white/50 text-lg italic leading-relaxed">
            "No description provided"
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Price */}
        <div className="backdrop-blur-sm bg-white/10 p-4 rounded-xl border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-white" />
            <span className="text-white/80 text-sm">Current Price</span>
          </div>
          <p className="text-white text-xl font-bold">
            {priceLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <>
                {formattedCurrentPrice}{" "}
                <span className="text-white/70 text-base">AVAX</span>
              </>
            )}
          </p>
        </div>

        {/* Funding Progress */}
        {token.fundingGoal && token.fundingGoal !== "0" && (
          <div className="backdrop-blur-sm bg-white/10 p-4 rounded-xl border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-white" />
              <span className="text-white/80 text-sm">Funding Progress</span>
            </div>
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-white text-sm font-semibold">
                {progress.toFixed(1)}% • {formattedCollateral} /{" "}
                {formattedFundingGoal} AVAX
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenHeaderStyled;
