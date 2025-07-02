// app/_debug/factory/components/WriteFunctionsDebug.tsx

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Factory,
  Play,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Coins,
  Settings,
} from "lucide-react";
import { parseEther, isAddress } from "viem";
import { useAccount, useBalance } from "wagmi";
import { useFactoryContract } from "@/final-hooks/useFactoryContract";
import { useToast } from "@/hooks/use-toast";

interface WriteFunctionsDebugProps {
  token: string;
}

export function WriteFunctionsDebug({ token }: WriteFunctionsDebugProps) {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  // Final-hooks integration
  const {
    createToken,
    buyTokens,
    sellTokens,
    isPending,
    writeError,
    useCalculateTokens,
    useCalculateBuyPrice,
    useCalculateSellPrice,
  } = useFactoryContract();

  // Form states
  const [createTokenForm, setCreateTokenForm] = useState({
    name: "Test Token",
    symbol: "TEST",
    imageUrl: "https://example.com/image.png",
    burnManager: address || "",
  });

  const [buyForm, setBuyForm] = useState({
    ethAmount: "1.0",
  });

  const [sellForm, setSellForm] = useState({
    tokenAmount: "1000",
  });

  // Get user's AVAX balance
  const { data: avaxBalance } = useBalance({
    address: address,
  });

  // Get user's token balance
  const { data: tokenBalance } = useBalance({
    address: address,
    token: token && isAddress(token) ? (token as `0x${string}`) : undefined,
  });

  // Calculate trade previews
  const { tokenAmount: buyPreview } = useCalculateTokens(
    token && isAddress(token) ? (token as `0x${string}`) : undefined,
    buyForm.ethAmount
  );

  const { ethAmount: sellPreview } = useCalculateSellPrice(
    token && isAddress(token) ? (token as `0x${string}`) : undefined,
    sellForm.tokenAmount
  );

  // Write function handlers
  const handleCreateToken = async () => {
    try {
      if (!isAddress(createTokenForm.burnManager)) {
        toast({
          title: "Invalid Address",
          description: "Burn manager must be a valid address",
          variant: "destructive",
        });
        return;
      }

      await createToken(
        createTokenForm.name,
        createTokenForm.symbol,
        createTokenForm.imageUrl,
        createTokenForm.burnManager as `0x${string}`
      );

      toast({
        title: "Token Creation Initiated",
        description: "Check your wallet to confirm the transaction",
      });
    } catch (error) {
      console.error("Create token error:", error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleBuyTokens = async () => {
    try {
      if (!token || !isAddress(token)) {
        toast({
          title: "Invalid Token",
          description: "Please provide a valid token address",
          variant: "destructive",
        });
        return;
      }

      await buyTokens(token as `0x${string}`, buyForm.ethAmount);

      toast({
        title: "Buy Transaction Initiated",
        description: "Check your wallet to confirm the transaction",
      });
    } catch (error) {
      console.error("Buy tokens error:", error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleSellTokens = async () => {
    try {
      if (!token || !isAddress(token)) {
        toast({
          title: "Invalid Token",
          description: "Please provide a valid token address",
          variant: "destructive",
        });
        return;
      }

      await sellTokens(token as `0x${string}`, sellForm.tokenAmount);

      toast({
        title: "Sell Transaction Initiated",
        description: "Check your wallet to confirm the transaction",
      });
    } catch (error) {
      console.error("Sell tokens error:", error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Wallet Not Connected</h3>
          <p className="text-muted-foreground">
            Connect your wallet to test write functions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-green-500" />
            Write Functions Testing (Final-Hooks)
            <Badge variant="outline" className="text-green-600">
              final-hooks ✓
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Wallet:</span>
              <div className="font-mono text-xs">
                {address?.slice(0, 8)}...{address?.slice(-4)}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">AVAX Balance:</span>
              <div className="font-mono">
                {avaxBalance
                  ? parseFloat(avaxBalance.formatted).toFixed(4)
                  : "0"}{" "}
                AVAX
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Token Balance:</span>
              <div className="font-mono">
                {tokenBalance
                  ? parseFloat(tokenBalance.formatted).toFixed(2)
                  : "0"}{" "}
                tokens
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Transaction Status:</span>
              <div className="flex items-center gap-1">
                {isPending ? (
                  <>
                    <Clock className="h-3 w-3 animate-spin text-blue-500" />
                    <span className="text-blue-600">Pending</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Ready</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {writeError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Transaction Error:</span>
                <span>{writeError.message}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Write Functions Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-500" />
            Factory Write Functions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create-token" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create-token">Create Token</TabsTrigger>
              <TabsTrigger value="buy-tokens">Buy Tokens</TabsTrigger>
              <TabsTrigger value="sell-tokens">Sell Tokens</TabsTrigger>
            </TabsList>

            {/* Create Token Tab */}
            <TabsContent value="create-token" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="token-name">Token Name</Label>
                    <Input
                      id="token-name"
                      value={createTokenForm.name}
                      onChange={(e) =>
                        setCreateTokenForm({
                          ...createTokenForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="My Awesome Token"
                    />
                  </div>

                  <div>
                    <Label htmlFor="token-symbol">Token Symbol</Label>
                    <Input
                      id="token-symbol"
                      value={createTokenForm.symbol}
                      onChange={(e) =>
                        setCreateTokenForm({
                          ...createTokenForm,
                          symbol: e.target.value,
                        })
                      }
                      placeholder="MAT"
                    />
                  </div>

                  <div>
                    <Label htmlFor="token-image">Image URL</Label>
                    <Input
                      id="token-image"
                      value={createTokenForm.imageUrl}
                      onChange={(e) =>
                        setCreateTokenForm({
                          ...createTokenForm,
                          imageUrl: e.target.value,
                        })
                      }
                      placeholder="https://example.com/image.png"
                    />
                  </div>

                  <div>
                    <Label htmlFor="burn-manager">Burn Manager Address</Label>
                    <Input
                      id="burn-manager"
                      value={createTokenForm.burnManager}
                      onChange={(e) =>
                        setCreateTokenForm({
                          ...createTokenForm,
                          burnManager: e.target.value,
                        })
                      }
                      placeholder="0x..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-muted p-4 rounded">
                    <h5 className="font-medium mb-2">Token Preview:</h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Name:</strong> {createTokenForm.name}
                      </div>
                      <div>
                        <strong>Symbol:</strong> {createTokenForm.symbol}
                      </div>
                      <div>
                        <strong>Creator:</strong> {address?.slice(0, 8)}...
                      </div>
                      <div>
                        <strong>Burn Manager:</strong>{" "}
                        {createTokenForm.burnManager.slice(0, 8)}...
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateToken}
                    disabled={
                      isPending ||
                      !createTokenForm.name ||
                      !createTokenForm.symbol
                    }
                    className="w-full gap-2"
                  >
                    {isPending ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Creating Token...
                      </>
                    ) : (
                      <>
                        <Factory className="h-4 w-4" />
                        Create Token
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Buy Tokens Tab */}
            <TabsContent value="buy-tokens" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="buy-amount">AVAX Amount</Label>
                    <Input
                      id="buy-amount"
                      type="number"
                      step="0.01"
                      value={buyForm.ethAmount}
                      onChange={(e) =>
                        setBuyForm({ ...buyForm, ethAmount: e.target.value })
                      }
                      placeholder="1.0"
                    />
                  </div>

                  <div className="bg-muted p-4 rounded">
                    <h5 className="font-medium mb-2">Trade Preview:</h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>You Pay:</strong> {buyForm.ethAmount} AVAX
                      </div>
                      <div>
                        <strong>You Receive:</strong> ~
                        {buyPreview
                          ? parseFloat(buyPreview.toString()) / 1e18
                          : 0}{" "}
                        tokens
                      </div>
                      <div>
                        <strong>Token Address:</strong>{" "}
                        {token || "Not provided"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleBuyTokens}
                    disabled={
                      isPending ||
                      !token ||
                      !isAddress(token) ||
                      !buyForm.ethAmount
                    }
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isPending ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Buying...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4" />
                        Buy Tokens
                      </>
                    )}
                  </Button>

                  {(!token || !isAddress(token)) && (
                    <div className="text-yellow-600 text-sm flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Provide a valid token address to enable buying
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Sell Tokens Tab */}
            <TabsContent value="sell-tokens" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="sell-amount">Token Amount</Label>
                    <Input
                      id="sell-amount"
                      type="number"
                      step="1"
                      value={sellForm.tokenAmount}
                      onChange={(e) =>
                        setSellForm({
                          ...sellForm,
                          tokenAmount: e.target.value,
                        })
                      }
                      placeholder="1000"
                    />
                  </div>

                  <div className="bg-muted p-4 rounded">
                    <h5 className="font-medium mb-2">Trade Preview:</h5>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>You Sell:</strong> {sellForm.tokenAmount} tokens
                      </div>
                      <div>
                        <strong>You Receive:</strong> ~
                        {sellPreview
                          ? parseFloat(sellPreview.toString()) / 1e18
                          : 0}{" "}
                        AVAX
                      </div>
                      <div>
                        <strong>Token Address:</strong>{" "}
                        {token || "Not provided"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleSellTokens}
                    disabled={
                      isPending ||
                      !token ||
                      !isAddress(token) ||
                      !sellForm.tokenAmount
                    }
                    className="w-full gap-2 bg-red-600 hover:bg-red-700"
                  >
                    {isPending ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Selling...
                      </>
                    ) : (
                      <>
                        <Coins className="h-4 w-4" />
                        Sell Tokens
                      </>
                    )}
                  </Button>

                  {(!token || !isAddress(token)) && (
                    <div className="text-yellow-600 text-sm flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Provide a valid token address to enable selling
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Final-Hooks Benefits */}
      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
        <CardContent className="p-4">
          <h5 className="font-medium text-green-700 dark:text-green-400 mb-2">
            ✅ Final-Hooks Write Function Benefits:
          </h5>
          <div className="text-sm text-green-600 dark:text-green-300 space-y-1">
            <div>
              • <strong>Unified Interface:</strong> All write functions in one
              hook
            </div>
            <div>
              • <strong>Built-in State Management:</strong> isPending,
              writeError handled automatically
            </div>
            <div>
              • <strong>Type Safety:</strong> Full TypeScript support with
              proper parameter types
            </div>
            <div>
              • <strong>Error Handling:</strong> Comprehensive error reporting
              and user feedback
            </div>
            <div>
              • <strong>Transaction Previews:</strong> Real-time calculation
              before execution
            </div>
            <div>
              • <strong>Consistent API:</strong> Same patterns across
              createToken, buyTokens, sellTokens
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
