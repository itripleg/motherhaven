"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { isAddress } from "viem";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { TokenFactoryListener } from "./TokenFactoryListener";

export default function FactoryDefaultPage() {
  const router = useRouter();
  const [inputAddress, setInputAddress] = useState("");
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    async function fetchTokens() {
      try {
        const querySnapshot = await getDocs(collection(db, "tokens"));
        const tokensData = querySnapshot.docs.map((doc) => ({
          id: doc.id, // Token address
          ...doc.data(),
        }));
        setTokens(tokensData);
      } catch (error) {
        console.error("Error fetching tokens: ", error);
      }
    }
    fetchTokens();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (isAddress(inputAddress)) {
      router.push(`/factory/${inputAddress}`);
    } else {
      alert("Please enter a valid token address");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to the Token Factory</h1>
      <p>
        Select a token to view its details or enter a token address in the URL.
      </p>
      <div className="mt-8">
        {/* Search Bar */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-4"
        >
          <input
            type="text"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            placeholder="Enter token address"
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-md"
          >
            Search
          </motion.button>
        </motion.form>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">NewTokens</h2>
          <TokenFactoryListener />
          <h2 className="text-xl font-semibold mb-4">Trending Tokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tokens.map((token) => (
              <Card key={token.id} className="p-4">
                <h3 className="text-lg font-bold">
                  {token.name} ({token.ticker})
                </h3>
                <p>
                  <strong>Token Address:</strong> {token.id}
                </p>
                <p>
                  <strong>Transaction Hash:</strong> {token.creator}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(`/factory/${token.id}`)}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md"
                >
                  View Token
                </motion.button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
