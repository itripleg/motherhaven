// app/api/calculate-tokens/route.ts
import { NextRequest, NextResponse } from "next/server";
import { formatUnits, parseEther, Address } from "viem";
import { FACTORY_ADDRESS, FACTORY_ABI } from "@/types";
import { publicClient } from "@/wagmi-config";
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Firestore cache with TTL
interface CacheDoc {
  result: string;
  timestamp: number;
  tokenAddress: string;
  type: string;
  amount: string;
}

class FirestoreCache {
  private readonly TTL = 10000; // 10 seconds
  private readonly collection = "calculation_cache";

  async get(key: string): Promise<string | null> {
    try {
      const docRef = doc(db, this.collection, key);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const data = docSnap.data() as CacheDoc;
      if (Date.now() - data.timestamp > this.TTL) {
        // Don't delete here to avoid extra writes, let cleanup handle it
        return null;
      }

      return data.result;
    } catch (error) {
      console.error("Cache read error:", error);
      return null;
    }
  }

  async set(
    key: string,
    value: string,
    meta: Omit<CacheDoc, "result" | "timestamp">
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collection, key);
      await setDoc(docRef, {
        result: value,
        timestamp: Date.now(),
        ...meta,
      });
    } catch (error) {
      console.error("Cache write error:", error);
    }
  }
}

const cache = new FirestoreCache();

// Rate limiting (simple in-memory, use Redis in production)
const rateLimiter = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute per IP
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimiter.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimiter.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Input validation
interface CalculationRequest {
  tokenAddress: string;
  ethAmount?: string;
  tokenAmount?: string;
  type: "buy" | "sell";
}

function validateRequest(body: any): CalculationRequest | null {
  if (!body || typeof body !== "object") return null;

  const { tokenAddress, ethAmount, tokenAmount, type } = body;

  // Validate token address
  if (
    !tokenAddress ||
    typeof tokenAddress !== "string" ||
    !tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)
  ) {
    return null;
  }

  // Validate type
  if (type !== "buy" && type !== "sell") {
    return null;
  }

  // Validate amounts based on type
  if (type === "buy") {
    if (!ethAmount || typeof ethAmount !== "string") return null;
    const amount = parseFloat(ethAmount);
    if (isNaN(amount) || amount <= 0 || amount > 1000) return null; // Max 1000 AVAX
  } else {
    if (!tokenAmount || typeof tokenAmount !== "string") return null;
    const amount = parseFloat(tokenAmount);
    if (isNaN(amount) || amount <= 0 || amount > 1e15) return null; // Reasonable max
  }

  return { tokenAddress, ethAmount, tokenAmount, type } as CalculationRequest;
}

// Enhanced error handling
function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting (NextJS 14+ compatible)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip") || "unknown";

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return createErrorResponse(
        "Rate limit exceeded. Please try again later.",
        429
      );
    }

    // Parse and validate request body
    const body = await request.json().catch(() => null);
    const validatedRequest = validateRequest(body);

    if (!validatedRequest) {
      return createErrorResponse("Invalid request parameters");
    }

    const { tokenAddress, ethAmount, tokenAmount, type } = validatedRequest;

    // Create cache key
    const cacheKey = `${type}-${tokenAddress}-${
      ethAmount || tokenAmount
    }-${Date.now().toString().slice(0, -4)}0000`; // Round to nearest 10 seconds

    // Check cache first
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true,
        type,
      });
    }

    // Perform calculation using your existing client
    let result: bigint;

    if (type === "buy") {
      result = (await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "calculateTokenAmount",
        args: [tokenAddress as Address, parseEther(ethAmount!)],
      })) as bigint;
    } else {
      result = (await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "calculateSellPrice",
        args: [tokenAddress as Address, parseEther(tokenAmount!)],
      })) as bigint;
    }

    // Format and cache result
    const formattedResult = formatUnits(result, 18);

    await cache.set(cacheKey, formattedResult, {
      tokenAddress,
      type,
      amount: ethAmount || tokenAmount!,
    });

    return NextResponse.json({
      success: true,
      data: formattedResult,
      cached: false,
      type,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("API calculation error:", error);

    if (error instanceof Error) {
      if (error.message.includes("execution reverted")) {
        return createErrorResponse(
          "Contract execution failed. Token may not exist or trading may be halted.",
          422
        );
      }
      if (error.message.includes("network")) {
        return createErrorResponse("Network error. Please try again.", 503);
      }
    }

    return createErrorResponse("Internal server error", 500);
  }
}

// Health check using your client
export async function GET() {
  try {
    const blockNumber = await publicClient.getBlockNumber();

    return NextResponse.json({
      status: "healthy",
      blockNumber: blockNumber.toString(),
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

// Clear cache endpoint removed - Firestore handles cleanup automatically

/*
Usage Examples:

// Buy calculation
POST /api/calculate-tokens
{
  "tokenAddress": "0x123...",
  "ethAmount": "1.0",
  "type": "buy"
}

// Sell calculation
POST /api/calculate-tokens
{
  "tokenAddress": "0x123...",
  "tokenAmount": "1000.0", 
  "type": "sell"
}

// Response format
{
  "success": true,
  "data": "1000.123456789",
  "cached": false,
  "type": "buy",
  "timestamp": 1234567890
}

// Error response
{
  "error": "Invalid request parameters",
  "success": false
}

// Health check
GET /api/calculate-tokens
{
  "status": "healthy",
  "blockNumber": "12345678",
  "cacheSize": 45,
  "timestamp": 1234567890
}
*/
