"use client";
import React from "react";
import TokenPage from "../components/TokenPage";
import { TokenState } from "@/types/token";
import { TokenProvider } from "@/contexts/TokenContext";
import { useParams } from "next/navigation";

type Props = {};

function PageWrapper({}: Props) {
  const { tokenAddress } = useParams();
  return (
    <div>
      <TokenProvider>
        <TokenPage
          tokenAddress={tokenAddress as string}
          // tokenData={null}
          // price={0}
          // tokenState={TokenState.NOT_CREATED}
          // isConnected={false}
          // loading={false}
        />
      </TokenProvider>
    </div>
  );
}

export default PageWrapper;
