import { useReadContracts } from "wagmi";
import { formatUnits, type Abi } from "viem";
import { motion } from "framer-motion";
import { TokenCard } from "./TokenCard";
import { Token } from "@/types";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/types";

const factoryContract = {
  address: FACTORY_ADDRESS as `0x${string}`,
  abi: FACTORY_ABI as Abi,
} as const;

export const TokenGrid = ({ tokens }: { tokens: Token[] }) => {
  const { data: pricesData } = useReadContracts({
    contracts: tokens.map((token) => ({
      ...factoryContract,
      functionName: "getCurrentPrice" as const,
      args: [token.address as `0x${string}`] as const,
    })),
  });

  const tokenPrices = tokens.reduce<Record<string, string>>(
    (acc, token, index) => {
      const result = pricesData?.[index]?.result;
      try {
        acc[token.address] = result
          ? formatUnits(BigInt(result.toString()), 18)
          : "0";
      } catch {
        acc[token.address] = "0";
      }
      console.log("Token price from the Token Grid (acc): ", acc);
      return acc;
    },
    {}
  );

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-screen overflow-y-auto scrollbar-thin p-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {tokens.map((token) => (
        <TokenCard
          key={token.address}
          token={token}
          price={tokenPrices[token.address]}
        />
      ))}
    </motion.div>
  );
};
