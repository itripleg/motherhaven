// app/debug/components/DebugTestRunner.tsx

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
} from "lucide-react";
import { parseEther, formatEther, Address, isAddress } from "viem";
import { useReadContract, useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";

// Import all hooks to test
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { useToken } from "@/contexts/TokenContext";
import { useTokenTrades } from "@/new-hooks/useTokenTrades";
import { useUnifiedTokenPrice } from "@/hooks/token/useUnifiedTokenPrice";
import { useRealtimeTokenPrice } from "@/hooks/token/useRealtimeTokenPrices";
import { useTokenStats } from "@/hooks/token/useTokenStats";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";

interface DebugTestRunnerProps {
  testToken?: string;
}

interface TestResult {
  section: string;
  test: string;
  status: "pass" | "fail" | "warning" | "pending";
  expected?: any;
  actual?: any;
  message?: string;
  functionName?: string;
  executionTime?: number;
}

export function DebugTestRunner({ testToken }: DebugTestRunnerProps) {
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
      // 1. ENVIRONMENT TESTS
      testResults.push({
        section: "Environment",
        test: "User wallet connection",
        status: userAddress ? "pass" : "fail",
        expected: "Connected wallet address",
        actual: userAddress || "Not connected",
        functionName: "useAccount",
      });

      testResults.push({
        section: "Environment",
        test: "Test token address validation",
        status: testToken && isAddress(testToken) ? "pass" : "fail",
        expected: "Valid Ethereum address",
        actual: testToken || "Not provided",
        functionName: "isAddress",
      });

      testResults.push({
        section: "Environment",
        test: "Factory contract address",
        status: FACTORY_ADDRESS && isAddress(FACTORY_ADDRESS) ? "pass" : "fail",
        expected: "Valid factory address",
        actual: FACTORY_ADDRESS,
        functionName: "FACTORY_ADDRESS constant",
      });

      // 2. PRICE SOURCE TESTS
      const priceTests = [
        {
          name: "Factory Contract Price",
          value: factoryCurrentPrice ? formatEther(factoryCurrentPrice) : null,
          functionName: "useCurrentPrice",
          hook: "useFactoryContract",
        },
        {
          name: "Unified Price Hook",
          value: unifiedPrice.raw,
          functionName: "useUnifiedTokenPrice",
          hook: "useUnifiedTokenPrice",
        },
        {
          name: "Realtime Price Hook",
          value: realtimePrice.raw,
          functionName: "useRealtimeTokenPrice",
          hook: "useRealtimeTokenPrice",
        },
        {
          name: "Token Stats Price",
          value: tokenStats.currentPrice,
          functionName: "useTokenStats",
          hook: "useTokenStats",
        },
        {
          name: "Token Context Price",
          value: tokenContextData?.currentPrice,
          functionName: "useToken",
          hook: "useToken",
        },
      ];

      const validPrices = priceTests.filter(
        (p) => p.value && Number(p.value) > 0
      );
      const priceVariance =
        validPrices.length > 1
          ? calculatePriceVariance(validPrices.map((p) => Number(p.value)))
          : 0;

      priceTests.forEach((test) => {
        testResults.push({
          section: "Price Sources",
          test: test.name,
          status: test.value && Number(test.value) > 0 ? "pass" : "fail",
          expected: "> 0 AVAX",
          actual: test.value || "null/undefined",
          functionName: test.functionName,
          message: test.hook,
        });
      });

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
      });

      // 3. TRADING CALCULATION TESTS
      const buyEffectivePrice = buyTokensResult
        ? Number(TEST_BUY_AMOUNT) / Number(formatEther(buyTokensResult))
        : null;

      const sellEffectivePrice = sellAvaxResult
        ? Number(formatEther(sellAvaxResult)) / Number(TEST_SELL_AMOUNT)
        : null;

      testResults.push({
        section: "Trading Calculations",
        test: "Buy calculation response",
        status: buyTokensResult ? "pass" : "fail",
        expected: "> 0 tokens",
        actual: buyTokensResult ? formatEther(buyTokensResult) : "null",
        functionName: "calculateTokenAmount",
      });

      testResults.push({
        section: "Trading Calculations",
        test: "Sell calculation response",
        status: sellAvaxResult ? "pass" : "fail",
        expected: "> 0 AVAX",
        actual: sellAvaxResult ? formatEther(sellAvaxResult) : "null",
        functionName: "calculateSellPrice",
      });

      if (buyEffectivePrice && sellEffectivePrice) {
        const asymmetry =
          Math.abs(buyEffectivePrice - sellEffectivePrice) / sellEffectivePrice;
        testResults.push({
          section: "Trading Calculations",
          test: "Buy/Sell price symmetry",
          status:
            asymmetry < 0.05 ? "pass" : asymmetry < 0.15 ? "warning" : "fail",
          expected: "< 5% difference",
          actual: `${(asymmetry * 100).toFixed(2)}% difference`,
          functionName: "price symmetry calculation",
          message: `Buy: ${buyEffectivePrice.toFixed(
            12
          )}, Sell: ${sellEffectivePrice.toFixed(12)}`,
        });
      }

      // 4. DATA CONSISTENCY TESTS
      testResults.push({
        section: "Data Consistency",
        test: "Token context loading state",
        status: !tokenContextLoading ? "pass" : "pending",
        expected: "false",
        actual: tokenContextLoading.toString(),
        functionName: "useToken loading",
      });

      testResults.push({
        section: "Data Consistency",
        test: "Trades data loading state",
        status: !tradesLoading ? "pass" : "pending",
        expected: "false",
        actual: tradesLoading.toString(),
        functionName: "useTokenTrades loading",
      });

      if (tokenContextData) {
        const requiredFields = ["name", "symbol", "address", "currentPrice"];
        requiredFields.forEach((field) => {
          testResults.push({
            section: "Data Consistency",
            test: `Token context has ${field}`,
            status: tokenContextData[field] ? "pass" : "fail",
            expected: "truthy value",
            actual: tokenContextData[field] || "null/undefined",
            functionName: `useToken.${field}`,
          });
        });
      }

      // 5. TYPE INTERFACE TESTS
      testResults.push({
        section: "Type Validation",
        test: "Factory address type",
        status: typeof FACTORY_ADDRESS === "string" ? "pass" : "fail",
        expected: "string",
        actual: typeof FACTORY_ADDRESS,
        functionName: "typeof FACTORY_ADDRESS",
      });

      if (factoryCurrentPrice) {
        testResults.push({
          section: "Type Validation",
          test: "Current price type",
          status: typeof factoryCurrentPrice === "bigint" ? "pass" : "fail",
          expected: "bigint",
          actual: typeof factoryCurrentPrice,
          functionName: "typeof useCurrentPrice result",
        });
      }

      // 6. ROUNDTRIP TEST
      if (buyTokensResult && sellAvaxResult) {
        const tokensFromBuy = Number(formatEther(buyTokensResult));

        // Calculate what we'd get selling those tokens
        const { data: roundtripSell } = await new Promise((resolve) => {
          // This is a simplified test - in reality you'd need to make another contract call
          const estimatedReturn =
            Number(formatEther(sellAvaxResult)) *
            (tokensFromBuy / Number(TEST_SELL_AMOUNT));
          resolve({ data: parseEther(estimatedReturn.toString()) });
        });

        if (roundtripSell) {
          const roundtripReturn = Number(formatEther(roundtripSell.data));
          const roundtripLoss =
            (Number(TEST_BUY_AMOUNT) - roundtripReturn) /
            Number(TEST_BUY_AMOUNT);

          testResults.push({
            section: "Roundtrip Test",
            test: "Buy then sell roundtrip",
            status:
              roundtripLoss < 0.1
                ? "pass"
                : roundtripLoss < 0.2
                ? "warning"
                : "fail",
            expected: "< 10% loss",
            actual: `${(roundtripLoss * 100).toFixed(2)}% loss`,
            functionName: "roundtrip calculation",
            message: `${TEST_BUY_AMOUNT} AVAX → ${tokensFromBuy.toFixed(
              0
            )} tokens → ${roundtripReturn.toFixed(6)} AVAX`,
          });
        }
      }
    } catch (error) {
      testResults.push({
        section: "Test Runner",
        test: "Test execution",
        status: "fail",
        expected: "No errors",
        actual: error instanceof Error ? error.message : "Unknown error",
        functionName: "runAllTests",
      });
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Add execution summary
    const passCount = testResults.filter((r) => r.status === "pass").length;
    const failCount = testResults.filter((r) => r.status === "fail").length;
    const warningCount = testResults.filter(
      (r) => r.status === "warning"
    ).length;

    testResults.push({
      section: "Summary",
      test: "Test execution summary",
      status: failCount === 0 ? "pass" : "warning",
      expected: "All tests pass",
      actual: `${passCount} pass, ${failCount} fail, ${warningCount} warning`,
      executionTime,
      message: `Completed in ${executionTime}ms`,
    });

    setResults(testResults);

    // Generate JSON output
    const jsonData = {
      timestamp: new Date().toISOString(),
      testToken,
      userAddress,
      executionTimeMs: executionTime,
      summary: {
        total: testResults.length - 1, // Exclude summary itself
        pass: passCount,
        fail: failCount,
        warning: warningCount,
      },
      results: testResults,
    };

    setJsonOutput(JSON.stringify(jsonData, null, 2));
    setIsRunning(false);

    toast({
      title: "Tests completed",
      description: `${passCount} passed, ${failCount} failed, ${warningCount} warnings`,
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

  return (
    <Card className="border-2 border-blue-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-blue-500" />
          Debug Test Runner
          {results.length > 0 && (
            <Badge
              variant={
                results.some((r) => r.status === "fail")
                  ? "destructive"
                  : results.some((r) => r.status === "warning")
                  ? "secondary"
                  : "default"
              }
            >
              {results.filter((r) => r.status === "pass").length} /{" "}
              {results.length - 1} passed
            </Badge>
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
                Run All Tests
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
              <h4 className="font-medium">Test Results:</h4>
              {results.map((result, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                >
                  <div className="flex items-center gap-3">
                    {result.status === "pass" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {result.status === "fail" && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    {result.status === "warning" && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    {result.status === "pending" && (
                      <Clock className="h-4 w-4 text-gray-500" />
                    )}

                    <div>
                      <div className="font-medium">
                        {result.section}: {result.test}
                      </div>
                      {result.functionName && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {result.functionName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div>Expected: {result.expected}</div>
                    <div>Actual: {result.actual}</div>
                    {result.message && (
                      <div className="text-muted-foreground">
                        {result.message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-medium mb-2">JSON Output:</h4>
              <Textarea
                value={jsonOutput}
                readOnly
                className="font-mono text-xs h-40"
                placeholder="Run tests to see JSON output..."
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
