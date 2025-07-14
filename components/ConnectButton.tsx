// components/ConnectButton.tsx
"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { type Address } from "viem";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { WalletConnector } from "./WalletConnector";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface ConnectButtonProps {
  size?: "default" | "sm" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
}

const REQUIRED_CHAIN_ID = avalancheFuji.id; // 43113
const REQUIRED_NETWORK_NAME = "Avalanche Fuji Testnet";

export function ConnectButton({
  size = "default",
  variant = "default",
  className = "",
}: ConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, error, isError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Handle connection success
  useEffect(() => {
    if (isConnected && address) {
      toast({
        title: "Connected",
        description: `Wallet ${address?.slice(0, 6)}...${address?.slice(
          -4
        )} connected successfully`,
        duration: 3000,
      });
      setSheetOpen(false);
      setIsConnecting(false);

      // Log network status for debugging
      console.log(
        "Connected to chain:",
        chainId,
        "Required:",
        REQUIRED_CHAIN_ID
      );

      if (chainId !== REQUIRED_CHAIN_ID) {
        toast({
          title: "Network Check",
          description: `Please switch to ${REQUIRED_NETWORK_NAME} to use all features`,
          variant: "destructive",
          duration: 5000,
        });
      }
    }
  }, [isConnected, address, chainId]);

  // Handle connection errors
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
        duration: 5000,
      });
      setIsConnecting(false);
    }
  }, [isError, error]);

  const handleNetworkSwitch = async () => {
    try {
      toast({
        title: "Switching Network...",
        description: `Switching to ${REQUIRED_NETWORK_NAME}`,
      });

      await switchChain({ chainId: REQUIRED_CHAIN_ID });

      toast({
        title: "Network Switched",
        description: `Successfully connected to ${REQUIRED_NETWORK_NAME}`,
      });
    } catch (error) {
      console.error("Failed to switch network:", error);

      toast({
        title: "Network Switch Failed",
        description: `Please manually switch to ${REQUIRED_NETWORK_NAME} in your wallet`,
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  const handleConnect = async (connectorId: number) => {
    setIsConnecting(true);
    try {
      const connector = connectors[connectorId];
      toast({
        title: "Connecting...",
        description: `Please approve connection to ${connector.name}`,
        duration: 2000,
      });
      await connect({ connector });
    } catch (error) {
      console.error("Connection error:", error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully",
      duration: 3000,
    });
  };

  if (isConnected && address) {
    const isCorrectNetwork = chainId === REQUIRED_CHAIN_ID;

    return (
      <div className="flex items-center gap-2">
        {/* Network status indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isCorrectNetwork ? "bg-green-500" : "bg-yellow-500"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {`${address.slice(0, 6)}...${address.slice(-4)}`}
          </span>
        </div>

        {/* Show network switch button if on wrong network */}
        {!isCorrectNetwork && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNetworkSwitch}
            className="text-yellow-600 border-yellow-600/30 hover:bg-yellow-600/10 text-xs"
          >
            Switch Network
          </Button>
        )}

        <Button
          variant={variant}
          size={size}
          onClick={handleDisconnect}
          className={className}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isConnecting}
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </SheetTrigger>
      <SheetContent className="z-[120]">
        <SheetTitle className="sr-only">Connect Wallet</SheetTitle>
        <SheetDescription className="sr-only">
          Choose a wallet to connect to this application. Please ensure you're
          on {REQUIRED_NETWORK_NAME}.
        </SheetDescription>
        <div className="space-y-4">
          <WalletConnector
            connectors={connectors}
            onConnect={handleConnect}
            isLoading={isConnecting}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
