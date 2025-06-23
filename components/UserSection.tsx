// src/components/UserSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { FACTORY_ADDRESS } from "@/types";
import { AddressComponent } from "./AddressComponent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  LogOut,
  Wallet,
  ChevronDown,
  Copy,
  ExternalLink,
  Factory,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const UserSection = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Don't render anything until mounted to prevent hydration errors
  if (!mounted) {
    return (
      <div className="flex items-center justify-between w-full p-4">
        <div className="h-6 w-32 bg-muted/20 rounded animate-pulse" />
        <div className="h-9 w-24 bg-muted/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full -mb-24">
      {/* Mobile Layout */}
      <div className="block lg:hidden">
        <Card className="mx-4 my-3 bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm">
          <CardContent className="p-4 space-y-3">
            {/* Factory Address - Always visible on mobile */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Factory className="h-4 w-4" />
                <span className="font-medium">Factory:</span>
              </div>
              <AddressComponent hash={FACTORY_ADDRESS} type="address" />
            </div>

            {/* User Status */}
            {isConnected && address ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Connected
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatAddress(address)}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-1">
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs">
                        {formatAddress(address)}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={copyAddress} className="gap-2">
                        <Copy className="h-3 w-3" />
                        {copied ? "Copied!" : "Copy Address"}
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href={`https://43113.testnet.snowtrace.dev/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gap-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on Explorer
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => disconnect()}
                        className="gap-2 text-red-600 focus:text-red-600"
                      >
                        <LogOut className="h-3 w-3" />
                        Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Not Connected
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Connect to start trading
                    </p>
                  </div>
                </div>
                <ConnectButton size="sm" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex lg:items-center lg:justify-between w-full px-6 py-4">
        {/* Factory Address */}
        <div className="flex items-center gap-3 text-primary">
          <Factory className="h-4 w-4" />
          <span className="text-sm font-medium">Factory Contract:</span>
          <AddressComponent hash={FACTORY_ADDRESS} type="address" />
        </div>

        {/* User Status */}
        <div className="flex items-center gap-4">
          {isConnected && address ? (
            <>
              <div className="text-right">
                <p className="text-sm text-primary font-medium">Connected as</p>
                <p className="text-xs text-muted-foreground">
                  {formatAddress(address)}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                    <span className="hidden sm:inline">
                      {formatAddress(address)}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-mono text-xs">
                    {address}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={copyAddress} className="gap-2">
                    <Copy className="h-4 w-4" />
                    {copied ? "Copied!" : "Copy Address"}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href={`https://43113.testnet.snowtrace.dev/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Snowtrace
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => disconnect()}
                    className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Connect wallet to start trading
              </span>
              <ConnectButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
