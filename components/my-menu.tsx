"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { ModeToggle } from "./mode-toggle";
import { usePathname } from "next/navigation";

export default function MyMenu2() {
  const pathname = usePathname();

  // Conditionally render the Menubar
  if (pathname === "/") {
    return null; // Return nothing if on the home page
  }

  return (
    <Menubar className="text-primary rounded-md max-w-[300px] md:max-w-xl justify-center mx-auto mt-4">
      <MenubarMenu>
        <MenubarTrigger className="uppercase tracking-wider">
          Motherhaven
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <a href="/dex">DEX</a>
          </MenubarItem>
          <MenubarItem>
            <a href="/dashboard">Dash</a>
          </MenubarItem>
          <MenubarItem>
            <a href="/casino">Casino</a>
          </MenubarItem>
          <MenubarItem>
            <a href="/dex/factory">Token Factory</a>
          </MenubarItem>
          <MenubarItem>
            <a href="/roadmap">Road to Riches</a>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <ModeToggle />
    </Menubar>
  );
}
