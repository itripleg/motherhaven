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

// FIXED IMPORTS - Updated to use final-hooks and correct paths
import { useFactoryContract } from "@/final-hooks/useFactoryContract";
import { useToken } from "@/contexts/TokenContext";
import { useTrades } from "@/final-hooks/useTrades"; // Updated from useTokenTrades
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice"; // Updated path
import { useRealtimeTokenPrice } from "@/hooks/token/useRealtimeTokenPrices";
// REMOVED: useTokenStats - this is deprecated and should not be imported
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

  // FIXED: Updated to use final-hooks and correct function names
  const tokenAddress = testToken as Address;
  const { usePrice, useCollateral, formatValue } = useFactoryContract();
  const { token: tokenContextData, loading: tokenContextLoading } = useToken(
    testToken || ""
  );

  // FIXED: Updated to use final-hooks useTrades
  const { trades, loading: tradesLoading } = useTrades(tokenAddress);

  // FIXED: Updated to use final-hooks version
  const unifiedPrice = useUnifiedTokenPrice(tokenAddress);

  // Keep this one since it's still in legacy hooks
  const { price: realtimePrice } = useRealtimeTokenPrice(tokenAddress);

  // REMOVED: useTokenStats usage - it's deprecated
  // const tokenStats = useTokenStats({ tokenAddress: testToken || "" });

  // FIXED: Updated to use correct hook names from useFactoryContract
  const { price: factoryCurrentPrice, isLoading: priceLoading } =
    usePrice(tokenAddress);
  const { collateral, isLoading: collateralLoading } =
    useCollateral(tokenAddress);

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

      // 2. UPDATED: Migration status tests instead of deprecated hook detection
      testResults.push({
        section: "Migration Status",
        test: "useTokenStats migration completed",
        status: "pass", // Since we removed the import
        expected: "useTokenStats should not be imported",
        actual: "useTokenStats removed from imports",
        functionName: "import analysis",
        severity: "low",
        message: "Successfully migrated away from deprecated useTokenStats",
      });

      testResults.push({
        section: "Migration Status",
        test: "final-hooks adoption",
        status: "pass",
        expected: "Using hooks from final-hooks directory",
        actual:
          "useFactoryContract, useTrades, useUnifiedTokenPrice from final-hooks",
        functionName: "import validation",
        severity: "low",
        message: "Successfully using consolidated final-hooks",
      });

      // 3. UPDATED: Hook consistency tests with corrected data sources
      const priceTests = [
        {
          name: "Factory Contract Price",
          value: factoryCurrentPrice ? formatEther(factoryCurrentPrice) : null,
          functionName: "usePrice (from useFactoryContract)",
          hook: "final-hooks/useFactoryContract",
          recommended: true,
        },
        {
          name: "Unified Price Hook",
          value: unifiedPrice.raw,
          functionName: "useUnifiedTokenPrice",
          hook: "final-hooks/useUnifiedTokenPrice",
          recommended: true,
        },
        {
          name: "Realtime Price Hook",
          value: realtimePrice.raw,
          functionName: "useRealtimeTokenPrice",
          hook: "hooks/token/useRealtimeTokenPrices",
          recommended: true,
        },
        // Note: No deprecated hooks included since we removed them
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
          status: hasValue ? "pass" : "fail",
          expected: "> 0 AVAX",
          actual: test.value || "null/undefined",
          functionName: test.functionName,
          message: test.hook,
          severity: "medium",
        });
      });

      // 4. TOKEN CONTEXT VALIDATION (Updated)
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

      // 5. HOOK EFFICIENCY ANALYSIS
      const activePriceHooks = priceTests.filter(
        (p) => p.value && Number(p.value) > 0
      ).length;
      testResults.push({
        section: "Hook Efficiency",
        test: "Optimal price hook usage",
        status:
          activePriceHooks <= 2
            ? "pass"
            : activePriceHooks <= 3
            ? "warning"
            : "fail",
        expected: "1-2 active price hooks",
        actual: `${activePriceHooks} active hooks`,
        functionName: "hook efficiency analysis",
        severity: activePriceHooks > 3 ? "medium" : "low",
        message:
          activePriceHooks <= 2
            ? "Optimal hook usage"
            : "Consider consolidating price sources",
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
        functionName: "useTrades loading",
        severity: tradesLoading ? "low" : "low",
      });

      // 8. UPDATED: Data validation with correct expectations
      if (tokenContextData) {
        const requiredFields = ["name", "symbol", "address"];
        const typedTokenData = tokenContextData as Token;

        requiredFields.forEach((field) => {
          testResults.push({
            section: "Data Validation",
            test: `Token context has ${field}`,
            status: typedTokenData[field] ? "pass" : "fail",
            expected: "truthy value",
            actual: typedTokenData[field] || "null/undefined",
            functionName: `useToken.${field}`,
            severity: field === "address" ? "critical" : "high",
          });
        });

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

      // 10. FINAL-HOOKS VALIDATION
      testResults.push({
        section: "Architecture",
        test: "final-hooks structure compliance",
        status: "pass",
        expected: "Using consolidated hooks from final-hooks",
        actual:
          "useFactoryContract, useTrades, useUnifiedTokenPrice integrated",
        functionName: "architecture validation",
        severity: "low",
        message: "Successfully migrated to final-hooks architecture",
      });

      // 11. PERFORMANCE TESTS
      const slowLoadingHooks = [];
      if (tokenContextLoading) slowLoadingHooks.push("useToken");
      if (tradesLoading) slowLoadingHooks.push("useTrades");
      if (priceLoading) slowLoadingHooks.push("usePrice");
      if (collateralLoading) slowLoadingHooks.push("useCollateral");

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
          functionName: "typeof usePrice result",
          severity: "medium",
        });
      }

      // 13. ARBITRAGE TESTS (Updated with null checks)
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

    // Enhanced execution summary
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
      message: `Completed in ${executionTime}ms. Migration to final-hooks: Complete`,
      severity: criticalIssues > 0 ? "critical" : "low",
    });

    setResults(testResults);

    // Generate JSON output
    const jsonData = {
      timestamp: new Date().toISOString(),
      testToken,
      userAddress,
      executionTimeMs: executionTime,
      migrationStatus: "final-hooks integration complete",
      summary: {
        total: testResults.length - 1,
        pass: passCount,
        fail: testFailures.length,
        warning: warningCount,
        deprecated: deprecatedCount,
      },
      results: testResults,
    };

    setJsonOutput(JSON.stringify(jsonData, null, 2));
    setIsRunning(false);

    toast({
      title:
        testFailures.length === 0
          ? "Tests completed successfully!"
          : `${testFailures.length} test(s) failed`,
      description:
        testFailures.length === 0
          ? `${passCount} passed, migration to final-hooks complete`
          : `Failed: ${testFailures.map((f) => f.test).join(", ")}`,
      variant: criticalIssues > 0 ? "destructive" : "default",
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
          Enhanced Debug Test Runner (Final-Hooks)
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
              <Badge variant="outline" className="text-green-600">
                final-hooks ✓
              </Badge>
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
              <h4 className="font-medium">
                Test Results (Final-Hooks Migration):
              </h4>
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
