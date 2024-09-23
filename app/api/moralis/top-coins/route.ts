import Moralis from "moralis";
import { NextResponse } from "next/server";

// Flag to check if Moralis is initialized
let isMoralisInitialized = false;

export async function GET() {
  try {
    // Check if Moralis has already been initialized
    if (!isMoralisInitialized) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
      isMoralisInitialized = true;
    }

    // Fetch top cryptocurrencies by market cap
    const response =
      await Moralis.EvmApi.marketData.getTopCryptoCurrenciesByMarketCap();

    // Log the raw response for debugging purposes
    // console.log(response.raw);

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
