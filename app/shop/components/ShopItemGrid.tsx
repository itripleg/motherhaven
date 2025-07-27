// app/shop/components/ShopItemGrid.tsx
"use client";

import { motion } from "framer-motion";
import { ShopItemCard } from "./ShopItemCard";
import { type ShopItem } from "../types";
import { Loader2, AlertCircle, RefreshCw, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

type GridLayout = 3 | 4 | 5;

interface ShopItemGridProps {
  items: ShopItem[];
  gridLayout?: GridLayout;
  userBalance?: number;
  onPurchase?: (item: ShopItem) => void;
}

// Configuration for different layouts
const LAYOUT_CONFIG = {
  3: {
    cardWidth: 300,
    gap: 24,
    classes: "grid gap-6 p-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  },
  4: { cardWidth: 300, gap: 20, classes: "grid gap-5 p-2" },
  5: { cardWidth: 300, gap: 16, classes: "grid gap-4 p-2" },
} as const;

export const ShopItemGrid = ({
  items,
  gridLayout = 3,
  userBalance = 0,
  onPurchase,
}: ShopItemGridProps) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousLayout, setPreviousLayout] = useState(gridLayout);

  // Handle layout transitions
  useEffect(() => {
    if (gridLayout !== previousLayout) {
      setIsTransitioning(true);
      setPreviousLayout(gridLayout);
      const timer = setTimeout(() => setIsTransitioning(false), 500);
      return () => clearTimeout(timer);
    }
  }, [gridLayout, previousLayout]);

  // Get layout configuration
  const config = LAYOUT_CONFIG[gridLayout];

  // Check if we're on mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  // Determine scroll strategy based on layout
  const useInternalScroll = gridLayout === 3 || isMobile;

  // Calculate container styles for breakout layouts (4 & 5 columns)
  const getContainerStyles = (): React.CSSProperties => {
    if (gridLayout === 3 || isMobile) {
      return {
        position: "relative",
        maxWidth: "100%",
        width: "100%",
      };
    }

    // Desktop breakout layout for 4 & 5 columns
    const totalWidth =
      config.cardWidth * gridLayout + config.gap * (gridLayout - 1) + 80;
    return {
      position: "relative",
      width: `${totalWidth}px`,
      left: "50%",
      transform: "translateX(-50%)",
      margin: "0 auto",
    };
  };

  // Get grid styles
  const getGridStyles = (): React.CSSProperties => {
    if (gridLayout === 3 || isMobile) {
      return {};
    }

    return {
      gridTemplateColumns: `repeat(${gridLayout}, ${config.cardWidth}px)`,
      gap: `${config.gap}px`,
      justifyContent: "center",
      justifyItems: "center",
    };
  };

  // Apply gradient mask for fade effect (only for 3-column with internal scroll)
  const shouldApplyMask = useInternalScroll && !isTransitioning;
  const maskStyles = shouldApplyMask
    ? {
        maskImage:
          "linear-gradient(to bottom, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 92%, transparent 100%)",
      }
    : {};

  // No items state
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center text-gray-400">
          <div className="text-6xl opacity-30 mb-4">🏪</div>
          <p className="text-lg font-medium">No items found</p>
          <p className="text-sm">Adjust your filters or check back later</p>
        </div>
      </div>
    );
  }

  if (useInternalScroll) {
    // 3-COLUMN LAYOUT: Use internal scrolling with contained height
    return (
      <div
        className="h-full max-h-[80vh] overflow-y-scroll relative"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "hsl(var(--border)) transparent",
        }}
      >
        <div style={getContainerStyles()}>
          <motion.div
            className={`${config.classes}`}
            style={{
              ...getGridStyles(),
              ...maskStyles,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                layoutId={`shop-item-card-${item.id}`}
                layout
                style={{
                  width: `${config.cardWidth}px`,
                  minWidth: `${config.cardWidth}px`,
                  maxWidth: `${config.cardWidth}px`,
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 1,
                  transform: "translateZ(0)",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    mass: 1.5,
                  },
                  opacity: {
                    delay: index * 0.1,
                    duration: 0.4,
                  },
                  y: {
                    delay: index * 0.1,
                    duration: 0.4,
                  },
                }}
              >
                <ShopItemCard
                  item={item}
                  canPurchase={userBalance >= item.cost && item.isAvailable}
                  userBalance={userBalance}
                  onPurchase={onPurchase}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Custom Scrollbar Styles for 3-column */}
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background-color: hsl(var(--border));
            border-radius: 3px;
            transition: background-color 0.2s ease;
          }
          div::-webkit-scrollbar-thumb:hover {
            background-color: hsl(var(--border) / 0.8);
          }
        `}</style>
      </div>
    );
  } else {
    // 4 & 5 COLUMN LAYOUTS: Use natural page scroll with horizontal breakout
    return (
      <div className="relative" style={{ overflow: "visible" }}>
        <div style={getContainerStyles()}>
          <motion.div
            className={`${config.classes}`}
            style={{
              ...getGridStyles(),
              overflow: "visible",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                layoutId={`shop-item-card-${item.id}`}
                layout
                style={{
                  width: `${config.cardWidth}px`,
                  minWidth: `${config.cardWidth}px`,
                  maxWidth: `${config.cardWidth}px`,
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 1,
                  transform: "translateZ(0)",
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    mass: 1.5,
                  },
                  opacity: {
                    delay: index * 0.1,
                    duration: 0.4,
                  },
                  y: {
                    delay: index * 0.1,
                    duration: 0.4,
                  },
                }}
              >
                <ShopItemCard
                  item={item}
                  canPurchase={userBalance >= item.cost && item.isAvailable}
                  userBalance={userBalance}
                  onPurchase={onPurchase}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }
};
