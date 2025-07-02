// app/_debug/factory/page.tsx

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Factory, AlertCircle, CheckCircle } from "lucide-react";
import { isAddress } from "viem";
import { FACTORY_ADDRESS } from "@/types";

// Import our new components
import { FactoryContractReads } from "./components/FactoryContractReads";
import { FormattingUtilsDebug } from "./components/FormattingUtilsDebug";
import { ABIAnalysisDebug } from "./components/ABIAnalysisDebug";
import { WriteFunctionsDebug } from "./components/WriteFunctionsDebug";

// Loading component for Suspense fallback
function FactoryDebugLoading() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Factory className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-4" />
        <p className="text-muted-foreground">Loading factory debugger...</p>
      </div>
    </div>
  );
}

// Main content component that uses useSearchParams
function FactoryDebugContent() {
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchParams = useSearchParams();
  const testToken = searchParams.get("token") || "";
  const isValidToken = testToken && isAddress(testToken);

  useEffect(() => {
    setMounted(true);
  }, []);

  const forceRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!mounted) {
    return <FactoryDebugLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Factory className="h-8 w-8 text-green-500" />
            Factory Contract Debug (Final-Hooks)
          </h1>
          <p className="text-muted-foreground mt-2">
            Test factory contract reads, writes, and formatting utilities using
            final-hooks
          </p>
        </div>

        <Button onClick={forceRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Force Refresh
        </Button>
      </div>

      {/* Contract Info */}
      <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/20">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Factory Address:</span>
                <Badge variant="outline" className="font-mono">
                  {FACTORY_ADDRESS}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Refresh Key: #{refreshKey}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Test Token:</span>
                {isValidToken ? (
                  <>
                    <Badge variant="default" className="font-mono">
                      {testToken.slice(0, 8)}...{testToken.slice(-8)}
                    </Badge>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </>
                ) : (
                  <>
                    <Badge variant="destructive">No valid token</Badge>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </>
                )}
              </div>
              <Badge variant="outline" className="text-green-600">
                final-hooks ✓
              </Badge>
            </div>

            {!isValidToken && (
              <p className="text-sm text-muted-foreground">
                💡 Add a valid token address to test token-specific contract
                reads
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contract-reads" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contract-reads">Contract Reads</TabsTrigger>
          <TabsTrigger value="formatting">Formatting Utils</TabsTrigger>
          <TabsTrigger value="abi-analysis">ABI Analysis</TabsTrigger>
          <TabsTrigger value="write-functions">Write Functions</TabsTrigger>
        </TabsList>

        {/* Contract Reads Tab */}
        <TabsContent value="contract-reads">
          <FactoryContractReads token={testToken} refreshKey={refreshKey} />
        </TabsContent>

        {/* Formatting Utils Tab */}
        <TabsContent value="formatting">
          <FormattingUtilsDebug refreshKey={refreshKey} />
        </TabsContent>

        {/* ABI Analysis Tab */}
        <TabsContent value="abi-analysis">
          <ABIAnalysisDebug />
        </TabsContent>

        {/* Write Functions Tab */}
        <TabsContent value="write-functions">
          <WriteFunctionsDebug token={testToken} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function DebugFactoryPage() {
  return (
    <Suspense fallback={<FactoryDebugLoading />}>
      <FactoryDebugContent />
    </Suspense>
  );
}
