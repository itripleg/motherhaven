// app/api/vanity-name/user/[address]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query, collection, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { Address } from "viem";

interface VanityNameDocument {
  name: string;
  displayName: string;
  owner: Address;
  claimedAt: string;
  transactionHash: string;
  blockNumber: number;
  isActive: boolean;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await context.params;
    const userAddress = address.toLowerCase() as Address;

    console.log("📊 Fetching vanity data for address:", userAddress);

    // Validate address format
    if (
      !userAddress ||
      !userAddress.startsWith("0x") ||
      userAddress.length !== 42
    ) {
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 }
      );
    }

    // Get user's current vanity name from vanity_names collection
    const vanityNamesQuery = query(
      collection(db, "vanity_names"),
      where("owner", "==", userAddress),
      where("isActive", "==", true)
    );

    const vanityNamesSnapshot = await getDocs(vanityNamesQuery);
    let currentVanityName = "";
    let nameClaimedAt = null;
    let transactionHash = "";

    if (!vanityNamesSnapshot.empty) {
      const nameDoc = vanityNamesSnapshot.docs[0].data() as VanityNameDocument;
      currentVanityName = nameDoc.displayName;
      nameClaimedAt = nameDoc.claimedAt;
      transactionHash = nameDoc.transactionHash;
    }

    // Get all vanity names owned by this user (for history)
    const allNamesQuery = query(
      collection(db, "vanity_names"),
      where("owner", "==", userAddress)
    );

    const allNamesSnapshot = await getDocs(allNamesQuery);
    const nameHistory = allNamesSnapshot.docs
      .map((doc, index) => {
        const data = doc.data() as VanityNameDocument;
        return {
          name: data.displayName,
          changedAt: data.claimedAt,
          requestId: data.blockNumber || index + 1,
          burnAmount: "1000000000000000000000", // 1000 tokens
          tokenAddress: process.env.NEXT_PUBLIC_BURN_TOKEN_ADDRESS,
          transactionHash: data.transactionHash,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
      );

    const response = {
      address: userAddress,
      currentName: currentVanityName,
      nameHistory,
      burnInfo: null, // Contract provides real-time burn data
      stats: {
        totalChanges: nameHistory.length,
        lastChanged: nameClaimedAt,
      },
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Successfully fetched user vanity data:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Error fetching user vanity data:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json(
    { message: "Use GET to fetch user vanity data" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: "Use GET to fetch user vanity data" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Use GET to fetch user vanity data" },
    { status: 405 }
  );
}
