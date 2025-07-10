// components/menu/MobileMenu.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Factory, ChevronDown, User, Wallet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { FACTORY_ADDRESS } from "@/types";
import { AddressComponent } from "@/components/AddressComponent";
import { navItems, userMenuItems } from "./menuData";
import { isActiveRoute, getCurrentNavItem, formatAddress } from "./menuUtils";
import { Icon } from "./IconHelper";
import { UserAccountMenu } from "./UserAccountMenu";
import { ThemeMenu } from "./ThemeMenu";

export function MobileMenu() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const currentNavItem = getCurrentNavItem(pathname);

  return (
    <div className="md:hidden px-4 relative z-[90] mt-4 opacity-90">
      <div
        className={cn(
          "bg-background/90 backdrop-blur-md border border-border/50 shadow-lg",
          "rounded-2xl p-3",
          "transition-all duration-300"
        )}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-3">
          {/* Brand */}
          <div className="flex items-center gap-2 text-primary font-bold tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span className="text-base uppercase">Motherhaven</span>
          </div>

          {/* Theme Palette for Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg">
                <Icon name="Palette" className="h-4 w-4 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="rounded-xl border-primary/20 bg-background/95 backdrop-blur-md shadow-xl z-[110] w-64"
              align="end"
            >
              <ThemeMenu />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between rounded-lg h-9 mb-2"
            >
              <div className="flex items-center gap-2">
                <Icon name={currentNavItem.iconName} />
                <span className="text-sm">{currentNavItem.label}</span>
              </div>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-80 rounded-xl border-primary/20 bg-background/95 backdrop-blur-md shadow-xl z-[110]">
            <DropdownMenuLabel className="px-3 py-2">
              Navigation
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="border-primary/10" />

            {navItems.map((item) => (
              <DropdownMenuItem
                key={item.href}
                className="p-0 focus:bg-transparent"
              >
                <Link
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
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Status */}
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
                  className="w-56 rounded-xl border-primary/20 bg-background/95 backdrop-blur-md shadow-xl z-[110]"
                >
                  <DropdownMenuLabel className="px-3 py-2">
                    Account Actions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="border-primary/10" />

                  {/* User Menu Items */}
                  {userMenuItems.map((item) => (
                    <DropdownMenuItem
                      key={item.href}
                      asChild
                      className="p-0 focus:bg-transparent"
                    >
                      <Link
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
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator className="border-border/50" />
                  <UserAccountMenu pathname={pathname} />
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

        {/* Factory Address */}
        <div className="px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-primary">
              <Factory className="h-3 w-3" />
              <span className="font-medium">Factory:</span>
            </div>
            <AddressComponent hash={FACTORY_ADDRESS} type="address" />
          </div>
        </div>
      </div>
    </div>
  );
}
