// app/dex/components/trading/TradingInterface.tsx
"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { BuyTokenFormOptimized } from "./BuyTokenFormOptimized";
import { SellTokenFormOptimized } from "./SellTokenFormOptimized";
import { Token } from "@/types";

interface TradingInterfaceProps {
  token: Token;
}

export function TradingInterface({ token }: TradingInterfaceProps) {
  const [activeTab, setActiveTab] = useState("buy");

  return (
    <div className="space-y-6">
      {/* Trading Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary/30">
          <TabsTrigger
            value="buy"
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 transition-all duration-200"
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Buy
          </TabsTrigger>
          <TabsTrigger
            value="sell"
            className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 transition-all duration-200"
          >
            <ArrowDownLeft className="h-4 w-4 mr-2" />
            Sell
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="mt-0 space-y-4">
          <BuyTokenFormOptimized />
        </TabsContent>

        <TabsContent value="sell" className="mt-0 space-y-4">
          <SellTokenFormOptimized />
        </TabsContent>
      </Tabs>
    </div>
  );
}
