// app/api/email/inbound/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Function to extract text content from HTML
function extractTextFromHtml(html: string): string {
  // Simple HTML to text conversion
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

// Function to parse SendGrid Inbound Parse payload
function parseInboundEmail(formData: FormData) {
  return {
    to: formData.get("to") as string,
    from: formData.get("from") as string,
    subject: formData.get("subject") as string,
    text: formData.get("text") as string,
    html: formData.get("html") as string,
    attachments: formData.get("attachments") as string, // JSON string of attachment info
    envelope: formData.get("envelope") as string, // JSON string with SMTP envelope
    charsets: formData.get("charsets") as string, // JSON string of character sets
    SPF: formData.get("SPF") as string, // SPF check result
    headers: formData.get("headers") as string, // Raw email headers
  };
}

export async function POST(request: NextRequest) {
  try {
    // SendGrid Inbound Parse sends form data, not JSON
    const formData = await request.formData();

    // Parse the inbound email data
    const emailData = parseInboundEmail(formData);

    // Basic validation
    if (!emailData.to || !emailData.from) {
      return NextResponse.json(
        { error: "Missing required email fields" },
        { status: 400 }
      );
    }

    // Check if this email is for your domain
    const recipientEmail = emailData.to.toLowerCase();
    const isForYourDomain = recipientEmail.includes("@motherhaven.app");

    if (!isForYourDomain) {
      console.log(`Email not for motherhaven.app domain: ${emailData.to}`);
      return NextResponse.json({
        message: "Email not for motherhaven.app domain, ignored",
      });
    }

    // Extract the local part (before @) for logging
    const localPart = recipientEmail.split("@")[0];
    console.log(
      `Received email for: ${localPart}@motherhaven.app from ${emailData.from}`
    );

    // Parse envelope for additional metadata
    let envelopeData = null;
    try {
      envelopeData = emailData.envelope ? JSON.parse(emailData.envelope) : null;
    } catch (e) {
      console.warn("Failed to parse envelope data:", e);
    }

    // Extract sender name from "Name <email@domain.com>" format
    let fromName: string | undefined;
    let fromEmail = emailData.from;

    const fromMatch = emailData.from.match(/^(.+?)\s*<(.+?)>$/);
    if (fromMatch) {
      fromName = fromMatch[1].trim().replace(/"/g, ""); // Remove quotes
      fromEmail = fromMatch[2].trim();
    }

    // Generate text content if only HTML is provided
    let textContent = emailData.text;
    if (!textContent && emailData.html) {
      textContent = extractTextFromHtml(emailData.html);
    }

    // Create inbox message document
    const inboxMessage = {
      from: fromEmail,
      fromName: fromName || undefined,
      to: recipientEmail,
      subject: emailData.subject || "(No Subject)",
      htmlContent: emailData.html || undefined,
      textContent: textContent || undefined,
      isRead: false,
      receivedAt: serverTimestamp(),
      messageId: envelopeData?.messageId || undefined,

      // Additional metadata for debugging/analytics
      spfResult: emailData.SPF || undefined,
      originalTo: emailData.to, // Keep original recipient field
      envelope: envelopeData || undefined,
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, "inbox"), inboxMessage);

    console.log(
      `All motherhaven.app emails saved to inbox: ${docRef.id} from ${fromEmail} to ${recipientEmail}`
    );

    // Handle attachments if present
    if (emailData.attachments) {
      try {
        const attachmentsData = JSON.parse(emailData.attachments);
        console.log(
          `Email has ${Object.keys(attachmentsData).length} attachments`
        );

        // TODO: Process attachments
        // You might want to save attachment files to Firebase Storage
        // and update the document with attachment metadata
      } catch (e) {
        console.warn("Failed to parse attachments:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Inbound email processed successfully",
      messageId: docRef.id,
    });
  } catch (error) {
    console.error("Inbound email processing error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process inbound email",
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({
    message: "SendGrid Inbound Parse webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
