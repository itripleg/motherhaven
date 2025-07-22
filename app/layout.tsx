// app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import MyMenu from "@/components/my-menu";
import WagmiContext from "@/contexts/WagmiContext";
import { Toaster } from "@/components/ui/toaster";
import { EventWatcher } from "../components/EventWatcher";
import { FactoryConfigProvider } from "@/contexts/FactoryConfigProvider";
import { ColorThemeProvider } from "@/contexts/ColorThemeProvider";
import { NetworkGuard } from "@/components/NetworkGuard";
import { NetworkDebug } from "@/components/NetworkDebug";
import Script from "next/script";

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
  title: {
    default: "Motherhaven - Web3 Playground",
    template: "%s | Motherhaven",
  },
  description:
    "Explore Web3 with Motherhaven - featuring DEX trading, token factory, and more blockchain fun in one playground.",
  keywords: [
    "motherhaven",
    "web3",
    "playground",
    "avalanche",
    "defi",
    "dex",
    "token creation",
    "bonding curve",
    "fair launch",
    "crypto",
    "blockchain",
    "memecoin",
    "tokenomics"
  ],
  authors: [{ name: "Motherhaven Team" }],
  creator: "Motherhaven",
  publisher: "Motherhaven",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://motherhaven.app"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Motherhaven - Web3 Playground",
    description:
      "Explore Web3 with Motherhaven - featuring DEX trading, token factory, and more blockchain tools in one playground.",
    siteName: "Motherhaven",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Motherhaven - Web3 Playground",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Motherhaven - Web3 Playground",
    description:
      "Explore Web3 with Motherhaven - featuring DEX trading, token factory, and more blockchain tools in one playground.",
    images: ["/og-image.png"],
    creator: "@motherhaven",
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION_ID,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='12 0 100 100'><text y='.9em' font-size='90'>🐱‍🚀</text></svg>"
        />

        {/* Manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme Color */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://cloud.umami.is" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        {/* Umami Analytics - Non-blocking */}
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="32846e29-4243-4f45-b593-eb54fe00811d"
          strategy="afterInteractive"
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <WagmiContext>
            <ColorThemeProvider>
              <NetworkGuard>
                {/* Skip to main content link for accessibility */}
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
                >
                  Skip to main content
                </a>

                {/* Navigation */}
                <MyMenu />

                {/* Main Content */}
                <main id="main-content" className="min-h-screen">
                  <FactoryConfigProvider>
                    <EventWatcher />
                    {children}
                    <Toaster />
                  </FactoryConfigProvider>
                </main>

                {/* Debug components - only in development */}
                {/* {process.env.NODE_ENV === "development" && <NetworkDebug />} */}
              </NetworkGuard>
            </ColorThemeProvider>
          </WagmiContext>
        </ThemeProvider>

        {/* Additional Analytics Scripts (if needed) */}
        {process.env.NODE_ENV === "production" && (
          <>
            {/* Google Analytics (if you want to add it later) */}
            {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
              <>
                <Script
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
                  strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                  {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
                  `}
                </Script>
              </>
            )}
          </>
        )}
      </body>
    </html>
  );
}