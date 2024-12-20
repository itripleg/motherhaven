"use client";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { address, addresses, connector, status, isConnected } = useAccount();
  const chainId = useChainId();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Loading screen logic based on connection status
  useEffect(() => {
    if (isConnected) {
      setTimeout(() => setLoading(false), 2000); // Simulate loading
    } else {
      setLoading(false);
    }
  }, [isConnected]);

  if (loading) {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-4xl font-bold">Loading your dashboard...</h2>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-6">User Dashboard</h1>

      {isConnected ? (
        <div className="w-full max-w-lg p-6 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Wallet Information</h2>
          <p className="text-sm mb-2">
            <strong>Status:</strong>{" "}
            {status === "connected" ? "Connected" : status}
          </p>
          <p className="text-sm mb-2">
            <strong>Connected Address:</strong> {address}
          </p>
          {addresses && addresses.length > 1 && (
            <p className="text-sm mb-2">
              <strong>All Addresses:</strong> {addresses.join(", ")}
            </p>
          )}
          <p className="text-sm mb-2">
            <strong>Network:</strong> Chain ID {chainId}
          </p>
          {connector && (
            <p className="text-sm mb-2">
              <strong>Connector:</strong> {connector.name}
            </p>
          )}

          <Button onClick={() => router.push("/casino/lobby")}>
            Go to Casino Lobby
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-lg p-6 bg-gray-800 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold mb-4">Not Connected</h2>
          <p className="text-sm mb-4">
            Please connect your wallet to view your dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
