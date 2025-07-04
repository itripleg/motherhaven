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
// import { FactoryGuard } from "@/components/FactoryGuard";

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
  // ... your metadata stays the same
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='12 0 100 100'><text y='.9em' font-size='90'>🤑</text></svg>"
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
              {/* <FactoryGuard> */}
              <MyMenu />
              {/* <div className="p-0 md:p-20" /> */}
              <FactoryConfigProvider>
                <EventWatcher />
                {/* <Header /> */}
                {children}
                <Toaster />
              </FactoryConfigProvider>
              {/* </FactoryGuard> */}
            </ColorThemeProvider>
          </WagmiContext>
        </ThemeProvider>
      </body>
    </html>
  );
}
