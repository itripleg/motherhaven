import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GlobalFinanceProvider } from "@/contexts/GlobalFinanceContext";
import StickyHeader from "@/components/sticky-header";
import MyMenu from "@/components/my-menu";
import WagmiContext from "@/contexts/WagmiContext";
import { Toaster } from "@/components/ui/toaster";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MotherHaven | The DeFi Community Token Platform",
  description:
    "Create, trade, and manage community tokens in a decentralized ecosystem. Join the future of social tokenization.",
  keywords: [
    "DeFi",
    "tokens",
    "cryptocurrency",
    "blockchain",
    "community tokens",
    "social tokens",
    "Web3",
  ],
  authors: [{ name: "MotherHaven Team" }],
  viewport: "width=device-width, initial-scale=1",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://motherhaven.vercel.app/",
    siteName: "MotherHaven",
    title: "MotherHaven - Community Token Platform",
    description:
      "Create and manage community tokens in a decentralized ecosystem",
    images: [
      {
        url: "/og-image.png", // You'll need to add this image to your public folder
        width: 1200,
        height: 630,
        alt: "MotherHaven Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MotherHaven - Community Token Platform",
    description:
      "Create and manage community tokens in a decentralized ecosystem",
    images: ["/og-image.png"], // Same as OpenGraph image
  },
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='12 0 100 100'><text y='.9em' font-size='90'>🤑</text></svg>",
        type: "image/svg+xml",
      },
    ],
    shortcut: "/favicon.ico", // You might want to add a proper favicon
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  manifest: "/manifest.json", // You might want to add a web manifest file
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <MyMenu />
          <WagmiContext>
            <GlobalFinanceProvider>
              {children}
              <Toaster />
            </GlobalFinanceProvider>
          </WagmiContext>
        </ThemeProvider>
      </body>
    </html>
  );
}
