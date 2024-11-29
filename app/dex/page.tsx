"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AllTokensDisplay from "./components/AllTokensDisplay";
import { ConnectButton } from "@/components/ConnectButton";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const UserSection = () => (
    <div className="flex items-center w-full gap-2 justify-between z-40">
      <span className="text-sm text-muted-foreground">
        Logged in as{" "}
        {isConnected
          ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
          : "Guest"}
      </span>
      {isConnected ? (
        <Button size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      ) : (
        <ConnectButton />
      )}
    </div>
  );

  return (
    <div className="container mx-auto pt-20 p-4">
      <div className="flex justify-between items-center mb-4">
        {/* Logged in user information and connect/disconnect button */}
        <UserSection />
      </div>
      <AllTokensDisplay />
    </div>
  );
}
