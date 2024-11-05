"use client";
import { useConnect, useAccount } from "wagmi";
import { injected } from "wagmi/connectors";
import { useState, useEffect } from "react";
<<<<<<< HEAD
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { motion } from "framer-motion";
=======
import { useRouter } from "next/navigation"; // Import useRouter
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { WalletOptions } from "./wallet-options";
>>>>>>> 52897a74d11fd383a4b6861308d9ae4dca563bdb

export default function LandingPage() {
  const { connect } = useConnect();
  const { address, isConnected } = useAccount();
  const [theme, setTheme] = useState("light");
<<<<<<< HEAD
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
=======
  const router = useRouter(); // Initialize useRouter
  const { address, isConnected } = useAccount();
  const { connect, connectors, isLoading } = useConnect();
  const { disconnect } = useDisconnect();
>>>>>>> 52897a74d11fd383a4b6861308d9ae4dca563bdb

  // Handle theme setting
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Function to toggle between light and dark mode
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Function to connect wallet
  const connectWallet = async () => {
<<<<<<< HEAD
    if (!isConnected) {
      setLoading(true); // Start loading when attempting to connect
      await connect({ connector: injected() });
      console.log("Connecting wallet...");
      setWalletConnected(true);
      setTimeout(() => {
        router.push("/casino/lobby"); // Redirect after 2 seconds for effect
      }, 2000);
    }
  };

  // Handle showing loading screen with Framer Motion while redirecting
  if (loading) {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-4xl font-bold">Loading...</h2>
      </motion.div>
    );
  }
=======
    try {
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

  // Redirect to /casino/lobby if connected
  useEffect(() => {
    if (isConnected) {
      router.push("/casino/lobby");
    }
  }, [isConnected, router]);
>>>>>>> 52897a74d11fd383a4b6861308d9ae4dca563bdb

  return (
    <div className="min-h-screen flex flex-col">
      {/* Remove WalletOptions if not needed */}
      {/* <WalletOptions /> */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">The House</h1>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </Button>
      </header>
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">
            Welcome back,
            <span className="">{isConnected ? address : "Guest"}</span>
          </h2>
          <p className="text-xl mb-8">
            {/* Experience the thrill of decentralized gaming */}
            May the odds ever be in your favor.
          </p>
<<<<<<< HEAD
          <Button size="lg" onClick={connectWallet}>
            {isConnected ? "Wallet Connected" : "Connect Wallet"}
          </Button>
=======
          {!isConnected ? (
            <Button size="lg" onClick={connectWallet}>
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <Button size="lg" onClick={disconnect}>
              Disconnect {address?.slice(0, 6)}...{address?.slice(-4)}
            </Button>
          )}
>>>>>>> 52897a74d11fd383a4b6861308d9ae4dca563bdb
        </div>
      </main>
      <footer className="p-4 text-center">
        <p>&copy; 2024 CryptoComfort Casino. All rights reserved.</p>
      </footer>
    </div>
  );
}
