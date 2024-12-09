// hooks/contracts/useFactoryContract.ts
import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useSimulateContract,
} from 'wagmi';
import { FACTORY_ADDRESS, FACTORY_ABI, Token, TokenState } from '@/types';
import { type Address, formatEther, parseEther } from 'viem';

export function useFactoryContract() {
  const { writeContract, isPending: isWritePending } = useWriteContract();

  // Read Operations
  const useTokenState = (tokenAddress?: Address) => {
    return useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'getTokenState',
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: Boolean(tokenAddress),
      }
    });
  };

  const useCollateral = (tokenAddress?: Address) => {
    const { data, ...rest } = useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'collateral',
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: Boolean(tokenAddress),
      }
    });

    return {
      data: data ? formatEther(data as bigint) : undefined,
      ...rest
    };
  };

  // Write Operations with Simulation
  const useCreateToken = (name?: string, symbol?: string) => {
    const simulation = useSimulateContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'createToken',
      args: name && symbol ? [name, symbol] : undefined,
      query: {
        enabled: Boolean(name && symbol),
      }
    });

    const write = async () => {
      if (!name || !symbol) throw new Error('Name and symbol are required');
      
      const hash = await writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'createToken',
        args: [name, symbol]
      });

      return hash;
    };

    return {
      simulation,
      write,
      isPending: isWritePending
    };
  };

  const useBuyTokens = (tokenAddress?: Address, amount?: string) => {
    const simulation = useSimulateContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'buy',
      args: tokenAddress ? [tokenAddress] : undefined,
      value: amount ? parseEther(amount) : undefined,
      query: {
        enabled: Boolean(tokenAddress && amount),
      }
    });

    const write = async () => {
      if (!tokenAddress || !amount) throw new Error('Token address and amount are required');
      
      const hash = await writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'buy',
        args: [tokenAddress],
        value: parseEther(amount)
      });

      return hash;
    };

    return {
      simulation,
      write,
      isPending: isWritePending
    };
  };

  const useSellTokens = (tokenAddress?: Address, amount?: string) => {
    const simulation = useSimulateContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'sell',
      args: tokenAddress && amount 
        ? [tokenAddress, parseEther(amount)] 
        : undefined,
      query: {
        enabled: Boolean(tokenAddress && amount),
      }
    });

    const write = async () => {
      if (!tokenAddress || !amount) throw new Error('Token address and amount are required');
      
      const hash = await writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'sell',
        args: [tokenAddress, parseEther(amount)]
      });

      return hash;
    };

    return {
      simulation,
      write,
      isPending: isWritePending
    };
  };

  const useCurrentPrice = (tokenAddress?: Address) => {
    return useReadContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'getCurrentPrice',
      args: tokenAddress ? [tokenAddress] : undefined,
      query: {
        enabled: Boolean(tokenAddress), // Only run query if tokenAddress is provided
        // You can add caching or polling here if needed
        // gcTime: 1000 * 60 * 5, // Cache for 5 minutes
        // refetchInterval: 1000 * 30 // Refetch every 30 seconds
      }
    });
  }
  // Function to format price with a specified number of decimals
  const formatPriceDecimals = (price: bigint | undefined, decimals: number = 18): string => {
    if (!price) return '0';
    const formatted = formatEther(price);
    return Number(formatted).toFixed(decimals);
  };
  return {
    useTokenState,
    useCollateral,
    useCreateToken,
    useBuyTokens,
    useSellTokens,
    useCurrentPrice,
    formatPriceDecimals
  };


}
