// app/api/email/inbox/route.ts
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
    const isReadParam = searchParams.get("isRead");
    const searchQuery = searchParams.get("search");
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
    const requestedLimit = limitParam ? parseInt(limitParam, 10) : 50;
    const messageLimit = Math.min(Math.max(requestedLimit, 1), 100); // Between 1 and 100

    // Validate admin access
    if (!address || address !== ADMIN_ADDRESS) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only admin can view inbox",
        },
        { status: 403 }
      );
    }

    // Build Firestore query
    const inboxQuery = query(
      collection(db, "inbox"),
      where("to", "==", "admin@motherhaven.app"), // Assuming admin receives at admin@
      orderBy("receivedAt", "desc"),
      limit(messageLimit)
    );

    // Note: Firestore doesn't support complex filtering with orderBy on different fields
    // So we'll filter isRead and search in memory after fetching
    const inboxSnapshot = await getDocs(inboxQuery);

    // Transform Firestore documents to InboxMessage format
    let messages = inboxSnapshot.docs.map((doc) => {
      const data = doc.data();

      // Convert Firestore timestamps to ISO strings
      const receivedAt = data.receivedAt?.toDate
        ? data.receivedAt.toDate().toISOString()
        : data.receivedAt || new Date().toISOString();

      return {
        id: doc.id,
        from: data.from || "",
        fromName: data.fromName || undefined,
        to: data.to || "",
        subject: data.subject || "",
        htmlContent: data.htmlContent || undefined,
        textContent: data.textContent || undefined,
        isRead: data.isRead || false,
        receivedAt,
        messageId: data.messageId || undefined,
      };
    });

    // Apply filters in memory (since Firestore has limitations with complex queries)

    // Filter by read status
    if (isReadParam !== null) {
      const isReadFilter = isReadParam === "true";
      messages = messages.filter((msg) => msg.isRead === isReadFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      messages = messages.filter(
        (msg) =>
          msg.subject.toLowerCase().includes(query) ||
          msg.from.toLowerCase().includes(query) ||
          (msg.fromName && msg.fromName.toLowerCase().includes(query)) ||
          (msg.textContent && msg.textContent.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({
      success: true,
      data: messages,
      message: `Retrieved ${messages.length} messages`,
    });
  } catch (error) {
    console.error("Inbox API error:", error);

    // Handle specific Firestore errors
    if (error instanceof Error) {
      // Check if it's a missing index error
      if (error.message.includes("index")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Database index required. Please create composite index for inbox collection.",
            details: "Create index: to (Ascending), receivedAt (Descending)",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch inbox messages",
      },
      { status: 500 }
    );
  }
}
