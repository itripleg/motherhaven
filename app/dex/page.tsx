"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { WalletConnector } from "@/components/WalletConnector";
import { Factory } from "./Factory";
// import { TokenCard } from "./components/AllTokensDisplay";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleConnect = async (connectorId: number) => {
    try {
      const connector = connectors[connectorId];
      await connect({ connector });
      toast({
        title: "Connected",
        description: "Successfully connected to wallet",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to wallet",
        variant: "destructive",
      });
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Token Factory</h1>
      {/* <TokenCard token={undefined} /> */}
      {isConnected ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <p>
              Logged in as{" "}
              {address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "N/A"}
            </p>
            <Button onClick={() => disconnect()}>Disconnect</Button>
          </div>
          <Factory />
        </>
      ) : (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Choose a wallet to connect to this app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnector
              connectors={connectors}
              onConnect={handleConnect}
              isLoading={false}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
