// pet/components/PetHeader.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Skull,
  Activity,
  Clock,
  Crown,
  DollarSign,
  Edit3,
  Check,
  X,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { PetHeaderProps } from "../types";

interface EnhancedPetHeaderProps extends PetHeaderProps {
  onRenamePet?: (newName: string) => Promise<void>;
  isWritePending?: boolean;
}

export const PetHeader: React.FC<EnhancedPetHeaderProps> = ({
  petName,
  isAlive,
  currentHealth,
  currentCaretaker,
  deathCount = 0,
  revivalCost = "0",
  isUserCaretaker = false,
  timeSinceLastFed,
  onRenamePet,
  isWritePending = false,
}) => {
  const { address } = useAccount();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(petName);
  const [isRenaming, setIsRenaming] = useState(false);

  // Always show dog emoji since contract only supports dogs
  const petEmoji = "🐕";

  const getHealthStatus = (health?: number) => {
    if (!health)
      return {
        color: "text-muted-foreground",
        status: "Unknown",
        urgency: "none",
        bgColor: "bg-muted",
      };
    if (health >= 80)
      return {
        color: "text-green-500",
        status: "Excellent",
        urgency: "none",
        bgColor: "bg-green-500",
      };
    if (health >= 60)
      return {
        color: "text-lime-500",
        status: "Good",
        urgency: "none",
        bgColor: "bg-lime-500",
      };
    if (health >= 40)
      return {
        color: "text-yellow-500",
        status: "Fair",
        urgency: "low",
        bgColor: "bg-yellow-500",
      };
    if (health >= 20)
      return {
        color: "text-orange-500",
        status: "Poor",
        urgency: "medium",
        bgColor: "bg-orange-500",
      };
    return {
      color: "text-red-500",
      status: "Critical",
      urgency: "high",
      bgColor: "bg-red-500",
    };
  };

  const healthStatus = getHealthStatus(currentHealth);

  const handleStartEdit = () => {
    if (!isUserCaretaker || !onRenamePet) return;
    setNewName(petName);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewName(petName);
  };

  const handleSaveEdit = async () => {
    if (!onRenamePet || !newName.trim() || newName.trim() === petName) {
      handleCancelEdit();
      return;
    }

    if (newName.trim().length > 32) {
      toast({
        title: "Name Too Long",
        description: "Pet name must be 32 characters or less.",
        variant: "destructive",
      });
      return;
    }

    setIsRenaming(true);
    try {
      await onRenamePet(newName.trim());
      setIsEditing(false);
      toast({
        title: "🏷️ Pet Renamed!",
        description: `Your pet is now called "${newName.trim()}"!`,
      });
    } catch (error) {
      console.error("Rename failed:", error);
      toast({
        title: "Rename Failed",
        description: "Failed to rename pet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRenaming(false);
    }
  };

  const getPetMessage = () => {
    if (!isAlive) {
      if (deathCount === 0) {
        return "I died for the first time... someone please revive me! 💔";
      } else if (deathCount <= 3) {
        return `I've died ${deathCount} times now... getting expensive to revive! 😢`;
      } else {
        return `I'm a veteran of ${deathCount} deaths... revival is very costly now! 👻`;
      }
    }

    if (currentHealth !== undefined) {
      if (currentHealth > 80)
        return "I'm feeling amazing! Thanks for all the CHOW! 🐕✨";
      if (currentHealth > 60)
        return "I'm doing great! Keep the CHOW coming! 😊";
      if (currentHealth > 40)
        return "I could use some more CHOW... getting a bit hungry! 🍖";
      if (currentHealth > 20)
        return "I'm getting pretty hungry... please burn some CHOW soon! 😟";
      return "I'm very weak... I need CHOW urgently or I'll die! 😰";
    }

    return "Woof! I'm doing great thanks to the community! 🐕";
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getCaretakerDisplay = () => {
    if (!currentCaretaker) return "Unknown";
    if (address && currentCaretaker.toLowerCase() === address.toLowerCase()) {
      return "You";
    }
    return formatAddress(currentCaretaker);
  };

  const formatTimeSince = (seconds?: number) => {
    if (!seconds) return "Unknown";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <Card className="unified-card border-2 shadow-lg overflow-hidden">
        {/* Critical health warning bar */}
        {isAlive && healthStatus.urgency === "high" && (
          <div className="h-1 bg-red-500 animate-pulse" />
        )}

        {/* Death warning bar */}
        {!isAlive && (
          <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
        )}

        <CardContent className="p-4 sm:p-6 lg:p-8">
          {/* Main content - responsive layout */}
          <div className="space-y-6">
            {/* Top Row: Pet Avatar & Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 relative">
              {/* Pet Name and Info - Left Side */}
              <div className="space-y-3 text-center sm:text-left flex-shrink-0 z-10">
                {/* Pet Name with Rename Functionality */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold h-auto p-1 min-w-0 text-center sm:text-left"
                        style={{ fontSize: "inherit" }}
                        maxLength={32}
                        disabled={isRenaming}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        autoFocus
                      />
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          onClick={handleSaveEdit}
                          disabled={isRenaming || isWritePending}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                        >
                          {isRenaming ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          disabled={isRenaming}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                        {petName}
                      </h1>
                      {isUserCaretaker && onRenamePet && (
                        <Button
                          onClick={handleStartEdit}
                          disabled={isWritePending}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <Badge variant="outline" className="text-sm">
                    Community Dog
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  On Fuji Testnet
                </div>
              </div>

              {/* Animated Pet Walking Area - Center Space */}
              <div className="flex-1 relative h-24 hidden sm:block overflow-hidden">
                
                {/* Pet container with sporadic random animation */}
                <motion.div
                  className="absolute top-[15%] -translate-y-1/2 z-10"
                  animate={{
                    x: [0, 300, 150, 800, 1200, 600, 950, 200, 0],
                    scaleX: [-1, -1, 1, -1, -1, 1, -1, 1, -1]
                  }}
                  transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.15, 0.25, 0.4, 0.55, 0.7, 0.8, 0.9, 1]
                  }}
                >
                  {/* Pet with its status indicator */}
                  <div className="relative">
                    <motion.div
                      className={`text-7xl transition-all duration-300 leading-none ${
                        isAlive
                          ? healthStatus.urgency === "high"
                            ? "animate-bounce"
                            : ""
                          : "grayscale opacity-60"
                      }`}
                    >
                      {petEmoji}
                    </motion.div>

                    {/* Status indicator */}
                    <motion.div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-background flex items-center justify-center ${
                        isAlive ? "bg-green-500" : "bg-red-500"
                      } ${
                        isAlive && healthStatus.urgency === "high"
                          ? "animate-pulse"
                          : ""
                      }`}
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <span className="text-xs">{isAlive ? "❤️" : "💀"}</span>
                    </motion.div>
                  </div>
                </motion.div>

              </div>

              {/* Mobile Pet - Static when small */}
              <div className="relative flex-shrink-0 sm:hidden">
                <div
                  className={`text-6xl transition-all duration-300 ${
                    isAlive
                      ? healthStatus.urgency === "high"
                        ? "animate-bounce"
                        : ""
                      : "grayscale opacity-60"
                  }`}
                >
                  {petEmoji}
                </div>

                {/* Status indicator */}
                <div
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-background flex items-center justify-center ${
                    isAlive ? "bg-green-500" : "bg-red-500"
                  } ${
                    isAlive && healthStatus.urgency === "high"
                      ? "animate-pulse"
                      : ""
                  }`}
                >
                  {isAlive ? "❤️" : "💀"}
                </div>
              </div>
            </div>

            {/* Bottom Row: Health & Caretaker Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Health Status */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Activity className={`h-5 w-5 ${healthStatus.color}`} />
                    <span className="text-lg font-semibold">Health Status</span>
                  </div>
                  <div className="text-center sm:text-right">
                    <div
                      className={`text-2xl lg:text-3xl font-bold ${healthStatus.color}`}
                    >
                      {currentHealth !== undefined ? currentHealth : "?"}/100
                    </div>
                    <Badge
                      variant={
                        healthStatus.urgency === "high"
                          ? "destructive"
                          : "secondary"
                      }
                      className={`text-xs ${
                        healthStatus.urgency === "high" ? "animate-pulse" : ""
                      }`}
                    >
                      {healthStatus.status}
                    </Badge>
                  </div>
                </div>

                {currentHealth !== undefined && (
                  <div className="space-y-2">
                    <Progress
                      value={currentHealth}
                      className={`h-4 ${
                        healthStatus.urgency === "high" ? "animate-pulse" : ""
                      }`}
                    />
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        <span>-1 health per hour</span>
                      </div>
                      <span className="font-mono">0 ←→ 100</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Caretaker & Status Info */}
              <div className="space-y-3">
                {/* Caretaker Info */}
                <div className="text-center p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Crown
                      className={`h-4 w-4 ${
                        isUserCaretaker
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-sm font-medium">
                      Current Caretaker
                    </span>
                  </div>
                  <div
                    className={`text-sm ${
                      isUserCaretaker
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {getCaretakerDisplay()}
                  </div>
                  {isUserCaretaker && (
                    <Badge
                      variant="outline"
                      className="mt-1 text-xs bg-primary/10 text-primary border-primary/30"
                    >
                      <Crown className="h-2 w-2 mr-1" />
                      You own this pet
                    </Badge>
                  )}
                </div>

                {/* Revival Cost (if dead) */}
                {!isAlive && (
                  <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        Revival Cost
                      </span>
                    </div>
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {revivalCost} AVAX
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {deathCount > 0 && `2^${deathCount} × base cost`}
                    </div>
                  </div>
                )}

                {/* Live Status (if alive) */}
                {isAlive && (
                  <div
                    className={`text-center p-3 rounded-lg border ${
                      healthStatus.urgency === "high"
                        ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                        : healthStatus.urgency === "medium"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800"
                        : "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800"
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {healthStatus.urgency === "high"
                        ? "🚨 Feed Immediately!"
                        : healthStatus.urgency === "medium"
                        ? "⚠️ Getting Hungry"
                        : "✅ Healthy & Happy"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pet message footer */}
          <div className="mt-6 pt-4 border-t border-border/30">
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border">
              <div className="text-2xl flex-shrink-0">
                {isAlive
                  ? healthStatus.urgency === "high"
                    ? "😰"
                    : healthStatus.urgency === "medium"
                    ? "😊"
                    : "🥰"
                  : deathCount === 0
                  ? "😢"
                  : deathCount <= 3
                  ? "💸"
                  : "👻"}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-base lg:text-lg font-medium ${
                    isAlive
                      ? healthStatus.urgency === "high"
                        ? "text-red-700 dark:text-red-300"
                        : "text-foreground"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {getPetMessage()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};