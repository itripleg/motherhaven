// src/components/UserSection.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { FACTORY_ADDRESS } from "@/types";
import { AddressComponent } from "./AddressComponent";

export const UserSection = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration errors
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center w-full gap-2 justify-between z-40">
      <div className="flex justify-center items-center text-primary z-40">
        Factory Contract :
        <AddressComponent hash={FACTORY_ADDRESS} type={"address"} />
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-primary">
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
    </div>
  );
};
