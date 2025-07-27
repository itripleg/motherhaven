// components/NetworkGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
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

// Browser detection
const detectBrowser = (): string => {
  if (typeof window === "undefined") return "unknown";

  const userAgent = window.navigator.userAgent;

  if (userAgent.includes("Chrome") && userAgent.includes("Brave")) {
    return "brave";
  }
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    return "chrome";
  }
  if (userAgent.includes("Firefox")) {
    return "firefox";
  }
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    return "safari";
  }
  if (userAgent.includes("Edg")) {
    return "edge";
  }

  return "unknown";
};

// Check if browser is Brave (more reliable detection)
const isBraveBrowser = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  // Method 1: Check for Brave-specific API
  if ((navigator as any).brave && (navigator as any).brave.isBrave) {
    try {
      return await (navigator as any).brave.isBrave();
    } catch (e) {
      // Continue to other methods
    }
  }

  // Method 2: Check user agent
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Brave")) {
    return true;
  }

  // Method 3: Check for Brave wallet
  if (window.ethereum?.isBraveWallet) {
    return true;
  }

  return false;
};

// Enhanced wallet detection for Brave compatibility
const getWalletProvider = () => {
  if (typeof window === "undefined") return null;

  // Check for MetaMask specifically on Brave
  if (window.ethereum?.providers) {
    // Multiple providers case (Brave + MetaMask)
    const metamaskProvider = window.ethereum.providers.find(
      (provider: any) => provider.isMetaMask && !provider.isBraveWallet
    );
    if (metamaskProvider) return metamaskProvider;
  }

  // Check for MetaMask without Brave wallet interference
  if (window.ethereum?.isMetaMask && !window.ethereum?.isBraveWallet) {
    return window.ethereum;
  }

  // Fallback to default ethereum provider
  return window.ethereum || null;
};

export function NetworkGuard({ children }: NetworkGuardProps) {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [actualWalletChainId, setActualWalletChainId] = useState<
    number | undefined
  >(undefined);
  const [walletProvider, setWalletProvider] = useState<any>(null);
  const [browserType, setBrowserType] = useState<string>("unknown");
  const [isBrave, setIsBrave] = useState<boolean>(false);

  const { isConnected } = useAccount();
  const wagmiChainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { toast } = useToast();

  // Use actual wallet chain ID, not wagmi's potentially incorrect one
  const effectiveChainId = actualWalletChainId ?? wagmiChainId;
  const isWrongNetwork = isConnected && effectiveChainId !== REQUIRED_CHAIN_ID;

  // Initialize browser detection and wallet provider on mount
  useEffect(() => {
    const initializeBrowserDetection = async () => {
      const browser = detectBrowser();
      const brave = await isBraveBrowser();

      setBrowserType(browser);
      setIsBrave(brave);

      console.log("🔍 Browser detection:", {
        browser,
        isBrave: brave,
        userAgent: navigator.userAgent,
      });
    };

    const provider = getWalletProvider();
    setWalletProvider(provider);
    setMounted(true);
    initializeBrowserDetection();

    if (provider) {
      console.log("🔍 Detected wallet provider:", {
        isMetaMask: provider.isMetaMask,
        isBraveWallet: provider.isBraveWallet,
        isMultiProvider: !!window.ethereum?.providers,
      });
    }
  }, []);

  // Get actual wallet chain ID when connected
  useEffect(() => {
    if (!isConnected || !walletProvider) {
      setActualWalletChainId(undefined);
      return;
    }

    const getWalletChainId = async () => {
      try {
        const chainId = await walletProvider.request({
          method: "eth_chainId",
        });
        const numericChainId = parseInt(chainId, 16);
        console.log("🔍 Got actual wallet chain ID:", numericChainId);
        setActualWalletChainId(numericChainId);
      } catch (error) {
        console.error("Failed to get wallet chain ID:", error);
        setActualWalletChainId(wagmiChainId);
      }
    };

    // Get initial chain ID when connected
    getWalletChainId();

    // Listen for chain changes on the correct provider
    if (walletProvider) {
      const handleChainChanged = (chainId: string) => {
        const numericChainId = parseInt(chainId, 16);
        console.log("🔄 Wallet chain changed to:", numericChainId);
        setActualWalletChainId(numericChainId);
        setBannerDismissed(false); // Reset dismissal on chain change
      };

      // Skip event listeners on Brave browser to prevent issues (affects all wallets)
      if (isBrave) {
        console.log(
          "🦁 Brave browser detected - using polling instead of events"
        );

        // Use polling for Brave browser
        const pollInterval = setInterval(async () => {
          try {
            const chainId = await walletProvider.request({
              method: "eth_chainId",
            });
            const numericChainId = parseInt(chainId, 16);
            if (numericChainId !== actualWalletChainId) {
              console.log("🔄 Polling detected chain change:", numericChainId);
              setActualWalletChainId(numericChainId);
              setBannerDismissed(false);
            }
          } catch (error) {
            console.error("Error polling chain ID:", error);
          }
        }, 3000); // Poll every 3 seconds on Brave

        return () => clearInterval(pollInterval);
      }

      // Use event listeners for non-Brave browsers
      if (typeof walletProvider.on === "function") {
        walletProvider.on("chainChanged", handleChainChanged);
        return () => {
          if (typeof walletProvider.removeListener === "function") {
            walletProvider.removeListener("chainChanged", handleChainChanged);
          } else if (typeof walletProvider.off === "function") {
            walletProvider.off("chainChanged", handleChainChanged);
          }
        };
      } else if (typeof walletProvider.addEventListener === "function") {
        walletProvider.addEventListener("chainChanged", handleChainChanged);
        return () => {
          if (typeof walletProvider.removeEventListener === "function") {
            walletProvider.removeEventListener(
              "chainChanged",
              handleChainChanged
            );
          }
        };
      } else {
        // Fallback to polling if no event support
        const pollInterval = setInterval(async () => {
          try {
            const chainId = await walletProvider.request({
              method: "eth_chainId",
            });
            const numericChainId = parseInt(chainId, 16);
            if (numericChainId !== actualWalletChainId) {
              handleChainChanged(chainId);
            }
          } catch (error) {
            console.error("Error polling chain ID:", error);
          }
        }, 5000);

        return () => clearInterval(pollInterval);
      }
    }
  }, [isConnected, wagmiChainId, walletProvider, isBrave, actualWalletChainId]);

  useEffect(() => {
    if (!mounted) return;

    console.log(`
    📊 NetworkGuard Status:
    - Browser: ${browserType} ${isBrave ? "(Brave)" : ""}
    - Connected: ${isConnected}
    - Wagmi Chain ID: ${wagmiChainId}
    - Actual Wallet Chain ID: ${actualWalletChainId}
    - Effective Chain ID: ${effectiveChainId}
    - Required: ${REQUIRED_CHAIN_ID}
    - Wrong Network: ${isWrongNetwork}
    - Banner Dismissed: ${bannerDismissed}
    - Is Switching: ${isSwitching}
    - Wallet Provider: ${walletProvider ? "Available" : "Not Available"}
    `);

    // Show banner logic
    // For Brave browser: Always show if connected and not dismissed (network detection unreliable)
    // For others: Only show if wrong network
    const shouldShowBanner =
      isConnected &&
      !bannerDismissed &&
      !isSwitching &&
      (isBrave || isWrongNetwork);

    if (shouldShowBanner) {
      // For Brave browser, add a slight delay to prevent rapid banner toggling
      if (isBrave) {
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        setShowBanner(true);
      }
    } else {
      setShowBanner(false);
    }

    // Reset banner dismissal when switching to correct network (non-Brave only)
    if (!isWrongNetwork && !isBrave) {
      setBannerDismissed(false);
    }
  }, [
    mounted,
    isConnected,
    wagmiChainId,
    actualWalletChainId,
    effectiveChainId,
    isWrongNetwork,
    bannerDismissed,
    isSwitching,
    walletProvider,
    browserType,
    isBrave,
  ]);

  const handleSwitchNetwork = async () => {
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
      console.error("Failed to switch network:", error);
      toast({
        title: "Switch Failed",
        description: isBrave
          ? "Please manually switch networks in your wallet - Brave has network detection issues"
          : "Please manually switch networks in your wallet",
        variant: "destructive",
      });
    }
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    setShowBanner(false);

    // On Brave browser, store dismissal in sessionStorage to prevent re-showing
    if (isBrave) {
      sessionStorage.setItem("networkBannerDismissed", "true");
    }
  };

  // Check sessionStorage for Brave browser dismissal
  useEffect(() => {
    if (isBrave && mounted) {
      const dismissed = sessionStorage.getItem("networkBannerDismissed");
      if (dismissed === "true") {
        setBannerDismissed(true);
      }
    }
  }, [isBrave, mounted]);

  const getNetworkName = (chainId: number) => {
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
      default:
        return `Chain ${chainId}`;
    }
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      {/* Wrong Network Banner - Right Side */}
      <AnimatePresence>
        {showBanner && isConnected && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed top-20 right-4 z-50 pointer-events-none max-w-sm"
          >
            <Card className="w-full bg-yellow-500/10 border-yellow-500/30 backdrop-blur-md shadow-xl pointer-events-auto">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-yellow-600 mb-1">
                      {isBrave ? "Brave Browser Detected" : "Wrong Network"}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {isBrave ? (
                        <>
                          We can't reliably detect your network on Brave
                          browser. Please ensure you're connected to{" "}
                          <strong>{REQUIRED_NETWORK_NAME}</strong>!
                        </>
                      ) : (
                        <>
                          You're on {getNetworkName(effectiveChainId)}. Switch
                          to {REQUIRED_NETWORK_NAME} to use all features.
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      {isBrave ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleDismissBanner}
                          className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/20 text-xs h-8"
                        >
                          Got it, I'm on Fuji
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleSwitchNetwork}
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
                      )}
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
