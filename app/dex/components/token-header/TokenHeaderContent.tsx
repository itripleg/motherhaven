// app/dex/components/token-header/TokenHeaderContent.tsx
"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddressComponent } from "@/components/AddressComponent";
import { Progress } from "@/components/ui/progress";
import {
  Crown,
  User,
  Camera,
  TrendingUp,
  Target,
  FileText,
  Map,
} from "lucide-react";
import { motion } from "framer-motion";
import { TokenHeaderData } from "./types";
import { DescriptionEditor } from "./DescriptionEditor";
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
  onDescriptionSave?: (description: string) => Promise<boolean>;
  onDescriptionEdit?: () => void;
  onDescriptionCancel?: () => void;
  onRoadmapClick?: () => void;
  progress?: number;
  className?: string;
  isEditingDescription?: boolean;
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
  onDescriptionSave,
  onDescriptionEdit,
  onDescriptionCancel,
  onRoadmapClick,
  progress = 0,
  className = "",
  isEditingDescription = false,
}) => {
  const stateDisplay = getStateDisplay(data.state);

  return (
    <div
      className={`relative z-10 flex flex-col justify-between h-full p-4 lg:p-6 ${className}`}
    >
      {/* Top Bar */}
      <div className="flex justify-between items-start mb-4 lg:mb-0">
        <div className="min-w-0 flex-1">
          <AddressComponent hash={data.address} type="address" />
        </div>

        <div className="flex items-center gap-2 lg:gap-3 ml-2 flex-shrink-0">
          <Badge
            className={`${stateDisplay.color} text-white border-0 text-xs lg:text-sm`}
            variant="outline"
          >
            {stateDisplay.text}
          </Badge>

          {/* Icon group - always visible */}
          <div className="flex items-center gap-1 lg:gap-2 p-1 lg:p-1.5 bg-black/30 border border-white/40 rounded-lg backdrop-blur-sm">
            {/* Roadmap icon - always visible, functional for creators, read-only for others */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    console.log(
                      "Roadmap button clicked, isCreator:",
                      isCreator,
                      "onRoadmapClick:",
                      !!onRoadmapClick
                    );
                    if (onRoadmapClick) {
                      onRoadmapClick();
                    }
                  }}
                  className="text-white hover:text-primary hover:bg-primary/20 h-6 w-6 lg:h-7 lg:w-7 border border-white/40 hover:border-primary/50 transition-all duration-200"
                >
                  <Map className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isCreator ? "Manage roadmap" : "View roadmap"}
              </TooltipContent>
            </Tooltip>

            {/* Creator-only controls */}
            {isCreator && (
              <>
                {canEdit && data.imageUrl && onEditClick && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onEditClick}
                        className="text-white hover:text-primary hover:bg-primary/20 h-6 w-6 lg:h-7 lg:w-7 border border-white/40 hover:border-primary/50 transition-all duration-200"
                      >
                        <Camera className="h-3 w-3 lg:h-4 lg:w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit photo position</TooltipContent>
                  </Tooltip>
                )}

                {onDescriptionSave && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDescriptionEdit}
                        className="text-white hover:text-primary hover:bg-primary/20 h-6 w-6 lg:h-7 lg:w-7 border border-white/40 hover:border-primary/50 transition-all duration-200"
                      >
                        <FileText className="h-3 w-3 lg:h-4 lg:w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit description</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-1 lg:p-1.5 bg-primary/20 border border-primary/40 rounded-md">
                      <Crown className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>You are the creator</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          {!isCreator && data.creator && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-1 lg:p-1.5 bg-gray-500/20 border border-gray-400/30 rounded-md">
                  <User className="h-3 w-3 lg:h-4 lg:w-4 text-gray-300" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Created by: {data.creator}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Token Info */}
      <div className="space-y-4 lg:space-y-6 flex-1">
        <div className="space-y-2 lg:space-y-3">
          <h1 className="text-2xl lg:text-4xl font-bold text-white leading-tight">
            {data.name}
            {data.symbol && (
              <span className="text-lg lg:text-2xl text-white/70 ml-2 lg:ml-3">
                ({data.symbol})
              </span>
            )}
          </h1>

          {/* Description with inline editor */}
          <DescriptionEditor
            description={data.description}
            isCreator={isCreator}
            onSave={onDescriptionSave || (async () => false)}
            showEditButton={false}
            forceEditing={isEditingDescription}
            onCancel={onDescriptionCancel}
            className="max-w-2xl"
          />
        </div>

        {/* Combined Stats for Mobile, Separate for Desktop */}
        {data.currentPrice && data.fundingGoal && data.fundingGoal !== "0" ? (
          // Both price and progress exist
          <>
            {/* Mobile: Combined Card */}
            <div className="block lg:hidden">
              <div className="backdrop-blur-sm bg-white/10 p-3 rounded-lg border border-white/20 space-y-3">
                {/* Price Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-white" />
                    <span className="text-white/80 text-sm">Price</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-lg font-bold">
                      {data.currentPrice}{" "}
                      <span className="text-white/70 text-sm">AVAX</span>
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <hr className="border-white/20" />

                {/* Progress Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-white" />
                    <span className="text-white/80 text-sm">Funding</span>
                  </div>
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-white/80">
                      <span>{progress.toFixed(1)}%</span>
                      <span>
                        {data.collateral || "0"} / {data.fundingGoal} AVAX
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: Separate Cards */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-4">
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

              <div className="backdrop-blur-sm bg-white/10 p-4 rounded-xl border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-white" />
                  <span className="text-white/80 text-sm">
                    Funding Progress
                  </span>
                </div>
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-white text-sm font-semibold">
                    {progress.toFixed(1)}% • {data.collateral || "0"} /{" "}
                    {data.fundingGoal} AVAX
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : data.currentPrice ? (
          // Only price exists
          <div className="backdrop-blur-sm bg-white/10 p-3 lg:p-4 rounded-lg lg:rounded-xl border border-white/20 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-white" />
              <span className="text-white/80 text-sm">Current Price</span>
            </div>
            <p className="text-white text-lg lg:text-xl font-bold">
              {data.currentPrice}{" "}
              <span className="text-white/70 text-sm lg:text-base">AVAX</span>
            </p>
          </div>
        ) : data.fundingGoal && data.fundingGoal !== "0" ? (
          // Only funding progress exists
          <div className="backdrop-blur-sm bg-white/10 p-3 lg:p-4 rounded-lg lg:rounded-xl border border-white/20 max-w-sm">
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
        ) : null}
      </div>
    </div>
  );
};
