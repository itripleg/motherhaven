"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card"; // Assuming you're using shadcn's Card component for styling
import Image from "next/image"; // To properly render images

type Coin = {
  symbol: string;
  name: string;
  logo: string;
  circulating_supply: string;
  total_supply: string;
  market_cap_usd: string;
  usd_price: string;
  usd_price_24hr_change: string;
  usd_price_24hr_percent_change: string;
};

export default function TopCoins() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch top coins on component mount
  useEffect(() => {
    const fetchTopCoins = async () => {
      try {
        const response = await fetch("/api/moralis/top-coins"); // Adjust the endpoint to your Next.js API route
        if (!response.ok) throw new Error("Failed to fetch top coins");
        const data = await response.json();
        setCoins(data); // Assuming data is the array of objects you provided
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCoins();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {coins.map((coin) => (
        <Card key={coin.name}>
          <CardContent>
            <div className="flex items-center space-x-4">
              {/* Display the coin logo */}
              <Image
                src={coin.logo}
                alt={`${coin.name} logo`}
                width={50}
                height={50}
                className="rounded-full"
              />
              <div>
                <CardTitle>
                  {coin.name} ({coin.symbol.toUpperCase()})
                </CardTitle>
                <p>Price: ${parseFloat(coin.usd_price).toFixed(4)}</p>
                <p>
                  Market Cap: $
                  {parseFloat(coin.market_cap_usd).toLocaleString()}
                </p>
                <p>
                  24h Change:{" "}
                  {parseFloat(coin.usd_price_24hr_percent_change).toFixed(2)}%
                </p>
                <p>
                  Circulating Supply:{" "}
                  {parseFloat(coin.circulating_supply).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
