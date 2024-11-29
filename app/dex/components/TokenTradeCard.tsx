import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AddressComponent } from "@/components/AddressComponent";
import { BuyTokenForm } from "./BuyTokenForm";
import { SellTokenForm } from "./SellTokenForm";
import { TokenData } from "@/types";
import { useConnect } from "wagmi";

interface TokenTradeCardProps {
  tokenData: TokenData;
  isConnected: boolean;
}

export function TokenTradeCard({
  tokenData,
  isConnected,
}: TokenTradeCardProps) {
  const { connect, connectors } = useConnect();

  return (
    <Card>
      <AddressComponent hash={tokenData.address} type="address" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardHeader className="md:col-span-2 md:col-start-2 text-center">
          <CardTitle>
            Trade {tokenData.symbol} ({tokenData.name})
          </CardTitle>
        </CardHeader>
        <div className="h-20 hidden text-center justify-center md:flex items-center mr-4">
          Token Estimation coming soon!
        </div>
        <CardContent>
          {isConnected ? (
            <Tabs defaultValue="buy">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell">Sell</TabsTrigger>
              </TabsList>
              <TabsContent value="buy">
                <BuyTokenForm />
              </TabsContent>
              <TabsContent value="sell">
                <SellTokenForm />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center">
              <p className="mb-4">Connect your wallet to trade tokens</p>
              {connectors.map((connector) => (
                <Button
                  key={connector.id}
                  onClick={() => connect({ connector })}
                  className="mx-2"
                >
                  Connect {connector.name}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
