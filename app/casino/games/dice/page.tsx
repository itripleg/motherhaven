"use client";

import { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Box } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/craft";
import { motion } from "framer-motion";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useConnect,
} from "wagmi";
import { parseUnits, parseEther, formatUnits, Address } from "viem";
import { useRouter } from "next/navigation"; // Import useRouter from Next.js
import * as THREE from "three";
import metadata from "@/contracts/magic-dice/MagicDice_metadata.json";

function Scene() {
  const cube1Ref = useRef<THREE.Mesh>(null);
  const cube2Ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (cube1Ref.current && cube2Ref.current) {
      cube1Ref.current.rotation.x += 0.01;
      cube1Ref.current.rotation.y += 0.01;
      cube2Ref.current.rotation.x -= 0.01;
      cube2Ref.current.rotation.y -= 0.01;
    }
  });

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 10]} />
      <pointLight position={[10, 10, 10]} />
      <Box ref={cube1Ref} position={[-1.5, 0, 0]}>
        <meshStandardMaterial color="hotpink" />
      </Box>
      <Box ref={cube2Ref} position={[1.5, 0, 0]}>
        <meshStandardMaterial color="lightblue" />
      </Box>
    </>
  );
}

export default function DiceGame() {
  const [betRange, setBetRange] = useState<[number, number]>([11, 100]);
  const [betAmount, setBetAmount] = useState("100");
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { connect, connectors, loading } = useConnect(); // No pendingConnector, use isLoading
  const router = useRouter();
  const contractAddress =
    "0xd50d3638d617f6b15fc3024421e2f4110e7bf249" as Address;
  const contractABI = metadata.output.abi;

  const contractConfig = {
    address: contractAddress,
    abi: contractABI,
  };

  // Redirect if the user is not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/casino"); // Redirect to /casino if not connected
    }
  }, [isConnected, router]);

  // Read functions
  const { data: playerBalanceData } = useReadContract({
    ...contractConfig,
    functionName: "balanceOf",
    args: [address as Address, 0],
  });

  const playerBalance = playerBalanceData
    ? formatUnits(playerBalanceData as bigint, 12)
    : "0";

  const { data: contractDicePointsData } = useReadContract({
    ...contractConfig,
    functionName: "balanceOf",
    args: [contractAddress, 0],
  });

  const contractDicePoints = contractDicePointsData
    ? formatUnits(contractDicePointsData as bigint, 12)
    : "0";

  const { data: totalRollsData } = useReadContract({
    ...contractConfig,
    functionName: "totalRolls",
  });

  const totalRolls = totalRollsData ? Number(totalRollsData) : 0;

  const { data: lastPayoutData } = useReadContract({
    ...contractConfig,
    functionName: "payout",
  });

  const lastPayout = lastPayoutData
    ? formatUnits(lastPayoutData as bigint, 12)
    : "0";

  // Roll function
  const { data: rollHash, writeContract: roll } = useWriteContract();

  const handleRoll = async () => {
    setIsRolling(true);
    setErrorMessage(null);
    try {
      await roll({
        address: contractAddress,
        abi: contractABI,
        functionName: "roll",
        args: [betRange[0], betRange[1], parseUnits(betAmount, 12) as bigint],
      });
    } catch (error) {
      setErrorMessage((error as Error).message);
      setIsRolling(false);
    }
  };

  const expectedPayout = Math.floor(
    (10000 / (betRange[1] * 100 - betRange[0] * 100)) * parseInt(betAmount)
  );

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Magic Dice</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-[400px]">
            <Canvas camera={{ position: [0, 0, 5] }}>
              <Scene />
              <OrbitControls enableZoom={false} />
            </Canvas>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Bet Range
              </label>
              <Slider
                value={betRange}
                onValueChange={(value) =>
                  setBetRange([value[0], value[1]] as [number, number])
                }
                min={11}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="mt-2 text-sm">
                Win if roll is between {betRange[0]} and {betRange[1]}
              </div>
              <div>Number of outs: {betRange[1] - betRange[0] + 1}</div>
            </div>

            <div>
              <label
                htmlFor="betAmount"
                className="block text-sm font-medium mb-2"
              >
                Bet Amount (DICEPOINTS)
              </label>
              <Input
                id="betAmount"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min="1"
                step="1"
              />
            </div>

            <div>Expected Payout: {expectedPayout} DICEPOINTS</div>

            <div className="space-x-4">
              <Button
                onClick={handleRoll}
                disabled={isRolling}
                className="bg-gradient-to-tl from-purple-400 to-blue-700 hover:animate-pulse"
              >
                {isRolling ? "Rolling..." : "Roll"}
              </Button>
            </div>

            {errorMessage && (
              <div className="text-red-500">Error: {errorMessage}</div>
            )}

            {rollResult !== null && (
              <motion.div
                className="text-6xl font-bold text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                {rollResult}
                <div className="text-xl mt-2">
                  {rollResult >= betRange[0] && rollResult <= betRange[1]
                    ? "You Win!"
                    : "You Lose"}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>Player Balance: {playerBalance} DICEPOINTS</div>
            <div>Contract DICEPOINTS: {contractDicePoints}</div>
            <div>Total Rolls: {totalRolls}</div>
            <div>Last Payout: {lastPayout} DICEPOINTS</div>
          </div>
        </div>
      </div>
    </Container>
  );
}
