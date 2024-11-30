import { NextResponse } from "next/server";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";
import { decodeEventLog, formatEther, parseAbiItem } from "viem";
import { FACTORY_ADDRESS } from "@/types";

// Event definitions with correct signatures
const EVENTS = {
  TokenCreated: {
    abi: parseAbiItem(
      "event TokenCreated(address indexed tokenAddress, string name, string ticker, address creator)"
    ),
    signature:
      "0x6596c1670eb3390048d23721809c3da5d3f531375ac0e2cab0f77a808ed64331",
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

function formatAmount(amount: bigint): string {
  return Number(formatEther(amount)).toFixed(4);
}

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
    console.log("==================================");

    for (const log of event.data.block.logs) {
      if (log.account.address.toLowerCase() !== FACTORY_ADDRESS.toLowerCase())
        continue;

      const eventSignature = log.topics[0];

      try {
        // Handle TokenCreated
        if (eventSignature === EVENTS.TokenCreated.signature) {
          const decoded = decodeEventLog({
            abi: [EVENTS.TokenCreated.abi],
            data: log.data,
            topics: log.topics,
          });

          console.log("\n🪙 NEW TOKEN CREATED");
          console.log("------------------------");
          console.log(`Name: ${decoded.args.name} (${decoded.args.ticker})`);
          console.log(`Address: ${decoded.args.tokenAddress}`);
          console.log(`Creator: ${decoded.args.creator}`);
          console.log(`TX Hash: ${log.transaction.hash}`);

          await setDoc(
            doc(db, "tokens", decoded.args.tokenAddress.toLowerCase()),
            {
              address: decoded.args.tokenAddress,
              name: decoded.args.name,
              symbol: decoded.args.ticker,
              creator: decoded.args.creator,
              createdAt: new Date(
                Number(blockInfo.timestamp) * 1000
              ).toISOString(),
              blockNumber: Number(blockInfo.number),
              transactionHash: log.transaction.hash,
            }
          );
        }

        // Handle TokensPurchased
        else if (eventSignature === EVENTS.TokensPurchased.signature) {
          const decoded = decodeEventLog({
            abi: [EVENTS.TokensPurchased.abi],
            data: log.data,
            topics: log.topics,
          });

          console.log("\n💰 BUY TRANSACTION");
          console.log("------------------------");
          console.log(`Token: ${decoded.args.token}`);
          console.log(`Buyer: ${decoded.args.buyer}`);
          console.log(
            `Tokens Amount: ${formatAmount(decoded.args.amount)} tokens`
          );
          console.log(`ETH Amount: ${formatAmount(decoded.args.price)} ETH`);
          console.log(
            `Price per Token: ${
              Number(formatAmount(decoded.args.price)) /
              Number(formatAmount(decoded.args.amount))
            } ETH`
          );
          console.log(`TX Hash: ${log.transaction.hash}`);

          await addDoc(collection(db, "trades"), {
            type: "buy",
            token: decoded.args.token.toLowerCase(),
            trader: decoded.args.buyer,
            tokenAmount: decoded.args.amount.toString(),
            ethAmount: decoded.args.price.toString(),
            pricePerToken: (
              Number(decoded.args.price) / Number(decoded.args.amount)
            ).toString(),
            blockNumber: Number(blockInfo.number),
            transactionHash: log.transaction.hash,
            timestamp: new Date(
              Number(blockInfo.timestamp) * 1000
            ).toISOString(),
          });
        }

        // Handle TokensSold
        else if (eventSignature === EVENTS.TokensSold.signature) {
          const decoded = decodeEventLog({
            abi: [EVENTS.TokensSold.abi],
            data: log.data,
            topics: log.topics,
          });

          console.log("\n💰 SELL TRANSACTION");
          console.log("------------------------");
          console.log(`Token: ${decoded.args.token}`);
          console.log(`Seller: ${decoded.args.seller}`);
          console.log(
            `Tokens Amount: ${formatAmount(decoded.args.tokenAmount)} tokens`
          );
          console.log(
            `ETH Amount: ${formatAmount(decoded.args.ethAmount)} ETH`
          );
          console.log(
            `Price per Token: ${
              Number(formatAmount(decoded.args.ethAmount)) /
              Number(formatAmount(decoded.args.tokenAmount))
            } ETH`
          );
          console.log(`TX Hash: ${log.transaction.hash}`);

          await addDoc(collection(db, "trades"), {
            type: "sell",
            token: decoded.args.token.toLowerCase(),
            trader: decoded.args.seller,
            tokenAmount: decoded.args.tokenAmount.toString(),
            ethAmount: decoded.args.ethAmount.toString(),
            pricePerToken: (
              Number(decoded.args.ethAmount) / Number(decoded.args.tokenAmount)
            ).toString(),
            blockNumber: Number(blockInfo.number),
            transactionHash: log.transaction.hash,
            timestamp: new Date(
              Number(blockInfo.timestamp) * 1000
            ).toISOString(),
          });
        }

        // Handle TradingHalted
        else if (eventSignature === EVENTS.TradingHalted.signature) {
          const decoded = decodeEventLog({
            abi: [EVENTS.TradingHalted.abi],
            data: log.data,
            topics: log.topics,
          });

          console.log("\n🛑 TRADING HALTED");
          console.log("------------------------");
          console.log(`Token: ${decoded.args.token}`);
          console.log(
            `Final Collateral: ${formatAmount(decoded.args.collateral)} ETH`
          );
          console.log(`TX Hash: ${log.transaction.hash}`);

          await setDoc(
            doc(db, "tokens", decoded.args.token.toLowerCase()),
            {
              tradingHalted: true,
              finalCollateral: decoded.args.collateral.toString(),
              haltedAt: new Date(
                Number(blockInfo.timestamp) * 1000
              ).toISOString(),
              haltBlock: Number(blockInfo.number),
            },
            { merge: true }
          );
        }
      } catch (error: any) {
        console.error("\n❌ Error processing event:", {
          error: error.message,
          eventSignature,
          tx: log.transaction.hash,
        });
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
