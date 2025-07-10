// app/dex/components/TokenPage.tsx - Updated for New Structure
"use client";

import React from "react";
import { Address } from "viem";
import { useTokenData } from "@/final-hooks/useTokenData";
import { TradesProvider } from "@/contexts/TradesContext";
import { TokenDataProvider } from "@/contexts/TokenDataProvider";
import { TokenPageLayout } from "./layout/TokenPageLayout";
import { LoadingState } from "./core/LoadingState";
import { ErrorState } from "./core/ErrorState";

interface TokenPageProps {
  tokenAddress: string;
}

export default function TokenPage({ tokenAddress }: TokenPageProps) {
  const { token, isLoading, error } = useTokenData(tokenAddress as Address);

  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading Token Data" />;
  }

  // Error state
  if (error && !isLoading) {
    return (
      <ErrorState
        title="Token Not Found"
        message={
          error ||
          "The token could not be found. The address might be invalid or the token hasn't been created yet."
        }
        showBackButton
      />
    );
  }

  // No token state
  if (!isLoading && !token) {
    return (
      <ErrorState
        title="Token Not Found"
        message="The token could not be found. The address might be invalid or the token hasn't been created yet."
        showBackButton
      />
    );
  }

  if (!token) {
    return null;
  }

  // Main render - much simpler now!
  return (
    <TradesProvider>
      <TokenDataProvider tokenAddress={token.address}>
        <TokenPageLayout token={token} />
      </TokenDataProvider>
    </TradesProvider>
  );
}
