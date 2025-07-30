// app/api/email/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

// Admin address - must match the one in your hook
const ADMIN_ADDRESS = "0xd85327505Ab915AB0C1aa5bC6768bF4002732258";

export async function GET(request: NextRequest) {
  try {
    // Get wallet address and API secret from query params
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const apiSecret = searchParams.get("apiSecret");

    // Validate API secret
    if (!apiSecret || apiSecret !== process.env.EMAIL_API_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API secret",
        },
        { status: 401 }
      );
    }

    // Validate admin access
    if (!address || address !== ADMIN_ADDRESS) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only admin can view email stats",
        },
        { status: 403 }
      );
    }

    // Calculate 24 hours ago timestamp
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    const twentyFourHoursAgoTimestamp = Timestamp.fromDate(twentyFourHoursAgo);

    // Query all emails from this sender
    const emailsQuery = query(
      collection(db, "emails"),
      where("senderAddress", "==", address)
    );

    const emailsSnapshot = await getDocs(emailsQuery);
    const emails = emailsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate statistics
    let totalSent = 0;
    let totalFailed = 0;
    let sent24h = 0;
    let failed24h = 0;

    emails.forEach((email) => {
      const emailData = email as any;
      const createdAt = emailData.createdAt;

      // Check if email was created in last 24 hours
      const isRecent =
        createdAt &&
        (createdAt.toDate
          ? createdAt.toDate() >= twentyFourHoursAgo
          : new Date(createdAt) >= twentyFourHoursAgo);

      // Count totals
      if (emailData.status === "sent") {
        totalSent++;
        if (isRecent) {
          sent24h++;
        }
      } else if (emailData.status === "failed") {
        totalFailed++;
        if (isRecent) {
          failed24h++;
        }
      }
    });

    const stats = {
      totalSent,
      totalFailed,
      sent24h,
      failed24h,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Stats API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch email statistics",
      },
      { status: 500 }
    );
  }
}
