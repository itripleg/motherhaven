import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = body.question || "";

    if (question.trim().length === 0) {
      return NextResponse.json(
        { error: { message: "Please enter a valid question" } },
        { status: 400 }
      );
    }

    // Array of predefined responses
    const responses = [
      "[wagmi]",
      "[ngmi]",
      "[hodl]",
      "[degen]",
      "[moon]",
      "[wen]",
      "[safu]",
      "[copium]",
      "[fomo]",
      "[rekt]",
    ];

    // Get a random response
    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    return NextResponse.json({ result: randomResponse });
  } catch (error) {
    return NextResponse.json(
      { error: { message: "Failed to process request" } },
      { status: 500 }
    );
  }
}
