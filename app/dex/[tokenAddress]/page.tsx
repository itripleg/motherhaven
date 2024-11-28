"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import {
  doc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
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
import { TokenPriceChart } from "../components/TokenPriceChart";
import { ChatComponent } from "../components/ChatComponent";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { EventWatcher } from "../components/EventWatcher";
import { DocumentReference, DocumentData } from "firebase/firestore";
import Chart from "@/components/chart";

export interface TokenData {
  id: string;
  address: string;
  name: string;
  symbol: string;
  blockNumber: number;
  timestamp: string; // Changed to string since that's how it's stored
  imageUrl?: string;
  description?: string;
  createdAt: string; // Added as required string
  transactionHash: string; // Added as required string
  marketCap?: number; // Keeping optional fields that might be added later
  currentPrice?: number;
  creator?: string;
}

export interface Trade {
  timestamp: Date;
  price: number;
}

export default function Page() {
  // Changed from TokenPage to Page
  const pathname = usePathname();
  const tokenAddress = pathname?.split("/").pop() || "";
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false); // Add this for hydration fix

  // Add this for hydration fix
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
        const tokenDocRef: DocumentReference<DocumentData> = doc(
          db,
          "tokens",
          tokenAddress.toLowerCase() // Ensure consistent case
        );

        const tokenDoc = await getDoc(tokenDocRef);
        if (tokenDoc.exists()) {
          const data = tokenDoc.data();
          setTokenData({
            id: tokenDoc.id,
            address: data.address,
            name: data.name,
            symbol: data.symbol,
            blockNumber: data.blockNumber,
            timestamp: data.timestamp,
            imageUrl: data.imageUrl || undefined,
            description: data.description || undefined,
            createdAt: data.createdAt,
            transactionHash: data.transactionHash,
          });
        } else {
          console.error("Token not found");
        }

        // Rest of your trades fetching code...
      } catch (error) {
        console.error("Error fetching token data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTokenData();
  }, [tokenAddress]);

  // Add this for hydration fix
  if (!mounted) return null;

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading token details...
      </div>
    );
  if (!tokenData)
    return (
      <div className="flex justify-center items-center h-screen">
        Token not found or invalid address.
      </div>
    );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="container mx-auto p-4 space-y-6 pt-20">
        <div className="flex justify-between items-start">
          <div className="space-y-6 flex-1">
            <Card className="relative overflow-hidden">
              {/* Background Image Layer */}
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
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
              </div>

              {/* Content Layer */}
              <div className="relative z-10">
                <div className="p-4">
                  <AddressComponent hash={tokenData.address} type="address" />
                </div>
                <CardHeader>
                  <CardTitle className="text-white text-3xl font-bold">
                    {tokenData.name} ({tokenData.symbol})
                  </CardTitle>
                  <CardDescription className="text-gray-200 text-lg">
                    Token Details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                        <Label className="text-gray-200">Total Supply</Label>
                        <p className="text-white text-lg font-semibold">
                          {tokenData.blockNumber.toLocaleString()}
                        </p>
                      </div>
                      <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                        <Label className="text-gray-200">Created At</Label>
                        <p className="text-white text-lg font-semibold">
                          {new Date(tokenData.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                        <Label className="text-gray-200">Market Cap</Label>
                        <p className="text-white text-lg font-semibold">
                          ${tokenData.marketCap?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                      <div className="backdrop-blur-sm bg-white/10 p-4 rounded-lg">
                        <Label className="text-gray-200">Current Price</Label>
                        <p className="text-white text-lg font-semibold">
                          ${tokenData.currentPrice?.toFixed(4) || "N/A"}
                        </p>
                      </div>
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

              {/* Fallback background if no image */}
              {!tokenData.imageUrl && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
              )}
            </Card>
            <Card className="h-[400px] p-2">
              {/* <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64"> */}
              {/* <TokenPriceChart trades={trades} /> */}
              <Chart />
              {/* </div> */}
              {/* </CardContent> */}
            </Card>

            <Card>
              <AddressComponent hash={tokenData.address} type={"address"} />
              <CardHeader>
                <CardTitle>
                  Trade {tokenData.symbol} ({tokenData.name})
                </CardTitle>
              </CardHeader>
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
            </Card>
          </div>

          <div className="hidden lg:block ml-6">
            <ChatComponent
              tokenAddress={tokenAddress}
              creatorAddress={tokenData?.creator} // Pass the creator's address
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
