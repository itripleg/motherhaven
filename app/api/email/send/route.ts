// app/api/email/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import sgMail from "@sendgrid/mail";

// Admin address - must match the one in your hook
const ADMIN_ADDRESS = "0xd85327505Ab915AB0C1aa5bC6768bF4002732258";

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      to,
      subject,
      htmlContent,
      textContent,
      fromName,
      fromEmail,
      senderAddress,
      apiSecret,
    } = body;

    // Validate API secret first (most important security check)
    if (!apiSecret || apiSecret !== process.env.EMAIL_API_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API secret",
        },
        { status: 401 }
      );
    }

    // Validate sender address
    if (!senderAddress || senderAddress !== ADMIN_ADDRESS) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only admin can send emails",
        },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!to || !subject) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: to, subject",
        },
        { status: 400 }
      );
    }

    // Parse and validate email addresses
    let emailAddresses: string[] = [];
    if (typeof to === "string") {
      // Split comma-separated emails and clean them
      emailAddresses = to
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);
    } else if (Array.isArray(to)) {
      emailAddresses = to
        .map((email) => email.trim())
        .filter((email) => email.length > 0);
    }

    if (emailAddresses.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one recipient email is required",
        },
        { status: 400 }
      );
    }

    // Validate each email format
    const invalidEmails = emailAddresses.filter(
      (email) => !isValidEmail(email)
    );
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid email address format: ${invalidEmails.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate content
    if (!htmlContent && !textContent) {
      return NextResponse.json(
        {
          success: false,
          error: "Email must have either HTML or text content",
        },
        { status: 400 }
      );
    }

    // Validate from email if provided
    if (fromEmail && !isValidEmail(fromEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid from email address format",
        },
        { status: 400 }
      );
    }

    // Ensure from email is from motherhaven.app domain
    const finalFromEmail = fromEmail || "noreply@motherhaven.app";
    if (!finalFromEmail.endsWith("@motherhaven.app")) {
      return NextResponse.json(
        {
          success: false,
          error: "From email must be from motherhaven.app domain",
        },
        { status: 400 }
      );
    }

    // Generate text content from HTML if not provided
    let finalTextContent = textContent;
    if (!finalTextContent && htmlContent) {
      // Simple HTML to text conversion
      finalTextContent = htmlContent
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<p[^>]*>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();
    }

    // Create email record in Firestore
    const emailData = {
      to: emailAddresses, // Store as array
      subject: subject.trim(),
      htmlContent,
      textContent: finalTextContent,
      status: "sending",
      createdAt: serverTimestamp(),
      sentAt: null,
      failureReason: null,
      senderAddress,
      fromName: fromName || "Big Boss",
      fromEmail: finalFromEmail,
    };

    // Add to Firestore
    const emailRef = await addDoc(collection(db, "emails"), emailData);
    const emailId = emailRef.id;

    // Send email using SendGrid
    try {
      // Verify SendGrid API key is configured
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error("SendGrid API key not configured");
      }

      const msg = {
        to: emailAddresses, // SendGrid accepts array of emails
        from: {
          email: finalFromEmail,
          name: fromName || "Mother Haven",
        },
        subject: subject.trim(),
        html: htmlContent,
        text: finalTextContent,
        // Optional: Add tracking and other SendGrid features
        trackingSettings: {
          clickTracking: {
            enable: true,
          },
          openTracking: {
            enable: true,
          },
        },
        // Optional: Add categories for analytics
        categories: ["motherhaven-app"],
      };

      // Send email via SendGrid
      const [response] = await sgMail.send(msg);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        // Update email record as sent in Firestore
        await updateDoc(doc(db, "emails", emailId), {
          status: "sent",
          sentAt: serverTimestamp(),
        });

        // Return the updated email data
        const updatedEmailData = {
          id: emailId,
          ...emailData,
          status: "sent",
          sentAt: new Date().toISOString(),
        };

        return NextResponse.json({
          success: true,
          data: updatedEmailData,
          message: `Email sent successfully to ${emailAddresses.length} recipient(s)`,
        });
      } else {
        throw new Error(
          `SendGrid responded with status: ${response.statusCode}`
        );
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError);

      // Update email record as failed in Firestore
      const failureReason =
        emailError instanceof Error ? emailError.message : "Unknown error";

      await updateDoc(doc(db, "emails", emailId), {
        status: "failed",
        failureReason,
      });

      const failedEmailData = {
        id: emailId,
        ...emailData,
        status: "failed",
        failureReason,
      };

      return NextResponse.json(
        {
          success: false,
          error: "Failed to send email",
          data: failedEmailData,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
