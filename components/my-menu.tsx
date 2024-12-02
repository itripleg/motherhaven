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
import Link from "next/link";

export default function MyMenu2() {
  const pathname = usePathname();

  // Conditionally render the Menubar
  if (pathname === "/") {
    return null; // Return nothing if on the home page
  }

  return (
    <Menubar
      className="text-primary rounded-md max-w-[300px] md:max-w-xl 
    justify-center mx-auto mt-4 absolute left-1/2 transform -translate-x-1/2  z-40"
    >
      <MenubarMenu>
        <MenubarTrigger className="uppercase tracking-wider">
          Motherhaven
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <Link href="/dex">DEX</Link>
          </MenubarItem>
          <MenubarItem>
            <Link href="/dashboard">Dash</Link>
          </MenubarItem>
          {/* <MenubarItem>
            <Link href="/casino">Casino</Link>
          </MenubarItem> */}
          <MenubarItem>
            <Link href="/dex/factory">Token Factory</Link>
          </MenubarItem>
          <MenubarItem>
            <Link href="/roadmap">Road to Riches</Link>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <ModeToggle />
    </Menubar>
  );
}
