"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./mode-toggle";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  Home,
  ArrowLeftRight,
  Droplets,
  BarChart3,
  Factory,
  Map,
  X,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

const navItems: NavItem[] = [
  {
    href: "/dex",
    label: "DEX",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    description: "Trade tokens on our decentralized exchange",
  },
  {
    href: "/faucet",
    label: "Faucet",
    icon: <Droplets className="h-4 w-4" />,
    description: "Get test tokens for development",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <BarChart3 className="h-4 w-4" />,
    description: "View your portfolio and analytics",
  },
  {
    href: "/dex/factory",
    label: "Token Factory",
    icon: <Factory className="h-4 w-4" />,
    description: "Create your own tokens",
  },
  {
    href: "/roadmap",
    label: "Road to Riches",
    icon: <Map className="h-4 w-4" />,
    description: "Explore our development roadmap",
  },
];

export default function MyMenu() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Don't render on home page
  if (pathname === "/") {
    return null;
  }

  // Don't render until mounted to prevent hydration errors
  if (!mounted) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-8 w-32 bg-muted/20 rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted/20 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const isActiveRoute = (href: string) => {
    if (href === "/dex" && pathname.startsWith("/dex")) {
      return true;
    }
    return pathname === href;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo/Brand */}
        <Link
          href="/dex"
          className="flex items-center gap-2 font-bold text-lg tracking-wider text-primary hover:text-primary/80 transition-colors"
        >
          <Coins className="h-6 w-6" />
          <span className="hidden sm:inline">MOTHERHAVEN</span>
          <span className="sm:hidden">MH</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                        isActiveRoute(item.href)
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <ModeToggle />
        </div>

        {/* Mobile Navigation */}
        <div className="flex lg:hidden items-center gap-2">
          <ModeToggle />

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-80 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <Link
                    href="/dex"
                    className="flex items-center gap-2 font-bold text-lg tracking-wider text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Coins className="h-6 w-6" />
                    MOTHERHAVEN
                  </Link>
                </div>

                {/* Navigation Items */}
                <div className="flex-1 py-6">
                  <nav className="space-y-2 px-6">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                          isActiveRoute(item.href)
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-md",
                            isActiveRoute(item.href)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Footer */}
                <div className="border-t p-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Coins className="h-4 w-4" />
                    <span>Decentralized Exchange Platform</span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
