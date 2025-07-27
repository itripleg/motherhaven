// app/faucet/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
  useBlockNumber,
} from "wagmi";
import { formatEther } from "viem";
import { motion } from "framer-motion";
import { ConnectButton } from "@/components/ConnectButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Timer,
  Droplets,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Zap,
  Vault,
} from "lucide-react";
import GRAND_VAULT_ABI from "./GrandVault_abi.json";
import { FAUCET_ADDRESS } from "@/types/contracts";

// Define a clear type for the button's state
type ButtonState = {
  text: string;
  disabled: boolean;
};

const GrandVaultFaucetPage = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isGaslessRequest, setIsGaslessRequest] = useState(false);

  // Handle client-side mounting to avoid hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current block number for more accurate timing
  const { data: currentBlockNumber } = useBlockNumber({ watch: true });

  // Read vault balance
  const { data: vaultBalance, refetch: refetchBalance } = useBalance({
    address: FAUCET_ADDRESS,
  });

  // Read contract data using GrandVault ABI
  const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: GRAND_VAULT_ABI,
    functionName: "getUserInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: vaultInfo, refetch: refetchVaultInfo } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: GRAND_VAULT_ABI,
    functionName: "getVaultInfo",
  });

  // Extract user info safely
  const isWhitelisted = userInfo ? (userInfo as any)[0] : false;
  const canDrip = userInfo ? (userInfo as any)[1] : false;
  const nextDripBlock = userInfo ? (userInfo as any)[2] : 0n;

  // Extract vault info safely
  const currentBalance = vaultInfo ? (vaultInfo as any)[0] : 0n;
  const dripAmount = vaultInfo ? (vaultInfo as any)[2] : 0n;

  // Write contract interaction
  const { writeContract, data: hash, error: writeError } = useWriteContract();

  // Transaction receipt handling
  const { isLoading: isDripping, isSuccess: isDripSuccess } =
    useWaitForTransactionReceipt({ hash });

  // Handle successful transaction
  useEffect(() => {
    if (isDripSuccess && dripAmount && mounted) {
      toast({
        title: "Success!",
        description: `${formatEther(
          dripAmount
        )} AVAX has been sent to your wallet`,
      });
      // Refetch all relevant data
      refetchBalance();
      refetchUserInfo();
      refetchVaultInfo();
      setLastUpdate(new Date());
    }
  }, [
    isDripSuccess,
    dripAmount,
    toast,
    refetchBalance,
    refetchUserInfo,
    refetchVaultInfo,
    mounted,
  ]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      toast({
        title: "Transaction Error",
        description: writeError.message,
        variant: "destructive",
      });
    }
  }, [writeError, toast]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!mounted || !isConnected) return;
    const interval = setInterval(() => {
      Promise.all([refetchBalance(), refetchUserInfo(), refetchVaultInfo()])
        .then(() => {
          setLastUpdate(new Date());
        })
        .catch((error) => {
          console.error("Auto-refresh failed:", error);
        });
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [mounted, isConnected, refetchBalance, refetchUserInfo, refetchVaultInfo]);

  const handleDripRequest = () => {
    writeContract({
      address: FAUCET_ADDRESS,
      abi: GRAND_VAULT_ABI,
      functionName: "requestDrip",
    });
  };

  const handleGaslessRequest = async () => {
    if (!address) return;

    setIsGaslessRequest(true);
    try {
      const response = await fetch("/api/gasless-drip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success!",
          description: `${data.amount} AVAX sent to your wallet (gasless)`,
        });
        // Refresh data
        refetchBalance();
        refetchUserInfo();
        refetchVaultInfo();
        setLastUpdate(new Date());
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request gasless drip",
        variant: "destructive",
      });
    } finally {
      setIsGaslessRequest(false);
    }
  };

  const hasSufficientBalance = currentBalance >= dripAmount;

  // Update time left every second
  useEffect(() => {
    if (
      typeof nextDripBlock !== "bigint" ||
      typeof currentBlockNumber !== "bigint" ||
      !mounted
    )
      return;

    const blocksLeft =
      nextDripBlock > currentBlockNumber
        ? Number(nextDripBlock - currentBlockNumber)
        : 0;
    const timeLeftInSeconds = blocksLeft * 2; // Assuming 2 seconds per block for Fuji

    setTimeLeft(timeLeftInSeconds);

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [nextDripBlock, currentBlockNumber, mounted]);

  const formatTimeLeft = (seconds: number): string => {
    if (seconds <= 0) return "00:00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const progressValue = timeLeft > 0 ? ((43200 - timeLeft) / 43200) * 100 : 100; // Assuming 24-hour cooldown (86400 seconds)

  // Get button state
  const getButtonState = (): ButtonState => {
    if (isDripping || isGaslessRequest)
      return { text: "Requesting...", disabled: true };
    if (!isWhitelisted)
      return { text: "Address Not Whitelisted", disabled: true };
    if (!hasSufficientBalance)
      return { text: "Insufficient Vault Balance", disabled: true };
    if (timeLeft > 0)
      return { text: `Wait ${formatTimeLeft(timeLeft)}`, disabled: true };
    return { text: "Request AVAX", disabled: false };
  };

  // Wait for mount before rendering anything that depends on wallet state
  if (!mounted) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="text-center">
          <Vault className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-lg">Loading Grand Vault...</p>
        </div>
      </div>
    );
  }

  const buttonState = getButtonState();

  return (
    <div className="min-h-screen animated-bg floating-particles">
      <div className="relative z-10 container mx-auto p-6 pt-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <Vault className="h-8 w-8 text-blue-400" />
                </div>
                Grand Vault Faucet
                <Badge
                  className="bg-green-500/20 text-green-400 border-green-500/30"
                  variant="outline"
                >
                  🟢 LIVE
                </Badge>
              </h1>
              <p className="text-gray-400 text-lg">
                Get test AVAX from trading fees collected in the Grand Vault
              </p>
            </div>
            {lastUpdate && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Updated {lastUpdate.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <Card className="unified-card w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Vault className="h-6 w-6 text-blue-400" />
                Grand Vault
              </CardTitle>
              <CardDescription>
                Request test AVAX tokens from collected trading fees
              </CardDescription>
              <div className="mt-3 p-2 bg-gray-500/10 border border-gray-500/30 rounded text-center">
                <p className="text-xs text-gray-400">Contract Address:</p>
                <p className="font-mono text-sm text-gray-300 break-all">
                  {FAUCET_ADDRESS}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isConnected ? (
                <div className="text-center space-y-4">
                  <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-orange-400 mx-auto mb-3" />
                    <h3 className="text-orange-400 font-medium mb-2">
                      Wallet Required
                    </h3>
                    <p className="text-orange-300 text-sm">
                      Connect your wallet to request test AVAX
                    </p>
                  </div>
                  <ConnectButton />
                </div>
              ) : !isWhitelisted ? (
                <div className="text-center space-y-4">
                  <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                    <h3 className="text-red-400 font-medium mb-2">
                      Not Whitelisted
                    </h3>
                    <p className="text-red-300 text-sm">
                      Your address is not whitelisted. Please contact an admin.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        Next drip available in:
                      </span>
                      <span className="font-mono text-blue-400 font-medium">
                        {formatTimeLeft(timeLeft)}
                      </span>
                    </div>
                    <Progress
                      value={progressValue}
                      className="h-3 bg-gray-800 border border-gray-700"
                    />
                  </div>
                  <div className="glass-card p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">
                        Amount per drip:
                      </span>
                      <span className="font-mono text-green-400 font-medium">
                        {dripAmount ? formatEther(dripAmount) : "0"} AVAX
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">
                        Vault balance:
                      </span>
                      <span className="font-mono text-blue-400 font-medium">
                        {vaultBalance
                          ? Number(vaultBalance.formatted).toFixed(4)
                          : "0"}{" "}
                        AVAX
                      </span>
                    </div>
                  </div>
                  {!hasSufficientBalance && (
                    <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>
                        The vault has insufficient funds. Try again later.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            {isConnected && isWhitelisted && (
              <CardFooter className="flex flex-col gap-2">
                <Button
                  className={`w-full h-12 text-lg font-bold transition-all duration-300 ${
                    buttonState.disabled
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "btn-primary hover:scale-105"
                  }`}
                  disabled={buttonState.disabled}
                  onClick={handleDripRequest}
                >
                  {isDripping ? (
                    <>
                      <Timer className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Droplets className="h-5 w-5 mr-2" />
                      {buttonState.text}
                    </>
                  )}
                </Button>

                {/* Gasless option */}
                {/* <Button
                  variant="outline"
                  className="w-full h-10 text-sm font-medium"
                  disabled={buttonState.disabled || isGaslessRequest}
                  onClick={handleGaslessRequest}
                >
                  {isGaslessRequest ? (
                    <>
                      <Timer className="h-4 w-4 animate-spin mr-2" />
                      Requesting gasless...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Request Gasless (Zero Balance OK)
                    </>
                  )}
                </Button> */}
              </CardFooter>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center py-12"
        >
          <Card className="unified-card max-w-2xl mx-auto">
            <CardContent className="p-8 space-y-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gradient flex items-center justify-center gap-2">
                  <Sparkles className="h-6 w-6 text-blue-400" />
                  Powered by Trading Fees
                </h3>
                <p className="text-muted-foreground">
                  This vault is currently collecting all trading fees from our
                  DEX.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://docs.avax.network/build/dapp/smart-contracts/get-funds-faucet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Avalanche Docs
                </a>
                <a
                  href={`https://testnet.snowtrace.io/address/${FAUCET_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  View on Explorer
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default GrandVaultFaucetPage;
