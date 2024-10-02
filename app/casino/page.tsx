"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { metaMask } from "@wagmi/connectors";

export default function LandingPage() {
  const [theme, setTheme] = useState("light");
  const { address, isConnected } = useAccount();

  // Use useConnect hook and pass the MetaMask connector
  const { connect, connectors, isLoading } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const connectWallet = async () => {
    try {
      // Use the MetaMask connector to connect
      const metamaskConnector = connectors.find((c) => c.id === "metaMask");
      if (metamaskConnector) {
        await connect({ connector: metamaskConnector });
      } else {
        console.error("MetaMask connector not found");
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
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
          {!isConnected ? (
            <Button size="lg" onClick={connectWallet}>
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <Button size="lg" onClick={disconnect}>
              Disconnect {address?.slice(0, 6)}...{address?.slice(-4)}
            </Button>
          )}
        </div>
      </main>
      <footer className="p-4 text-center">
        <p>&copy; 2024 CryptoComfort Casino. All rights reserved.</p>
      </footer>
    </div>
  );
}
