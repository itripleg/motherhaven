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
import { useToast } from "@/hooks/use-toast";
import { Container } from "@/components/craft";
import { Timer, Droplets, AlertCircle } from "lucide-react";
import FAUCET_ABI from "@/contracts/nu-nu/Faucet_abi.json";

const FAUCET_ADDRESS = "0x0B50C987D357a8000FCD88f7eC6D35A88775AfD2";

const FujiFaucet = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current block number for more accurate timing
  const { data: currentBlockNumber } = useBlockNumber({
    watch: true,
  });

  // Read faucet balance
  const { data: faucetBalance, refetch: refetchBalance } = useBalance({
    address: FAUCET_ADDRESS,
  });

  // Read contract data
  const { data: isWhitelisted, refetch: refetchWhitelisted } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "whitelisted",
    args: address ? [address] : undefined,
  });

  const { data: canRequest, refetch: refetchCanRequest } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "canRequestDrip",
    args: address ? [address] : undefined,
  });

  const { data: nextDripBlock, refetch: refetchNextDrip } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "getNextDripBlock",
    args: address ? [address] : undefined,
  }) as any;

  const { data: dripAmount } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "dripAmount",
  }) as { data: bigint | undefined };

  // Write contract interaction
  const { writeContract, data: hash } = useWriteContract();

  // Transaction receipt handling
  const { isLoading: isDripping } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle successful transaction
  useEffect(() => {
    if (!isDripping && hash && dripAmount) {
      toast({
        title: "Success!",
        description: `${formatEther(
          dripAmount
        )} AVAX has been sent to your wallet`,
      });
      // Refetch all data
      refetchBalance();
      refetchWhitelisted();
      refetchCanRequest();
      refetchNextDrip();
    }
  }, [
    isDripping,
    hash,
    dripAmount,
    toast,
    refetchBalance,
    refetchWhitelisted,
    refetchCanRequest,
    refetchNextDrip,
  ]);

  const handleDripRequest = () => {
    writeContract({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "requestDrip",
    });
  };

  // Calculate if the faucet has enough balance for a drip
  const hasSufficientBalance =
    faucetBalance && dripAmount
      ? BigInt(faucetBalance.value) >= dripAmount
      : false;

  // Update time left every second
  useEffect(() => {
    if (!nextDripBlock || !currentBlockNumber) return;

    const updateTimeLeft = () => {
      if (typeof nextDripBlock === "bigint") {
        const blocksLeft =
          nextDripBlock > BigInt(currentBlockNumber)
            ? Number(nextDripBlock - BigInt(currentBlockNumber))
            : 0;
        const timeLeftInSeconds = blocksLeft * 2; // 2 seconds per block
        setTimeLeft(timeLeftInSeconds);
      }
    };

    updateTimeLeft(); // Initial update
    const timer = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [nextDripBlock, currentBlockNumber]);

  const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return "0:00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const progressValue =
    timeLeft > 0 ? ((24 * 3600 - timeLeft) / (24 * 3600)) * 100 : 100;

  // Get button state
  const getButtonState = () => {
    if (isDripping) return { text: "Requesting...", disabled: true };
    if (!isWhitelisted)
      return { text: "Address Not Whitelisted", disabled: true };
    if (!hasSufficientBalance)
      return { text: "Insufficient Faucet Balance", disabled: true };
    if (timeLeft > 0)
      return { text: `Wait ${formatTimeLeft(timeLeft)}`, disabled: true };
    return { text: "Request AVAX", disabled: false };
  };

  // Handle hydration
  if (!mounted) {
    return null;
  }

  const buttonState = getButtonState();

  return (
    <Container className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-6 w-6" />
            Fuji Testnet Faucet
          </CardTitle>
          <CardDescription>
            Get test AVAX for development on the Fuji testnet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="text-center">
              <ConnectButton />
            </div>
          ) : !isWhitelisted ? (
            <div className="flex items-center gap-2 text-center text-sm text-destructive bg-destructive/10 rounded-lg p-4">
              <AlertCircle className="h-4 w-4" />
              Your address is not whitelisted. Please contact the faucet
              administrator.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Next drip available in:
                  </span>
                  <span className="font-mono">{formatTimeLeft(timeLeft)}</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Amount per drip:
                  </span>
                  <span className="font-mono">
                    {dripAmount ? formatEther(dripAmount) : "0"} AVAX
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Faucet balance:
                  </span>
                  <span className="font-mono">
                    {faucetBalance
                      ? Number(faucetBalance.formatted).toFixed(4)
                      : "0"}{" "}
                    AVAX
                  </span>
                </div>
              </div>
              {!hasSufficientBalance && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-4">
                  <AlertCircle className="h-4 w-4" />
                  The faucet currently has insufficient balance for drips
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            disabled={buttonState.disabled}
            onClick={handleDripRequest}
          >
            {isDripping ? (
              <Timer className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Droplets className="mr-2 h-4 w-4" />
            )}
            {buttonState.text}
          </Button>
        </CardFooter>
      </Card>
    </Container>
  );
};

export default FujiFaucet;
