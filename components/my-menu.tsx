"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./mode-toggle";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeftRight,
  Droplets,
  BarChart3,
  Factory,
  Map,
  Sparkles,
  ChevronDown,
  Home,
  User,
  Wallet,
  LogOut,
  Copy,
  ExternalLink,
  Settings,
  TrendingUp,
  Bot,
  House,
  GamepadIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { FACTORY_ADDRESS } from "@/types";
import { AddressComponent } from "@/components/AddressComponent";

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

const navItems: NavItem[] = [
  {
    href: "/dex",
    label: "DEX",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    description: "Trade tokens",
  },
  {
    href: "/bots",
    label: "TVBs",
    icon: <Bot className="h-4 w-4" />,
    description: "Transparent Volume Bots",
  },
  {
    href: "/game",
    label: "Battle",
    icon: <GamepadIcon className="h-4 w-4" />,
    description: "BigBrain Battle Arena",
  },
  {
    href: "/faucet",
    label: "Faucet",
    icon: <Droplets className="h-4 w-4" />,
    description: "Get test tokens",
  },
  {
    href: "/dex/factory",
    label: "Token Factory",
    icon: <Factory className="h-4 w-4" />,
    description: "Create tokens",
  },
  {
    href: "/roadmap",
    label: "Road to Riches",
    icon: <Map className="h-4 w-4" />,
    description: "Our roadmap",
  },
];

const userMenuItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <BarChart3 className="h-4 w-4" />,
    description: "Portfolio overview",
  },
];

export default function MyMenu() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // User account hooks
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on home page
  if (pathname === "/") {
    return null;
  }

  // Don't render until mounted to prevent hydration errors
  if (!mounted) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="h-12 w-80 bg-background/80 rounded-xl border animate-pulse" />
      </div>
    );
  }

  const isActiveRoute = (href: string) => {
    // Exact match for most routes
    if (pathname === href) {
      return true;
    }

    // DEX matches /dex exactly and dynamic token pages
    if (href === "/dex") {
      return (
        pathname === "/dex" ||
        (pathname.startsWith("/dex/") &&
          !pathname.startsWith("/dex/factory") &&
          pathname.split("/").length === 3)
      ); // /dex/[tokenAddress]
    }

    return false;
  };

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

  const getCurrentNavItem = () => {
    const baseItem = navItems.find((item) => isActiveRoute(item.href));

    // If on a token page, show DEX with token info
    if (
      pathname.startsWith("/dex/") &&
      !pathname.startsWith("/dex/factory") &&
      pathname.split("/").length === 3
    ) {
      return {
        ...baseItem,
        label: "DEX • Token Page",
        icon: <ArrowLeftRight className="h-4 w-4" />,
        description: "Trading pair",
      };
    }

    return (
      baseItem || {
        label: "Navigate",
        icon: <Home className="h-4 w-4" />,
        href: "#",
      }
    );
  };

  return (
    <>
      {/* Desktop Floating Menu */}
      <div className="hidden md:block fixed top-4 left-1/2 transform -translate-x-1/2 z-50 opacity-80">
        <Menubar
          className={cn(
            "bg-background/90 backdrop-blur-md border border-border/50 shadow-lg",
            "rounded-2xl px-2 py-1 min-h-12 w-fit",
            "transition-all duration-300 hover:shadow-xl hover:bg-background/95"
          )}
        >
          {/* Brand */}
          <MenubarMenu>
            <MenubarTrigger
              className={cn(
                "uppercase tracking-wider font-bold text-primary",
                "hover:bg-primary/10 data-[state=open]:bg-primary/10",
                "rounded-xl px-4 py-2 transition-all duration-200"
              )}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Motherhaven
            </MenubarTrigger>
            <MenubarContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-md shadow-xl z-[110]">
              {/* Factory Address */}
              <MenubarItem>
                <Link
                  href="/dex/factory"
                  className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-accent w-full"
                >
                  <Factory className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <div className="text-xs">
                      <AddressComponent hash={FACTORY_ADDRESS} type="address" />
                    </div>
                  </div>
                </Link>
              </MenubarItem>
              <MenubarSeparator />

              {navItems.map((item) => (
                <MenubarItem key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 w-full",
                      "transition-colors duration-200",
                      isActiveRoute(item.href)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent"
                    )}
                  >
                    {item.icon}
                    <div className="flex-1">
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </Link>
                </MenubarItem>
              ))}
            </MenubarContent>
          </MenubarMenu>

          {/* User Account Menu */}
          <MenubarMenu>
            <MenubarTrigger
              className={cn(
                "hover:bg-accent data-[state=open]:bg-accent",
                "rounded-xl px-3 py-2 transition-all duration-200",
                "flex items-center gap-2"
              )}
            >
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
            </MenubarTrigger>
            {/* <Link href={"/"}>
              <House className="h-5 " />
            </Link> */}
            <MenubarContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-md shadow-xl z-[110]">
              {isConnected && address ? (
                <>
                  <MenubarItem disabled className="opacity-100">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Connected</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {formatAddress(address)}
                        </div>
                      </div>
                    </div>
                  </MenubarItem>
                  <MenubarSeparator />

                  {/* User Menu Items */}
                  {userMenuItems.map((item) => (
                    <MenubarItem key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 w-full",
                          "transition-colors duration-200",
                          isActiveRoute(item.href)
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-accent"
                        )}
                      >
                        {item.icon}
                        <div className="flex-1">
                          <div className="font-medium">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </Link>
                    </MenubarItem>
                  ))}

                  <MenubarSeparator />
                  <MenubarItem onClick={copyAddress} className="gap-3">
                    <Copy className="h-4 w-4" />
                    <span>{copied ? "Copied!" : "Copy Address"}</span>
                  </MenubarItem>
                  <MenubarItem>
                    <div
                      onClick={() =>
                        window.open(
                          `https://43113.testnet.snowtrace.dev/address/${address}`,
                          "_blank"
                        )
                      }
                      className="flex items-center gap-3 w-full cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Explorer
                    </div>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem
                    onClick={() => disconnect()}
                    className="gap-3 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </MenubarItem>
                </>
              ) : (
                <div className="p-3">
                  <div className="text-center mb-3">
                    <div className="text-sm font-medium mb-1">
                      Connect Your Wallet
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Access your dashboard and portfolio
                    </div>
                  </div>
                  <ConnectButton className="w-full" />
                </div>
              )}
            </MenubarContent>
          </MenubarMenu>

          {/* Theme Toggle */}
          <div className="ml-2">
            <ModeToggle />
          </div>
        </Menubar>
      </div>

      {/* Mobile Fixed Top Menu - REMOVED DUPLICATE */}

      {/* Mobile Unified Menu */}
      <div className="md:hidden px-4 relative z-[90] mt-4">
        <div
          className={cn(
            "bg-background/90 backdrop-blur-md border border-border/50 shadow-lg",
            "rounded-2xl p-3",
            "transition-all duration-300"
          )}
        >
          {/* Mobile Header - More compact */}
          <div className="flex items-center justify-between mb-3">
            {/* Brand */}
            <div className="flex items-center gap-2 text-primary font-bold tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span className="text-base uppercase">Motherhaven</span>
            </div>

            {/* Theme Toggle */}
            <ModeToggle />
          </div>

          {/* Factory Address - More compact version */}
          <div className="mb-3 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-primary">
                <Factory className="h-3 w-3" />
                <span className="font-medium">Factory:</span>
              </div>
              <AddressComponent hash={FACTORY_ADDRESS} type="address" />
            </div>
          </div>

          {/* User Status - More compact */}
          {isConnected && address ? (
            <div className="mb-3 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Connected</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatAddress(address)}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-xl z-[110]"
                  >
                    <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* User Menu Items */}
                    {userMenuItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 w-full"
                        >
                          {item.icon}
                          <div>
                            <div className="font-medium">{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={copyAddress} className="gap-3">
                      <Copy className="h-4 w-4" />
                      {copied ? "Copied!" : "Copy Address"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        window.open(
                          `https://43113.testnet.snowtrace.dev/address/${FACTORY_ADDRESS}`,
                          "_blank"
                        )
                      }
                      className="gap-3 cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Explorer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => disconnect()}
                      className="gap-3 text-red-600 focus:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : (
            <div className="mb-3 px-3 py-1.5 bg-muted/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                    <Wallet className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Not Connected
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Connect wallet
                    </p>
                  </div>
                </div>
                <ConnectButton size="sm" />
              </div>
            </div>
          )}

          {/* Navigation - Compact */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between rounded-lg h-9"
              >
                <div className="flex items-center gap-2">
                  {getCurrentNavItem().icon}
                  <span className="text-sm">{getCurrentNavItem().label}</span>
                </div>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80 rounded-xl z-[110]">
              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {navItems.map((item) => (
                <DropdownMenuItem key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 p-3 w-full",
                      isActiveRoute(item.href) && "bg-primary/10 text-primary"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        isActiveRoute(item.href)
                          ? "bg-primary/20"
                          : "bg-muted/50"
                      )}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
