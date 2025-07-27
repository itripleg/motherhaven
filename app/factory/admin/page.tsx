// app/factory/admin/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/craft";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  DollarSign,
  Users,
  Factory,
  AlertCircle,
  Download,
  ExternalLink,
  Target,
  Globe,
} from "lucide-react";

import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types/contracts";

const FactoryAdmin = () => {
  const { address } = useAccount();
  const { toast } = useToast();
  const [newFeeRecipient, setNewFeeRecipient] = useState("");
  const [newDefaultGoal, setNewDefaultGoal] = useState("");
  const [newIpfsGateway, setNewIpfsGateway] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenGoal, setTokenGoal] = useState("");
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const { writeContract, data: hash } = useWriteContract();

  // Read contract data
  const { data: ownerAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "owner",
  });

  const { data: feeRecipient } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "feeRecipient",
  });

  const { data: defaultFundingGoal } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "defaultFundingGoal",
  });

  const { data: defaultIpfsGateway } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "defaultIpfsGateway",
  });

  const { data: allTokens } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getAllTokens",
  });

  // Get factory balance
  const { data: factoryBalance } = useBalance({
    address: FACTORY_ADDRESS,
  });

  const isOwner = ownerAddress === address;

  // Transaction receipt handling
  const { isLoading: isPending } = useWaitForTransactionReceipt({
    hash,
  });

  // Reset form fields after successful transaction
  useEffect(() => {
    if (!isPending && hash) {
      toast({
        title: "Success",
        description: "Transaction completed successfully",
      });

      // Reset form fields
      setNewFeeRecipient("");
      setNewDefaultGoal("");
      setNewIpfsGateway("");
      setTokenAddress("");
      setTokenGoal("");
    }
  }, [isPending, hash, toast]);

  // Transaction handlers
  const handleSetFeeRecipient = () => {
    if (!newFeeRecipient) return;
    writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "setFeeRecipient",
      args: [newFeeRecipient as `0x${string}`],
    });
  };

  const handleSetDefaultFundingGoal = () => {
    if (!newDefaultGoal) return;
    try {
      const goal = parseEther(newDefaultGoal);
      writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "setDefaultFundingGoal",
        args: [goal],
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid funding goal format",
        variant: "destructive",
      });
    }
  };

  const handleSetIpfsGateway = () => {
    if (!newIpfsGateway) return;
    writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "setDefaultIpfsGateway",
      args: [newIpfsGateway],
    });
  };

  const handleSetTokenFundingGoal = () => {
    if (!tokenAddress || !tokenGoal) return;
    try {
      const goal = parseEther(tokenGoal);
      writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "setTokenFundingGoal",
        args: [tokenAddress as `0x${string}`, goal],
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid token goal format",
        variant: "destructive",
      });
    }
  };

  const handleWithdrawAll = () => {
    writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "withdrawAll",
    });
  };

  // Handle hydration
  if (!mounted) {
    return null;
  }

  if (!isOwner) {
    return (
      <Container className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-400" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              You must be the factory owner to access this panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Current address: {address || "Not connected"}</p>
              <p>Factory owner: {String(ownerAddress || "Loading...")}</p>
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <div className="min-h-screen animated-bg floating-particles">
      <Container className="py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <Factory className="h-8 w-8 text-blue-400" />
                </div>
                Factory Administration
                <Badge
                  className="bg-green-500/20 text-green-400 border-green-500/30"
                  variant="outline"
                >
                  OWNER
                </Badge>
              </h1>
              <p className="text-gray-400 text-lg">
                Manage factory settings and monitor token creation
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Factory Stats */}
          <Card className="unified-card xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Factory Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Factory Balance:
                  </span>
                  <span className="font-mono text-green-400">
                    {factoryBalance ? formatEther(factoryBalance.value) : "0"}{" "}
                    ETH
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Tokens:
                  </span>
                  <span className="font-mono text-blue-400">
                    {Array.isArray(allTokens) ? allTokens.length : 0}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Current Fee Recipient:
                  </span>
                  <span className="font-mono text-primary text-xs">
                    {feeRecipient
                      ? `${String(feeRecipient).slice(0, 6)}...${String(
                          feeRecipient
                        ).slice(-4)}`
                      : "Loading..."}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Default Funding Goal:
                  </span>
                  <span className="font-mono text-yellow-400">
                    {defaultFundingGoal
                      ? formatEther(defaultFundingGoal as bigint)
                      : "0"}{" "}
                    ETH
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    IPFS Gateway:
                  </span>
                  <span className="font-mono text-purple-400 text-xs truncate max-w-32">
                    {String(defaultIpfsGateway || "Loading...")}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <Button
                  onClick={handleWithdrawAll}
                  disabled={
                    isPending || !factoryBalance || factoryBalance.value === 0n
                  }
                  variant="destructive"
                  className="w-full"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Withdraw All Funds
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Controls */}
          <div className="xl:col-span-2 space-y-6">
            {/* Fee & Global Settings */}
            <Card className="unified-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  Global Settings
                </CardTitle>
                <CardDescription>
                  Configure factory-wide parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fee Recipient */}
                <div className="space-y-2">
                  <Label>Fee Recipient Address</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="0x..."
                      value={newFeeRecipient}
                      onChange={(e) => setNewFeeRecipient(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSetFeeRecipient}
                      disabled={isPending || !newFeeRecipient}
                      size="sm"
                    >
                      Update
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Address that receives all trading fees (0.3% of trades)
                  </p>
                </div>

                {/* Default Funding Goal */}
                <div className="space-y-2">
                  <Label>Default Funding Goal (ETH)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="25.0"
                      value={newDefaultGoal}
                      onChange={(e) => setNewDefaultGoal(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSetDefaultFundingGoal}
                      disabled={isPending || !newDefaultGoal}
                      size="sm"
                    >
                      Update
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Default funding goal for new tokens (current:{" "}
                    {defaultFundingGoal
                      ? String(formatEther(defaultFundingGoal as bigint))
                      : "0"}{" "}
                    ETH)
                  </p>
                </div>

                {/* IPFS Gateway */}
                <div className="space-y-2">
                  <Label>IPFS Gateway URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://ipfs.io/ipfs/"
                      value={newIpfsGateway}
                      onChange={(e) => setNewIpfsGateway(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSetIpfsGateway}
                      disabled={isPending || !newIpfsGateway}
                      size="sm"
                    >
                      Update
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gateway used for IPFS image resolution
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Token Management */}
            <Card className="unified-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-400" />
                  Token Management
                </CardTitle>
                <CardDescription>
                  Manage individual token settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Set Token Funding Goal</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Token Address (0x...)"
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Goal (ETH)"
                      value={tokenGoal}
                      onChange={(e) => setTokenGoal(e.target.value)}
                      className="w-32"
                    />
                    <Button
                      onClick={handleSetTokenFundingGoal}
                      disabled={isPending || !tokenAddress || !tokenGoal}
                      size="sm"
                    >
                      Set Goal
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Override the funding goal for a specific token. Trading will
                    halt when reached.
                  </p>
                </div>

                {/* Quick Links */}
                <div className="pt-4 border-t border-border/50">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open("/factory/tokens", "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View All Tokens
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open("/factory/analytics", "_blank")
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Analytics Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default FactoryAdmin;
