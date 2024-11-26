"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { isAddress } from "viem";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  query,
  limit,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Container } from "@/components/craft";

interface Token {
  id: string;
  name: string;
  symbol: string;
  address: string;
  currentPrice: number;
  createdAt: Date;
}

const TokenCard = ({ token }: { token: Token }) => {
  const router = useRouter();

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{token.name}</CardTitle>
          <CardDescription>Ticker: {token.symbol}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <Badge variant="secondary">{token.symbol}</Badge>
            <span className="text-sm text-muted-foreground">
              ${token.currentPrice?.toFixed(2) || "N/A"}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Address:{" "}
            {token.address
              ? `${token.address.slice(0, 6)}...${token.address.slice(-4)}`
              : "N/A"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {/* Created: {token.createdAt.toLocaleDateString()} */}
          </p>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => router.push(`/factory/${token.address}`)}
          >
            View Token
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default function AllTokensDisplay() {
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const tokensQuery = query(
      collection(db, "tokens"),
      orderBy("timestamp", "desc"),
      limit(25)
    );

    const unsubscribe = onSnapshot(tokensQuery, (snapshot) => {
      const updatedTokens = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Token[];
      setTokens(updatedTokens);
    });

    return () => unsubscribe(); // Clean up the listener on unmount
  }, []);

  useEffect(() => {
    const filtered = tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTokens(filtered);
  }, [searchQuery, tokens]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddress(searchQuery)) {
      router.push(`/factory/${searchQuery}`);
    } else {
      // The filtering is already done in the useEffect above
      setActiveCategory("all");
    }
  };

  const filterTokensByCategory = (category: string) => {
    setActiveCategory(category);
    if (category === "all") {
      setFilteredTokens(tokens);
    } else {
      const filtered = tokens.filter((token) => {
        // You might want to adjust this logic based on your actual token categories
        if (category === "high") return token.currentPrice >= 100;
        if (category === "medium")
          return token.currentPrice >= 10 && token.currentPrice < 100;
        if (category === "low") return token.currentPrice < 10;
        return true;
      });
      setFilteredTokens(filtered);
    }
  };

  return (
    <Container>
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Newest Tokens</h1>

        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-4 mb-8"
        >
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, symbol, or address"
            className="flex-grow"
          />
          <Button type="submit">Search</Button>
        </motion.form>

        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="all"
              onClick={() => filterTokensByCategory("all")}
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="high"
              onClick={() => filterTokensByCategory("high")}
            >
              High Value
            </TabsTrigger>
            <TabsTrigger
              value="medium"
              onClick={() => filterTokensByCategory("medium")}
            >
              Medium Value
            </TabsTrigger>
            <TabsTrigger
              value="low"
              onClick={() => filterTokensByCategory("low")}
            >
              Low Value
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {filteredTokens.map((token) => (
            <TokenCard key={token.id} token={token} />
          ))}
        </motion.div>
      </div>
    </Container>
  );
}
