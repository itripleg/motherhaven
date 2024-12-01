import { useState } from "react";
import { TokenTabs } from "./tokens/TokenTabs";
import { TokenGrid } from "./tokens/TokenGrid";
import { useTokenList } from "@/hooks/token/useTokenList";
import { Token } from "@/types";

type TokenContainerProps = {
  tokens: Token[];
};

export const TokenContainer: React.FC = () => {
  const [category, setCategory] = useState("all");
  const { tokens, isLoading, error } = useTokenList();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse">Loading tokens...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  const filteredTokens =
    category === "all"
      ? tokens
      : tokens.filter((token: Token) => {
          switch (category) {
            case "trending":
              return true; // Implement trending logic
            case "new":
              const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
              return token.createdAt > oneDayAgo;
            case "gainers":
              return true; // Implement gainers logic
            default:
              return true;
          }
        });

  return (
    <>
      <TokenTabs onCategoryChange={setCategory} />
      <TokenGrid tokens={filteredTokens} />
    </>
  );
};
