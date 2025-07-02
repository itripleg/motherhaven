// app/dex/layout.tsx
"use client";
import { FactoryConfigProvider } from "@/contexts/FactoryConfigProvider";

export default function DexLayout({ children }: { children: React.ReactNode }) {
  return <FactoryConfigProvider>{children}</FactoryConfigProvider>;
}
