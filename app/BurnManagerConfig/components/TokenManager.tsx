// app/BurnManagerConfig/components/TokenManager.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { isAddress } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Coins,
  Settings,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Copy,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TokenManagerProps {
  userAddress: string;
}

// BurnToken ABI - just the functions we need
const BURN_TOKEN_ABI = [
  {
    inputs: [{ name: "newManager", type: "address" }],
    name: "setBurnManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "burnManager",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function TokenManager({ userAddress }: TokenManagerProps) {
  const { toast } = useToast();
  const [tokenAddress, setTokenAddress] = useState("");
  const [burnManagerAddress, setBurnManagerAddress] = useState("");
  const [isValidTokenAddress, setIsValidTokenAddress] = useState(false);
  const [isValidBurnManagerAddress, setIsValidBurnManagerAddress] =
    useState(false);

  // Read token info
  const { data: tokenName } = useReadContract({
    address: isValidTokenAddress ? (tokenAddress as `0x${string}`) : undefined,
    abi: BURN_TOKEN_ABI,
    functionName: "name",
    query: { enabled: isValidTokenAddress },
  });

  const { data: tokenSymbol } = useReadContract({
    address: isValidTokenAddress ? (tokenAddress as `0x${string}`) : undefined,
    abi: BURN_TOKEN_ABI,
    functionName: "symbol",
    query: { enabled: isValidTokenAddress },
  });

  const { data: tokenOwner } = useReadContract({
    address: isValidTokenAddress ? (tokenAddress as `0x${string}`) : undefined,
    abi: BURN_TOKEN_ABI,
    functionName: "owner",
    query: { enabled: isValidTokenAddress },
  });

  const { data: currentBurnManager, refetch: refetchBurnManager } =
    useReadContract({
      address: isValidTokenAddress
        ? (tokenAddress as `0x${string}`)
        : undefined,
      abi: BURN_TOKEN_ABI,
      functionName: "burnManager",
      query: { enabled: isValidTokenAddress },
    });

  // Contract write
  const {
    writeContract: setBurnManager,
    data: txHash,
    error: writeError,
    isPending: isWritePending,
  } = useWriteContract();

  const { isLoading: isWaitingForTx, isSuccess: txSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Validate addresses
  React.useEffect(() => {
    setIsValidTokenAddress(isAddress(tokenAddress));
  }, [tokenAddress]);

  React.useEffect(() => {
    setIsValidBurnManagerAddress(isAddress(burnManagerAddress));
  }, [burnManagerAddress]);

  // Handle success
  React.useEffect(() => {
    if (txSuccess) {
      toast({
        title: "Burn Manager Set! 🔥",
        description: "The burn manager has been successfully updated.",
      });
      refetchBurnManager();
      setBurnManagerAddress("");
    }
  }, [txSuccess, toast, refetchBurnManager]);

  // Handle errors
  React.useEffect(() => {
    if (writeError) {
      toast({
        title: "Transaction Failed",
        description: writeError.message,
        variant: "destructive",
      });
    }
  }, [writeError, toast]);

  const handleSetBurnManager = async () => {
    if (!isValidTokenAddress || !isValidBurnManagerAddress) {
      toast({
        title: "Invalid Addresses",
        description: "Please enter valid token and burn manager addresses.",
        variant: "destructive",
      });
      return;
    }

    try {
      await setBurnManager({
        address: tokenAddress as `0x${string}`,
        abi: BURN_TOKEN_ABI,
        functionName: "setBurnManager",
        args: [burnManagerAddress as `0x${string}`],
      });

      toast({
        title: "🔄 Setting Burn Manager...",
        description: "Transaction submitted. Please wait for confirmation.",
      });
    } catch (error: any) {
      console.error("Failed to set burn manager:", error);
      toast({
        title: "Failed to Submit",
        description: error.message || "Failed to submit transaction.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} Copied! 📋`,
      description: "Address has been copied to clipboard.",
    });
  };

  const viewOnExplorer = (address: string) => {
    window.open(`https://testnet.snowtrace.io/address/${address}`, "_blank");
  };

  const isOwner = tokenOwner?.toLowerCase() === userAddress.toLowerCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Token Manager</h2>
        <p className="text-muted-foreground">
          Set burn managers for your tokens
        </p>
      </div>

      {/* Token Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="unified-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Coins className="h-5 w-5 text-primary" />
              Token Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tokenAddress">Token Contract Address</Label>
              <Input
                id="tokenAddress"
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x..."
                className={
                  tokenAddress
                    ? isValidTokenAddress
                      ? "border-green-400/50 focus:border-green-400"
                      : "border-red-400/50 focus:border-red-400"
                    : ""
                }
              />
            </div>

            {isValidTokenAddress && tokenName && (
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Token Info
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(tokenAddress, "Token Address")
                      }
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewOnExplorer(tokenAddress)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium text-foreground">
                      {tokenName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Symbol:</span>
                    <span className="ml-2 font-medium text-foreground">
                      {tokenSymbol}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground text-sm">
                      Owner:
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {tokenOwner?.slice(0, 6)}...{tokenOwner?.slice(-4)}
                      </code>
                      {isOwner && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          You
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground text-sm">
                      Current Burn Manager:
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {currentBurnManager
                          ? `${currentBurnManager.slice(
                              0,
                              6
                            )}...${currentBurnManager.slice(-4)}`
                          : "None set"}
                      </code>
                      {currentBurnManager && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewOnExplorer(currentBurnManager)}
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Set Burn Manager Card */}
      {isValidTokenAddress && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="unified-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-primary" />
                Set Burn Manager
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isOwner && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You are not the owner of this token. Only the token owner
                    can set the burn manager.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="burnManagerAddress">
                  New Burn Manager Address
                </Label>
                <Input
                  id="burnManagerAddress"
                  type="text"
                  value={burnManagerAddress}
                  onChange={(e) => setBurnManagerAddress(e.target.value)}
                  placeholder="0x..."
                  disabled={!isOwner}
                  className={
                    burnManagerAddress
                      ? isValidBurnManagerAddress
                        ? "border-green-400/50 focus:border-green-400"
                        : "border-red-400/50 focus:border-red-400"
                      : ""
                  }
                />
              </div>

              <Button
                onClick={handleSetBurnManager}
                disabled={
                  !isOwner ||
                  !isValidBurnManagerAddress ||
                  isWritePending ||
                  isWaitingForTx
                }
                className="w-full h-12"
              >
                {isWritePending || isWaitingForTx ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isWritePending ? "Submitting..." : "Confirming..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Set Burn Manager
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* How it Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="unified-card border-blue-400/20 bg-blue-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-400">How it works</h3>
                <div className="text-sm text-blue-300 space-y-1">
                  <p>
                    <strong>Step 1:</strong> Enter your token contract address
                  </p>
                  <p>
                    <strong>Step 2:</strong> Verify you are the token owner
                  </p>
                  <p>
                    <strong>Step 3:</strong> Set the burn manager contract
                    address
                  </p>
                  <p className="mt-2 text-xs text-blue-400">
                    💡 <strong>Note:</strong> Only token owners can set burn
                    managers. The burn manager will be notified when tokens are
                    burned.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
