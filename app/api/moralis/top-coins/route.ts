import Moralis from "moralis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Start Moralis with API key from environment variables
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });

    // Fetch top cryptocurrencies by market cap
    const response =
      await Moralis.EvmApi.marketData.getTopCryptoCurrenciesByMarketCap({});

    // Log the raw response for debugging purposes
    console.log(response.raw);

    // Return the response as a JSON object
    return NextResponse.json(response.raw, { status: 200 });
  } catch (e) {
    console.error(e);

    // Return an error response with a 500 status
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
