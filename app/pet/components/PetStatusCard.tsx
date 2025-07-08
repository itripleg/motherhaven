// pet/components/PetStatusCard.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  AlertTriangle,
  Crown,
  Edit3,
  Heart,
  Skull,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PetStatusCardProps } from "../types";

export const PetStatusCard: React.FC<PetStatusCardProps> = ({
  extendedPetInfo,
  revivalInfo,
  userStats,
  onRevive,
  onRenamePet,
  onUpdateHealth,
  isConnected,
  isWritePending,
  isUserCaretaker,
}) => {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newPetName, setNewPetName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  if (!extendedPetInfo) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            Loading pet information...
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAvax = (wei: bigint) => {
    return parseFloat((Number(wei) / 1e18).toFixed(4));
  };

  const handleRename = async () => {
    if (!newPetName.trim() || !onRenamePet) return;

    setIsRenaming(true);
    try {
      await onRenamePet(newPetName.trim());
      setIsRenameDialogOpen(false);
      setNewPetName("");
    } catch (error) {
      console.error("Rename failed:", error);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pet Ownership & Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Pet Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Caretaker */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Crown
                className={`h-5 w-5 ${
                  isUserCaretaker ? "text-yellow-500" : "text-blue-500"
                }`}
              />
              <div>
                <div className="font-medium">Current Caretaker</div>
                <div className="text-sm text-muted-foreground">
                  {isUserCaretaker
                    ? "You"
                    : formatAddress(extendedPetInfo.currentCaretaker)}
                </div>
              </div>
            </div>
            {isUserCaretaker && (
              <Badge
                variant="default"
                className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300"
              >
                <Crown className="h-3 w-3 mr-1" />
                Owner
              </Badge>
            )}
          </div>

          {/* Actions Row */}
          <div className="flex gap-2">
            {/* Rename Pet (only for caretaker) */}
            {isUserCaretaker && onRenamePet && (
              <Dialog
                open={isRenameDialogOpen}
                onOpenChange={setIsRenameDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Rename Pet
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rename Your Pet</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">New Name</label>
                      <Input
                        value={newPetName}
                        onChange={(e) => setNewPetName(e.target.value)}
                        placeholder={extendedPetInfo.name}
                        maxLength={32}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRename}
                        disabled={!newPetName.trim() || isRenaming}
                        className="flex-1"
                      >
                        {isRenaming ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Renaming...
                          </>
                        ) : (
                          <>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Rename
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsRenameDialogOpen(false);
                          setNewPetName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Manual Health Update */}
            {extendedPetInfo.isAlive && onUpdateHealth && (
              <Button
                onClick={onUpdateHealth}
                variant="outline"
                disabled={isWritePending}
                className="flex-1"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isWritePending ? "animate-spin" : ""
                  }`}
                />
                Update Health
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Your Community Stats (if connected and has fed) */}
      {isConnected && userStats && userStats.hasEverFed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Your Contribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border">
              <div className="text-3xl font-bold text-pink-500 mb-1">
                {userStats.feedingCount}
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                feedings by you
              </div>
              <Badge variant="secondary">
                {extendedPetInfo.totalFeedings > 0
                  ? Math.round(
                      (userStats.feedingCount / extendedPetInfo.totalFeedings) *
                        100
                    )
                  : 0}
                % of total community feeds
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revival Section (if dead) */}
      {!extendedPetInfo.isAlive && revivalInfo && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Skull className="h-5 w-5" />
              Revival Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">
                    💀 {extendedPetInfo.name} has died and needs revival!
                  </p>
                  <p className="text-sm">
                    Revival cost:{" "}
                    <strong>{formatAvax(revivalInfo.currentCost)} AVAX</strong>
                    {revivalInfo.deathCount > 0 && (
                      <span className="text-muted-foreground ml-2">
                        (Death #{revivalInfo.deathCount + 1} - cost doubles each
                        time)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The reviver becomes the new caretaker.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Revival Button */}
            <Button
              onClick={onRevive}
              disabled={!isConnected || isWritePending}
              className="w-full bg-red-600 hover:bg-red-700"
              size="lg"
            >
              {isWritePending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reviving...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Revive for {formatAvax(revivalInfo.currentCost)} AVAX
                </>
              )}
            </Button>

            {!isConnected && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Connect your wallet to revive the pet
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
