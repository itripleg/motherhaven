// components/WalletConnector.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";

interface Connector {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

interface WalletConnectorProps {
  connectors?: readonly Connector[];
  onConnect: (index: number) => void;
  isLoading: boolean;
  connectingConnectorId?: number | null;
}

// Function to get proper wallet name from connector
function getWalletName(connector: Connector): string {
  return connector.name || connector.id;
}

export function WalletConnector({
  connectors,
  onConnect,
  isLoading,
  connectingConnectorId,
}: WalletConnectorProps) {
  return (
    <Card className="w-full max-w-md mx-auto border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Connect Your Wallet
          <Wallet className="h-5 w-5 text-primary" />
        </CardTitle>
        <CardDescription>
          Choose a wallet to connect to the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {connectors?.map((connector, index) => (
            <div key={connector.id}>
              <Button
                variant="outline"
                size="lg"
                className="w-full h-16 text-lg font-medium border-primary/30 hover:border-primary/50"
                onClick={() => onConnect(index)}
                disabled={isLoading}
              >
                {isLoading && connectingConnectorId === index ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </div>
                ) : (
                  getWalletName(connector)
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Network Info */}
        <div className="mt-4 p-3 bg-secondary border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-primary font-medium">Required Network:</span>
            <span className="text-muted-foreground">
              Avalanche Fuji Testnet
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Please ensure your wallet is connected to the correct network for
            full functionality.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
