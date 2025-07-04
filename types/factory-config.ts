export interface FactoryConfig {
  maxSupply: string;
  initialMint: string;
  initialPrice: string;
  maxWalletPercentage: number;
  tradingFee: number; // in basis points
  minPurchase: string;
  maxPurchase: string;
  priceRate: string;
  fundingGoal?: string;
  decimals?: string;
}
