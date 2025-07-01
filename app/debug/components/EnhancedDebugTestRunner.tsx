// app/debug/components/EnhancedDebugTestRunner.tsx

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Copy,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  XCircle,
  Info,
} from "lucide-react";
import { parseEther, formatEther, Address, isAddress } from "viem";
import { useReadContract, useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";

// Import all hooks to test - including deprecated ones
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { useToken } from "@/contexts/TokenContext";
import { useTokenTrades } from "@/new-hooks/useTokenTrades";
import { useUnifiedTokenPrice } from "@/hooks/token/useUnifiedTokenPrice";
import { useRealtimeTokenPrice } from "@/hooks/token/useRealtimeTokenPrices";
import { useTokenStats } from "@/hooks/token/useTokenStats"; // DEPRECATED - should flag this
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";

interface DebugTestRunnerProps {
  testToken?: string;
}

interface TestResult {
  section: string;
  test: string;
  status: "pass" | "fail" | "warning" | "pending" | "deprecated";
  expected?: any;
  actual?: any;
  message?: string;
  functionName?: string;
  executionTime?: number;
  severity?: "low" | "medium" | "high" | "critical";
}

// Define Token interface to fix indexing issues
interface Token {
  name?: string;
  symbol?: string;
  address?: string;
  currentPrice?: string;
  [key: string]: any; // Add index signature for dynamic access
}

export function EnhancedDebugTestRunner({ testToken }: DebugTestRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [jsonOutput, setJsonOutput] = useState("");
  const { toast } = useToast();
  const { address: userAddress } = useAccount();

  // All the hooks we want to test
  const tokenAddress = testToken as Address;
  const { useCurrentPrice, useCollateral, formatValue } = useFactoryContract();
  const { token: tokenContextData, loading: tokenContextLoading } = useToken(
    testToken || ""
  );
  const { trades, loading: tradesLoading } = useTokenTrades(tokenAddress);
  const unifiedPrice = useUnifiedTokenPrice(tokenAddress);
  const { price: realtimePrice } = useRealtimeTokenPrice(tokenAddress);

  // DEPRECATED HOOK - This should be flagged
  const tokenStats = useTokenStats({ tokenAddress: testToken || "" });

  // Contract reads for testing
  const { data: factoryCurrentPrice } = useCurrentPrice(tokenAddress);
  const { data: collateral } = useCollateral(tokenAddress);

  const TEST_BUY_AMOUNT = "1.0"; // 1 AVAX
  const TEST_SELL_AMOUNT = "1000"; // 1000 tokens

  const { data: buyTokensResult } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "calculateTokenAmount",
    args: tokenAddress
      ? [tokenAddress, parseEther(TEST_BUY_AMOUNT)]
      : undefined,
    query: { enabled: Boolean(tokenAddress) },
  });

  const { data: sellAvaxResult } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "calculateSellPrice",
    args: tokenAddress
      ? [tokenAddress, parseEther(TEST_SELL_AMOUNT)]
      : undefined,
    query: { enabled: Boolean(tokenAddress) },
  });

  const runAllTests = async () => {
    setIsRunning(true);
    const testResults: TestResult[] = [];
    const startTime = Date.now();

    try {
      // 1. ENVIRONMENT & SETUP TESTS
      testResults.push({
        section: "Environment",
        test: "User wallet connection",
        status: userAddress ? "pass" : "fail",
        expected: "Connected wallet address",
        actual: userAddress || "Not connected",
        functionName: "useAccount",
        severity: "high",
      });

      testResults.push({
        section: "Environment",
        test: "Test token address validation",
        status: testToken && isAddress(testToken) ? "pass" : "fail",
        expected: "Valid Ethereum address",
        actual: testToken || "Not provided",
        functionName: "isAddress",
        severity: "high",
      });

      testResults.push({
        section: "Environment",
        test: "Factory contract address",
        status: FACTORY_ADDRESS && isAddress(FACTORY_ADDRESS) ? "pass" : "fail",
        expected: "Valid factory address",
        actual: FACTORY_ADDRESS,
        functionName: "FACTORY_ADDRESS constant",
        severity: "critical",
      });

      // 2. DEPRECATED HOOK DETECTION
      testResults.push({
        section: "Deprecated Hooks",
        test: "useTokenStats usage detection",
        status: "deprecated",
        expected: "Should use useUnifiedTokenPrice instead",
        actual: "Currently using deprecated useTokenStats",
        functionName: "useTokenStats",
        severity: "medium",
        message:
          "useTokenStats is deprecated and should be replaced with useUnifiedTokenPrice for price data",
      });

      // Check if tokenStats is actually being used and returning data
      const isTokenStatsActive =
        !tokenStats.loading &&
        !tokenStats.error &&
        tokenStats.currentPrice !== "0";
      testResults.push({
        section: "Deprecated Hooks",
        test: "useTokenStats active usage",
        status: isTokenStatsActive ? "warning" : "pass",
        expected: "No active usage of deprecated hook",
        actual: isTokenStatsActive
          ? "Hook is actively returning data"
          : "Hook not actively used",
        functionName: "useTokenStats.currentPrice",
        severity: isTokenStatsActive ? "medium" : "low",
        message: isTokenStatsActive
          ? "Deprecated hook is still providing data - migration needed"
          : "Deprecated hook not actively used",
      });

      // 3. HOOK CONSISTENCY TESTS
      const priceTests = [
        {
          name: "Factory Contract Price",
          value: factoryCurrentPrice ? formatEther(factoryCurrentPrice) : null,
          functionName: "useCurrentPrice",
          hook: "useFactoryContract",
          recommended: true,
        },
        {
          name: "Unified Price Hook",
          value: unifiedPrice.raw,
          functionName: "useUnifiedTokenPrice",
          hook: "useUnifiedTokenPrice",
          recommended: true,
        },
        {
          name: "Realtime Price Hook",
          value: realtimePrice.raw,
          functionName: "useRealtimeTokenPrice",
          hook: "useRealtimeTokenPrice",
          recommended: true,
        },
        {
          name: "Token Stats Price (DEPRECATED)",
          value: tokenStats.currentPrice,
          functionName: "useTokenStats",
          hook: "useTokenStats",
          recommended: false,
        },
        // REMOVED: Token Context Price test - context no longer provides currentPrice
        // This was the source of the "fail" status in previous tests
      ];

      const validPrices = priceTests.filter(
        (p) => p.value && Number(p.value) > 0
      );
      const priceVariance =
        validPrices.length > 1
          ? calculatePriceVariance(validPrices.map((p) => Number(p.value)))
          : 0;

      priceTests.forEach((test) => {
        const hasValue = test.value && Number(test.value) > 0;
        testResults.push({
          section: "Price Sources",
          test: test.name,
          status:
            !test.recommended && hasValue
              ? "deprecated"
              : hasValue
              ? "pass"
              : "fail",
          expected: test.recommended ? "> 0 AVAX" : "Should not be used",
          actual: test.value || "null/undefined",
          functionName: test.functionName,
          message: test.hook,
          severity: !test.recommended && hasValue ? "medium" : "low",
        });
      });

      // 4. TOKEN CONTEXT VALIDATION (Updated to not expect currentPrice)
      testResults.push({
        section: "Token Context",
        test: "Token context correctly excludes currentPrice",
        status:
          tokenContextData && !tokenContextData.hasOwnProperty("currentPrice")
            ? "pass"
            : "warning",
        expected: "Token context should not include currentPrice field",
        actual: tokenContextData?.hasOwnProperty("currentPrice")
          ? "Context includes deprecated currentPrice"
          : "Context correctly excludes currentPrice",
        functionName: "useToken context validation",
        severity: "low",
        message:
          "Token context should only provide database data, not live contract prices",
      });

      // 5. HOOK OVERLAP DETECTION
      const activePriceHooks = priceTests.filter(
        (p) => p.value && Number(p.value) > 0
      ).length;
      testResults.push({
        section: "Hook Efficiency",
        test: "Multiple price hook usage",
        status:
          activePriceHooks > 2
            ? "warning"
            : activePriceHooks > 1
            ? "pass"
            : "fail",
        expected: "1-2 active price hooks",
        actual: `${activePriceHooks} active hooks`,
        functionName: "multiple hooks analysis",
        severity: activePriceHooks > 3 ? "medium" : "low",
        message:
          activePriceHooks > 2
            ? "Too many price hooks may cause performance issues"
            : "Acceptable hook usage",
      });

      // 6. PRICE CONSISTENCY ANALYSIS
      testResults.push({
        section: "Price Sources",
        test: "Price consistency across sources",
        status:
          priceVariance < 0.01
            ? "pass"
            : priceVariance < 0.05
            ? "warning"
            : "fail",
        expected: "< 1% variance",
        actual: `${(priceVariance * 100).toFixed(2)}% variance`,
        functionName: "calculatePriceVariance",
        severity:
          priceVariance > 0.05
            ? "high"
            : priceVariance > 0.01
            ? "medium"
            : "low",
      });

      // 7. CONTEXT PROVIDER HEALTH
      testResults.push({
        section: "Context Health",
        test: "Token context loading state",
        status: !tokenContextLoading ? "pass" : "pending",
        expected: "false",
        actual: tokenContextLoading.toString(),
        functionName: "useToken loading",
        severity: tokenContextLoading ? "low" : "low",
      });

      testResults.push({
        section: "Context Health",
        test: "Trades data loading state",
        status: !tradesLoading ? "pass" : "pending",
        expected: "false",
        actual: tradesLoading.toString(),
        functionName: "useTokenTrades loading",
        severity: tradesLoading ? "low" : "low",
      });

      // 8. DATA VALIDATION TESTS (Updated to not check currentPrice)
      if (tokenContextData) {
        const requiredFields = ["name", "symbol", "address"]; // Removed currentPrice
        const typedTokenData = tokenContextData as Token; // Type assertion for safe indexing

        requiredFields.forEach((field) => {
          testResults.push({
            section: "Data Validation",
            test: `Token context has ${field}`,
            status: typedTokenData[field] ? "pass" : "fail",
            expected: "truthy value",
            actual: typedTokenData[field] || "null/undefined",
            functionName: `useToken.${field}`,
            severity: "high",
          });
        });

        // New test: Verify context provides metadata but not price data
        testResults.push({
          section: "Data Validation",
          test: "Token context provides metadata only",
          status:
            typedTokenData.name &&
            typedTokenData.symbol &&
            !typedTokenData.hasOwnProperty("currentPrice")
              ? "pass"
              : "warning",
          expected: "Has metadata, no currentPrice",
          actual: `Name: ${!!typedTokenData.name}, Symbol: ${!!typedTokenData.symbol}, CurrentPrice: ${typedTokenData.hasOwnProperty(
            "currentPrice"
          )}`,
          functionName: "useToken metadata validation",
          severity: "medium",
          message:
            "Context should provide token metadata but delegate price fetching to specialized hooks",
        });
      } else {
        testResults.push({
          section: "Data Validation",
          test: "Token context data availability",
          status: "fail",
          expected: "Token data object",
          actual: "null/undefined",
          functionName: "useToken",
          severity: "critical",
          message:
            "Token context returning no data - check if token exists in database",
        });
      }

      // 9. TRADING CALCULATION TESTS
      const buyEffectivePrice =
        buyTokensResult && typeof buyTokensResult === "bigint"
          ? Number(TEST_BUY_AMOUNT) / Number(formatEther(buyTokensResult))
          : null;

      const sellEffectivePrice =
        sellAvaxResult && typeof sellAvaxResult === "bigint"
          ? Number(formatEther(sellAvaxResult)) / Number(TEST_SELL_AMOUNT)
          : null;

      testResults.push({
        section: "Trading Calculations",
        test: "Buy calculation response",
        status: buyTokensResult ? "pass" : "fail",
        expected: "> 0 tokens",
        actual:
          buyTokensResult && typeof buyTokensResult === "bigint"
            ? formatEther(buyTokensResult)
            : "null",
        functionName: "calculateTokenAmount",
        severity: "medium",
      });

      testResults.push({
        section: "Trading Calculations",
        test: "Sell calculation response",
        status: sellAvaxResult ? "pass" : "fail",
        expected: "> 0 AVAX",
        actual:
          sellAvaxResult && typeof sellAvaxResult === "bigint"
            ? formatEther(sellAvaxResult)
            : "null",
        functionName: "calculateSellPrice",
        severity: "medium",
      });

      // 10. EDGE CASE TESTS
      testResults.push({
        section: "Edge Cases",
        test: "Invalid token address handling",
        status: testToken && !isAddress(testToken) ? "warning" : "pass",
        expected: "Graceful handling of invalid addresses",
        actual:
          testToken && !isAddress(testToken)
            ? "Invalid address provided"
            : "Valid or no address",
        functionName: "address validation",
        severity: "medium",
      });

      // Test zero values
      const hasZeroPrices = priceTests.some((p) => p.value === "0");
      testResults.push({
        section: "Edge Cases",
        test: "Zero price value handling",
        status: hasZeroPrices ? "warning" : "pass",
        expected: "No zero prices for valid tokens",
        actual: hasZeroPrices ? "Found zero prices" : "All prices > 0",
        functionName: "zero value detection",
        severity: hasZeroPrices ? "medium" : "low",
      });

      // 11. PERFORMANCE TESTS
      const slowLoadingHooks = [];
      if (tokenContextLoading) slowLoadingHooks.push("useToken");
      if (tradesLoading) slowLoadingHooks.push("useTokenTrades");
      if (tokenStats.loading) slowLoadingHooks.push("useTokenStats");

      testResults.push({
        section: "Performance",
        test: "Hook loading performance",
        status: slowLoadingHooks.length === 0 ? "pass" : "warning",
        expected: "All hooks loaded",
        actual:
          slowLoadingHooks.length === 0
            ? "All loaded"
            : `${slowLoadingHooks.join(", ")} still loading`,
        functionName: "loading state analysis",
        severity: slowLoadingHooks.length > 2 ? "medium" : "low",
      });

      // 12. TYPE SAFETY TESTS
      testResults.push({
        section: "Type Safety",
        test: "Factory address type validation",
        status: typeof FACTORY_ADDRESS === "string" ? "pass" : "fail",
        expected: "string",
        actual: typeof FACTORY_ADDRESS,
        functionName: "typeof FACTORY_ADDRESS",
        severity: "high",
      });

      if (factoryCurrentPrice) {
        testResults.push({
          section: "Type Safety",
          test: "Current price type validation",
          status: typeof factoryCurrentPrice === "bigint" ? "pass" : "fail",
          expected: "bigint",
          actual: typeof factoryCurrentPrice,
          functionName: "typeof useCurrentPrice result",
          severity: "medium",
        });
      }

      // 13. SYMMETRY & ARBITRAGE TESTS
      if (buyEffectivePrice && sellEffectivePrice) {
        const asymmetry =
          Math.abs(buyEffectivePrice - sellEffectivePrice) / sellEffectivePrice;
        testResults.push({
          section: "Arbitrage Detection",
          test: "Buy/Sell price symmetry",
          status:
            asymmetry < 0.05 ? "pass" : asymmetry < 0.15 ? "warning" : "fail",
          expected: "< 5% difference",
          actual: `${(asymmetry * 100).toFixed(2)}% difference`,
          functionName: "price symmetry calculation",
          message: `Buy: ${buyEffectivePrice.toFixed(
            12
          )}, Sell: ${sellEffectivePrice.toFixed(12)}`,
          severity:
            asymmetry > 0.15 ? "high" : asymmetry > 0.05 ? "medium" : "low",
        });
      }
    } catch (error) {
      testResults.push({
        section: "Test Runner",
        test: "Test execution",
        status: "fail",
        expected: "No errors",
        actual: error instanceof Error ? error.message : "Unknown error",
        functionName: "runAllTests",
        severity: "critical",
      });
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Add execution summary with severity analysis
    const passCount = testResults.filter((r) => r.status === "pass").length;
    const failCount = testResults.filter((r) => r.status === "fail").length;
    const warningCount = testResults.filter(
      (r) => r.status === "warning"
    ).length;
    const deprecatedCount = testResults.filter(
      (r) => r.status === "deprecated"
    ).length;

    const criticalIssues = testResults.filter(
      (r) => r.severity === "critical" && r.status === "fail"
    ).length;
    const highIssues = testResults.filter(
      (r) => r.severity === "high" && r.status === "fail"
    ).length;

    // Fix: Use different variable name to avoid redeclaration
    const testFailures = testResults.filter(
      (r) => r.status === "fail" && r.section !== "Summary"
    );

    testResults.push({
      section: "Summary",
      test: "Test execution summary",
      status:
        testFailures.length === 0
          ? "pass"
          : criticalIssues > 0
          ? "fail"
          : "warning",
      expected: "All tests pass",
      actual: `${passCount} pass, ${testFailures.length} fail, ${warningCount} warning, ${deprecatedCount} deprecated`,
      executionTime,
      message: `Completed in ${executionTime}ms. Actual failures: ${
        testFailures.map((f) => f.test).join(", ") || "None"
      }`,
      severity:
        criticalIssues > 0 ? "critical" : highIssues > 0 ? "high" : "low",
    });

    setResults(testResults);

    // Generate enhanced JSON output with categorization
    const jsonData = {
      timestamp: new Date().toISOString(),
      testToken,
      userAddress,
      executionTimeMs: executionTime,
      summary: {
        total: testResults.length - 1,
        pass: passCount,
        fail: testFailures.length, // Only count real failures, not summary
        warning: warningCount,
        deprecated: deprecatedCount,
        severityBreakdown: {
          critical: testResults.filter(
            (r) => r.severity === "critical" && r.status === "fail"
          ).length,
          high: testResults.filter(
            (r) => r.severity === "high" && r.status === "fail"
          ).length,
          medium: testResults.filter(
            (r) => r.severity === "medium" && r.status === "fail"
          ).length,
          low: testResults.filter(
            (r) => r.severity === "low" && r.status === "fail"
          ).length,
        },
      },
      actualFailures: testFailures,
      deprecatedHooks: testResults.filter((r) => r.status === "deprecated"),
      criticalIssues: testResults.filter(
        (r) => r.severity === "critical" && r.status === "fail"
      ),
      results: testResults,
    };

    setJsonOutput(JSON.stringify(jsonData, null, 2));
    setIsRunning(false);

    // Enhanced toast notification
    const realFailures = testFailures.length;
    const toastVariant =
      criticalIssues > 0
        ? "destructive"
        : realFailures > 0
        ? "default"
        : "default";

    toast({
      title:
        realFailures === 0
          ? "Tests completed successfully!"
          : `${realFailures} test(s) failed`,
      description:
        realFailures === 0
          ? `${passCount} passed, ${warningCount} warnings, ${deprecatedCount} deprecated hooks to migrate`
          : `Failed: ${testFailures.map((f) => f.test).join(", ")}`,
      variant: toastVariant,
    });
  };

  const calculatePriceVariance = (prices: number[]): number => {
    if (prices.length < 2) return 0;
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return Math.max(...prices.map((p) => Math.abs(p - avg) / avg));
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      toast({
        title: "Copied to clipboard",
        description: "Test results copied as JSON",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const downloadResults = () => {
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug-test-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string, severity?: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "deprecated":
        return <Info className="h-4 w-4 text-orange-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 font-bold";
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card className="border-2 border-blue-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-blue-500" />
          Enhanced Debug Test Runner
          {results.length > 0 && (
            <div className="flex gap-2">
              <Badge
                variant={
                  results.some((r) => r.status === "fail") ||
                  results.some((r) => r.severity === "critical")
                    ? "destructive"
                    : results.some((r) => r.status === "warning") ||
                      results.some((r) => r.status === "deprecated")
                    ? "secondary"
                    : "default"
                }
              >
                {results.filter((r) => r.status === "pass").length} /{" "}
                {results.length - 1} passed
              </Badge>
              {results.some((r) => r.status === "deprecated") && (
                <Badge variant="outline" className="text-orange-600">
                  {results.filter((r) => r.status === "deprecated").length}{" "}
                  deprecated
                </Badge>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runAllTests} disabled={isRunning} className="gap-2">
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Enhanced Tests
              </>
            )}
          </Button>

          {jsonOutput && (
            <>
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy JSON
              </Button>
              <Button
                onClick={downloadResults}
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </>
          )}
        </div>

        {/* Results Display */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Test Results (Enhanced):</h4>
              {results.map((result, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 bg-muted rounded text-sm border-l-4 ${
                    result.severity === "critical"
                      ? "border-red-600"
                      : result.severity === "high"
                      ? "border-red-400"
                      : result.severity === "medium"
                      ? "border-yellow-400"
                      : result.status === "deprecated"
                      ? "border-orange-400"
                      : "border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status, result.severity)}

                    <div>
                      <div className="font-medium">
                        {result.section}: {result.test}
                        {result.severity && (
                          <span
                            className={`ml-2 text-xs ${getSeverityColor(
                              result.severity
                            )}`}
                          >
                            [{result.severity.toUpperCase()}]
                          </span>
                        )}
                      </div>
                      {result.functionName && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {result.functionName}
                        </div>
                      )}
                      {result.status === "deprecated" && (
                        <div className="text-xs text-orange-600 mt-1">
                          ⚠️ This hook is deprecated and should be replaced
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div>Expected: {result.expected}</div>
                    <div>Actual: {result.actual}</div>
                    {result.message && (
                      <div className="text-muted-foreground mt-1">
                        {result.message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-medium mb-2">Enhanced JSON Output:</h4>
              <Textarea
                value={jsonOutput}
                readOnly
                className="font-mono text-xs h-48"
                placeholder="Run tests to see enhanced JSON output..."
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
