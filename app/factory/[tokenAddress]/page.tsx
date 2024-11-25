"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
import { BuyTokenForm } from "../BuyTokenForm";
import { SellTokenForm } from "../SellTokenForm";
import { TokenPriceChart } from "../TokenPriceChart"; // New import for chart

export default function TokenPage() {
  const pathname = usePathname();
  const tokenAddress = pathname?.split("/").pop();

  const [tokenData, setTokenData] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

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
          setTokenData({ id: tokenDoc.id, ...tokenDoc.data() });
        } else {
          console.error("Token not found");
        }

        const tradesQuery = query(
          collection(db, "trades"),
          where("tokenAddress", "==", tokenAddress)
        );
        const tradesSnapshot = await getDocs(tradesQuery);
        const tradesData = tradesSnapshot.docs.map((doc) => {
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

      <Card>
        <CardHeader>
          <CardTitle>Token Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {/* TokenPriceChart component here */}
            <TokenPriceChart trades={trades} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trade Tokens</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
