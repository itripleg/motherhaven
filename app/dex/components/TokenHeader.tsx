import React from "react";
import { TokenDebugView } from "./TokenDebugView";
import { TokenHeaderStyled } from "./TokenHeaderStyled";

const DEBUG = true;

interface TokenHeaderProps {
  address: string;
}

export const TokenHeader: React.FC<TokenHeaderProps> = ({ address }) => {
  return DEBUG ? (
    <TokenDebugView address={address} />
  ) : (
    <TokenHeaderStyled address={address} />
  );
};
