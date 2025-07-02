// app/_debug/factory/components/ABIAnalysisDebug.tsx

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Factory,
  AlertCircle,
  Code,
  Eye,
  Settings,
} from "lucide-react";
import { FACTORY_ABI, TOKEN_ABI, MANAGER_ABI } from "@/types";

export function ABIAnalysisDebug() {
  const [selectedABI, setSelectedABI] = useState<
    "factory" | "token" | "manager"
  >("factory");

  // Analyze the selected ABI
  const getABIAnalysis = (abi: readonly any[], name: string) => {
    const readFunctions = abi.filter(
      (item: any) =>
        item.type === "function" &&
        (item.stateMutability === "view" || item.stateMutability === "pure")
    );

    const writeFunctions = abi.filter(
      (item: any) =>
        item.type === "function" &&
        item.stateMutability !== "view" &&
        item.stateMutability !== "pure"
    );

    const events = abi.filter((item: any) => item.type === "event");
    const errors = abi.filter((item: any) => item.type === "error");
    const constructors = abi.filter((item: any) => item.type === "constructor");

    return {
      name,
      total: abi.length,
      readFunctions,
      writeFunctions,
      events,
      errors,
      constructors,
    };
  };

  const factoryAnalysis = getABIAnalysis(
    FACTORY_ABI as readonly any[],
    "Factory"
  );
  const tokenAnalysis = getABIAnalysis(TOKEN_ABI as readonly any[], "Token");
  const managerAnalysis = getABIAnalysis(
    MANAGER_ABI as readonly any[],
    "Manager"
  );

  const currentAnalysis =
    selectedABI === "factory"
      ? factoryAnalysis
      : selectedABI === "token"
      ? tokenAnalysis
      : managerAnalysis;

  const currentABI =
    selectedABI === "factory"
      ? (FACTORY_ABI as readonly any[])
      : selectedABI === "token"
      ? (TOKEN_ABI as readonly any[])
      : (MANAGER_ABI as readonly any[]);

  return (
    <div className="grid gap-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-indigo-500" />
            Contract ABI Analysis (Final-Hooks Compatible)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {[factoryAnalysis, tokenAnalysis, managerAnalysis].map(
              (analysis) => (
                <Card
                  key={analysis.name}
                  className={`cursor-pointer transition-all ${
                    selectedABI === analysis.name.toLowerCase()
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() =>
                    setSelectedABI(analysis.name.toLowerCase() as any)
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Factory className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">
                        {analysis.name} Contract
                      </span>
                      {selectedABI === analysis.name.toLowerCase() && (
                        <Badge variant="default" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Total Items:
                        </span>
                        <span className="font-mono">{analysis.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Read Functions:
                        </span>
                        <span className="font-mono text-blue-600">
                          {analysis.readFunctions.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Write Functions:
                        </span>
                        <span className="font-mono text-green-600">
                          {analysis.writeFunctions.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Events:</span>
                        <span className="font-mono text-purple-600">
                          {analysis.events.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Errors:</span>
                        <span className="font-mono text-red-600">
                          {analysis.errors.length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-500" />
            {currentAnalysis.name} Contract Details
            <Badge variant="outline">{currentAnalysis.total} total items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="read-functions" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="read-functions">
                Read ({currentAnalysis.readFunctions.length})
              </TabsTrigger>
              <TabsTrigger value="write-functions">
                Write ({currentAnalysis.writeFunctions.length})
              </TabsTrigger>
              <TabsTrigger value="events">
                Events ({currentAnalysis.events.length})
              </TabsTrigger>
              <TabsTrigger value="errors">
                Errors ({currentAnalysis.errors.length})
              </TabsTrigger>
              <TabsTrigger value="raw-abi">Raw ABI</TabsTrigger>
            </TabsList>

            <TabsContent value="read-functions" className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Read Functions (View/Pure)
              </h4>
              <div className="space-y-2">
                {currentAnalysis.readFunctions.map((func: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-medium">{func.name}</span>
                      <Badge variant="outline" className="text-blue-600">
                        {func.stateMutability}
                      </Badge>
                    </div>

                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-muted-foreground">Inputs: </span>
                        <span className="font-mono">
                          (
                          {func.inputs
                            ?.map((input: any) => `${input.type} ${input.name}`)
                            .join(", ") || "none"}
                          )
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Outputs: </span>
                        <span className="font-mono">
                          (
                          {func.outputs
                            ?.map((output: any) => output.type)
                            .join(", ") || "none"}
                          )
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="write-functions" className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="h-4 w-4 text-green-500" />
                Write Functions (State Changing)
              </h4>
              <div className="space-y-2">
                {currentAnalysis.writeFunctions.map((func: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-green-50 dark:bg-green-950/20 rounded border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-medium">{func.name}</span>
                      <Badge variant="outline" className="text-green-600">
                        {func.stateMutability || "nonpayable"}
                      </Badge>
                    </div>

                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-muted-foreground">Inputs: </span>
                        <span className="font-mono">
                          (
                          {func.inputs
                            ?.map((input: any) => `${input.type} ${input.name}`)
                            .join(", ") || "none"}
                          )
                        </span>
                      </div>
                      {func.stateMutability === "payable" && (
                        <div className="text-orange-600 text-xs">
                          ⚠️ Payable function - requires ETH
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-purple-500" />
                Events
              </h4>
              <div className="space-y-2">
                {currentAnalysis.events.map((event: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-medium">
                        {event.name}
                      </span>
                      <Badge variant="outline" className="text-purple-600">
                        Event
                      </Badge>
                    </div>

                    <div className="text-sm">
                      <span className="text-muted-foreground">Inputs: </span>
                      <span className="font-mono">
                        (
                        {event.inputs
                          ?.map(
                            (input: any) =>
                              `${input.indexed ? "indexed " : ""}${
                                input.type
                              } ${input.name}`
                          )
                          .join(", ") || "none"}
                        )
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="errors" className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Custom Errors
              </h4>
              {currentAnalysis.errors.length > 0 ? (
                <div className="space-y-2">
                  {currentAnalysis.errors.map((error: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 bg-red-50 dark:bg-red-950/20 rounded border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-medium">
                          {error.name}
                        </span>
                        <Badge variant="outline" className="text-red-600">
                          Error
                        </Badge>
                      </div>

                      <div className="text-sm">
                        <span className="text-muted-foreground">Inputs: </span>
                        <span className="font-mono">
                          (
                          {error.inputs
                            ?.map((input: any) => `${input.type} ${input.name}`)
                            .join(", ") || "none"}
                          )
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No custom errors defined in this contract</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="raw-abi" className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Raw ABI JSON</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(currentABI, null, 2)
                    );
                  }}
                >
                  Copy ABI
                </Button>
              </div>

              <div className="bg-muted p-4 rounded border">
                <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                  {JSON.stringify(currentABI, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Final-Hooks Compatibility */}
      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
        <CardContent className="p-4">
          <h5 className="font-medium text-green-700 dark:text-green-400 mb-2">
            ✅ Final-Hooks ABI Compatibility:
          </h5>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-green-600 dark:text-green-300">
            <ul className="space-y-1">
              <li>
                • <strong>Factory ABI:</strong> Fully integrated in
                useFactoryContract
              </li>
              <li>
                • <strong>Token ABI:</strong> Used for balance checks and
                approvals
              </li>
              <li>
                • <strong>Manager ABI:</strong> Available via useManagerContract
              </li>
            </ul>
            <ul className="space-y-1">
              <li>• All read functions are hookified with proper caching</li>
              <li>• Write functions use wagmi's writeContract</li>
              <li>• Events are monitored via EventWatcher</li>
              <li>• Type-safe with full TypeScript support</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
