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

// FIXED IMPORTS - Updated to use final-hooks exclusively
import { useFactoryContract } from "@/final-hooks/useFactoryContract";
import { useTokenData } from "@/final-hooks/useTokenData";
import { useTrades } from "@/final-hooks/useTrades";
import { useUnifiedTokenPrice } from "@/final-hooks/useUnifiedTokenPrice";
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

export function EnhancedDebugTestRunner({ testToken }: DebugTestRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [jsonOutput, setJsonOutput] = useState("");
  const { toast } = useToast();
  const { address: userAddress } = useAccount();

  // FIXED: Updated to use final-hooks exclusively
  const tokenAddress = testToken as Address;
  const {
    usePrice,
    useCollateral,
    useTokenState,
    useCalculateTokens,
    useCalculateBuyPrice,
    useCalculateSellPrice,
    formatValue,
  } = useFactoryContract();

  // Use unified token data hook instead of old context
  const {
    token: tokenData,
    isLoading: tokenLoading,
    error: tokenError,
    statistics,
    hasFirestoreData,
    hasContractData,
  } = useTokenData(tokenAddress);

  // Get contract data directly
  const { price: contractPrice, isLoading: priceLoading } =
    usePrice(tokenAddress);
  const { collateral: contractCollateral, isLoading: collateralLoading } =
    useCollateral(tokenAddress);
  const { state: contractState, isLoading: stateLoading } =
    useTokenState(tokenAddress);

  // Get unified price data
  const {
    formatted: unifiedPrice,
    raw: rawPrice,
    wei: priceWei,
    isLoading: unifiedPriceLoading,
  } = useUnifiedTokenPrice(tokenAddress);

  // Get trades data
  const {
    trades,
    loading: tradesLoading,
    analytics: tradeAnalytics,
  } = useTrades(tokenAddress);

  // Test calculation functions
  const { tokenAmount: calculateTokensResult } = useCalculateTokens(
    tokenAddress,
    "1.0"
  );
  const { ethAmount: calculateBuyResult } = useCalculateBuyPrice(
    tokenAddress,
    "1000"
  );
  const { ethAmount: calculateSellResult } = useCalculateSellPrice(
    tokenAddress,
    "1000"
  );

  const runDebugTests = async () => {
    if (!testToken || !isAddress(testToken)) {
      toast({
        title: "Invalid Token",
        description: "Please provide a valid token address",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    const testResults: TestResult[] = [];
    const startTime = Date.now();

    try {
      // Test 1: Basic Token Data Validation
      testResults.push({
        section: "Token Data",
        test: "Token exists in Firestore",
        status: hasFirestoreData ? "pass" : "fail",
        expected: "Token should exist in database",
        actual: hasFirestoreData ? "Found" : "Not found",
        message: hasFirestoreData
          ? "Token metadata loaded successfully"
          : "Token not found in Firestore",
        executionTime: Date.now() - startTime,
        severity: hasFirestoreData ? "low" : "high",
      });

      testResults.push({
        section: "Token Data",
        test: "Contract data available",
        status: hasContractData ? "pass" : "fail",
        expected: "Contract should respond",
        actual: hasContractData ? "Available" : "Unavailable",
        message: hasContractData
          ? "Contract data loaded successfully"
          : "Contract data unavailable",
        executionTime: Date.now() - startTime,
        severity: hasContractData ? "low" : "high",
      });

      // Test 2: Token Metadata
      if (tokenData) {
        testResults.push({
          section: "Token Data",
          test: "Token name validation",
          status: tokenData.name ? "pass" : "fail",
          expected: "Non-empty name",
          actual: tokenData.name || "Empty",
          message: tokenData.name
            ? `Name: ${tokenData.name}`
            : "Token name is missing",
          executionTime: Date.now() - startTime,
          severity: "medium",
        });

        testResults.push({
          section: "Token Data",
          test: "Token symbol validation",
          status: tokenData.symbol ? "pass" : "fail",
          expected: "Non-empty symbol",
          actual: tokenData.symbol || "Empty",
          message: tokenData.symbol
            ? `Symbol: ${tokenData.symbol}`
            : "Token symbol is missing",
          executionTime: Date.now() - startTime,
          severity: "medium",
        });
      }

      // Test 3: Price Data Validation
      testResults.push({
        section: "Price Data",
        test: "Unified price loading",
        status: unifiedPriceLoading
          ? "pending"
          : unifiedPrice !== "0.000000"
          ? "pass"
          : "warning",
        expected: "Price > 0",
        actual: unifiedPrice,
        message: unifiedPriceLoading
          ? "Loading..."
          : `Current price: ${unifiedPrice} AVAX`,
        functionName: "useUnifiedTokenPrice",
        executionTime: Date.now() - startTime,
        severity: "medium",
      });

      testResults.push({
        section: "Price Data",
        test: "Raw contract price",
        status: priceLoading ? "pending" : contractPrice ? "pass" : "fail",
        expected: "Contract price available",
        actual: contractPrice ? formatValue(contractPrice) : "None",
        message: priceLoading
          ? "Loading..."
          : `Contract price: ${
              contractPrice ? formatValue(contractPrice) : "0"
            } AVAX`,
        functionName: "usePrice",
        executionTime: Date.now() - startTime,
        severity: "medium",
      });

      // Test 4: Contract State
      testResults.push({
        section: "Contract Data",
        test: "Contract state",
        status: stateLoading
          ? "pending"
          : contractState !== undefined
          ? "pass"
          : "fail",
        expected: "Valid state number",
        actual: contractState?.toString() || "undefined",
        message: stateLoading
          ? "Loading..."
          : `State: ${contractState} (${getStateName(contractState)})`,
        functionName: "useTokenState",
        executionTime: Date.now() - startTime,
        severity: "medium",
      });

      testResults.push({
        section: "Contract Data",
        test: "Collateral amount",
        status: collateralLoading
          ? "pending"
          : contractCollateral
          ? "pass"
          : "warning",
        expected: "Collateral >= 0",
        actual: contractCollateral ? formatValue(contractCollateral) : "0",
        message: collateralLoading
          ? "Loading..."
          : `Collateral: ${
              contractCollateral ? formatValue(contractCollateral) : "0"
            } AVAX`,
        functionName: "useCollateral",
        executionTime: Date.now() - startTime,
        severity: "low",
      });

      // Test 5: Calculation Functions
      testResults.push({
        section: "Calculations",
        test: "Calculate tokens for 1 AVAX",
        status: calculateTokensResult ? "pass" : "fail",
        expected: "Tokens > 0",
        actual: calculateTokensResult
          ? formatEther(calculateTokensResult)
          : "0",
        message: calculateTokensResult
          ? `1 AVAX buys ${formatEther(calculateTokensResult)} tokens`
          : "Calculation failed",
        functionName: "useCalculateTokens",
        executionTime: Date.now() - startTime,
        severity: "medium",
      });

      testResults.push({
        section: "Calculations",
        test: "Calculate buy price for 1000 tokens",
        status: calculateBuyResult ? "pass" : "fail",
        expected: "ETH cost > 0",
        actual: calculateBuyResult ? formatEther(calculateBuyResult) : "0",
        message: calculateBuyResult
          ? `1000 tokens cost ${formatEther(calculateBuyResult)} AVAX`
          : "Calculation failed",
        functionName: "useCalculateBuyPrice",
        executionTime: Date.now() - startTime,
        severity: "medium",
      });

      testResults.push({
        section: "Calculations",
        test: "Calculate sell price for 1000 tokens",
        status: calculateSellResult ? "pass" : "fail",
        expected: "ETH received > 0",
        actual: calculateSellResult ? formatEther(calculateSellResult) : "0",
        message: calculateSellResult
          ? `1000 tokens sell for ${formatEther(calculateSellResult)} AVAX`
          : "Calculation failed",
        functionName: "useCalculateSellPrice",
        executionTime: Date.now() - startTime,
        severity: "medium",
      });

      // Test 6: Trades Data
      testResults.push({
        section: "Trades Data",
        test: "Trades loading",
        status: tradesLoading ? "pending" : "pass",
        expected: "Trades loaded",
        actual: `${trades.length} trades`,
        message: tradesLoading
          ? "Loading trades..."
          : `Found ${trades.length} trades`,
        functionName: "useTrades",
        executionTime: Date.now() - startTime,
        severity: "low",
      });

      if (tradeAnalytics) {
        testResults.push({
          section: "Trades Data",
          test: "Trade analytics",
          status: "pass",
          expected: "Analytics available",
          actual: `${tradeAnalytics.tradeCount} trades, ${tradeAnalytics.totalVolume} AVAX volume`,
          message: `Buy pressure: ${(tradeAnalytics.buyPressure * 100).toFixed(
            1
          )}%`,
          functionName: "useTrades",
          executionTime: Date.now() - startTime,
          severity: "low",
        });
      }

      // Test 7: Data Consistency
      if (tokenData && unifiedPrice && contractPrice) {
        const unifiedPriceNum = parseFloat(unifiedPrice);
        const contractPriceNum = parseFloat(formatValue(contractPrice));
        const priceDiff =
          Math.abs(unifiedPriceNum - contractPriceNum) / contractPriceNum;

        testResults.push({
          section: "Data Consistency",
          test: "Price consistency",
          status: priceDiff < 0.01 ? "pass" : "warning",
          expected: "Unified and contract prices should match",
          actual: `Diff: ${(priceDiff * 100).toFixed(2)}%`,
          message:
            priceDiff < 0.01
              ? "Prices are consistent"
              : "Price sources may be out of sync",
          executionTime: Date.now() - startTime,
          severity: priceDiff < 0.01 ? "low" : "medium",
        });
      }

      // Test 8: Statistics
      if (statistics) {
        testResults.push({
          section: "Statistics",
          test: "Token statistics",
          status: "pass",
          expected: "Statistics available",
          actual: `Volume: ${statistics.volumeETH} AVAX, Holders: ${statistics.uniqueHolders}`,
          message: `Trade count: ${statistics.tradeCount}`,
          executionTime: Date.now() - startTime,
          severity: "low",
        });
      }
    } catch (error) {
      testResults.push({
        section: "Error",
        test: "Test execution",
        status: "fail",
        expected: "No errors",
        actual: error instanceof Error ? error.message : "Unknown error",
        message: "An error occurred during testing",
        executionTime: Date.now() - startTime,
        severity: "critical",
      });
    }

    setResults(testResults);

    // Generate JSON output
    const output = {
      timestamp: new Date().toISOString(),
      tokenAddress: testToken,
      totalTests: testResults.length,
      passed: testResults.filter((r) => r.status === "pass").length,
      failed: testResults.filter((r) => r.status === "fail").length,
      warnings: testResults.filter((r) => r.status === "warning").length,
      executionTime: Date.now() - startTime,
      results: testResults,
      summary: {
        tokenData: !!tokenData,
        hasFirestoreData,
        hasContractData,
        unifiedPrice,
        contractPrice: contractPrice ? formatValue(contractPrice) : "0",
        tradesCount: trades.length,
        userAddress,
      },
    };

    setJsonOutput(JSON.stringify(output, null, 2));
    setIsRunning(false);

    toast({
      title: "Debug Tests Complete",
      description: `${output.passed} passed, ${output.failed} failed, ${output.warnings} warnings`,
      variant: output.failed > 0 ? "destructive" : "default",
    });
  };

  const getStateName = (state: number | undefined): string => {
    if (state === undefined) return "Unknown";
    const states = [
      "NOT_CREATED",
      "TRADING",
      "GOAL_REACHED",
      "HALTED",
      "RESUMED",
    ];
    return states[state] || "Unknown";
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "deprecated":
        return <Info className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "pass":
        return "bg-green-100 text-green-800 border-green-200";
      case "fail":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "deprecated":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      toast({
        title: "Copied!",
        description: "Test results copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadResults = () => {
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug-results-${testToken}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.section]) {
      acc[result.section] = [];
    }
    acc[result.section].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Enhanced Debug Test Runner (Final-Hooks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={runDebugTests}
              disabled={isRunning || !testToken}
              className="gap-2"
            >
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
                  Copy Results
                </Button>
                <Button
                  onClick={downloadResults}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download JSON
                </Button>
              </>
            )}
          </div>

          {!testToken && (
            <div className="text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              Please provide a token address in the URL (?token=0x...)
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          {Object.entries(groupedResults).map(([section, sectionResults]) => (
            <Card key={section}>
              <CardHeader>
                <CardTitle className="text-lg">{section}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sectionResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      {getStatusIcon(result.status)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.test}</span>
                          <Badge className={getStatusColor(result.status)}>
                            {result.status}
                          </Badge>
                          {result.functionName && (
                            <Badge variant="outline" className="text-xs">
                              {result.functionName}
                            </Badge>
                          )}
                        </div>
                        {result.message && (
                          <p className="text-sm text-muted-foreground">
                            {result.message}
                          </p>
                        )}
                        <div className="text-xs space-y-1">
                          {result.expected && (
                            <div>
                              <strong>Expected:</strong> {result.expected}
                            </div>
                          )}
                          {result.actual && (
                            <div>
                              <strong>Actual:</strong> {result.actual}
                            </div>
                          )}
                          {result.executionTime && (
                            <div>
                              <strong>Time:</strong> {result.executionTime}ms
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {jsonOutput && (
        <Card>
          <CardHeader>
            <CardTitle>JSON Output</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jsonOutput}
              readOnly
              className="min-h-[300px] font-mono text-xs"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
