// components/menu/DesktopMenu.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sparkles, Factory } from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { cn } from "@/lib/utils";
import { FACTORY_ADDRESS } from "@/types";
import { AddressComponent } from "@/components/AddressComponent";
import { navItems, userMenuItems } from "./menuData";
import { isActiveRoute } from "./menuUtils";
import { Icon } from "./IconHelper";
import { UserAccountMenu } from "./UserAccountMenu";
import { ThemeMenu } from "./ThemeMenu";

export function DesktopMenu() {
  const pathname = usePathname();

  return (
    <div className="hidden md:block fixed top-4 left-1/2 transform -translate-x-1/2 z-50 opacity-90">
      <Menubar
        className={cn(
          "bg-background/90 backdrop-blur-md border border-border/50 shadow-lg",
          "rounded-2xl px-2 py-1 min-h-12 w-fit",
          "transition-all duration-300 hover:shadow-xl hover:bg-background/95"
        )}
      >
        {/* Brand Navigation */}
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
            {navItems.map((item) => (
              <MenubarItem key={item.href}>
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
              </MenubarItem>
            ))}

            <MenubarSeparator />

            {/* Factory Address */}
            <MenubarItem>
              <div className="flex items-center gap-3 px-3 py-2 w-full">
                <Factory className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Factory Address
                  </div>
                  <div className="text-xs">
                    <AddressComponent hash={FACTORY_ADDRESS} type="address" />
                  </div>
                </div>
              </div>
            </MenubarItem>
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
            <UserAccountMenu isDesktop pathname={pathname} />
          </MenubarTrigger>
          <MenubarContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-md shadow-xl z-[110]">
            <UserAccountMenu pathname={pathname} />
          </MenubarContent>
        </MenubarMenu>

        {/* Theme Menu */}
        <MenubarMenu>
          <MenubarTrigger
            className={cn(
              "hover:bg-accent data-[state=open]:bg-accent",
              "rounded-xl px-3 py-2 transition-all duration-200",
              "flex items-center justify-center min-w-10"
            )}
          >
            <Icon name="Palette" className="h-4 w-4 text-primary" />
          </MenubarTrigger>
          <MenubarContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-md shadow-xl z-[110] w-64">
            <ThemeMenu isDesktop />
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
