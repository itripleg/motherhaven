"use client";

import { Container } from "@/components/craft";
import { TokensCreated } from "./TokensCreated";
import { CoinTransactions } from "./CoinTransactions";
import { HoldingsOverview } from "./HoldingsOverview";
import { BundledTokensMap } from "./BundledTokensMap";
import { AuthWrapper } from "@/components/AuthWrapper";

export default function Dashboard() {
  return (
    <AuthWrapper>
      <Container className="mt-8">
        <div className="grid gap-6 md:grid-cols-2 pt-12">
          <TokensCreated />
          <CoinTransactions />
          <HoldingsOverview />
          <BundledTokensMap />
        </div>
      </Container>
    </AuthWrapper>
  );
}
