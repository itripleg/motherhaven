// app/dex/components/core/TokenGrid.tsx - FIXED: Conditional scroll strategy
import { motion } from "framer-motion";
import { TokenCard } from "./TokenCard";
import { Token } from "@/types";
import { type Address } from "viem";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealtimeTokenPrices } from "@/hooks/token/useRealtimeTokenPrices";
import { useState, useEffect } from "react";

type GridLayout = 3 | 4 | 5;

interface TokenGridProps {
  tokens: Token[];
  gridLayout?: GridLayout;
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

export const TokenGrid = ({ tokens, gridLayout = 3 }: TokenGridProps) => {
  const tokenAddresses = tokens.map((token) => token.address as Address);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousLayout, setPreviousLayout] = useState(gridLayout);

  const { prices, isLoading, error, refreshPrices } = useRealtimeTokenPrices(
    tokenAddresses,
    {
      refreshInterval: 15000,
      eventRefreshDelay: 2000,
      enableEventListening: true,
    }
  );

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
  const usePageScroll = !useInternalScroll;

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

  // Loading state
  if (isLoading && Object.keys(prices).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading token prices...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && Object.keys(prices).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load token prices</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshPrices}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  // No tokens state
  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center text-gray-400">
          <p className="text-lg font-medium">No tokens found</p>
          <p className="text-sm">Create a new token to get started</p>
        </div>
      </div>
    );
  }

  // SOLUTION: Conditional scroll strategy
  if (useInternalScroll) {
    // 3-COLUMN LAYOUT: Use internal scrolling with contained height
    return (
      <div 
        className="h-full max-h-[80vh] overflow-y-scroll relative"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'hsl(var(--border)) transparent'
        }}
      >
        <div style={getContainerStyles()}>
          <motion.div
            className={`${config.classes}`}
            style={{ 
              ...getGridStyles(), 
              ...maskStyles
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
            {tokens.map((token) => {
              const priceData = prices[token.address.toLowerCase()];

              return (
                <motion.div
                  key={token.address}
                  layoutId={`token-card-${token.address}`}
                  layout
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      mass: 1.5,
                    },
                  }}
                  style={{
                    width: `${config.cardWidth}px`,
                    minWidth: `${config.cardWidth}px`,
                    maxWidth: `${config.cardWidth}px`,
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 1,
                    transform: "translateZ(0)",
                  }}
                >
                  <TokenCard
                    token={token}
                    price={priceData?.formatted || "0.000000"}
                    rawPrice={priceData?.raw || "0"}
                    isLoading={isLoading}
                    lastUpdated={priceData?.lastUpdated}
                  />
                </motion.div>
              );
            })}
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
      <div className="relative" style={{ overflow: 'visible' }}>
        <div style={getContainerStyles()}>
          <motion.div
            className={`${config.classes}`}
            style={{ 
              ...getGridStyles(),
              overflow: 'visible'
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
            {tokens.map((token) => {
              const priceData = prices[token.address.toLowerCase()];

              return (
                <motion.div
                  key={token.address}
                  layoutId={`token-card-${token.address}`}
                  layout
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      mass: 1.5,
                    },
                  }}
                  style={{
                    width: `${config.cardWidth}px`,
                    minWidth: `${config.cardWidth}px`,
                    maxWidth: `${config.cardWidth}px`,
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 1,
                    transform: "translateZ(0)",
                  }}
                >
                  <TokenCard
                    token={token}
                    price={priceData?.formatted || "0.000000"}
                    rawPrice={priceData?.raw || "0"}
                    isLoading={isLoading}
                    lastUpdated={priceData?.lastUpdated}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    );
  }
};