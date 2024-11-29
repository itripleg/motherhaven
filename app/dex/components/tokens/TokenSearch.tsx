// components/tokens/TokenSearch.tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { isAddress } from "viem";

interface TokenSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (category: string) => void;
}

export const TokenSearch = ({
  searchQuery,
  setSearchQuery,
  setActiveCategory,
}: TokenSearchProps) => {
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddress(searchQuery)) {
      router.push(`/factory/${searchQuery}`);
    } else {
      setActiveCategory("all");
    }
  };

  return (
    <motion.form
      onSubmit={handleSearch}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center space-x-4 mb-8"
    >
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Name, symbol, or address"
        className="flex-grow z-40 bg-white/15 hidden dark:text-white dark:ring-white/40 ring-1"
      />
      <Button type="submit" className="z-40">
        Search
      </Button>
    </motion.form>
  );
};
