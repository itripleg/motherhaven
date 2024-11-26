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
  timestamp: number | Date;
}

export interface Trade {
  timestamp: Date;
  price: number;
}

export default function TokenPage() {
  const pathname = usePathname();
  const tokenAddress = pathname?.split("/").pop() || "";
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

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
          tokenAddress
        );

        const tokenDoc = await getDoc(tokenDocRef);
        if (tokenDoc.exists()) {
          const data = tokenDoc.data() as Omit<TokenData, "id">;
          setTokenData({
            id: tokenDoc.id,
            ...data,
            blockNumber: Number(data.blockNumber || 0),
          });
        } else {
          console.error("Token not found");
        }

        const tradesQuery = query(
          collection(db, "trades"),
          where("tokenAddress", "==", tokenAddress)
        );
        const tradesSnapshot = await getDocs(tradesQuery);
        const tradesData: Trade[] = tradesSnapshot.docs.map((doc) => {
          const { timestamp, pricePaid } = doc.data();
          return {
            timestamp: new Date(timestamp.seconds * 1000),
            price: parseFloat(pricePaid),
          };
        });

        setTrades(tradesData);
      } catch (error) {
        console.error("Error fetching token data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTokenData();
  }, [tokenAddress]);

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
      <div className="flex justify-between items-start">
        <div className="space-y-6 flex-1">
          <Card>
            <div>
              <AddressComponent hash={tokenData.address} type="address" />
            </div>
            <CardHeader>
              <CardTitle>
                {tokenData.name} ({tokenData.symbol})
              </CardTitle>
              <CardDescription>Token Details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label>Total Supply</Label>
                  <p>{tokenData.blockNumber.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Created At</Label>
                  <p>{new Date(tokenData.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
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
          <ChatComponent tokenAddress={tokenAddress} />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
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
  );
}
