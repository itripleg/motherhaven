// components/tokens/TokenGrid.tsx
import { motion } from "framer-motion";
import { TokenCard } from "./TokenCard";
import { Token } from "@/types";

interface TokenGridProps {
  tokens: Token[];
}

export const TokenGrid = ({ tokens }: TokenGridProps) => (
  <motion.div
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto scrollbar-thin p-2"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {tokens.map((token) => (
      <TokenCard key={token.id} token={token} />
    ))}
  </motion.div>
);
