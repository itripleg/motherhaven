// app/BurnManagerConfig/components/BurnManager.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { isAddress, formatEther } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Flame,
  Target,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Copy,
  Eye,
  Coins,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BurnManagerProps {
  userAddress: string;
}

// VanityNameBurnManager ABI - just the functions we need
const BURN_MANAGER_ABI = [
  {
    inputs: [{ name: "_burnToken", type: "address" }],
    name: "setBurnToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getBurnToken",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "token", type: "address" }],
    name: "supportsToken",
    outputs: [{ name: "", type: "bool" }],
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
  {
    inputs: [],
    name: "costPerNameChange",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Simple ERC20 ABI for token info
const ERC20_ABI = [
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
] as const;

// BurnToken ABI for getting the creator and setting burn manager
const BURN_TOKEN_ABI = [
  {
    inputs: [],
    name: "creator",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
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
] as const;

export function BurnManager({ userAddress }: BurnManagerProps) {
  const { toast } = useToast();
  const [burnManagerAddress, setBurnManagerAddress] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [isValidBurnManagerAddress, setIsValidBurnManagerAddress] =
    useState(false);
  const [isValidTokenAddress, setIsValidTokenAddress] = useState(false);

  // Read burn manager info (owner of the burn manager contract)
  const { data: burnManagerOwner } = useReadContract({
    address: isValidBurnManagerAddress
      ? (burnManagerAddress as `0x${string}`)
      : undefined,
    abi: BURN_MANAGER_ABI,
    functionName: "owner",
    query: { enabled: isValidBurnManagerAddress },
  });

  const { data: currentBurnToken, refetch: refetchBurnToken } = useReadContract(
    {
      address: isValidBurnManagerAddress
        ? (burnManagerAddress as `0x${string}`)
        : undefined,
      abi: BURN_MANAGER_ABI,
      functionName: "getBurnToken",
      query: { enabled: isValidBurnManagerAddress },
    }
  );

  const { data: costPerNameChange } = useReadContract({
    address: isValidBurnManagerAddress
      ? (burnManagerAddress as `0x${string}`)
      : undefined,
    abi: BURN_MANAGER_ABI,
    functionName: "costPerNameChange",
    query: { enabled: isValidBurnManagerAddress },
  });

  const { data: supportsToken } = useReadContract({
    address: isValidBurnManagerAddress
      ? (burnManagerAddress as `0x${string}`)
      : undefined,
    abi: BURN_MANAGER_ABI,
    functionName: "supportsToken",
    args: isValidTokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: isValidBurnManagerAddress && isValidTokenAddress },
  });

  // Read token info (including creator for permission check)
  const { data: tokenName } = useReadContract({
    address: isValidTokenAddress ? (tokenAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "name",
    query: { enabled: isValidTokenAddress },
  });

  const { data: tokenSymbol } = useReadContract({
    address: isValidTokenAddress ? (tokenAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: isValidTokenAddress },
  });

  // Get the token creator (the one who can set burn managers)
  const { data: tokenCreator } = useReadContract({
    address: isValidTokenAddress ? (tokenAddress as `0x${string}`) : undefined,
    abi: BURN_TOKEN_ABI,
    functionName: "creator",
    query: { enabled: isValidTokenAddress },
  });

  // Get the current burn manager for this token
  const { data: currentTokenBurnManager, refetch: refetchTokenBurnManager } =
    useReadContract({
      address: isValidTokenAddress
        ? (tokenAddress as `0x${string}`)
        : undefined,
      abi: BURN_TOKEN_ABI,
      functionName: "burnManager",
      query: { enabled: isValidTokenAddress },
    });

  // Contract write (using BURN_TOKEN_ABI since we're calling the token contract)
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
    setIsValidBurnManagerAddress(isAddress(burnManagerAddress));
  }, [burnManagerAddress]);

  React.useEffect(() => {
    setIsValidTokenAddress(isAddress(tokenAddress));
  }, [tokenAddress]);

  // Handle success
  React.useEffect(() => {
    if (txSuccess) {
      toast({
        title: "Burn Manager Set! 🎯",
        description: "The burn manager has been successfully updated.",
      });
      refetchBurnToken();
      refetchTokenBurnManager();
      setBurnManagerAddress("");
    }
  }, [txSuccess, toast, refetchBurnToken, refetchTokenBurnManager]);

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
    if (!isValidBurnManagerAddress || !isValidTokenAddress) {
      toast({
        title: "Invalid Addresses",
        description: "Please enter valid burn manager and token addresses.",
        variant: "destructive",
      });
      return;
    }

    if (!isTokenCreator) {
      toast({
        title: "Permission Denied",
        description: "Only the token creator can set the burn manager.",
        variant: "destructive",
      });
      return;
    }

    try {
      await setBurnManager({
        address: tokenAddress as `0x${string}`, // Call the token contract, not the burn manager
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

  const isBurnManagerOwner =
    burnManagerOwner?.toLowerCase() === userAddress.toLowerCase();
  const isTokenCreator =
    tokenCreator?.toLowerCase() === userAddress.toLowerCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Burn Manager Configuration
        </h2>
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
                      Token Creator:
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {tokenCreator?.slice(0, 6)}...{tokenCreator?.slice(-4)}
                      </code>
                      {isTokenCreator && (
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
                        {currentTokenBurnManager &&
                        currentTokenBurnManager !==
                          "0x0000000000000000000000000000000000000000"
                          ? `${currentTokenBurnManager.slice(
                              0,
                              6
                            )}...${currentTokenBurnManager.slice(-4)}`
                          : "None set"}
                      </code>
                      {currentTokenBurnManager &&
                        currentTokenBurnManager !==
                          "0x0000000000000000000000000000000000000000" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              viewOnExplorer(currentTokenBurnManager)
                            }
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

      {/* Burn Manager Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="unified-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-primary" />
              Burn Manager Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="burnManagerAddress">
                Burn Manager Contract Address
              </Label>
              <Input
                id="burnManagerAddress"
                type="text"
                value={burnManagerAddress}
                onChange={(e) => setBurnManagerAddress(e.target.value)}
                placeholder="0x..."
                className={
                  burnManagerAddress
                    ? isValidBurnManagerAddress
                      ? "border-green-400/50 focus:border-green-400"
                      : "border-red-400/50 focus:border-red-400"
                    : ""
                }
              />
            </div>

            {isValidBurnManagerAddress && burnManagerOwner && (
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Manager Info
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          burnManagerAddress,
                          "Burn Manager Address"
                        )
                      }
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewOnExplorer(burnManagerAddress)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground text-sm">
                      Burn Manager Owner:
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {burnManagerOwner?.slice(0, 6)}...
                        {burnManagerOwner?.slice(-4)}
                      </code>
                      {isBurnManagerOwner && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          You
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground text-sm">
                      Current Supported Token:
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {currentBurnToken &&
                        currentBurnToken !==
                          "0x0000000000000000000000000000000000000000"
                          ? `${currentBurnToken.slice(
                              0,
                              6
                            )}...${currentBurnToken.slice(-4)}`
                          : "None set"}
                      </code>
                      {currentBurnToken &&
                        currentBurnToken !==
                          "0x0000000000000000000000000000000000000000" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewOnExplorer(currentBurnToken)}
                            className="h-6 w-6 p-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                    </div>
                  </div>

                  {costPerNameChange && (
                    <div>
                      <span className="text-muted-foreground text-sm">
                        Cost per Name Change:
                      </span>
                      <div className="mt-1">
                        <span className="text-sm font-medium text-foreground">
                          {formatEther(costPerNameChange)} tokens
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Token compatibility check */}
                {isValidTokenAddress && supportsToken !== undefined && (
                  <div className="mt-3 p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      {supportsToken ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-green-400">
                            This burn manager supports your token
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-orange-400" />
                          <span className="text-sm text-orange-400">
                            This burn manager does not support your token
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Set Burn Manager Card */}
      {isValidTokenAddress && isValidBurnManagerAddress && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="unified-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                Set Burn Manager
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isTokenCreator && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You are not the creator of this token. Only the token
                    creator can set the burn manager.
                  </AlertDescription>
                </Alert>
              )}

              <div className="p-4 bg-muted/20 rounded-lg">
                <h4 className="font-medium mb-2">Transaction Summary</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Token:</span>
                    <span className="ml-2">
                      {tokenName} ({tokenSymbol})
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      New Burn Manager:
                    </span>
                    <span className="ml-2 font-mono text-xs">
                      {burnManagerAddress.slice(0, 6)}...
                      {burnManagerAddress.slice(-4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Action:</span>
                    <span className="ml-2">
                      Set burn manager for your token
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSetBurnManager}
                disabled={
                  !isTokenCreator ||
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
                    <Target className="h-4 w-4" />
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
        transition={{ delay: 0.4 }}
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
                    <strong>Step 2:</strong> Verify you are the token creator
                  </p>
                  <p>
                    <strong>Step 3:</strong> Enter the burn manager contract
                    address
                  </p>
                  <p>
                    <strong>Step 4:</strong> Set the burn manager for your token
                  </p>
                  <p className="mt-2 text-xs text-blue-400">
                    💡 <strong>Note:</strong> Only token creators can set burn
                    managers for their tokens. The burn manager will be notified
                    when tokens are burned.
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
