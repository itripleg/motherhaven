// app/dex/components/token-header/TokenHeaderContent.tsx
"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddressComponent } from "@/components/AddressComponent";
import { Progress } from "@/components/ui/progress";
import { Crown, User, Edit3, TrendingUp, Target } from "lucide-react";
import { motion } from "framer-motion";
import { TokenHeaderData } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TokenHeaderContentProps {
  data: TokenHeaderData;
  isCreator?: boolean;
  canEdit?: boolean;
  onEditClick?: () => void;
  progress?: number;
  className?: string;
}

const getStateDisplay = (state?: number) => {
  const stateMap: Record<number, { text: string; color: string }> = {
    0: { text: "Not Created", color: "bg-red-500/80" },
    1: { text: "Trading", color: "bg-green-600/70" },
    2: { text: "Goal Reached", color: "bg-yellow-500/80" },
    3: { text: "Halted", color: "bg-red-500/80" },
    4: { text: "Resumed", color: "bg-green-600/70" },
  };

  return stateMap[state || 0] || { text: "Unknown", color: "bg-gray-500/80" };
};

export const TokenHeaderContent: React.FC<TokenHeaderContentProps> = ({
  data,
  isCreator = false,
  canEdit = false,
  onEditClick,
  progress = 0,
  className = "",
}) => {
  const stateDisplay = getStateDisplay(data.state);

  return (
    <div
      className={`relative z-10 flex flex-col justify-between h-full p-6 ${className}`}
    >
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <AddressComponent hash={data.address} type="address" />
        <div className="flex items-center gap-3">
          <Badge
            className={`${stateDisplay.color} text-white border-0`}
            variant="outline"
          >
            {stateDisplay.text}
          </Badge>

          {isCreator && (
            <div className="flex items-center gap-2 p-1.5 bg-black/30 border border-primary/40 rounded-lg backdrop-blur-sm">
              {canEdit && data.imageUrl && onEditClick && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onEditClick}
                      className="text-primary hover:bg-primary/20 h-7 w-7 border border-primary/30 hover:border-primary/50 transition-all duration-200"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit photo position</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-1.5 bg-primary/20 border border-primary/40 rounded-md">
                    <Crown className="h-4 w-4 text-primary" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>You are the creator</TooltipContent>
              </Tooltip>
            </div>
          )}

          {!isCreator && data.creator && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-1.5 bg-gray-500/20 border border-gray-400/30 rounded-md">
                  <User className="h-4 w-4 text-gray-300" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Created by: {data.creator}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Token Info */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white leading-tight">
            {data.name}
            {data.symbol && (
              <span className="text-2xl text-white/70 ml-3">
                ({data.symbol})
              </span>
            )}
          </h1>

          {data.description ? (
            <blockquote className="text-white/80 text-lg italic leading-relaxed max-w-2xl">
              "{data.description}"
            </blockquote>
          ) : (
            <div className="text-white/50 text-lg italic leading-relaxed">
              "No description provided"
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.currentPrice && (
            <div className="backdrop-blur-sm bg-white/10 p-4 rounded-xl border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-white" />
                <span className="text-white/80 text-sm">Current Price</span>
              </div>
              <p className="text-white text-xl font-bold">
                {data.currentPrice}{" "}
                <span className="text-white/70 text-base">AVAX</span>
              </p>
            </div>
          )}

          {data.fundingGoal && data.fundingGoal !== "0" && (
            <div className="backdrop-blur-sm bg-white/10 p-4 rounded-xl border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-white" />
                <span className="text-white/80 text-sm">Funding Progress</span>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-white text-sm font-semibold">
                  {progress.toFixed(1)}% • {data.collateral || "0"} /{" "}
                  {data.fundingGoal} AVAX
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
