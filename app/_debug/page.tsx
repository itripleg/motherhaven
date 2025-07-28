// app/_debug/page.tsx

"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAccount } from "wagmi";
import { isAddress } from "viem";
import Link from "next/link";
import {
  Settings,
  Factory,
  Coins,
  Database,
  Calculator,
  ArrowRight,
  Copy,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnhancedDebugTestRunner } from "./components/EnhancedDebugTestRunner";

const DEFAULT_TEST_TOKEN = "0x1193ccc14edf32ec3a785e0c62115f243d22bec3";

const DEBUG_SECTIONS = [
  {
    id: "final-hooks",
    title: "Final-Hooks",
    description: "Test final-hooks architecture with consolidated interfaces",
    icon: Database,
    color: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
    iconColor: "text-blue-500",
    path: "/debug/final-hooks",
    hooks: [
      "useTokenData",
      "useTrades",
      "useFactoryContract",
      "useUnifiedTokenPrice",
    ],
  },
  {
    id: "factory",
    title: "Factory Contract",
    description: "Test factory contract interactions and reads",
    icon: Factory,
    color: "bg-green-500/10 border-green-500/20 hover:bg-green-500/20",
    iconColor: "text-green-500",
    path: "/debug/factory",
    hooks: [
      "useFactoryContract",
      "useTokenState",
      "useCollateral",
      "useCurrentPrice",
    ],
  },
  {
    id: "token",
    title: "Token Hooks",
    description: "Test price fetching, stats, trades, and utilities",
    icon: Coins,
    color: "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20",
    iconColor: "text-purple-500",
    path: "/debug/token",
    hooks: [
      "useUnifiedTokenPrice",
      "useTokenStats",
      "useTokenTrades",
      "useRealtimeTokenPrice",
    ],
  },
  {
    id: "trade",
    title: "Trade Debug",
    description:
      "Streamlined trading interface with price calculations and testing",
    icon: Calculator,
    color: "bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20",
    iconColor: "text-orange-500",
    path: "/debug/trade",
    hooks: [
      "useFactoryContract",
      "Live Trading",
      "Price Calculations",
      "Chart Verification",
    ],
  },
];

// Loading component for Suspense fallback
function DebugMainLoading() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Settings className="h-8 w-8 text-primary animate-pulse" />
          <h1 className="text-4xl font-bold">Hook Debug Center</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Loading debug environment...
        </p>
      </div>
    </div>
  );
}

// Main content component that uses search params
function DebugMainContent() {
  const searchParams = useSearchParams();
  const [testTokenAddress, setTestTokenAddress] =
    React.useState(DEFAULT_TEST_TOKEN);
  const [isValidAddress, setIsValidAddress] = React.useState(true);
  const [copiedAddress, setCopiedAddress] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { address: userAddress } = useAccount();
  const { toast } = useToast();

  // Handle hydration and URL sync
  React.useEffect(() => {
    setMounted(true);

    // Get token from URL params on mount
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setTestTokenAddress(tokenParam);
      setIsValidAddress(isAddress(tokenParam));
    } else {
      // If no token in URL, set the default token in URL
      const url = new URL(window.location.href);
      url.searchParams.set("token", DEFAULT_TEST_TOKEN);
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Validate address on change and update URL
  const handleAddressChange = (value: string) => {
    setTestTokenAddress(value);
    setIsValidAddress(!value || isAddress(value));

    // Update URL without page reload
    if (mounted) {
      const url = new URL(window.location.href);
      if (value && isAddress(value)) {
        url.searchParams.set("token", value);
      } else {
        url.searchParams.delete("token");
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Address copied successfully",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Hook Debug Center</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive testing environment for all token-related hooks,
          contexts, and utilities. Use this to identify inconsistencies and test
          functionality before refactoring.
        </p>
      </div>

      {/* Global Configuration */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Global Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Token Address */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Test Token Address</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(testTokenAddress)}
                className="h-7"
              >
                {copiedAddress ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                Copy
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                value={testTokenAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="Enter token address (0x...)"
                className={`flex-1 ${!isValidAddress ? "border-red-500" : ""}`}
              />
              <Button
                variant="outline"
                onClick={() => handleAddressChange(DEFAULT_TEST_TOKEN)}
                className="whitespace-nowrap"
              >
                Reset Default
              </Button>
            </div>

            {!isValidAddress && (
              <div className="text-red-500 text-sm flex items-center gap-1">
                ⚠️ Invalid address format - must be a valid Ethereum address
              </div>
            )}
          </div>

          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                User Wallet
              </span>
              <div className="font-mono text-sm flex items-center">
                {userAddress ? (
                  <>
                    <span>
                      {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                    </span>
                    <Badge variant="outline" className="ml-2">
                      Connected
                    </Badge>
                  </>
                ) : (
                  <>
                    <span>Not connected</span>
                    <Badge variant="secondary" className="ml-2">
                      Disconnected
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Test Token
              </span>
              <div className="font-mono text-sm flex items-center">
                {isValidAddress && testTokenAddress ? (
                  <>
                    <span>
                      {testTokenAddress.slice(0, 6)}...
                      {testTokenAddress.slice(-4)}
                    </span>
                    <Badge variant="default" className="ml-2">
                      Valid
                    </Badge>
                  </>
                ) : (
                  <>
                    <span>Invalid or empty</span>
                    <Badge variant="destructive" className="ml-2">
                      Invalid
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Network
              </span>
              <div className="text-sm flex items-center">
                <span>testnet</span>
                <Badge variant="outline" className="ml-2">
                  Testnet
                </Badge>
              </div>
            </div>
          </div>

          {/* URL Parameters Info */}
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-200 dark:border-blue-800">
            <strong>💡 Pro Tip:</strong> The test token address will be
            automatically passed to all debug pages as a URL parameter. You can
            also manually add <code>?token=0x...</code> to any debug page URL.
          </div>
        </CardContent>
      </Card>

      {/* Debug Test Runner */}
      <EnhancedDebugTestRunner
        testToken={isValidAddress ? testTokenAddress : undefined}
      />

      {/* Debug Sections */}
      <div className="grid gap-6">
        <h2 className="text-2xl font-bold text-center">Debug Sections</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEBUG_SECTIONS.map((section) => {
            const Icon = section.icon;
            const debugUrl = `${section.path}?token=${encodeURIComponent(
              testTokenAddress
            )}`;

            return (
              <Card
                key={section.id}
                className={`${section.color} transition-all duration-200 hover:scale-105 cursor-pointer border-2`}
              >
                <Link href={debugUrl}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${section.color}`}>
                        <Icon className={`h-6 w-6 ${section.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {section.title}
                        </CardTitle>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {section.description}
                    </p>

                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Features Tested
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {section.hooks.map((hook) => (
                          <Badge
                            key={hook}
                            variant="secondary"
                            className="text-xs font-mono"
                          >
                            {hook}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open("/dex", "_blank")}
            >
              <Coins className="h-4 w-4 mr-2" />
              Open DEX (Production)
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open(`/dex/${testTokenAddress}`, "_blank")}
              disabled={!isValidAddress || !testTokenAddress}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Open Test Token Page
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => window.open("/factory", "_blank")}
            >
              <Factory className="h-4 w-4 mr-2" />
              Open Token Factory
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                const randomAddress =
                  "0x" +
                  Array.from({ length: 40 }, () =>
                    Math.floor(Math.random() * 16).toString(16)
                  ).join("");
                handleAddressChange(randomAddress);
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Generate Random Address
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground space-y-2">
        <div>
          🔧 This debug environment helps identify hook overlaps, data
          inconsistencies, and performance issues before refactoring.
        </div>
        <div className="text-xs">
          Current test token:{" "}
          <code className="bg-muted px-1 py-0.5 rounded">
            {testTokenAddress}
          </code>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function DebugMainPage() {
  return (
    <Suspense fallback={<DebugMainLoading />}>
      <DebugMainContent />
    </Suspense>
  );
}
