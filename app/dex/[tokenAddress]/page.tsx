import React from "react";
import TokenPage from "../components/TokenPage";
import { TokenState } from "@/types/token";
import { TokenProvider } from "@/contexts/TokenContext";

type Props = {};

function page({}: Props) {
  const tokenAddress = "0xac43f76064e0c04f3250bf5463da61026135dae8";
  return (
    <div>
      <TokenProvider tokenAddress={tokenAddress}>
        <TokenPage
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

export default page;
