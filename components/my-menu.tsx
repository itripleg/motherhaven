// components/my-menu.tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DesktopMenu } from "./menu/DesktopMenu";
import { MobileMenu } from "./menu/MobileMenu";

export default function MyMenu() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

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

  return (
    <>
      <DesktopMenu />
      <MobileMenu />
    </>
  );
}
