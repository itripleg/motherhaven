import { useWatchContractEvent } from "wagmi";
import tf_metadata from "@/contracts/token-factory/TokenFactory_metadata.json";
import { useToast } from "@/hooks/use-toast";

import { useEffect } from "react";

export function TokenFactoryListener() {
  const { toast } = useToast();

  // Define the contract ABI and address
  const tokenFactoryABI = tf_metadata.output.abi;
  const FACTORY_ADDRESS = "0x5CefB1c5efc02aba182242D593554AAEf30f2631";

  // Listen for the TokenCreated event
  useWatchContractEvent({
    address: FACTORY_ADDRESS,
    abi: tokenFactoryABI,
    eventName: "TokenCreated",
    listener(tokenAddress, name, ticker, creator) {
      toast({
        title: "Token Created",
        description: `Name: ${name}, Ticker: ${ticker}, Address: ${tokenAddress}`,
      });

      console.log("TokenCreated Event:", {
        tokenAddress,
        name,
        ticker,
        creator,
      });
    },
  });

  // Listen for the TokensPurchased event
  useWatchContractEvent({
    address: FACTORY_ADDRESS,
    abi: tokenFactoryABI,
    eventName: "TokensPurchased",
    listener(tokenAddress, buyer, amount, price) {
      toast({
        title: "Tokens Purchased",
        description: `Buyer: ${buyer}, Amount: ${amount}, Price: ${price}`,
      });

      console.log("TokensPurchased Event:", {
        tokenAddress,
        buyer,
        amount,
        price,
      });
    },
  });

  // Listen for the TradingStarted event
  useWatchContractEvent({
    address: FACTORY_ADDRESS,
    abi: tokenFactoryABI,
    eventName: "TradingStarted",
    listener(tokenAddress, liquidityAdded) {
      toast({
        title: "Trading Started",
        description: `Token Address: ${tokenAddress}, Liquidity Added: ${liquidityAdded}`,
      });

      console.log("TradingStarted Event:", {
        tokenAddress,
        liquidityAdded,
      });
    },
  });

  return null; // No UI for this component
}
