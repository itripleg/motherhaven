import { useReadContract, useWatchContractEvent } from "wagmi";
import { formatUnits, parseUnits, Address, UnknownRpcError } from "viem";
import tokenFactoryMetadata from "@/contracts/token-factory/artifacts/TokenFactory_metadata.json";

const FACTORY_ADDRESS = "0x7713A39875A5335dc4Fc4f9359908afb55984b1F";
const FACTORY_ABI = tokenFactoryMetadata.output.abi;

type TokenEventLog = {
  args: {
    token: string;
    buyer?: string;
    seller?: string;
    amount?: bigint;
    tokenAmount?: bigint;
    price?: bigint;
    ethAmount?: bigint;
    eventName: string;
    args: [];
  };
  eventName: string;
};

const useTokenDetails = (tokenAddress: Address, amountInAvax?: string) => {
  // Get price from factory contract
  const {
    data: priceData,
    refetch: refetchPrice,
    isError: isPriceError,
  } = useReadContract({
    abi: FACTORY_ABI,
    address: FACTORY_ADDRESS,
    functionName: "getCurrentPrice",
    args: [tokenAddress],
  });

  // Get token's collateral from factory
  const {
    data: collateralData,
    refetch: refetchCollateral,
    isError: isCollateralError,
  } = useReadContract({
    abi: FACTORY_ABI,
    address: FACTORY_ADDRESS,
    functionName: "getCollateral",
    args: [tokenAddress],
  });

  // Get token's state from factory
  const { data: tokenStateData, isError: isStateError } = useReadContract({
    abi: FACTORY_ABI,
    address: FACTORY_ADDRESS,
    functionName: "getTokenState",
    args: [tokenAddress],
  });

  // Calculate tokens to receive for a given AVAX amount
  const { data: receiveAmountData } = useReadContract({
    abi: FACTORY_ABI,
    address: FACTORY_ADDRESS,
    functionName: "calculateTokenAmount",
    args: amountInAvax
      ? [tokenAddress, parseUnits(amountInAvax, 18)]
      : undefined,
    query: {
      enabled: !!amountInAvax,
    },
  });

  // Watch events...
  useWatchContractEvent({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    eventName: "TokensPurchased",
    onLogs(logs) {
      const log = logs[0] as unknown as TokenEventLog;
      if (log?.args?.token?.toLowerCase() === tokenAddress?.toLowerCase()) {
        refetchPrice();
        refetchCollateral();
      }
    },
  });

  useWatchContractEvent({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    eventName: "TokensSold",
    onLogs(logs) {
      const log = logs[0] as unknown as TokenEventLog;
      if (log?.args?.token?.toLowerCase() === tokenAddress?.toLowerCase()) {
        refetchPrice();
        refetchCollateral();
      }
    },
  });

  // Format the values if they exist
  const formattedPrice = priceData
    ? formatUnits(BigInt(priceData.toString()), 18)
    : "0";
  const formattedCollateral = collateralData
    ? formatUnits(BigInt(collateralData.toString()), 18)
    : "0";
  const formattedReceiveAmount = receiveAmountData
    ? formatUnits(BigInt(receiveAmountData.toString()), 18)
    : "0";

  // Consider loading complete if we either have data or encountered an error
  const isLoading = !(
    (priceData !== undefined || isPriceError) &&
    (collateralData !== undefined || isCollateralError) &&
    (tokenStateData !== undefined || isStateError)
  );

  return {
    price: formattedPrice,
    rawPrice: priceData,
    collateral: formattedCollateral,
    rawCollateral: collateralData,
    tokenState: Number(tokenStateData ?? 0),
    receiveAmount: formattedReceiveAmount,
    rawReceiveAmount: receiveAmountData,
    isLoading,
  };
};

export default useTokenDetails;
