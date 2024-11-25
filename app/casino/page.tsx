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

  // Ensure component only renders on the client side
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

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

  // Avoid rendering until the component has mounted on the client side
  if (!hasMounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* <header className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">The House</h1>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </Button>
      </header> */}
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">
            Welcome back,
            <span className="">
              {isConnected
                ? `0x${address?.substring(2, 5)}...${address?.slice(-3)}`
                : "Guest"}
            </span>
          </h2>
          <p className="text-xl mb-8">May the odds ever be in your favor.</p>
          {isConnected ? (
            <Button size="lg" onClick={() => router.push("/casino/lobby")}>
              Go to Lobby
            </Button>
          ) : (
            <Button size="lg" onClick={connectWallet}>
              Connect Wallet
            </Button>
          )}
        </div>
      </main>
      <footer className="p-4 text-center">
        <p>&copy; 2024 Motherhaven. All rights reserved.</p>
      </footer>
    </div>
  );
}
