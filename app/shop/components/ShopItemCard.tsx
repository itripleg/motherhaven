// app/shop/components/ShopItemCard.tsx
"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  ShoppingCart,
  Lock,
  Clock,
  Sparkles,
  AlertTriangle,
  Check,
  Star,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { type ShopItem, RARITY_COLORS } from "../types";
import { cn } from "@/lib/utils";

interface ShopItemCardProps {
  item: ShopItem;
  canPurchase: boolean;
  userBalance: number;
  onPurchase?: (item: ShopItem) => void;
  isLoading?: boolean;
}

export const ShopItemCard = ({
  item,
  canPurchase,
  userBalance,
  onPurchase,
  isLoading = false,
}: ShopItemCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchaseClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canPurchase || isPurchasing || !onPurchase || !item.isAvailable)
      return;

    setIsPurchasing(true);
    try {
      await onPurchase(item);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Get rarity color
  const rarityColor = RARITY_COLORS[item.rarity];

  // Check if user can afford this item
  const canAfford = userBalance >= item.cost;

  // Format cost display
  const formatCost = (cost: number) => {
    if (cost >= 1000000) {
      return `${(cost / 1000000).toFixed(1)}M`;
    } else if (cost >= 1000) {
      return `${(cost / 1000).toFixed(1)}K`;
    }
    return cost.toLocaleString();
  };

  // Get purchase button state
  const getPurchaseButtonState = () => {
    if (!item.isAvailable) {
      return {
        text: "Coming Soon",
        icon: Clock,
        disabled: true,
        variant: "secondary" as const,
        className: "opacity-60",
      };
    }

    if (!canAfford) {
      return {
        text: `Need ${formatCost(item.cost - userBalance)} more`,
        icon: AlertTriangle,
        disabled: true,
        variant: "outline" as const,
        className: "text-orange-400 border-orange-400/30",
      };
    }

    if (isPurchasing) {
      return {
        text: "Processing...",
        icon: null,
        disabled: true,
        variant: "default" as const,
        className: "",
      };
    }

    return {
      text: "Purchase",
      icon: ShoppingCart,
      disabled: false,
      variant: "default" as const,
      className: "bg-primary hover:bg-primary/90",
    };
  };

  const buttonState = getPurchaseButtonState();

  return (
    <motion.div
      whileHover={item.isAvailable ? { scale: 1.02, y: -5 } : {}}
      whileTap={item.isAvailable ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onHoverStart={() => setIsHovered(item.isAvailable)}
      onHoverEnd={() => setIsHovered(false)}
      layout
    >
      <Card
        className={cn(
          "h-full relative overflow-hidden group border-primary/40 transition-all duration-300",
          !item.isAvailable && "opacity-90",
          !canAfford && item.isAvailable && "border-orange-400/30",
          canPurchase &&
            item.isAvailable &&
            "hover:border-primary/60 hover:shadow-lg cursor-pointer",
          !item.isAvailable && "cursor-not-allowed"
        )}
        style={{
          borderColor:
            isHovered && item.isAvailable ? rarityColor + "60" : undefined,
        }}
      >
        {/* Rarity glow effect */}
        {item.isAvailable && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${rarityColor}40 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Background pattern */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
          {/* Item preview as background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <div className="text-[8rem] transform rotate-12 group-hover:rotate-6 transition-transform duration-500">
              {item.preview}
            </div>
          </div>
        </div>

        {/* Coming Soon Overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 z-20 bg-gray-900/85 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="text-center p-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4"
              >
                <Clock className="h-8 w-8 text-yellow-400" />
              </motion.div>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 text-yellow-400 px-6 py-3 rounded-full border border-yellow-400/40"
              >
                <span className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Coming Soon
                </span>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xs text-gray-300 mt-3 max-w-[200px] leading-relaxed"
              >
                This feature is in development and will be available soon!
              </motion.p>
            </div>
          </div>
        )}

        {/* Content Layer */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`text-3xl transition-transform duration-300 ${
                      item.isAvailable ? "group-hover:scale-110" : ""
                    }`}
                  >
                    {item.preview}
                  </div>
                  <Badge
                    className="text-xs font-medium"
                    style={{
                      backgroundColor: `${rarityColor}20`,
                      color: rarityColor,
                      borderColor: `${rarityColor}40`,
                    }}
                  >
                    {item.rarity}
                  </Badge>
                </div>
                <CardTitle
                  className={`text-foreground text-lg font-bold truncate transition-colors ${
                    item.isAvailable ? "group-hover:text-primary" : ""
                  }`}
                >
                  {item.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-sm line-clamp-2">
                  {item.description}
                </CardDescription>
              </div>

              {/* Status indicator */}
              {!item.isAvailable && (
                <div className="flex-shrink-0 ml-2">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-400/30"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Soon
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="flex-1 pb-3">
            {/* Price Display */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Price</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">
                  {formatCost(item.cost)}
                </span>
                <span className="text-sm text-muted-foreground">VAIN</span>
              </div>
            </div>

            {/* Requirements */}
            {item.requiresBurnBalance && (
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>
                    Requires {formatCost(item.requiresBurnBalance)} burned
                  </span>
                </div>
              </div>
            )}

            {/* Category badge */}
            {item.category && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {item.category}
                </Badge>
              </div>
            )}
          </CardContent>

          {/* Footer */}
          <CardFooter className="pt-0">
            <Button
              onClick={handlePurchaseClick}
              disabled={buttonState.disabled || isLoading || !item.isAvailable}
              variant={buttonState.variant}
              className={cn(
                "w-full transition-all duration-300",
                item.isAvailable && "group-hover:shadow-md",
                buttonState.className
              )}
            >
              <div className="flex items-center gap-2">
                {isPurchasing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                  />
                ) : buttonState.icon ? (
                  <buttonState.icon className="h-4 w-4" />
                ) : null}
                <span>{buttonState.text}</span>
              </div>
            </Button>
          </CardFooter>
        </div>

        {/* Hover effects (only for available items) */}
        <AnimatePresence>
          {isHovered && canPurchase && item.isAvailable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none z-5"
            />
          )}
        </AnimatePresence>

        {/* Purchased overlay (for future use) */}
        {item.isPurchased && (
          <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span className="font-medium">Owned</span>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
