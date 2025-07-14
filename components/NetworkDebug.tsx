// components/NetworkDebug.tsx
"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REQUIRED_CHAIN_ID = avalancheFuji.id; // 43113

export function NetworkDebug() {
  const { isConnected, isConnecting, address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isCorrectNetwork = chainId === REQUIRED_CHAIN_ID;

  const handleSwitch = async () => {
    try {
      console.log("🔄 Debug switch to:", REQUIRED_CHAIN_ID);
      await switchChain({ chainId: REQUIRED_CHAIN_ID });
      console.log("✅ Debug switch successful");
    } catch (error) {
      console.error("❌ Debug switch failed:", error);
    }
  };

  return (
    <Card className="fixed top-4 right-4 w-80 z-50 bg-black/90 text-white">
      <CardHeader>
        <CardTitle className="text-sm">Network Debug Panel</CardTitle>
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
          <div>Current Chain: {chainId || "undefined"}</div>
          <div>Required Chain: {REQUIRED_CHAIN_ID}</div>
          <div>Correct Network: {isCorrectNetwork ? "✅" : "❌"}</div>
        </div>

        <div>
          <strong>Switch Status:</strong>
          <div>Switching: {isSwitching ? "🔄" : "❌"}</div>
        </div>

        <div className="flex gap-2">
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
            onClick={() =>
              console.log("Current state:", {
                isConnected,
                chainId,
                REQUIRED_CHAIN_ID,
                isCorrectNetwork,
              })
            }
            variant="outline"
            className="text-xs"
          >
            Log State
          </Button>
        </div>

        {!isCorrectNetwork && isConnected && (
          <div className="p-2 bg-red-500/20 border border-red-500/30 rounded">
            <div className="text-red-400 font-semibold text-xs">
              🚨 WRONG NETWORK DETECTED
            </div>
            <div className="text-xs mt-1">
              Please switch to Avalanche Fuji Testnet
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
