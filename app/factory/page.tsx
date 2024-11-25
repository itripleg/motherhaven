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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CreateTokenForm } from "@/app/factory/CreateTokenForm";
import { BuyTokenForm } from "./BuyTokenForm";
import { WithdrawTokenForm } from "./WithdrawTokenForm";
import { SacrificeForm } from "./SacrificeForm";
import AllTokensDisplay from "./AllTokensDisplay";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const isLoading = false;
  // State to check if it's running on the client
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Only set `isClient` to true when we're sure we're on the client side
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
    // Render nothing or a loading state while determining client-side
    return null;
  }
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Token Factory</h1>
      {isConnected ? (
        <>
          <div className="flex justify-between">
            <p className="mb-4">
              Logged in as{" "}
              {address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "N/A"}
            </p>
            <Button onClick={() => disconnect()}>Disconnect</Button>
          </div>
          <AllTokensDisplay />
          <Tabs defaultValue="create" className="mt-8">
            <TabsList>
              <TabsTrigger value="create">Create Token</TabsTrigger>
              <TabsTrigger value="buy">Buy Token</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw Token</TabsTrigger>
              <TabsTrigger value="sacrifice">Sacrifice</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Token</CardTitle>
                  <CardDescription>Deploy a new token contract</CardDescription>
                </CardHeader>
                <CardContent>
                  <CreateTokenForm />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="buy">
              <Card>
                <CardHeader>
                  <CardTitle>Buy Token</CardTitle>
                  <CardDescription>
                    Purchase tokens during ICO phase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BuyTokenForm />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="withdraw">
              <Card>
                <CardHeader>
                  <CardTitle>Withdraw Token</CardTitle>
                  <CardDescription>
                    Withdraw your purchased tokens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WithdrawTokenForm />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="sacrifice">
              <SacrificeForm />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <>
          {connectors.map((connector, index) => (
            <Button
              key={connector.id}
              onClick={() => handleConnect(index)}
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : `Connect with ${connector.name}`}
            </Button>
          ))}
        </>
      )}
    </div>
  );
}
