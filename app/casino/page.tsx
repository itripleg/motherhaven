"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";

export default function LandingPage() {
  const [theme, setTheme] = useState("light");
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const connectWallet = async () => {
    // This is a placeholder for actual web3 wallet connection logic
    console.log("Connecting wallet...");
    setWalletConnected(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">CryptoComfort Casino</h1>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </Button>
      </header>
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">
            Welcome to CryptoComfort Casino
          </h2>
          <p className="text-xl mb-8">
            Experience the thrill of decentralized gaming
          </p>
          <Button size="lg" onClick={connectWallet}>
            {walletConnected ? "Wallet Connected" : "Connect Wallet"}
          </Button>
        </div>
      </main>
      <footer className="p-4 text-center">
        <p>&copy; 2024 CryptoComfort Casino. All rights reserved.</p>
      </footer>
    </div>
  );
}
