// app/faucet/admin/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
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
import { Settings, Vault, Activity } from "lucide-react";

import GRAND_VAULT_ABI from "../GrandVault_abi.json";
import { FAUCET_ADDRESS } from "@/types/contracts";

const GrandVaultAdmin = () => {
  const { address } = useAccount();
  const { toast } = useToast();
  const [newAmount, setNewAmount] = useState("");
  const [newInterval, setNewInterval] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [batchAddresses, setBatchAddresses] = useState("");
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const { writeContract, data: hash } = useWriteContract();

  // Read contract data using GrandVault ABI
  const { data: ownerAddress } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: GRAND_VAULT_ABI,
    functionName: "owner",
  });

  const isOwner = ownerAddress === address;

  const { data: vaultInfo } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: GRAND_VAULT_ABI,
    functionName: "getVaultInfo",
  });

  const { data: totalFeesCollected } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: GRAND_VAULT_ABI,
    functionName: "getTotalFeesCollected",
  });

  // Extract vault info safely
  const currentBalance = vaultInfo ? (vaultInfo as any)[0] : 0n;
  const trackedBalance = vaultInfo ? (vaultInfo as any)[1] : 0n;
  const currentAmount = vaultInfo ? (vaultInfo as any)[2] : 0n;
  const currentInterval = vaultInfo ? (vaultInfo as any)[3] : 0n;

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

      // Reset relevant form field based on the transaction type
      if (hash) {
        setNewAmount("");
        setNewInterval("");
        setNewAddress("");
        setBatchAddresses("");
      }
    }
  }, [isPending, hash, toast]);

  // Transaction handlers
  const handleSetAmount = () => {
    if (!newAmount) return;
    try {
      const amount = parseEther(newAmount);
      writeContract({
        address: FAUCET_ADDRESS,
        abi: GRAND_VAULT_ABI,
        functionName: "setDripAmount",
        args: [amount],
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid amount format",
        variant: "destructive",
      });
    }
  };

  const handleSetInterval = () => {
    if (!newInterval) return;
    const blocks = (parseInt(newInterval) * 3600) / 2;
    writeContract({
      address: FAUCET_ADDRESS,
      abi: GRAND_VAULT_ABI,
      functionName: "setDripInterval",
      args: [BigInt(blocks)],
    });
  };

  const handleUpdateWhitelist = (add: boolean) => {
    if (!newAddress) return;
    writeContract({
      address: FAUCET_ADDRESS,
      abi: GRAND_VAULT_ABI,
      functionName: "updateWhitelist",
      args: [newAddress as `0x${string}`, add],
    });
  };

  const handleBatchWhitelist = (add: boolean) => {
    if (!batchAddresses) return;
    const addresses = batchAddresses
      .split("\n")
      .map((addr) => addr.trim())
      .filter(Boolean) as `0x${string}`[];

    writeContract({
      address: FAUCET_ADDRESS,
      abi: GRAND_VAULT_ABI,
      functionName: "batchUpdateWhitelist",
      args: [addresses, add],
    });
  };

  const handleWithdraw = () => {
    writeContract({
      address: FAUCET_ADDRESS,
      abi: GRAND_VAULT_ABI,
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
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              You must be the contract owner to access this panel
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vault className="h-6 w-6" />
            Grand Vault Administration
          </CardTitle>
          <CardDescription>
            Manage vault settings, whitelist, and fee collection
          </CardDescription>
          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900/20 rounded border">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Contract Address:
            </p>
            <p className="font-mono text-sm text-gray-700 dark:text-gray-300 break-all">
              {FAUCET_ADDRESS}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vault Stats */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Vault Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Label className="text-sm text-blue-600 dark:text-blue-400">
                  Current Balance
                </Label>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatEther(currentBalance)} AVAX
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Label className="text-sm text-green-600 dark:text-green-400">
                  Total Fees Collected
                </Label>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {totalFeesCollected
                    ? formatEther(totalFeesCollected as bigint)
                    : "0"}{" "}
                  AVAX
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Label className="text-sm text-purple-600 dark:text-purple-400">
                  Tracked Balance
                </Label>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {formatEther(trackedBalance)} AVAX
                </p>
              </div>
            </div>
          </div>

          {/* Drip Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Drip Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Amount: {formatEther(currentAmount)} AVAX</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="New amount in AVAX"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                  <Button onClick={handleSetAmount} disabled={isPending}>
                    Update
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Current Interval: {(Number(currentInterval) * 2) / 3600} hours
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="New interval in hours"
                    value={newInterval}
                    onChange={(e) => setNewInterval(e.target.value)}
                  />
                  <Button onClick={handleSetInterval} disabled={isPending}>
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Whitelist Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Whitelist Management</h3>

            <div className="space-y-2">
              <Label>Add/Remove Single Address</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Address (0x...)"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
                <Button
                  onClick={() => handleUpdateWhitelist(true)}
                  disabled={isPending}
                  variant="secondary"
                >
                  Add
                </Button>
                <Button
                  onClick={() => handleUpdateWhitelist(false)}
                  disabled={isPending}
                  variant="destructive"
                >
                  Remove
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Add/Remove Batch Addresses</Label>
              <div className="flex gap-2 flex-col">
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter addresses, one per line"
                  value={batchAddresses}
                  onChange={(e) => setBatchAddresses(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBatchWhitelist(true)}
                    disabled={isPending}
                    variant="secondary"
                  >
                    Add Batch
                  </Button>
                  <Button
                    onClick={() => handleBatchWhitelist(false)}
                    disabled={isPending}
                    variant="destructive"
                  >
                    Remove Batch
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Withdraw Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Danger Zone
            </h3>
            <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
              <Label className="text-red-700 dark:text-red-300 mb-2 block">
                Withdraw All Funds
              </Label>
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                This will withdraw all AVAX from the vault to the owner address.
              </p>
              <Button
                onClick={handleWithdraw}
                disabled={isPending}
                variant="destructive"
              >
                Withdraw All Funds
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
};

export default GrandVaultAdmin;
