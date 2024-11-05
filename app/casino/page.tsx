"use client";
import { useConnect, useAccount } from "wagmi";
import { injected } from "wagmi/connectors";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const { connect } = useConnect();
  const { address, isConnected } = useAccount();
  const [theme, setTheme] = useState("light");
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
          <Button size="lg" onClick={connectWallet}>
            {isConnected ? "Wallet Connected" : "Connect Wallet"}
          </Button>
        </div>
      </main>
      <footer className="p-4 text-center">
        <p>&copy; 2024 CryptoComfort Casino. All rights reserved.</p>
      </footer>
    </div>
  );
}
