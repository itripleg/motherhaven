"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Search, LayoutGrid, List } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [isGridView, setIsGridView] = useState(true);

  useEffect(() => {
    const fetchTopCoins = async () => {
      try {
        const response = await fetch("/api/moralis/top-coins");
        if (!response.ok) throw new Error("Failed to fetch top coins");
        const data = await response.json();
        setCoins(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCoins();
  }, []);

  const filteredCoins = coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderCoinCard = (coin: Coin) => (
    <Card key={coin.symbol} className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Image
            src={coin.logo}
            alt={`${coin.name} logo`}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div className="flex-grow">
            <h3 className="font-bold">{coin.name}</h3>
            <p className="text-sm text-gray-500">{coin.symbol.toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">
              ${parseFloat(coin.usd_price).toFixed(2)}
            </p>
            <p
              className={`text-sm ${
                parseFloat(coin.usd_price_24hr_percent_change) >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {parseFloat(coin.usd_price_24hr_percent_change).toFixed(2)}%
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <p>Market Cap: ${parseFloat(coin.market_cap_usd).toLocaleString()}</p>
          <p>
            Circulating Supply:{" "}
            {parseFloat(coin.circulating_supply).toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search coins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Toggle
          pressed={isGridView}
          onPressedChange={setIsGridView}
          aria-label="Toggle view"
        >
          {isGridView ? <LayoutGrid size={20} /> : <List size={20} />}
        </Toggle>
      </div>
      {loading ? (
        <div
          className={`grid gap-4 ${
            isGridView
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div
          className={`grid gap-4 ${
            isGridView
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {filteredCoins.map(renderCoinCard)}
        </div>
      )}
    </div>
  );
}
