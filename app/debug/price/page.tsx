'use client'
import { useFactoryContract } from "@/new-hooks/useFactoryContract";
import { Address } from "viem";

export default function TokenPrice({ tokenAddress }: { tokenAddress: Address }) {
    const factory = useFactoryContract();
    tokenAddress = "0x599a4b621bd55bcecd5e48a40ca230569b68fd86"
    const { data: currentPrice, isPending, isError, error } = factory.useCurrentPrice(tokenAddress);
    
    if (isPending) return <div>Loading price...</div>;
    if (isError) return <div>Error: {error.message}</div>;
    
    // Format the price to 6 decimal places
    const formattedPrice = factory.formatPriceDecimals(currentPrice, 6);
    
    return <div>Current Price: {formattedPrice} ETH</div>;
  }