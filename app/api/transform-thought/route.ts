import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { pros, cons, thought } = await request.json();

    const prompt = `
      Analyze the following thought process and create a Venn diagram representation:
      
      Pros:
      ${pros}
      
      Cons:
      ${cons}
      
      Thought:
      ${thought}
      
      Return a JSON object that describes a Venn diagram where:
      - Circle A represents pros (positive aspects)
      - Circle B represents cons (negative aspects)
      - The intersection represents balanced or nuanced points
      
      Format the response as:
      {
        "prosPoints": ["Array of points unique to pros"],
        "consPoints": ["Array of points unique to cons"],
        "intersectionPoints": ["Array of points that show balance/nuance"],
        "summary": "Brief summary of analysis",
        "circles": {
          "pros": {"cx": number, "cy": number, "r": number},
          "cons": {"cx": number, "cy": number, "r": number}
        }
      }
      
      Use these specifications for the circles:
      - Center coordinates (cx, cy) should be between 100 and 300
      - Radius (r) should be between 80 and 120
      - Ensure circles overlap appropriately
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });
    // @ts-expect-error it works
    const analysis = JSON.parse(completion.choices[0].message.content);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
