// components/menu/MobileMenu.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, User, Wallet } from "lucide-react";
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

        {/* Inline Navigation and User Options */}
        <div className="flex items-center gap-2">
          {/* Navigation Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-between rounded-lg h-9"
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

          {/* User Status Dropdown */}
          {isConnected && address ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-lg h-9 px-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <span className="text-xs font-mono">
                      {formatAddress(address)}
                    </span>
                  </div>
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
          ) : (
            <ConnectButton size="sm" />
          )}
        </div>
      </div>
    </div>
  );
}
