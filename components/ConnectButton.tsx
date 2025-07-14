// components/ConnectButton.tsx
"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
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

export function ConnectButton({
  size = "default",
  variant = "default",
  className = "",
}: ConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors, error, isError } = useConnect();
  const { disconnect } = useDisconnect();

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
    }
  }, [isConnected, address]);

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
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </span>
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
          Choose a wallet to connect to this application
        </SheetDescription>
        <WalletConnector
          connectors={connectors}
          onConnect={handleConnect}
          isLoading={isConnecting}
        />
      </SheetContent>
    </Sheet>
  );
}
