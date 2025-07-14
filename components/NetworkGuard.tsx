// components/NetworkGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { avalancheFuji, mainnet } from "wagmi/chains";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Wifi, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NetworkGuardProps {
  children: React.ReactNode;
}

const REQUIRED_CHAIN_ID = avalancheFuji.id; // 43113
const REQUIRED_NETWORK_NAME = "Avalanche Fuji Testnet";

export function NetworkGuard({ children }: NetworkGuardProps) {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [realChainId, setRealChainId] = useState<number | undefined>(undefined);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [hasAttemptedAutoSwitch, setHasAttemptedAutoSwitch] = useState(false);

  const { isConnected, isConnecting, address } = useAccount();
  const wagmiChainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { toast } = useToast();

  // Get real chain ID from wallet - only when connected
  useEffect(() => {
    const getRealChainId = async () => {
      if (typeof window !== "undefined" && window.ethereum && isConnected) {
        try {
          const chainId = await window.ethereum.request({
            method: "eth_chainId",
          });
          const numericChainId = parseInt(chainId, 16);
          setRealChainId(numericChainId);
          console.log("🔍 Real chain ID from wallet:", numericChainId);
          console.log("🔍 Wagmi chain ID:", wagmiChainId);
        } catch (error) {
          console.error("Failed to get real chain ID:", error);
          setRealChainId(wagmiChainId);
        }
      } else if (!isConnected) {
        // Clear chain ID when disconnected
        setRealChainId(undefined);
      } else {
        setRealChainId(wagmiChainId);
      }
    };

    // Only check when connected and mounted
    if (mounted) {
      getRealChainId();
    }
  }, [isConnected, wagmiChainId, mounted]);

  // Listen for chain changes - only when connected
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum && isConnected) {
      const handleChainChanged = (chainId: string) => {
        const numericChainId = parseInt(chainId, 16);
        console.log("🔄 Chain changed to:", numericChainId);
        setRealChainId(numericChainId);
        setBannerDismissed(false); // Reset dismissal on chain change
        setHasAttemptedAutoSwitch(false); // Reset auto-switch flag
      };

      window.ethereum.on("chainChanged", handleChainChanged);
      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [isConnected]);

  const effectiveChainId = realChainId ?? wagmiChainId;
  const isCorrectNetwork = effectiveChainId === REQUIRED_CHAIN_ID;
  const isWrongNetwork = isConnected && !isCorrectNetwork;

  // Handle mounting
  useEffect(() => {
    setMounted(true);
    console.log("🛡️ NetworkGuard mounted");
  }, []);

  // Show/hide banner logic - NO AUTO-SWITCH
  useEffect(() => {
    const debug = `
    📊 NetworkGuard Debug:
    - Mounted: ${mounted}
    - Connected: ${isConnected}
    - Connecting: ${isConnecting}
    - Address: ${address || "none"}
    - Wagmi Chain ID: ${wagmiChainId || "undefined"}
    - Real Chain ID: ${realChainId || "undefined"}
    - Effective Chain ID: ${effectiveChainId || "undefined"}
    - Required: ${REQUIRED_CHAIN_ID}
    - Correct Network: ${isCorrectNetwork}
    - Wrong Network: ${isWrongNetwork}
    - Show Banner: ${showBanner}
    - Banner Dismissed: ${bannerDismissed}
    - Has Attempted Auto Switch: ${hasAttemptedAutoSwitch}
    `;

    console.log(debug);

    // Show banner logic - ONLY show, don't auto-switch
    if (mounted && isWrongNetwork && !bannerDismissed) {
      console.log(
        "🚨 WRONG NETWORK DETECTED - SHOWING BANNER (no auto-switch)"
      );
      setShowBanner(true);
    } else if (mounted && isCorrectNetwork) {
      console.log("✅ CORRECT NETWORK - HIDING BANNER");
      setShowBanner(false);
      setBannerDismissed(false); // Reset dismissal when on correct network
      setHasAttemptedAutoSwitch(false); // Reset auto-switch flag
    }
  }, [
    mounted,
    isConnected,
    isConnecting,
    address,
    wagmiChainId,
    realChainId,
    effectiveChainId,
    isCorrectNetwork,
    isWrongNetwork,
    showBanner,
    bannerDismissed,
    hasAttemptedAutoSwitch,
  ]);

  // REMOVED: Auto-switch logic - let user decide when to switch

  const handleManualSwitch = async () => {
    console.log("🔄 Manual switch triggered by user");
    try {
      toast({
        title: "Switching Network...",
        description: `Switching to ${REQUIRED_NETWORK_NAME}`,
      });

      await switchChain({ chainId: REQUIRED_CHAIN_ID });

      toast({
        title: "Network Switched",
        description: `Successfully switched to ${REQUIRED_NETWORK_NAME}`,
      });
    } catch (error) {
      console.error("❌ Manual switch failed:", error);

      toast({
        title: "Switch Failed",
        description: "Please manually switch networks in your wallet settings",
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  const handleDismissBanner = () => {
    console.log("Banner dismissed by user");
    setBannerDismissed(true);
    setShowBanner(false);
  };

  const getNetworkName = (chainId: number | undefined) => {
    switch (chainId) {
      case 1:
        return "Ethereum Mainnet";
      case 43113:
        return "Avalanche Fuji";
      case 43114:
        return "Avalanche Mainnet";
      case 137:
        return "Polygon";
      case 56:
        return "BSC";
      case 11155111:
        return "Sepolia";
      case 5:
        return "Goerli";
      default:
        return `Chain ${chainId}`;
    }
  };

  // Only show debug info in development
  const shouldShowDebug = process.env.NODE_ENV === "development";

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      {/* Debug Panel - Less intrusive */}
      {shouldShowDebug && (
        <div className="fixed bottom-4 left-4 max-w-xs z-40 bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
          <div className="mb-2 font-bold text-xs">Network Status:</div>
          <div className="space-y-1 text-xs">
            <div>Real: {getNetworkName(realChainId)}</div>
            <div>Required: {REQUIRED_NETWORK_NAME}</div>
            <div
              className={isCorrectNetwork ? "text-green-400" : "text-red-400"}
            >
              Status: {isCorrectNetwork ? "✅ Correct" : "❌ Wrong"}
            </div>
          </div>
          <div className="mt-2 space-x-1">
            <Button
              size="sm"
              onClick={() => {
                setBannerDismissed(false);
                setShowBanner(true);
              }}
              className="text-xs h-6 px-2"
            >
              Show Banner
            </Button>
          </div>
        </div>
      )}

      {/* Wrong Network Banner - User Controlled */}
      <AnimatePresence>
        {showBanner && !bannerDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed top-20 left-4 right-4 z-50 flex justify-center pointer-events-none"
          >
            <Card className="max-w-md w-full bg-yellow-500/10 border-yellow-500/30 backdrop-blur-md shadow-xl pointer-events-auto">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-yellow-600 mb-1">
                      Wrong Network
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      You're on {getNetworkName(effectiveChainId)}. Switch to{" "}
                      {REQUIRED_NETWORK_NAME} to use all features.
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleManualSwitch}
                        disabled={isSwitching}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs h-8"
                      >
                        {isSwitching ? (
                          <>Switching...</>
                        ) : (
                          <>
                            <Wifi className="h-3 w-3 mr-1" />
                            Switch Network
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDismissBanner}
                        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
