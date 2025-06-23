"use client";
import React from "react";
import TokenPage from "../components/TokenPage";
import { TokenState } from "@/types/token";
import { TokenProvider } from "@/contexts/TokenContext";
import { useParams } from "next/navigation";
import { useFactoryConfigContext } from "@/contexts/FactoryConfigProvider";

type Props = {};

function PageWrapper({}: Props) {
  const { tokenAddress } = useParams();
  const { config, isLoading } = useFactoryConfigContext();

  console.log("TokenPage Debug:", {
    tokenAddress,
    configLoading: isLoading,
    hasConfig: !!config,
    config,
  });

  // Show loading state while factory config loads
  if (isLoading) {
    return (
      <div className="container mx-auto pt-20 p-4">
        <div className="text-center">Loading factory configuration...</div>
      </div>
    );
  }

  // Show error if no config
  if (!config) {
    return (
      <div className="container mx-auto pt-20 p-4">
        <div className="text-center text-red-500">
          Failed to load factory configuration. Please refresh the page.
        </div>
      </div>
    );
  }

  return (
    <div>
      <TokenProvider>
        <TokenPage tokenAddress={tokenAddress as string} />
      </TokenProvider>
    </div>
  );
}

export default PageWrapper;
