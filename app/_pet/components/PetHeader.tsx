"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Crown,
  Clock,
} from "lucide-react";

interface PetHeaderProps {
  petName: string;
  petType: number;
  isAlive: boolean;
  lastUpdate: Date | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function PetHeader({
  petName,
  petType,
  isAlive,
  lastUpdate,
  onRefresh,
  isRefreshing,
}: PetHeaderProps) {
  const getPetTypeName = (type: number): string => {
    const types = ["Dog", "Cat", "Robot", "Dragon", "Alien"];
    return types[type] || "Unknown";
  };

  const getPetEmoji = (type: number): string => {
    const emojis = ["🐕", "🐱", "🤖", "🐉", "👽"];
    return emojis[type] || "🐾";
  };

  const getStatusBadge = () => {
    if (isAlive) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
          <Heart className="h-3 w-3 mr-1" />
          Alive & Well
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Needs Revival
        </Badge>
      );
    }
  };

  return (
    <div className="text-center space-y-6">
      {/* Main Title Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          {/* Pet Icon */}
          <div className="p-4 bg-primary/20 rounded-xl border border-primary/30">
            <div className="text-4xl">{getPetEmoji(petType)}</div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gradient bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {petName}
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Our Beloved Community {getPetTypeName(petType)}
            </p>
          </div>

          {/* Special Badge */}
          <div className="p-4 bg-primary/20 rounded-xl border border-primary/30">
            <Crown className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Status and Type Badges */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {getStatusBadge()}

          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Community Pet
          </Badge>

          <Badge className="bg-primary/20 text-primary border-primary/30">
            {getPetTypeName(petType)}
          </Badge>
        </div>

        {/* Description */}
        <div className="max-w-3xl mx-auto">
          <p className="text-muted-foreground text-lg leading-relaxed">
            Meet {petName}, our beloved community{" "}
            {getPetTypeName(petType).toLowerCase()}! Feed them with tokens to
            keep them happy and healthy.
            {isAlive
              ? " Watch them grow, play, and interact with the community!"
              : " They need your help to come back to life!"}
          </p>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* Last Update Info */}
        {lastUpdate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        )}

        {/* Refresh Button */}
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="border-border text-foreground hover:bg-secondary transition-all duration-200"
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 transition-transform duration-200 ${
              isRefreshing ? "animate-spin" : "hover:rotate-45"
            }`}
          />
          {isRefreshing ? "Updating..." : "Refresh Status"}
        </Button>
      </div>

      {/* Pet Status Alert */}
      {!isAlive && (
        <div className="max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center justify-center gap-3 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <div className="text-center">
              <p className="font-semibold">{petName} has passed away 😢</p>
              <p className="text-sm text-red-400/80 mt-1">
                Don't worry! They can be revived with AVAX. Scroll down to bring
                them back to life!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Development Notice */}
      {process.env.NODE_ENV === "development" && (
        <div className="max-w-2xl mx-auto p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-orange-400 text-sm">
            <Sparkles className="h-4 w-4" />
            <span>
              Development Mode - Contract data will be available after
              deployment
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
