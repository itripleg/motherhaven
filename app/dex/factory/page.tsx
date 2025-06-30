import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AddressComponent } from "@/components/AddressComponent";
import { Progress } from "@/components/ui/progress";
import { useToken } from "@/contexts/TokenContext";
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import { Address, formatEther } from "viem";
import { useAccount } from "wagmi";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  Edit3,
  Save,
  X,
  RotateCcw,
  Move,
  Settings,
  User,
  Crown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TokenHeaderProps {
  address: string;
}

interface StateDisplay {
  text: string;
  color: string;
}

interface ImagePosition {
  x: number; // -100 to 100 (percentage)
  y: number; // -100 to 100 (percentage)
  scale: number; // 0.5 to 3
  rotation: number; // -180 to 180 degrees
}

export const TokenHeaderStyled: React.FC<TokenHeaderProps> = ({ address }) => {
  const [progress, setProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editPosition, setEditPosition] = useState<ImagePosition>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const { address: userAddress } = useAccount();
  const { toast } = useToast();

  // Get token metadata
  const { token, loading } = useToken(address);

  // Get real-time contract data
  const { useTokenState, useCollateral, useCurrentPrice } =
    useFactoryContract();
  const { data: state } = useTokenState(address as Address);
  const { data: rawCollateral } = useCollateral(address as Address);
  const { data: rawCurrentPrice } = useCurrentPrice(address as Address);

  // Format values
  const formattedCollateral = rawCollateral
    ? formatTokenPrice(formatEther(rawCollateral))
    : "0.000000";

  const formattedCurrentPrice = rawCurrentPrice
    ? formatTokenPrice(formatEther(rawCurrentPrice))
    : "0.000000";

  // Initialize edit position when token loads
  useEffect(() => {
    if (token?.imagePosition) {
      setEditPosition(token.imagePosition);
    }
  }, [token?.imagePosition]);

  // Check if current user is the token creator
  const isCreator =
    userAddress &&
    token?.creator &&
    userAddress.toLowerCase() === token.creator.toLowerCase();

  // Update progress bar animation
  useEffect(() => {
    if (token?.fundingGoal && rawCollateral) {
      const goalAmount = parseFloat(token.fundingGoal);
      const collateralAmount = parseFloat(formatEther(rawCollateral));
      const percentage =
        goalAmount > 0 ? (collateralAmount / goalAmount) * 100 : 0;

      const animateProgress = (
        start: number,
        end: number,
        duration: number
      ) => {
        const startTime = performance.now();
        const update = (currentTime: number) => {
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          setProgress(start + progress * (end - start));
          if (progress < 1) {
            requestAnimationFrame(update);
          }
        };
        requestAnimationFrame(update);
      };

      animateProgress(progress, Math.min(percentage, 100), 1000);
    }
  }, [token?.fundingGoal, rawCollateral, progress]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle drag move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !headerRef.current) return;

    const rect = headerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    setEditPosition((prev) => ({
      ...prev,
      x: Math.max(-100, Math.min(100, prev.x + deltaX)),
      y: Math.max(-100, Math.min(100, prev.y + deltaY)),
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle drag end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel for scaling
  const handleWheel = (e: React.WheelEvent) => {
    if (!isEditing) return;
    e.preventDefault();

    const delta = e.deltaY * -0.001;
    const newScale = Math.max(0.5, Math.min(3, editPosition.scale + delta));
    setEditPosition((prev) => ({ ...prev, scale: newScale }));
  };

  // Save position to Firebase
  const savePosition = async () => {
    if (!token?.address) return;

    try {
      setIsSaving(true);
      const tokenDocRef = doc(db, "tokens", token.address);

      await updateDoc(tokenDocRef, {
        imagePosition: editPosition,
        lastUpdated: new Date().toISOString(),
        updatedBy: userAddress,
      });

      toast({
        title: "✅ Position Saved!",
        description: "Your token image positioning has been updated.",
      });

      setIsEditing(false);
      setShowControls(false);
    } catch (error) {
      console.error("Error saving position:", error);
      toast({
        title: "❌ Save Failed",
        description: "Failed to save image position. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditPosition(
      token?.imagePosition || { x: 0, y: 0, scale: 1, rotation: 0 }
    );
    setIsEditing(false);
    setShowControls(false);
  };

  // Reset position
  const resetPosition = () => {
    setEditPosition({ x: 0, y: 0, scale: 1, rotation: 0 });
  };

  if (loading || !token) {
    return (
      <Card className="min-h-[300px] flex items-center justify-center">
        <div className="p-8 text-gray-400">Loading token data...</div>
      </Card>
    );
  }

  const getStateDisplay = (state: number | undefined): StateDisplay => {
    const stateValue = state ?? 0;
    const stateMap: Record<number, StateDisplay> = {
      0: { text: "Not Created", color: "bg-red-500/80" },
      1: { text: "Trading", color: "bg-green-600/70" },
      2: { text: "Goal Reached", color: "bg-yellow-500/80" },
      3: { text: "Halted", color: "bg-red-500/80" },
      4: { text: "Resumed", color: "bg-green-600/70" },
    };
    return stateMap[stateValue] || { text: "Unknown", color: "bg-gray-500/80" };
  };

  const stateDisplay = getStateDisplay(state as number | undefined);
  const formattedFundingGoal = token.fundingGoal
    ? formatTokenPrice(token.fundingGoal)
    : "0.000000";

  // Get image positioning styles
  const getImagePositionStyle = (position: ImagePosition) => ({
    backgroundImage: `url(${token.imageUrl})`,
    backgroundSize: `${100 * position.scale}% ${100 * position.scale}%`,
    backgroundPosition: `${50 + position.x}% ${50 + position.y}%`,
    backgroundRepeat: "no-repeat",
    transform: `rotate(${position.rotation}deg)`,
    transformOrigin: "center center",
    transition: isDragging ? "none" : "all 0.2s ease-out",
  });

  const currentPosition = isEditing
    ? editPosition
    : token.imagePosition || { x: 0, y: 0, scale: 1, rotation: 0 };

  return (
    <Card className="relative overflow-hidden min-h-[300px]">
      {/* Background Image Layer */}
      {token.imageUrl && (
        <div
          ref={headerRef}
          className={`absolute inset-0 z-0 ${isEditing ? "cursor-move" : ""}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            className="absolute inset-0 bg-no-repeat"
            style={getImagePositionStyle(currentPosition)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

          {/* Editing Overlay */}
          {isEditing && (
            <div className="absolute inset-0 z-5">
              {/* Grid Overlay */}
              <div className="absolute inset-0 opacity-30">
                <div className="grid grid-cols-3 grid-rows-3 h-full">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/30" />
                  ))}
                </div>
              </div>

              {/* Center Point */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 border-2 border-white/80 rounded-full bg-black/40 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>

              {/* Drag Indicator */}
              {isDragging && (
                <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  <span>Drag to reposition • Scroll to zoom</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Header with Edit Controls */}
        <div className="p-4 flex justify-between items-start">
          <div className="space-y-2">
            <AddressComponent hash={address} type="address" />
            {token.creator && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1 text-gray-300">
                  {isCreator ? (
                    <>
                      <Crown className="h-3 w-3 text-yellow-400" />
                      <span className="text-yellow-400">Creator (You)</span>
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3" />
                      <span>Creator:</span>
                    </>
                  )}
                </div>
                {!isCreator && (
                  <AddressComponent hash={token.creator} type="address" />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={`${stateDisplay.color} text-white px-3 py-1`}
              variant="outline"
            >
              {stateDisplay.text}
            </Badge>

            {/* Edit Button - Only show for creator */}
            {isCreator && token.imageUrl && (
              <AnimatePresence>
                {!isEditing ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(true);
                        setShowControls(true);
                      }}
                      className="bg-black/50 border-white/30 text-white hover:bg-black/70"
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit Image
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                      className="bg-red-500/80 border-red-400 text-white hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={savePosition}
                      disabled={isSaving}
                      className="bg-green-500/80 border-green-400 text-white hover:bg-green-600"
                    >
                      {isSaving ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Fine-tune Controls */}
        <AnimatePresence>
          {showControls && isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-20 left-4 right-4 z-20 overflow-hidden"
            >
              <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-white text-sm font-medium">
                    <Settings className="h-4 w-4" />
                    Fine-tune Position
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetPosition}
                    className="text-white hover:bg-white/20"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-white">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Horizontal</span>
                      <span>{editPosition.x.toFixed(0)}%</span>
                    </div>
                    <Slider
                      value={[editPosition.x]}
                      onValueChange={([value]) =>
                        setEditPosition((prev) => ({ ...prev, x: value }))
                      }
                      min={-100}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Vertical</span>
                      <span>{editPosition.y.toFixed(0)}%</span>
                    </div>
                    <Slider
                      value={[editPosition.y]}
                      onValueChange={([value]) =>
                        setEditPosition((prev) => ({ ...prev, y: value }))
                      }
                      min={-100}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Scale</span>
                      <span>{editPosition.scale.toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={[editPosition.scale]}
                      onValueChange={([value]) =>
                        setEditPosition((prev) => ({ ...prev, scale: value }))
                      }
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Rotation</span>
                      <span>{editPosition.rotation.toFixed(0)}°</span>
                    </div>
                    <Slider
                      value={[editPosition.rotation]}
                      onValueChange={([value]) =>
                        setEditPosition((prev) => ({
                          ...prev,
                          rotation: value,
                        }))
                      }
                      min={-180}
                      max={180}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token Info */}
        <CardHeader>
          <CardTitle className="text-white text-3xl font-bold flex items-center gap-4">
            {token.name}
            {token.symbol && (
              <span className="text-2xl text-gray-300">({token.symbol})</span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                <Label className="text-gray-200">Current Price</Label>
                <p className="text-white text-lg font-semibold">
                  {formattedCurrentPrice}{" "}
                  <span className="text-gray-300">AVAX</span>
                </p>
              </div>
            </div>
          </div>

          {/* Funding Progress */}
          {token.fundingGoal && token.fundingGoal !== "0" && (
            <div className="mt-6 backdrop-blur-sm bg-white/10 p-4 rounded-lg">
              <Label className="text-gray-200 mb-2 block">
                Funding Progress
              </Label>
              <Progress value={progress} className="h-2 mb-2" />
              <p className="text-white text-sm font-semibold">
                {progress.toFixed(2)}% - {formattedCollateral} /{" "}
                {formattedFundingGoal} AVAX
              </p>
            </div>
          )}
        </CardContent>
      </div>

      {/* Fallback Background */}
      {!token.imageUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
      )}
    </Card>
  );
};

export default TokenHeaderStyled;
