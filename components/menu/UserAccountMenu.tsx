// components/menu/UserAccountMenu.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Wallet,
  Copy,
  ExternalLink,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { userMenuItems } from "./menuData";
import { formatAddress, isActiveRoute } from "./menuUtils";
import { Icon } from "./IconHelper";
import { cn } from "@/lib/utils";

interface UserAccountMenuProps {
  isDesktop?: boolean;
  pathname: string;
}

export function UserAccountMenu({
  isDesktop = false,
  pathname,
}: UserAccountMenuProps) {
  const [copied, setCopied] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const ConnectedContent = () => (
    <>
      <div className="flex items-center gap-3 px-3 py-2 opacity-100">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="font-medium">Connected</div>
          <div className="text-xs text-muted-foreground font-mono">
            {formatAddress(address!)}
          </div>
        </div>
      </div>
      <div
        className={cn(
          "border-t",
          isDesktop ? "border-border/50" : "border-border"
        )}
      />

      {userMenuItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 w-full",
            "transition-colors duration-200",
            isActiveRoute(item.href, pathname)
              ? "bg-primary/10 text-primary"
              : "hover:bg-accent"
          )}
        >
          <Icon name={item.iconName} />
          <div className="flex-1">
            <div className="font-medium">{item.label}</div>
            {item.description && (
              <div className="text-xs text-muted-foreground">
                {item.description}
              </div>
            )}
          </div>
        </Link>
      ))}

      <div
        className={cn(
          "border-t",
          isDesktop ? "border-border/50" : "border-border"
        )}
      />

      <div
        onClick={copyAddress}
        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent rounded-lg"
      >
        <Copy className="h-4 w-4" />
        <span>{copied ? "Copied!" : "Copy Address"}</span>
      </div>

      <div
        onClick={() =>
          window.open(
            `https://43113.testnet.snowtrace.dev/address/${address}`,
            "_blank"
          )
        }
        className="flex items-center gap-3 w-full cursor-pointer px-3 py-2 hover:bg-accent rounded-lg"
      >
        <ExternalLink className="h-4 w-4" />
        View on Explorer
      </div>

      <div
        className={cn(
          "border-t",
          isDesktop ? "border-border/50" : "border-border"
        )}
      />

      <div
        onClick={() => disconnect()}
        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
      >
        <LogOut className="h-4 w-4" />
        Disconnect
      </div>
    </>
  );

  const DisconnectedContent = () => (
    <div className="p-3">
      <div className="text-center mb-3">
        <div className="text-sm font-medium mb-1">Connect Your Wallet</div>
        <div className="text-xs text-muted-foreground">
          Access your dashboard and portfolio
        </div>
      </div>
      <ConnectButton className="w-full" />
    </div>
  );

  // For mobile, return just the content
  if (!isDesktop) {
    return isConnected ? <ConnectedContent /> : <DisconnectedContent />;
  }

  // For desktop, return the trigger button content
  return (
    <>
      {isConnected ? (
        <>
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-3 w-3 text-primary" />
          </div>
          <span className="hidden lg:inline text-sm">
            {formatAddress(address!)}
          </span>
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4" />
          <span className="hidden lg:inline text-sm">Connect</span>
        </>
      )}
    </>
  );
}
