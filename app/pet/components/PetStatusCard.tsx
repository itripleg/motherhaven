// pet/components/PetStatusCard.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Skull,
  Timer,
  Zap,
  RefreshCw,
  Wallet,
  AlertTriangle,
  Calendar,
  Activity,
  Crown,
  Edit3,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

interface ExtendedPetStatusCardProps
  extends Omit<PetStatusCardProps, "petStatus"> {
  extendedPetInfo: {
    name: string;
    health: number;
    isAlive: boolean;
    lastFed: number;
    totalFeedings: number;
    deathCount: number;
    currentCaretaker: string;
  } | null;
  revivalInfo: {
    currentCost: bigint;
    nextCost: bigint;
    deathCount: number;
    maxCost: bigint;
  } | null;
  isUserCaretaker: boolean;
  onRenamePet?: (newName: string) => Promise<void>;
}

export const PetStatusCard: React.FC<ExtendedPetStatusCardProps> = ({
  extendedPetInfo,
  revivalInfo,
  userStats,
  onRevive,
  onRenamePet,
  isConnected,
  isWritePending,
  onUpdateHealth,
  currentHealth,
  timeSinceLastFed,
  formatTimeSince,
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

  // Format time since last fed
  const getTimeSinceLastFedDisplay = () => {
    if (timeSinceLastFed && formatTimeSince) {
      return formatTimeSince(timeSinceLastFed);
    }
    if (extendedPetInfo.lastFed) {
      const now = Date.now() / 1000;
      const diffSeconds = now - extendedPetInfo.lastFed;
      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      return hours > 0 ? `${hours}h ${minutes}m ago` : `${minutes}m ago`;
    }
    return "Unknown";
  };

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
      {/* Caretaker Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Pet Ownership & Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Caretaker */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  isUserCaretaker
                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                    : "bg-blue-100 dark:bg-blue-900/30"
                }`}
              >
                <Crown
                  className={`h-5 w-5 ${
                    isUserCaretaker
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                />
              </div>
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

          {/* Rename Pet (only for caretaker) */}
          {isUserCaretaker && onRenamePet && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Pet Management</div>
              <Dialog
                open={isRenameDialogOpen}
                onOpenChange={setIsRenameDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Rename {extendedPetInfo.name}
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
                            Rename Pet
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Last Fed */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium">Last Fed</div>
                <div className="text-sm text-muted-foreground">
                  {getTimeSinceLastFedDisplay()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Feedings */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="font-medium">Total Feedings</div>
                <div className="text-sm text-muted-foreground">
                  {extendedPetInfo.totalFeedings} times
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Death Count */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Skull className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="font-medium">Death Count</div>
                <div className="text-sm text-muted-foreground">
                  {extendedPetInfo.deathCount} times
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Stats (if connected) */}
        {isConnected && userStats && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium">Your Feedings</div>
                    <div className="text-sm text-muted-foreground">
                      {userStats.feedingCount} times
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Heart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="font-medium">Status</div>
                    <div className="text-sm text-muted-foreground">
                      {userStats.hasEverFed ? "Community Helper" : "New Member"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Revival Economics (if dead) */}
      {!extendedPetInfo.isAlive && revivalInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-500" />
              Revival Economics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Skull className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      💀 {extendedPetInfo.name} has died!
                    </h3>
                    <p className="text-sm mb-3">
                      The pet&apos;s health reached zero. Revival cost doubles
                      with each death!
                    </p>
                  </div>

                  {/* Cost Progression */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded border">
                      <div className="font-bold text-red-600 dark:text-red-400">
                        {formatAvax(revivalInfo.currentCost)} AVAX
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Current Cost
                      </div>
                    </div>
                    <div className="text-center p-3 bg-orange-100 dark:bg-orange-900/30 rounded border">
                      <div className="font-bold text-orange-600 dark:text-orange-400">
                        {formatAvax(revivalInfo.nextCost)} AVAX
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Next Death Cost
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-100 dark:bg-gray-900/30 rounded border">
                      <div className="font-bold text-gray-600 dark:text-gray-400">
                        {formatAvax(revivalInfo.maxCost)} AVAX
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Maximum Cost
                      </div>
                    </div>
                  </div>

                  {/* Revival Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Death #:</span>
                      <span className="font-mono">
                        {revivalInfo.deathCount + 1}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost Formula:</span>
                      <span className="font-mono">
                        0.1 × 2^{revivalInfo.deathCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>New Caretaker:</span>
                      <span>Reviver becomes owner</span>
                    </div>
                  </div>

                  {/* Revival Button */}
                  <Button
                    onClick={onRevive}
                    disabled={!isConnected || isWritePending}
                    className="w-full"
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
                        Revive {extendedPetInfo.name} for{" "}
                        {formatAvax(revivalInfo.currentCost)} AVAX
                      </>
                    )}
                  </Button>

                  {!isConnected && (
                    <p className="text-xs text-center text-muted-foreground">
                      Connect your wallet to revive the pet and become the new
                      caretaker
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Manual Health Update (if alive) */}
      {extendedPetInfo.isAlive && onUpdateHealth && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Manual Health Update</div>
                <div className="text-sm text-muted-foreground">
                  Force refresh health calculation from blockchain
                </div>
              </div>
              <Button
                onClick={onUpdateHealth}
                variant="outline"
                size="sm"
                disabled={isWritePending}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isWritePending ? "animate-spin" : ""
                  }`}
                />
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pet Care Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Pet Care Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span>
                <strong>Feeding:</strong> Burn CHOW tokens for scaled health
                gain
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-red-500" />
              <span>
                <strong>Decay:</strong> Loses 1 health per hour automatically
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span>
                <strong>Ownership:</strong> Reviver becomes new caretaker
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span>
                <strong>Revival:</strong> Cost doubles with each death
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
