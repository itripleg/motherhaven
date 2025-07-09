// app/dex/components/tokens/TokenGrid.tsx
import { motion } from "framer-motion";
import { TokenCard } from "./TokenCard";
import { Token } from "@/types";
import { type Address } from "viem";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealtimeTokenPrices } from "@/hooks/token/useRealtimeTokenPrices";

type GridLayout = 3 | 4 | 5;

interface TokenGridProps {
  tokens: Token[];
  gridLayout?: GridLayout;
}

export const TokenGrid = ({ tokens, gridLayout = 3 }: TokenGridProps) => {
  // Extract token addresses for price fetching
  const tokenAddresses = tokens.map((token) => token.address as Address);

  // Use the new real-time prices hook
  const { prices, isLoading, error, refreshPrices, lastUpdate } =
    useRealtimeTokenPrices(tokenAddresses, {
      refreshInterval: 15000, // 15 seconds
      eventRefreshDelay: 2000, // 2 seconds after trade events
      enableEventListening: true,
    });

  // Calculate breakout based on card size and desired columns
  const getBreakoutCalculation = (layout: GridLayout) => {
    // Base card width (exactly what a card naturally wants to be)
    const baseCardWidth = 300; // Increased to ensure no squishing
    const gap = layout === 5 ? 16 : layout === 4 ? 20 : 24; // Increased gaps to prevent cramping

    // Calculate the total width needed for the desired number of columns
    const totalWidth = baseCardWidth * layout + gap * (layout - 1);

    // Add extra padding for hover effects and breathing room
    const paddingForHover = 40; // Extra space on each side for hover effects
    const totalWidthWithPadding = totalWidth + paddingForHover * 2;

    return {
      totalWidth: totalWidthWithPadding,
      cardWidth: baseCardWidth,
      gap,
      hoverPadding: paddingForHover,
    };
  };

  // Get grid classes with consistent card sizing
  const getGridClasses = (layout: GridLayout): string => {
    const baseClasses = "grid max-h-screen overflow-visible scrollbar-thin";

    // Use CSS Grid with fixed card widths
    switch (layout) {
      case 3:
        return (
          `${baseClasses} gap-6 p-2` + // Keep original padding for 3-column
          ` grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
        );
      case 4:
        return `${baseClasses} gap-5 p-6`;
      case 5:
        return `${baseClasses} gap-4 p-6`;
      default:
        return `${baseClasses} gap-6 p-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
    }
  };

  // Container classes with calculated breakout
  const getContainerClasses = (layout: GridLayout): string => {
    if (layout === 3) {
      // 3 columns - stays within container
      return "space-y-4 overflow-visible";
    }

    return "space-y-4"; // Base class, positioning handled by inline styles
  };

  // Get container styles with proper centering
  const getContainerStyles = (layout: GridLayout): React.CSSProperties => {
    if (layout === 3) {
      return {
        overflow: "visible", // Only add overflow visible for transitions
      };
    }

    const calc = getBreakoutCalculation(layout);

    return {
      position: "relative",
      width: `${calc.totalWidth}px`,
      left: "50%",
      transform: "translateX(-50%)",
      margin: "0 auto",
      overflow: "visible",
    };
  };

  // Alternative approach using CSS custom properties for more precise control
  const getCustomGridStyle = (layout: GridLayout): React.CSSProperties => {
    const calc = getBreakoutCalculation(layout);

    if (layout === 3) {
      return {
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", // Responsive for 3 columns
      };
    }

    // For 4 and 5 columns, use exact fixed widths to prevent squishing
    return {
      gridTemplateColumns: `repeat(${layout}, ${calc.cardWidth}px)`,
      gap: `${calc.gap}px`,
      justifyContent: "center",
      justifyItems: "center", // Center items within their grid cells
    };
  };

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

  // Error state with retry option
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

  return (
    <div
      className="space-y-4"
      style={{
        overflow: "visible", // Ensure parent containers don't clip during transitions
        position: "relative", // Create stacking context for transitions
      }}
    >
      <div
        style={{
          ...getContainerStyles(gridLayout),
          maskImage:
            gridLayout === 3
              ? "linear-gradient(to bottom, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 85%, transparent 100%)"
              : "none",
          WebkitMaskImage:
            gridLayout === 3
              ? "linear-gradient(to bottom, rgb(0, 0, 0) 0%, rgb(0, 0, 0) 85%, transparent 100%)"
              : "none",
        }}
      >
        {/* Token grid with consistent card sizing */}
        <motion.div
          className={getGridClasses(gridLayout)}
          style={{
            ...getCustomGridStyle(gridLayout),
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
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
                    duration: 0.6,
                    ease: "easeInOut",
                  },
                }}
                // Force exact card width to prevent any squishing + ensure no clipping during transitions
                style={{
                  width:
                    gridLayout === 3
                      ? "auto"
                      : `${getBreakoutCalculation(gridLayout).cardWidth}px`,
                  minWidth:
                    gridLayout === 3
                      ? "auto"
                      : `${getBreakoutCalculation(gridLayout).cardWidth}px`,
                  maxWidth:
                    gridLayout === 3
                      ? "none"
                      : `${getBreakoutCalculation(gridLayout).cardWidth}px`,
                  flexShrink: 0, // Prevent any shrinking
                  overflow: "visible", // Ensure card wrapper doesn't clip
                  zIndex: 1, // Ensure cards are above container bounds during transitions
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
};
