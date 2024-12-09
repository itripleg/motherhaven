// hooks/contracts/useFactoryContracts.ts
import { useReadContracts, useWriteContract, useSimulateContract } from "wagmi";
import { formatEther, parseEther, Address } from "viem";
import { FACTORY_ADDRESS, FACTORY_ABI, TokenState } from "@/types";

const factoryContract = {
  address: FACTORY_ADDRESS as `0x${string}`,
  abi: FACTORY_ABI,
} as const;

export function useFactoryContract(tokenAddress?: Address) {
  const { writeContract, isPending: isWritePending } = useWriteContract();

  // Read multiple contract values efficiently
  const {
    data: contractData,
    isError,
    refetch,
    isLoading,
  } = useReadContracts({
    contracts: tokenAddress
      ? [
          {
            ...factoryContract,
            functionName: "getCurrentPrice",
            args: [tokenAddress],
          },
          {
            ...factoryContract,
            functionName: "collateral",
            args: [tokenAddress],
          },
          {
            ...factoryContract,
            functionName: "getTokenState",
            args: [tokenAddress],
          },
          {
            ...factoryContract,
            functionName: "getFundingGoal",
            args: [tokenAddress],
          },
          {
            ...factoryContract,
            functionName: "virtualSupply",
            args: [tokenAddress],
          },
        ]
      : [],
  });

  // Parse contract data with type safety
  const parsedData = {
    currentPrice: contractData?.[0]?.result
      ? formatEther(contractData[0].result as bigint)
      : "0",
    collateral: contractData?.[1]?.result
      ? formatEther(contractData[1].result as bigint)
      : "0",
    tokenState: contractData?.[2]?.result
      ? (Number(contractData[2].result) as TokenState)
      : TokenState.NOT_CREATED,
    fundingGoal: contractData?.[3]?.result
      ? formatEther(contractData[3].result as bigint)
      : "0",
    virtualSupply: contractData?.[4]?.result
      ? (contractData[4].result as bigint).toString()
      : "0",
  };

  // Write Operations with Simulation
  const useBuy = (amount?: string) => {
    const simulation = useSimulateContract({
      ...factoryContract,
      functionName: "buy",
      args: tokenAddress ? [tokenAddress] : undefined,
      value: amount ? parseEther(amount) : undefined,
      query: {
        enabled: Boolean(tokenAddress && amount),
      },
    });

    const write = async () => {
      if (!tokenAddress || !amount)
        throw new Error("Token address and amount are required");

      return writeContract({
        ...factoryContract,
        functionName: "buy",
        args: [tokenAddress],
        value: parseEther(amount),
      });
    };

    return {
      simulation,
      write,
      isPending: isWritePending,
    };
  };

  const useSell = (amount?: string) => {
    const simulation = useSimulateContract({
      ...factoryContract,
      functionName: "sell",
      args:
        tokenAddress && amount ? [tokenAddress, parseEther(amount)] : undefined,
      query: {
        enabled: Boolean(tokenAddress && amount),
      },
    });

    const write = async () => {
      if (!tokenAddress || !amount)
        throw new Error("Token address and amount are required");

      return writeContract({
        ...factoryContract,
        functionName: "sell",
        args: [tokenAddress, parseEther(amount)],
      });
    };

    return {
      simulation,
      write,
      isPending: isWritePending,
    };
  };

  const useCreate = (
    name?: string,
    symbol?: string,
    imageUrl?: string,
    burnManager?: Address
  ) => {
    const simulation = useSimulateContract({
      ...factoryContract,
      functionName: "createToken",
      args:
        name && symbol && imageUrl && burnManager
          ? [name, symbol, imageUrl, burnManager]
          : undefined,
      query: {
        enabled: Boolean(name && symbol && imageUrl && burnManager),
      },
    });

    const write = async () => {
      if (!name || !symbol || !imageUrl || !burnManager) {
        throw new Error("All parameters are required for token creation");
      }

      return writeContract({
        ...factoryContract,
        functionName: "createToken",
        args: [name, symbol, imageUrl, burnManager],
      });
    };

    return {
      simulation,
      write,
      isPending: isWritePending,
    };
  };

  // Helper functions
  const calculateTokenAmount = async (ethAmount: string) => {
    if (!tokenAddress) throw new Error("Token address required");

    const result = await writeContract({
      ...factoryContract,
      functionName: "calculateTokenAmount",
      args: [tokenAddress, parseEther(ethAmount)],
    });

    return formatEther(result as bigint);
  };

  const calculateFee = async (amount: string) => {
    const result = await writeContract({
      ...factoryContract,
      functionName: "calculateFee",
      args: [parseEther(amount)],
    });

    return formatEther(result as bigint);
  };

  return {
    // Contract state
    ...parsedData,
    isLoading,
    isError,
    refetch,

    // Trading operations
    useBuy,
    useSell,
    useCreate,

    // Calculations
    calculateTokenAmount,
    calculateFee,
  };
}

// Example usage in a component:
/*
function TokenTrading({ tokenAddress }: { tokenAddress: Address }) {
  const {
    currentPrice,
    tokenState,
    collateral,
    isLoading,
    useBuy,
    useSell
  } = useFactoryContracts(tokenAddress);

  const { simulation: buySimulation, write: executeBuy } = useBuy('0.1');
  const { simulation: sellSimulation, write: executeSell } = useSell('100');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Current Price: {currentPrice} ETH</p>
      <p>Collateral: {collateral} ETH</p>
      <button onClick={() => executeBuy()}>Buy Tokens</button>
      <button onClick={() => executeSell()}>Sell Tokens</button>
    </div>
  );
}
*/
