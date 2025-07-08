// app/dex/components/token-header/TokenHeader.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAccount } from "wagmi";
import { formatEther, Address } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { useImagePosition } from "@/hooks/useImagePosition";
import { useTokenData } from "@/final-hooks/useTokenData";
import { useFactoryContract } from "@/final-hooks/useFactoryContract";
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice";
import { formatTokenPrice } from "@/utils/tokenPriceFormatter";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

import {
  ImagePositionEditor,
  TokenHeaderBackground,
  TokenHeaderContent,
  type ImagePosition,
  type TokenHeaderData,
} from "./index";
import {
  DescriptionEditor,
  type DescriptionEditorRef,
} from "./DescriptionEditor";

interface TokenHeaderProps {
  address: string;
  className?: string;
  height?: string;
}

const HEADER_HEIGHT = "h-80";

export const TokenHeader: React.FC<TokenHeaderProps> = ({
  address,
  className = "",
  height = HEADER_HEIGHT,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [position, setPosition] = useState<ImagePosition>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    fit: "cover",
  });

  const { address: userAddress } = useAccount();
  const { updatePosition, isUpdating } = useImagePosition();
  const { toast } = useToast();

  // Get token data
  const { token, isLoading: loading } = useTokenData(address as Address);

  // Get contract state
  const { useTokenState, useCollateral } = useFactoryContract();
  const { state } = useTokenState(address as Address);
  const { collateral: rawCollateral } = useCollateral(address as Address);

  // Get current price
  const { formatted: formattedCurrentPrice, isLoading: priceLoading } =
    useUnifiedTokenPrice(address as Address);

  const isCreator =
    userAddress &&
    token?.creator &&
    userAddress.toLowerCase() === token.creator.toLowerCase();

  // Update position state when token data changes
  useEffect(() => {
    if (token?.imagePosition) {
      setPosition(token.imagePosition);
    }
  }, [token?.imagePosition]);

  // Calculate progress
  const progress = React.useMemo(() => {
    if (token?.fundingGoal && rawCollateral) {
      const goalAmount = parseFloat(token.fundingGoal);
      const collateralAmount = parseFloat(formatEther(rawCollateral));
      const percentage =
        goalAmount > 0 ? (collateralAmount / goalAmount) * 100 : 0;
      return Math.min(percentage, 100);
    }
    return 0;
  }, [token?.fundingGoal, rawCollateral]);

  // Prepare header data
  const headerData: TokenHeaderData = React.useMemo(() => {
    if (!token) return {} as TokenHeaderData;

    return {
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      imageUrl: token.imageUrl,
      description: token.description,
      creator: token.creator,
      currentPrice: priceLoading ? "Loading..." : formattedCurrentPrice,
      fundingGoal: token.fundingGoal,
      collateral: rawCollateral
        ? formatTokenPrice(formatEther(rawCollateral))
        : "0",
      state: state ?? token.currentState,
      createdAt: token.createdAt,
      imagePosition: token.imagePosition,
    };
  }, [token, state, formattedCurrentPrice, priceLoading, rawCollateral]);

  const savePosition = async () => {
    if (!token?.address || !userAddress) return;
    const success = await updatePosition(token.address, position, userAddress);
    if (success) {
      setIsEditing(false);
    }
  };

  const cancelEdit = () => {
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
  };

  // Description save handler
  const handleDescriptionSave = async (
    description: string
  ): Promise<boolean> => {
    if (!token?.address || !userAddress) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      });
      return false;
    }

    try {
      const tokenDocRef = doc(db, "tokens", token.address.toLowerCase());

      await updateDoc(tokenDocRef, {
        description: description.trim(),
        lastUpdated: serverTimestamp(),
        updatedBy: userAddress,
      });

      toast({
        title: "Success",
        description: "Token description updated successfully",
      });

      // Close the editor after successful save
      setIsEditingDescription(false);
      return true;
    } catch (error) {
      console.error("Error updating description:", error);
      toast({
        title: "Error",
        description: "Failed to update description. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Function to trigger description editing
  const handleDescriptionEdit = () => {
    setIsEditingDescription(true);
  };

  // Function to cancel description editing
  const handleDescriptionCancel = () => {
    setIsEditingDescription(false);
  };

  if (loading || !token) {
    return (
      <Card
        className={`${height} flex items-center justify-center unified-card border-primary/20 ${className}`}
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
        className={`${height} relative overflow-hidden unified-card border-primary/20 ${className}`}
      >
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ImagePositionEditor
                position={position}
                onPositionChange={setPosition}
                onSave={savePosition}
                onCancel={cancelEdit}
                isUpdating={isUpdating}
                imageUrl={token.imageUrl || ""}
              />
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TokenHeaderBackground
                imageUrl={token.imageUrl}
                position={position}
              />
              <TokenHeaderContent
                data={headerData}
                isCreator={isCreator}
                canEdit={!!token.imageUrl}
                onEditClick={() => setIsEditing(true)}
                onDescriptionEdit={handleDescriptionEdit}
                onDescriptionCancel={handleDescriptionCancel}
                progress={progress}
                isEditingDescription={isEditingDescription}
                onDescriptionSave={
                  isCreator ? handleDescriptionSave : undefined
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </TooltipProvider>
  );
};
