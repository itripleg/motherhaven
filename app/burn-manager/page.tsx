"use client";
import React, { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Zap,
  Shield,
  ArrowRightLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Users,
  Gamepad2,
  Flame,
} from "lucide-react";
import { formatEther, parseEther, isAddress } from "viem";

// ABIs for different burn managers
const BURN_TOKEN_ABI = [
  {
    inputs: [{ internalType: "address", name: "newManager", type: "address" }],
    name: "setBurnManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "burnManager",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "creator",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

const GAME_BURN_MANAGER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "bool", name: "supported", type: "bool" },
    ],
    name: "setSupportedToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bool", name: "_paused", type: "bool" }],
    name: "setPaused",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAvaxRewardPool",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "withdrawAvax",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "depositAvax",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

const YMIR_BURN_MANAGER_ABI = [
  {
    inputs: [],
    name: "shinzouToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "SACRIFICE_AMOUNT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// Known burn manager contracts
const BURN_MANAGERS = {
  "0x1C1443ec23978aBD3fe766c7C470A3670D88f173": {
    name: "Ymir NFT Creator",
    type: "ymir",
    description: "Creates NFTs from SHINZOU token burns",
  },
  "0x984f7DE6889CFC8b06c818b1b372B89B93FEcA87": {
    name: "Game Burn Manager",
    type: "game",
    description: "AVAX rewards for BBT token burns",
  },
};

const BurnManagerAdmin = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // State
  const [selectedToken, setSelectedToken] = useState("");
  const [selectedBurnManager, setSelectedBurnManager] = useState("");
  const [customBurnManager, setCustomBurnManager] = useState("");
  const [avaxDepositAmount, setAvaxDepositAmount] = useState("");
  const [avaxWithdrawAmount, setAvaxWithdrawAmount] = useState("");

  // Token data
  const { data: currentBurnManager } = useReadContract({
    address: selectedToken as `0x${string}`,
    abi: BURN_TOKEN_ABI,
    functionName: "burnManager",
    query: { enabled: Boolean(selectedToken && isAddress(selectedToken)) },
  });

  const { data: tokenCreator } = useReadContract({
    address: selectedToken as `0x${string}`,
    abi: BURN_TOKEN_ABI,
    functionName: "creator",
    query: { enabled: Boolean(selectedToken && isAddress(selectedToken)) },
  });

  // Game manager data
  const { data: isPaused } = useReadContract({
    address: "0x984f7DE6889CFC8b06c818b1b372B89B93FEcA87",
    abi: GAME_BURN_MANAGER_ABI,
    functionName: "paused",
  });

  const { data: avaxRewardPool } = useReadContract({
    address: "0x984f7DE6889CFC8b06c818b1b372B89B93FEcA87",
    abi: GAME_BURN_MANAGER_ABI,
    functionName: "getAvaxRewardPool",
  });

  // Ymir manager data
  const { data: shinzouToken } = useReadContract({
    address: "0x1C1443ec23978aBD3fe766c7C470A3670D88f173",
    abi: YMIR_BURN_MANAGER_ABI,
    functionName: "shinzouToken",
  });

  const { data: sacrificeAmount } = useReadContract({
    address: "0x1C1443ec23978aBD3fe766c7C470A3670D88f173",
    abi: YMIR_BURN_MANAGER_ABI,
    functionName: "SACRIFICE_AMOUNT",
  });

  // Check permissions
  const isTokenCreator =
    tokenCreator &&
    address &&
    (tokenCreator as string).toLowerCase() === address.toLowerCase();

  // Handle successful transactions
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "✅ Transaction Successful",
        description: "Burn manager updated successfully",
      });
    }
  }, [isSuccess, toast]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "❌ Transaction Failed",
        description: error.message || "Transaction failed",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Functions
  const setBurnManager = async () => {
    if (!selectedToken || !isTokenCreator) return;

    const newManager = customBurnManager || selectedBurnManager;
    if (!newManager || !isAddress(newManager)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid burn manager address",
        variant: "destructive",
      });
      return;
    }

    writeContract({
      address: selectedToken as `0x${string}`,
      abi: BURN_TOKEN_ABI,
      functionName: "setBurnManager",
      args: [newManager as `0x${string}`],
    });
  };

  const toggleGameManagerPause = async () => {
    writeContract({
      address: "0x984f7DE6889CFC8b06c818b1b372B89B93FEcA87",
      abi: GAME_BURN_MANAGER_ABI,
      functionName: "setPaused",
      args: [!isPaused],
    });
  };

  const setSupportedToken = async (tokenAddr: string, supported: boolean) => {
    if (!isAddress(tokenAddr)) return;

    writeContract({
      address: "0x984f7DE6889CFC8b06c818b1b372B89B93FEcA87",
      abi: GAME_BURN_MANAGER_ABI,
      functionName: "setSupportedToken",
      args: [tokenAddr as `0x${string}`, supported],
    });
  };

  const depositAvax = async () => {
    if (!avaxDepositAmount) return;

    try {
      writeContract({
        address: "0x984f7DE6889CFC8b06c818b1b372B89B93FEcA87",
        abi: GAME_BURN_MANAGER_ABI,
        functionName: "depositAvax",
        value: parseEther(avaxDepositAmount),
      });
    } catch (err) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid AVAX amount",
        variant: "destructive",
      });
    }
  };

  const withdrawAvax = async () => {
    if (!avaxWithdrawAmount) return;

    try {
      writeContract({
        address: "0x984f7DE6889CFC8b06c818b1b372B89B93FEcA87",
        abi: GAME_BURN_MANAGER_ABI,
        functionName: "withdrawAvax",
        args: [parseEther(avaxWithdrawAmount)],
      });
    } catch (err) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid AVAX amount",
        variant: "destructive",
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen animated-bg floating-particles flex items-center justify-center">
        <Card className="unified-card max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to access burn manager administration
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg floating-particles md:pt-20">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gradient">
              Burn Manager Admin
            </h1>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              <Shield className="h-3 w-3 mr-1" />
              Admin Panel
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Manage burn managers and configure privileged settings for deployed
            contracts
          </p>
        </div>

        <Tabs defaultValue="token-management" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="token-management"
              className="flex items-center gap-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Token Management
            </TabsTrigger>
            <TabsTrigger
              value="game-manager"
              className="flex items-center gap-2"
            >
              <Gamepad2 className="h-4 w-4" />
              Game Manager
            </TabsTrigger>
            <TabsTrigger
              value="ymir-manager"
              className="flex items-center gap-2"
            >
              <Flame className="h-4 w-4" />
              Ymir Manager
            </TabsTrigger>
          </TabsList>

          {/* Token Management */}
          <TabsContent value="token-management" className="space-y-6">
            <Card className="unified-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                  Switch Token Burn Manager
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Token Selection */}
                <div className="space-y-2">
                  <Label htmlFor="token-address">Token Address</Label>
                  <Input
                    id="token-address"
                    placeholder="0x..."
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                  />
                </div>

                {/* Current State */}
                {selectedToken && isAddress(selectedToken) && (
                  <div className="space-y-4 p-4 bg-accent/20 rounded-lg border border-accent/30">
                    <h3 className="font-semibold">Current State</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Creator
                        </Label>
                        <p className="font-mono text-sm">
                          {tokenCreator
                            ? `${(tokenCreator as string).slice(0, 6)}...${(
                                tokenCreator as string
                              ).slice(-4)}`
                            : "Loading..."}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Current Burn Manager
                        </Label>
                        <p className="font-mono text-sm">
                          {currentBurnManager
                            ? `${(currentBurnManager as string).slice(
                                0,
                                6
                              )}...${(currentBurnManager as string).slice(-4)}`
                            : "None"}
                        </p>
                      </div>
                    </div>

                    {/* Permission Check */}
                    {isTokenCreator ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        You can manage this token
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Only token creator can manage
                      </Badge>
                    )}
                  </div>
                )}

                {/* New Burn Manager Selection */}
                <div className="space-y-4">
                  <Label>Select New Burn Manager</Label>

                  {/* Predefined Managers */}
                  <Select
                    value={selectedBurnManager}
                    onValueChange={setSelectedBurnManager}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a burn manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="something">
                        None (disable burns)
                      </SelectItem>
                      {Object.entries(BURN_MANAGERS).map(([address, info]) => (
                        <SelectItem key={address} value={address}>
                          {info.name} - {info.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Custom Address */}
                  <div className="space-y-2">
                    <Label htmlFor="custom-manager">
                      Or Enter Custom Address
                    </Label>
                    <Input
                      id="custom-manager"
                      placeholder="0x... (custom burn manager)"
                      value={customBurnManager}
                      onChange={(e) => setCustomBurnManager(e.target.value)}
                    />
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={setBurnManager}
                  disabled={
                    !isTokenCreator ||
                    isPending ||
                    isConfirming ||
                    (!selectedBurnManager && !customBurnManager)
                  }
                  className="w-full"
                >
                  {isPending || isConfirming ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  {isPending
                    ? "Confirming..."
                    : isConfirming
                    ? "Processing..."
                    : "Update Burn Manager"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Game Manager */}
          <TabsContent value="game-manager" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Card */}
              <Card className="unified-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-primary" />
                    Game Manager Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge
                        className={
                          isPaused
                            ? "bg-red-500/20 text-red-400"
                            : "bg-green-500/20 text-green-400"
                        }
                      >
                        {isPaused ? "Paused" : "Active"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>AVAX Pool:</span>
                      <span>
                        {avaxRewardPool
                          ? formatEther(avaxRewardPool as bigint)
                          : "0"}{" "}
                        AVAX
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={toggleGameManagerPause}
                    disabled={isPending || isConfirming}
                    variant={isPaused ? "default" : "destructive"}
                    className="w-full"
                  >
                    {isPending || isConfirming ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {isPaused ? "Resume Game Manager" : "Pause Game Manager"}
                  </Button>
                </CardContent>
              </Card>

              {/* AVAX Management */}
              <Card className="unified-card">
                <CardHeader>
                  <CardTitle>AVAX Pool Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deposit-amount">Deposit AVAX</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      step="0.01"
                      placeholder="Amount to deposit"
                      value={avaxDepositAmount}
                      onChange={(e) => setAvaxDepositAmount(e.target.value)}
                    />
                    <Button
                      onClick={depositAvax}
                      disabled={!avaxDepositAmount || isPending || isConfirming}
                      className="w-full"
                    >
                      Deposit AVAX
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount">Withdraw AVAX</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      step="0.01"
                      placeholder="Amount to withdraw"
                      value={avaxWithdrawAmount}
                      onChange={(e) => setAvaxWithdrawAmount(e.target.value)}
                    />
                    <Button
                      onClick={withdrawAvax}
                      disabled={
                        !avaxWithdrawAmount || isPending || isConfirming
                      }
                      variant="destructive"
                      className="w-full"
                    >
                      Withdraw AVAX
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Token Support Management */}
              <Card className="unified-card lg:col-span-2">
                <CardHeader>
                  <CardTitle>Supported Tokens</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Token address to add/remove"
                      value={selectedToken}
                      onChange={(e) => setSelectedToken(e.target.value)}
                    />
                    <Button
                      onClick={() => setSupportedToken(selectedToken, true)}
                      disabled={
                        !selectedToken || !isAddress(selectedToken) || isPending
                      }
                    >
                      Add Support
                    </Button>
                    <Button
                      onClick={() => setSupportedToken(selectedToken, false)}
                      disabled={
                        !selectedToken || !isAddress(selectedToken) || isPending
                      }
                      variant="destructive"
                    >
                      Remove Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ymir Manager */}
          <TabsContent value="ymir-manager" className="space-y-6">
            <Card className="unified-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-primary" />
                  Ymir NFT Manager
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Supported Token
                    </Label>
                    <p className="font-mono text-sm">
                      {shinzouToken
                        ? `${(shinzouToken as string).slice(0, 6)}...${(
                            shinzouToken as string
                          ).slice(-4)}`
                        : "Loading..."}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Sacrifice Amount
                    </Label>
                    <p className="font-mono text-sm">
                      {sacrificeAmount
                        ? formatEther(sacrificeAmount as bigint)
                        : "Loading..."}{" "}
                      tokens
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-accent/20 rounded-lg border border-accent/30">
                  <p className="text-sm text-muted-foreground">
                    The Ymir manager is immutable and only accepts burns from
                    the SHINZOU token. No administrative functions are available
                    for this contract.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BurnManagerAdmin;
