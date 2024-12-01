import { createPublicClient, http, getContract } from "viem";
import { avalancheFuji } from "viem/chains";

// Simple test function focused just on metadata
export async function testTokenMetadata(tokenAddress: string) {
  // Create Fuji client
  const client = createPublicClient({
    chain: avalancheFuji,
    transport: http("https://api.avax-test.network/ext/bc/C/rpc"),
  });

  // Factory contract config
  const factoryContract = {
    address: "0x56aec6B1D4Ea8Ee0B35B526e216aDd6e8268b1eA" as const,
    abi: [
      {
        inputs: [
          { internalType: "address", name: "tokenAddress", type: "address" },
        ],
        name: "getTokenMetadata",
        outputs: [
          { internalType: "string", name: "name", type: "string" },
          { internalType: "string", name: "symbol", type: "string" },
          { internalType: "string", name: "imageUrl", type: "string" },
          { internalType: "uint256", name: "fundingGoal", type: "uint256" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
  } as const;

  try {
    // Get contract instance
    const contract = getContract({
      ...factoryContract,
      client,
    });

    console.log("Fetching metadata for:", tokenAddress);
    console.log("From factory:", factoryContract.address);

    // Call getTokenMetadata
    const result = await contract.read.getTokenMetadata([
      tokenAddress as `0x${string}`,
    ]);

    console.log("Raw result:", result);

    // Format the result
    const [name, symbol, imageUrl, fundingGoal, createdAt] = result;

    const formatted = {
      name,
      symbol,
      imageUrl,
      fundingGoal,
      createdAt,
    };

    console.log("Formatted result:", formatted);
    return formatted;
  } catch (error) {
    console.error("Error in testTokenMetadata:", error);
    throw error;
  }
}
