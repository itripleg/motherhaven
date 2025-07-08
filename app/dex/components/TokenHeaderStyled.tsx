// app/dex/components/TokenHeaderStyled.tsx
// Adapter component to maintain backward compatibility
"use client";

import React from "react";
import { TokenHeader } from "./token-header/TokenHeader";

interface TokenHeaderStyledProps {
  address: string;
}

export const TokenHeaderStyled: React.FC<TokenHeaderStyledProps> = ({
  address,
}) => {
  return <TokenHeader address={address} />;
};

export default TokenHeaderStyled;
