// app/dex/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Container } from "@/components/craft";
import { useAccount } from "wagmi";
import { getAddressGreeting } from "@/hooks/addressGreetings";
import { Greeting } from "./components/Greeting";
// import { SpaceScene } from "./scene/SpaceScene";
import { SearchContainer } from "./components/SearchContainer";
import { TokenContainer } from "./components/tokens/TokenContainer";
// import { useTokenData } from "@/hooks/useTokenData";
// import { Token } from "@/types";
import { useTokenList } from "@/hooks/token/useTokenList";
import { SpaceScene } from "./scene/SpaceScene";

export default function DexPage() {
  const account = useAccount();
  const cameraRef = useRef<any>(null);
  const controlRef = useRef<any>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [searchMode, setSearchMode] = useState("token");

  const {
    filteredTokens,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setCategory,
    isLoading,
    error,
  } = useTokenList();

  const handleSecretFound = () => {
    setShowSecret(true);
    setTimeout(() => setShowSecret(false), 160000);
  };

  useEffect(() => {
    setGreeting(getAddressGreeting(account?.address));
  }, [account?.address]);

  return (
    <Container className="">
      <SpaceScene cameraRef={cameraRef} controlRef={controlRef} />
      <div className="container mx-auto py-8 relative">
        <Greeting greeting={greeting} showSecret={showSecret} />

        <SearchContainer
          searchMode={searchMode}
          setSearchMode={setSearchMode}
          cameraRef={cameraRef}
          controlRef={controlRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setActiveCategory={setCategory}
          onSecretFound={handleSecretFound}
          showSecret={showSecret}
        />

        {!showSecret && (
          <TokenContainer
            tokens={filteredTokens}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>
    </Container>
  );
}
