// app/api/email/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import crypto from "crypto";

// SendGrid webhook verification (optional but recommended)
function verifyWebhook(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  if (!process.env.SENDGRID_WEBHOOK_SECRET) {
    console.warn("SENDGRID_WEBHOOK_SECRET not set - skipping verification");
    return true; // Allow if no secret is set (for development)
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.SENDGRID_WEBHOOK_SECRET)
      .update(timestamp + payload)
      .digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "base64"),
      Buffer.from(expectedSignature, "base64")
    );
  } catch (error) {
    console.error("Webhook verification error:", error);
    return false;
  }
}

// Update email status in Firebase
async function updateEmailStatus(
  to: string | string[],
  status: string,
  eventType: string,
  reason?: string
) {
  try {
    // Convert to array for consistent querying
    const recipients = Array.isArray(to) ? to : [to];

    // Find emails that match any of the recipients
    // Note: This is a simplified approach. In production, you might want to use
    // SendGrid's custom arguments to pass the email document ID directly.
    for (const recipient of recipients) {
      const emailsQuery = query(
        collection(db, "emails"),
        where("to", "array-contains", recipient)
      );

      const emailsSnapshot = await getDocs(emailsQuery);

      for (const emailDoc of emailsSnapshot.docs) {
        const emailData = emailDoc.data();

        // Only update if the current status allows it
        if (
          emailData.status === "sending" ||
          eventType === "bounce" ||
          eventType === "dropped"
        ) {
          await updateDoc(doc(db, "emails", emailDoc.id), {
            status: status,
            ...(reason && { failureReason: reason }),
            ...(status === "sent" && { sentAt: new Date().toISOString() }),
          });

          console.log(
            `Updated email ${emailDoc.id} status to ${status} for ${recipient}`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error updating email status:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature (optional but recommended)
    const signature =
      request.headers.get("X-Twilio-Email-Event-Webhook-Signature") || "";
    const timestamp =
      request.headers.get("X-Twilio-Email-Event-Webhook-Timestamp") || "";

    if (
      process.env.SENDGRID_WEBHOOK_SECRET &&
      !verifyWebhook(rawBody, signature, timestamp)
    ) {
      console.error("Webhook signature verification failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the webhook events
    const events = JSON.parse(rawBody);

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: "Invalid payload format" },
        { status: 400 }
      );
    }

    // Process each event
    for (const event of events) {
      const {
        event: eventType,
        email,
        reason,
        sg_message_id,
        timestamp: eventTimestamp,
      } = event;

      console.log(`Processing SendGrid event: ${eventType} for ${email}`);

      switch (eventType) {
        case "delivered":
          await updateEmailStatus(email, "sent", eventType);
          break;

        case "bounce":
        case "dropped":
        case "blocked":
          await updateEmailStatus(
            email,
            "failed",
            eventType,
            reason || `Email ${eventType}`
          );
          break;

        case "deferred":
          // Deferred means temporary failure, keep as "sending"
          console.log(`Email deferred for ${email}: ${reason}`);
          break;

        case "processed":
          // Email was processed by SendGrid but not yet delivered
          // Keep as "sending" status
          break;

        case "open":
        case "click":
        case "unsubscribe":
        case "spamreport":
          // These are engagement events, not delivery status
          // You could store these for analytics if needed
          console.log(`Engagement event ${eventType} for ${email}`);
          break;

        default:
          console.log(`Unknown event type: ${eventType} for ${email}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${events.length} events`,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification during setup)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "SendGrid webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
