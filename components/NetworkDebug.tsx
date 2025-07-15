// components/NetworkDebug.tsx
"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

const REQUIRED_CHAIN_ID = avalancheFuji.id; // 43113

export function NetworkDebug() {
  const { isConnected, isConnecting, address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [walletChainId, setWalletChainId] = useState<number | undefined>(
    undefined
  );
  const [lastUpdate, setLastUpdate] = useState<string>("Never");
  const [stateHistory, setStateHistory] = useState<string[]>([]);

  const isCorrectNetwork = chainId === REQUIRED_CHAIN_ID;

  // Monitor wagmi state changes
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    const stateLog = `${timestamp}: Connected=${isConnected}, ChainId=${chainId}, Address=${address?.slice(
      0,
      8
    )}`;

    console.log("📊 Wagmi State Change:", stateLog);
    setLastUpdate(timestamp);

    // Keep last 5 state changes
    setStateHistory((prev) => [stateLog, ...prev.slice(0, 4)]);
  }, [isConnected, chainId, address]);

  // Get wallet chain ID directly
  const getWalletChainId = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        const numericChainId = parseInt(chainId, 16);
        console.log("🔍 Direct wallet chain ID:", numericChainId);
        setWalletChainId(numericChainId);
        return numericChainId;
      } catch (error) {
        console.error("❌ Failed to get wallet chain ID:", error);
        return undefined;
      }
    }
    return undefined;
  };

  // Listen for wallet chain changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleChainChanged = (chainId: string) => {
        const numericChainId = parseInt(chainId, 16);
        const timestamp = new Date().toLocaleTimeString();
        console.log(
          `🔄 ${timestamp}: Wallet chain changed to:`,
          numericChainId
        );
        setWalletChainId(numericChainId);
        setLastUpdate(timestamp);
      };

      window.ethereum.on("chainChanged", handleChainChanged);

      // Get initial wallet chain ID
      if (isConnected) {
        getWalletChainId();
      }

      return () => {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [isConnected]);

  const handleSwitch = async () => {
    try {
      console.log("🔄 Debug switch to:", REQUIRED_CHAIN_ID);
      await switchChain({ chainId: REQUIRED_CHAIN_ID });
      console.log("✅ Debug switch successful");
    } catch (error) {
      console.error("❌ Debug switch failed:", error);
    }
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
      default:
        return `Chain ${chainId}`;
    }
  };

  return (
    <Card className="fixed top-4 right-4 w-96 z-50 bg-black/90 text-white">
      <CardHeader>
        <CardTitle className="text-sm">Enhanced Network Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div>
          <strong>Connection Status:</strong>
          <div>Connected: {isConnected ? "✅" : "❌"}</div>
          <div>Connecting: {isConnecting ? "🔄" : "❌"}</div>
          <div>Address: {address ? `${address.slice(0, 8)}...` : "None"}</div>
        </div>

        <div>
          <strong>Network Status:</strong>
          <div>
            Wagmi Chain:{" "}
            {chainId ? `${chainId} (${getNetworkName(chainId)})` : "undefined"}
          </div>
          <div>
            Wallet Chain:{" "}
            {walletChainId
              ? `${walletChainId} (${getNetworkName(walletChainId)})`
              : "undefined"}
          </div>
          <div>Required: {REQUIRED_CHAIN_ID} (Avalanche Fuji)</div>
          <div>Match: {isCorrectNetwork ? "✅" : "❌"}</div>
          <div>
            Wallet Match: {walletChainId === REQUIRED_CHAIN_ID ? "✅" : "❌"}
          </div>
        </div>

        <div>
          <strong>State Updates:</strong>
          <div>Last Update: {lastUpdate}</div>
          <div>Switching: {isSwitching ? "🔄" : "❌"}</div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleSwitch}
            disabled={isSwitching}
            className="text-xs"
          >
            {isSwitching ? "Switching..." : "Test Switch"}
          </Button>

          <Button
            size="sm"
            onClick={getWalletChainId}
            variant="outline"
            className="text-xs"
          >
            Check Wallet
          </Button>

          <Button
            size="sm"
            onClick={() => {
              console.log("📊 Current state:", {
                isConnected,
                chainId,
                walletChainId,
                REQUIRED_CHAIN_ID,
                isCorrectNetwork,
              });
            }}
            variant="outline"
            className="text-xs"
          >
            Log State
          </Button>
        </div>

        {/* State History */}
        <div>
          <strong>Recent State Changes:</strong>
          <div className="max-h-32 overflow-y-auto space-y-1 mt-1">
            {stateHistory.map((entry, index) => (
              <div key={index} className="text-xs opacity-80 font-mono">
                {entry}
              </div>
            ))}
          </div>
        </div>

        {/* Network Mismatch Warning */}
        {!isCorrectNetwork && isConnected && (
          <div className="p-2 bg-red-500/20 border border-red-500/30 rounded">
            <div className="text-red-400 font-semibold text-xs">
              🚨 WAGMI REPORTS WRONG NETWORK
            </div>
            <div className="text-xs mt-1">Wagmi: {getNetworkName(chainId)}</div>
          </div>
        )}

        {/* Wallet vs Wagmi Mismatch */}
        {walletChainId && chainId && walletChainId !== chainId && (
          <div className="p-2 bg-yellow-500/20 border border-yellow-500/30 rounded">
            <div className="text-yellow-400 font-semibold text-xs">
              ⚠️ WALLET VS WAGMI MISMATCH
            </div>
            <div className="text-xs mt-1">
              Wallet: {getNetworkName(walletChainId)}
              <br />
              Wagmi: {getNetworkName(chainId)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
