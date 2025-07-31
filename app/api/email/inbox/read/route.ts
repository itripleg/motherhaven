// app/api/email/inbox/read/route.ts (fix the filename from roue.ts)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

// Admin address - must match the one in your hook
const ADMIN_ADDRESS = "0xd85327505Ab915AB0C1aa5bC6768bF4002732258";

export async function PATCH(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { address, messageId, isRead } = body;

    // Validate admin access
    if (!address || address !== ADMIN_ADDRESS) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only admin can update messages",
        },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!messageId || typeof isRead !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: messageId, isRead",
        },
        { status: 400 }
      );
    }

    // Check if message exists
    const messageRef = doc(db, "inbox", messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "Message not found",
        },
        { status: 404 }
      );
    }

    // Update the message read status
    await updateDoc(messageRef, {
      isRead: isRead,
      updatedAt: new Date().toISOString(),
    });

    console.log(`Updated message ${messageId} read status to ${isRead}`);

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Message marked as ${isRead ? "read" : "unread"}`,
      data: {
        messageId,
        isRead,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Mark as read API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update message status",
      },
      { status: 500 }
    );
  }
}
