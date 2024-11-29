// pages/AllTokensDisplay.tsx
"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/craft";
import {
  collection,
  query,
  limit,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase";
import { SpaceBackground } from "./scene/SpaceScene";
import { TokenSearch } from "./tokens/TokenSearch";
import { TokenTabs } from "./tokens/TokenTabs";
import { TokenGrid } from "./tokens/TokenGrid";
import { Token } from "@/types";

export default function AllTokensDisplay() {
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

    return () => unsubscribe();
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

  const filterTokensByCategory = (category: string) => {
    setActiveCategory(category);
    if (category === "all") {
      setFilteredTokens(tokens);
    } else {
      const filtered = tokens.filter((token) => {
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
    <Container className="">
      <SpaceBackground />
      <div className="container mx-auto py-8 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="z-30">
            <h1 className="text-4xl font-bold mb-8 text-center">
              Random quote here!!!
            </h1>
          </div>
        </div>

        <TokenSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setActiveCategory={setActiveCategory}
        />

        <TokenTabs onCategoryChange={filterTokensByCategory} />

        <TokenGrid tokens={filteredTokens} />
      </div>
    </Container>
  );
}
