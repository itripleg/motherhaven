import { motion } from "framer-motion";
import { TokenCard } from "./TokenCard";
import { Token } from "@/types"; // 1. Use the single, unified Token type
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { Card } from "@/components/ui/card"; // Used for the skeleton loader

/**
 * A placeholder component that mimics the TokenCard's layout while data is loading.
 * This provides a better user experience than a simple text loader.
 */
const SkeletonCard = () => (
  <Card className="h-[250px] bg-white/5 animate-pulse" />
);

export const TokenGrid = ({ tokens }: { tokens: Token[] }) => {
  const { useTokenGridData } = useFactoryContract();

  // 2. Use a more descriptive variable name, like 'hydratedTokens'
  const { hydratedTokens, isLoading } = useTokenGridData(tokens);

  // 3. Render a skeleton grid while data is loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
        {Array.from({ length: tokens.length || 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  // 4. Handle the case where there are no tokens to display
  if (hydratedTokens.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-400">No tokens found.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-screen overflow-y-auto scrollbar-thin p-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {hydratedTokens.map(
        (
          token: Token // 5. Map over the correctly named and typed variable
        ) => (
          <TokenCard key={token.address} token={token} />
        )
      )}
    </motion.div>
  );
};
