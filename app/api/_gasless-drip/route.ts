// api/gasless-drip/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  isAddress,
} from "viem";
import { avalancheFuji } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import FAUCET_ABI from "@/contracts/final/Faucet_abi.json";

// Configuration
const FAUCET_ADDRESS = "0x0B50C987D357a8000FCD88f7eC6D35A88775AfD2" as const;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY as `0x${string}`;
const FUJI_RPC =
  process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";

if (!RELAYER_PRIVATE_KEY) {
  throw new Error("RELAYER_PRIVATE_KEY environment variable is required");
}

// Initialize clients
const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(FUJI_RPC),
});

const relayerAccount = privateKeyToAccount(RELAYER_PRIVATE_KEY);
const walletClient = createWalletClient({
  account: relayerAccount,
  chain: avalancheFuji,
  transport: http(FUJI_RPC),
});

// In-memory rate limiting (in production, use Redis or database)
const requestLimits = new Map<string, { lastRequest: number; count: number }>();
const RATE_LIMIT_HOURS = 24; // 24 hours between gasless requests

function canRequestDrip(address: string): {
  allowed: boolean;
  message: string;
} {
  const now = Date.now();
  const existing = requestLimits.get(address.toLowerCase());

  if (existing) {
    const timeSinceLastRequest = now - existing.lastRequest;
    const hoursElapsed = timeSinceLastRequest / (1000 * 60 * 60);

    if (hoursElapsed < RATE_LIMIT_HOURS) {
      const hoursRemaining = RATE_LIMIT_HOURS - hoursElapsed;
      return {
        allowed: false,
        message: `Please wait ${hoursRemaining.toFixed(
          1
        )} hours before next gasless request`,
      };
    }
  }

  return { allowed: true, message: "OK" };
}

function updateRequestRecord(address: string) {
  const now = Date.now();
  const existing = requestLimits.get(address.toLowerCase());

  requestLimits.set(address.toLowerCase(), {
    lastRequest: now,
    count: existing ? existing.count + 1 : 1,
  });
}

export async function GET() {
  try {
    // Health check endpoint
    const relayerBalance = await publicClient.getBalance({
      address: relayerAccount.address,
    });

    const faucetBalance = await publicClient.getBalance({
      address: FAUCET_ADDRESS,
    });

    return NextResponse.json({
      status: "healthy",
      relayer_address: relayerAccount.address,
      relayer_balance: formatEther(relayerBalance),
      faucet_balance: formatEther(faucetBalance),
      network: "fuji-testnet",
      rate_limit_hours: RATE_LIMIT_HOURS,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address: userAddress } = body;

    // Validate input
    if (!userAddress || typeof userAddress !== "string") {
      return NextResponse.json(
        { error: "Valid address required" },
        { status: 400 }
      );
    }

    // Validate address format
    if (!isAddress(userAddress)) {
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 }
      );
    }

    // Check rate limiting
    const rateLimitCheck = canRequestDrip(userAddress);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { error: rateLimitCheck.message },
        { status: 429 }
      );
    }

    // Check if relayer has sufficient balance for gas
    const relayerBalance = await publicClient.getBalance({
      address: relayerAccount.address,
    });

    if (relayerBalance < parseEther("0.01")) {
      return NextResponse.json(
        { error: "Relayer out of gas funds. Please contact admin." },
        { status: 503 }
      );
    }

    // Check if user is whitelisted
    const isWhitelisted = (await publicClient.readContract({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "whitelisted",
      args: [userAddress as `0x${string}`],
    })) as boolean;

    if (!isWhitelisted) {
      return NextResponse.json(
        { error: "Address not whitelisted" },
        { status: 403 }
      );
    }

    // Check if user can request drip (contract cooldown)
    const canDrip = (await publicClient.readContract({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "canRequestDrip",
      args: [userAddress as `0x${string}`],
    })) as boolean;

    if (!canDrip) {
      return NextResponse.json(
        { error: "Contract cooldown not met. Wait for the regular interval." },
        { status: 429 }
      );
    }

    // Check faucet balance
    const dripAmount = (await publicClient.readContract({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "dripAmount",
    })) as bigint;

    const faucetBalance = await publicClient.getBalance({
      address: FAUCET_ADDRESS,
    });

    if (faucetBalance < dripAmount) {
      return NextResponse.json(
        { error: "Faucet has insufficient balance" },
        { status: 503 }
      );
    }

    // Execute the drip request on behalf of the user
    const hash = await walletClient.writeContract({
      address: FAUCET_ADDRESS,
      abi: FAUCET_ABI,
      functionName: "requestDrip",
      gas: 100000n, // Should be plenty for a simple drip call
    });

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 60000, // 60 second timeout
    });

    if (receipt.status === "success") {
      // Update rate limiting record
      updateRequestRecord(userAddress);

      return NextResponse.json({
        success: true,
        tx_hash: hash,
        amount: formatEther(dripAmount),
        recipient: userAddress,
        message: `Successfully sent ${formatEther(
          dripAmount
        )} AVAX to ${userAddress}`,
      });
    } else {
      return NextResponse.json(
        { error: "Transaction failed" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Gasless drip error:", error);

    // Handle specific error types
    if (error.message?.includes("insufficient funds")) {
      return NextResponse.json(
        { error: "Relayer out of funds" },
        { status: 503 }
      );
    }

    if (error.message?.includes("execution reverted")) {
      return NextResponse.json(
        { error: "Contract call failed. Check eligibility." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Rate limiting cleanup (run periodically to prevent memory leaks)
setInterval(() => {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_HOURS * 60 * 60 * 1000;

  for (const [address, record] of requestLimits.entries()) {
    if (record.lastRequest < cutoff) {
      requestLimits.delete(address);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour
