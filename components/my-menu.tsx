"use client";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  //   MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { ModeToggle } from "./mode-toggle";

// type MyMenuProps = {
//   setCurrentView: (view: "dashboard" | "chart") => void; // Define the type of setCurrentView
// };

export default function MyMenu2() {
  return (
    <Menubar className="text-primary rounded-md max-w-[300px] md:max-w-xl justify-center mx-auto mt-4 ">
      <MenubarMenu>
        <MenubarTrigger className="uppercase tracking-wider">
          Munny
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Dashboard<MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            <a href="/casino">Casino</a>
          </MenubarItem>
          {/* Add more menu items for different views */}
        </MenubarContent>
      </MenubarMenu>
      <ModeToggle />
    </Menubar>
  );
}
