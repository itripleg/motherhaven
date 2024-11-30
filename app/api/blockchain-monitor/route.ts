// app/api/webhook/alchemy/route.ts
import { NextResponse } from "next/server";
import { collection, addDoc } from "firebase/firestore";
import { verifyAlchemySignature } from "./verify-signature";
import { db } from "@/firebase";

export async function POST(req: Request) {
  try {
    // Verify the webhook signature from Alchemy
    const signature = req.headers.get("x-alchemy-signature");
    const timestamp = req.headers.get("x-alchemy-timestamp");
    const body = await req.json();

    // Optional but recommended: verify the webhook is actually from Alchemy
    const isValid = verifyAlchemySignature(
      signature,
      timestamp,
      JSON.stringify(body),
      process.env.ALCHEMY_WEBHOOK_SIGNING_KEY
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Process the webhook event
    const { event } = body;

    // Store in Firestore based on event type
    switch (event.eventName) {
      case "tx": {
        // Handle transaction events
        await addDoc(collection(db, "transactions"), {
          hash: event.data.transaction.hash,
          from: event.data.transaction.from,
          to: event.data.transaction.to,
          value: event.data.transaction.value,
          timestamp: new Date().toISOString(),
          blockNumber: event.data.transaction.blockNumber,
          // Add any other relevant fields
        });
        break;
      }

      case "event": {
        // Handle contract events
        await addDoc(collection(db, "contract_events"), {
          eventName: event.data.eventName,
          contractAddress: event.data.contractAddress,
          args: event.data.args,
          timestamp: new Date().toISOString(),
          blockNumber: event.data.blockNumber,
          transactionHash: event.data.transactionHash,
        });
        break;
      }

      // Add more cases as needed for different event types
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Verification helper function
const verifyAlchemySignature = (
  signature: string | null,
  timestamp: string | null,
  body: string,
  signingKey: string | undefined
): boolean => {
  if (!signature || !timestamp || !signingKey) {
    return false;
  }

  try {
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", signingKey);
    const computedSignature = hmac.update(`${timestamp}.${body}`).digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  } catch {
    return false;
  }
};
