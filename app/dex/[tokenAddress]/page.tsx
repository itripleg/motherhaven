"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect, useBlockNumber } from "wagmi";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { AddressComponent } from "@/components/AddressComponent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { BuyTokenForm } from "../components/BuyTokenForm";
import { SellTokenForm } from "../components/SellTokenForm";
import { ChatComponent } from "../components/ChatComponent";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import Chart from "@/app/dex/components/chart";
import useTokenDetails from "@/hooks/useTokenDetails";

export interface TokenData {
  id: string;
  name: string;
  symbol: string;
  address: string;
  description?: string;
  creationTimestamp?: Timestamp;
  creationBlock?: number;
  imageUrl?: string;
  marketCap?: number;
  currentPrice?: number;
  creator?: string;
  transactionHash: string;
}

export default function Page() {
  const pathname = usePathname();
  const tokenAddress = pathname?.split("/").pop() || "";
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: blockNumber } = useBlockNumber();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avaxAmount, setAvaxAmount] = useState("");

  // Get token details from our hook
  const { price, collateral, tokenState, isLoading, receiveAmount } =
    useTokenDetails(tokenData?.address as `0x${string}`);

  // hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!tokenAddress) {
      setLoading(false);
      return;
    }
    async function fetchTokenData() {
      try {
        const tokenDocRef = doc(db, "tokens", tokenAddress);
        const tokenDoc = await getDoc(tokenDocRef);

        if (tokenDoc.exists()) {
          const data = tokenDoc.data();
          setTokenData({
            id: tokenDoc.id,
            name: data.name,
            symbol: data.symbol,
            address: data.address,
            description: data.description || undefined,
            creationTimestamp: data.timestamp,
            imageUrl: data.imageUrl || undefined,
            creator: data.creator,
            creationBlock: data.creationBlock,
            transactionHash: data.transactionHash,
          });
        } else {
          console.error("Token not found");
        }
      } catch (error) {
        console.error("Error fetching token data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTokenData();
  }, [tokenAddress]);

  if (!mounted) return null;
  if (loading || isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading token details...
      </div>
    );
  if (!tokenData)
    return (
      <div className="flex justify-center items-center h-screen">
        Token or Pair Not Found. We can&apos;t seem to find the token
        you&apos;re looking for.
      </div>
    );

  const getTokenStateText = (state: number | undefined) => {
    switch (state) {
      case 0:
        return "Not Created";
      case 1:
        return "Platform Trading";
      case 2:
        return "Goal Reached";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="container mx-auto p-4 space-y-6 pt-20">
        <div className="flex justify-between items-start">
          <div className="space-y-6 flex-1">
            <Card className="relative overflow-hidden">
              <div
                className="absolute inset-0 z-0"
                style={{
                  backgroundImage: tokenData.imageUrl
                    ? `url(${tokenData.imageUrl})`
                    : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
              </div>

              <div className="relative z-10">
                <div className="p-4">
                  <AddressComponent hash={tokenData.address} type="address" />
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-3xl font-bold">
                    {tokenData.name} ({tokenData.symbol})
                  </CardTitle>
                  <CardDescription className="text-gray-200 text-lg">
                    <p className="text-white text-lg font-semibold">
                      {getTokenStateText(tokenState)}
                    </p>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                        <Label className="text-gray-200">Current Price</Label>
                        <p className="text-white text-lg font-semibold">
                          {price} <span className="text-xs">AVAX</span>
                        </p>
                      </div>
                      {/* <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                        <Label className="text-gray-200">
                          Total Collateral
                        </Label>
                        <p className="text-white text-lg font-semibold">
                          {collateral} AVAX
                        </p>
                      </div> */}
                    </div>
                  </div>
                  {tokenData.description && (
                    <div className="mt-6 backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                      <Label className="text-gray-200">Description</Label>
                      <p className="text-white mt-2">{tokenData.description}</p>
                    </div>
                  )}
                </CardContent>
              </div>

              {!tokenData.imageUrl && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
              )}
            </Card>

            <Card className="h-[400px] p-2">
              <Chart />
            </Card>

            <Card>
              <AddressComponent hash={tokenData.address} type="address" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CardHeader className="md:col-span-2 md:col-start-2 text-center">
                  <CardTitle>
                    Trade {tokenData.symbol} ({tokenData.name})
                  </CardTitle>
                </CardHeader>
                <div className="h-20 hidden text-center justify-center md:flex items-center mr-4">
                  {/* Recieved amount from useTokenDetails via receiveAmount */}
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
                      <p className="mb-4">
                        Connect your wallet to trade tokens
                      </p>
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
          </div>

          <div className="hidden lg:block ml-6">
            <ChatComponent
              tokenAddress={tokenAddress}
              creatorAddress={tokenData.creator}
            />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className="fixed bottom-4 right-4 lg:hidden"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <ChatComponent tokenAddress={tokenAddress} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
