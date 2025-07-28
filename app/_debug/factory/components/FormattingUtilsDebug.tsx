// app/_debug/factory/components/FormattingUtilsDebug.tsx

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity } from "lucide-react";
import { useFactoryContract } from "@/final-hooks/useFactoryContract";

interface FormattingUtilsDebugProps {
  refreshKey: number;
}

export function FormattingUtilsDebug({
  refreshKey,
}: FormattingUtilsDebugProps) {
  const { formatValue } = useFactoryContract();
  const [testValue, setTestValue] = useState("1000000000000000000"); // 1 ETH in wei

  const testValues = [
    { label: "0 Wei", value: "0" },
    { label: "1 Wei", value: "1" },
    { label: "1 AVAX", value: "1000000000000000000" },
    { label: "0.001 AVAX", value: "1000000000000000" },
    { label: "1000 AVAX", value: "1000000000000000000000" },
    { label: "Very Large", value: "123456789000000000000000" },
    { label: "Small Fraction", value: "123456789" },
  ];

  const generateRandomValue = () => {
    const randomValue = (Math.random() * 1e18).toString();
    setTestValue(randomValue.split(".")[0]); // Remove decimals to keep as wei
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          formatValue() Utility Testing (Final-Hooks)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Interactive Testing */}
        <div className="space-y-3">
          <h4 className="font-medium">Interactive Testing:</h4>
          <div className="space-y-2">
            <Label htmlFor="test-value">Test Value (in wei)</Label>
            <div className="flex gap-2">
              <Input
                id="test-value"
                type="text"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                placeholder="Enter wei value"
                className="flex-1 font-mono"
              />
              <Button onClick={generateRandomValue} variant="outline" size="sm">
                Random
              </Button>
            </div>
          </div>

          <div className="bg-muted p-4 rounded grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1">
                formatValue(val, 2):
              </span>
              <div className="font-mono font-bold text-green-600">
                {formatValue(BigInt(testValue || "0"), 2)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">
                formatValue(val, 6):
              </span>
              <div className="font-mono font-bold text-blue-600">
                {formatValue(BigInt(testValue || "0"), 6)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">
                formatValue(val, 10):
              </span>
              <div className="font-mono font-bold text-purple-600">
                {formatValue(BigInt(testValue || "0"), 10)}
              </div>
            </div>
          </div>

          {/* Input validation */}
          <div className="text-xs text-muted-foreground">
            <strong>Input:</strong> {testValue} wei
            {testValue && !isNaN(Number(testValue)) && (
              <span className="ml-2">
                (≈ {(Number(testValue) / 1e18).toFixed(6)} AVAX)
              </span>
            )}
          </div>
        </div>

        {/* Predefined Tests */}
        <div className="space-y-3">
          <h4 className="font-medium">Predefined Value Tests:</h4>
          <div className="space-y-3">
            {testValues.map((test, i) => (
              <div key={i} className="border rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{test.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTestValue(test.value)}
                    className="text-xs"
                  >
                    Use This
                  </Button>
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-2">
                  {test.value} wei
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs block">
                      Precision 2:
                    </span>
                    <div className="font-mono text-green-600">
                      {formatValue(BigInt(test.value), 2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">
                      Precision 4:
                    </span>
                    <div className="font-mono text-blue-600">
                      {formatValue(BigInt(test.value), 4)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">
                      Precision 6:
                    </span>
                    <div className="font-mono text-purple-600">
                      {formatValue(BigInt(test.value), 6)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">
                      Precision 8:
                    </span>
                    <div className="font-mono text-orange-600">
                      {formatValue(BigInt(test.value), 8)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edge Cases */}
        <div className="space-y-3">
          <h4 className="font-medium">Edge Case Tests:</h4>
          <div className="bg-muted p-4 rounded space-y-2 text-sm">
            <div className="flex justify-between">
              <span>formatValue(undefined):</span>
              <span className="font-mono">{formatValue(undefined)}</span>
            </div>
            <div className="flex justify-between">
              <span>formatValue(0n):</span>
              <span className="font-mono">{formatValue(0n)}</span>
            </div>
            <div className="flex justify-between">
              <span>formatValue(1n, 0):</span>
              <span className="font-mono">{formatValue(1n, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>formatValue(1n, 18):</span>
              <span className="font-mono">{formatValue(1n, 18)}</span>
            </div>
            <div className="flex justify-between">
              <span>formatValue(BigInt(Number.MAX_SAFE_INTEGER)):</span>
              <span className="font-mono text-xs">
                {formatValue(BigInt(Number.MAX_SAFE_INTEGER))}
              </span>
            </div>
          </div>
        </div>

        {/* Precision Comparison */}
        <div className="space-y-3">
          <h4 className="font-medium">Precision Comparison:</h4>
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded">
            <div className="text-sm space-y-2">
              <div className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                Current Test Value Analysis:
              </div>
              {[0, 2, 4, 6, 8, 10, 12, 18].map((precision) => (
                <div key={precision} className="flex justify-between">
                  <span className="text-muted-foreground">
                    Precision {precision}:
                  </span>
                  <span className="font-mono">
                    {formatValue(BigInt(testValue || "0"), precision)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Usage Guidelines */}
        <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded border border-green-200 dark:border-green-800">
          <h5 className="font-medium text-green-700 dark:text-green-400 mb-2">
            💡 Usage Guidelines:
          </h5>
          <ul className="text-sm space-y-1 text-green-600 dark:text-green-300">
            <li>
              • <strong>Precision 2-4:</strong> For large amounts (ETH balances)
            </li>
            <li>
              • <strong>Precision 6-8:</strong> For token prices (recommended)
            </li>
            <li>
              • <strong>Precision 10+:</strong> For very small token prices
            </li>
            <li>
              • <strong>Default (6):</strong> Good balance for most use cases
            </li>
            <li>• The function handles undefined/null values gracefully</li>
            <li>• All formatting is consistent across the application</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
