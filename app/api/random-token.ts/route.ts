import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { randomBytes } from "crypto";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const randomName = `Token_${randomBytes(4).toString("hex")}`;
    const randomTicker = `TK${randomBytes(2).toString("hex").toUpperCase()}`;
    const randomCreator = `0x${randomBytes(20).toString("hex")}`;

    const docRef = await addDoc(collection(db, "tokens"), {
      name: randomName,
      ticker: randomTicker,
      logo: "", // Placeholder for logo
      creator: randomCreator,
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({ message: "Random token created", id: docRef.id });
  } catch (error) {
    console.error("Error creating random token:", error);
    res.status(500).json({ error: "Failed to create random token" });
  }
}
