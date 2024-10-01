import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WagmiContext from "@/contexts/WagmiContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CryptoComfort Casino",
  description: "Experience the thrill of decentralized gaming",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <WagmiContext>
        <body className={inter.className}>{children}</body>
      </WagmiContext>
    </html>
  );
}
