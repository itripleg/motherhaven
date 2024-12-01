// /app/api/factory-monitor/route.ts

import { NextResponse } from "next/server";
// import { collection, addDoc, setDoc, doc } from "firebase/firestore";
// import { db } from "@/firebase";
import { decodeEventLog, formatEther, parseAbiItem } from "viem";

const FACTORY_ADDRESS = "0x4696af372b151E2fF611561B565C3A15b53850C4";

const EVENTS = {
  TokenCreated: {
    abi: parseAbiItem(
      "event TokenCreated(address indexed tokenAddress, string name, string ticker, string imageUrl, address creator, uint256 fundingGoal)"
    ),
    signature:
      "0x04fd48c2f6f5e55655ccb9c8e74b3536d134d868106456d0fa24ee25acd5013a", // This will be our new signature
  },
  TokensPurchased: {
    abi: parseAbiItem(
      "event TokensPurchased(address indexed token, address indexed buyer, uint256 amount, uint256 price)"
    ),
    signature:
      "0x6faf93231a456e552dbc9961f58d9713ee4f2e69d15f1975b050ef0911053a7b",
  },
  TokensSold: {
    abi: parseAbiItem(
      "event TokensSold(address indexed token, address indexed seller, uint256 tokenAmount, uint256 ethAmount)"
    ),
    signature:
      "0x697c42d55a5e1fed3f464ec6f38b32546a0bd368dc8068b065c67566d73f3290",
  },
  TradingHalted: {
    abi: parseAbiItem(
      "event TradingHalted(address indexed token, uint256 collateral)"
    ),
    signature:
      "0xb88b7874f043c64f2f74ff66df3ca7559f7253821a4f862a4a7af74e9c147170",
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event } = body;
    const blockInfo = event.data.block;

    console.log("\n==================================");
    console.log(`📦 BLOCK #${blockInfo.number}`);
    console.log(
      `⏰ ${new Date(Number(blockInfo.timestamp) * 1000).toLocaleString()}`
    );
    console.log("==================================\n");

    for (const log of event.data.block.logs) {
      console.log("\n--- Processing Log ---");

      const eventSignature = log.topics[0];
      console.log("Event Signature:", eventSignature);

      console.log("\nMatches:");
      Object.entries(EVENTS).forEach(([name, event]) => {
        console.log(`- ${name}: ${event.signature === eventSignature}`);
      });

      console.log("Emitter:", log.account.address);
      console.log("Topics:", JSON.stringify(log.topics, null, 2));
      console.log("Data:", log.data);
      console.log("Transaction:", log.transaction.hash);
      console.log("Value:", log.transaction.value);

      if (log.account.address.toLowerCase() !== FACTORY_ADDRESS.toLowerCase()) {
        console.log("⚠️ Skipping - Not from factory contract");
        continue;
      }

      try {
        const eventEntry = Object.entries(EVENTS).find(
          ([_, event]) => event.signature === eventSignature
        );

        if (eventEntry) {
          const [eventType, eventDef] = eventEntry;
          console.log(`\n🎯 Matched Event: ${eventType}`);

          const decoded = decodeEventLog({
            abi: [eventDef.abi],
            data: log.data,
            topics: log.topics,
          });

          console.log("Decoded Data:", JSON.stringify(decoded.args, null, 2));

          // ... rest of your event handling logic
        } else {
          console.log("❌ No matching event definition found");
        }
      } catch (error) {
        console.error("❌ Error processing event:", error);
      }
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
