import { useReadContract, useWatchContractEvent } from "wagmi";
import { formatUnits, parseUnits, Address } from "viem";
import { useEffect } from "react";
import tokenFactoryMetadata from "@/contracts/token-factory/artifacts/TokenFactory_metadata.json";

const FACTORY_ADDRESS = "0x7713A39875A5335dc4Fc4f9359908afb55984b1F";
const FACTORY_ABI = tokenFactoryMetadata.output.abi;

const useTokenDetails = (tokenAddress: Address, amountInAvax?: string) => {
  // Get price from factory contract
  const { data: priceData, refetch: refetchPrice } = useReadContract({
    abi: FACTORY_ABI,
    address: FACTORY_ADDRESS,
    functionName: "getCurrentPrice",
    args: [tokenAddress],
  });

  // Get token's collateral from factory
  const { data: collateralData, refetch: refetchCollateral } = useReadContract({
    abi: FACTORY_ABI,
    address: FACTORY_ADDRESS,
    functionName: "getCollateral",
    args: [tokenAddress],
  });

  // Get token's state from factory
  const { data: tokenStateData } = useReadContract({
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
    enabled: !!amountInAvax,
  });

  // Watch for buy events for this token
  useWatchContractEvent({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    eventName: "TokensPurchased",
    onLogs(logs) {
      logs.forEach((log) => {
        if (log.args.token?.toLowerCase() === tokenAddress?.toLowerCase()) {
          console.log("Buy detected for this token, refreshing price...");
          refetchPrice();
          refetchCollateral();
        }
      });
    },
  });

  // Watch for sell events for this token
  useWatchContractEvent({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    eventName: "TokensSold",
    onLogs(logs) {
      logs.forEach((log) => {
        if (log.args.token?.toLowerCase() === tokenAddress?.toLowerCase()) {
          console.log("Sell detected for this token, refreshing price...");
          refetchPrice();
          refetchCollateral();
        }
      });
    },
  });

  // Format the values if they exist
  const formattedPrice = priceData
    ? formatUnits(BigInt(priceData.toString()), 18)
    : undefined;
  const formattedCollateral = collateralData
    ? formatUnits(BigInt(collateralData.toString()), 18)
    : undefined;
  const formattedReceiveAmount = receiveAmountData
    ? formatUnits(BigInt(receiveAmountData.toString()), 18)
    : undefined;

  return {
    price: formattedPrice,
    rawPrice: priceData,
    collateral: formattedCollateral,
    rawCollateral: collateralData,
    tokenState: tokenStateData,
    receiveAmount: formattedReceiveAmount,
    rawReceiveAmount: receiveAmountData,
    isLoading: !priceData || !collateralData || tokenStateData === undefined,
  };
};

export default useTokenDetails;
