// app/api/email/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

// Admin address - must match the one in your hook
const ADMIN_ADDRESS = "0xd85327505Ab915AB0C1aa5bC6768bF4002732258";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const limitParam = searchParams.get("limit");
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

    // Parse limit with default and max
    const requestedLimit = limitParam ? parseInt(limitParam, 10) : 20;
    const emailLimit = Math.min(Math.max(requestedLimit, 1), 100); // Between 1 and 100

    // Validate admin access
    if (!address || address !== ADMIN_ADDRESS) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only admin can view email history",
        },
        { status: 403 }
      );
    }

    // Query emails from Firestore, ordered by creation date (newest first)
    const emailsQuery = query(
      collection(db, "emails"),
      where("senderAddress", "==", address),
      orderBy("createdAt", "desc"),
      limit(emailLimit)
    );

    const emailsSnapshot = await getDocs(emailsQuery);

    // Transform Firestore documents to EmailMessage format
    const emails = emailsSnapshot.docs.map((doc) => {
      const data = doc.data();

      // Convert Firestore timestamps to ISO strings
      const createdAt = data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString()
        : data.createdAt || new Date().toISOString();

      const sentAt = data.sentAt?.toDate
        ? data.sentAt.toDate().toISOString()
        : data.sentAt || undefined;

      return {
        id: doc.id,
        to: data.to || "", // Can be string or array
        subject: data.subject || "",
        htmlContent: data.htmlContent || undefined,
        textContent: data.textContent || undefined,
        status: data.status || "failed",
        sentAt,
        failureReason: data.failureReason || undefined,
        createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: emails,
      message: `Retrieved ${emails.length} emails`,
    });
  } catch (error) {
    console.error("History API error:", error);

    // Handle specific Firestore errors
    if (error instanceof Error) {
      // Check if it's a missing index error
      if (error.message.includes("index")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Database index required. Please create composite index for emails collection.",
            details:
              "Create index: senderAddress (Ascending), createdAt (Descending)",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch email history",
      },
      { status: 500 }
    );
  }
}
