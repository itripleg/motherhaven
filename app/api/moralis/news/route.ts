import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Define the request options
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${process.env.MORALIS_API_KEY}`, // Use environment variable for API key
      },
    };

    // Fetch news data from Moralis API
    const response = await fetch(
      "https://wdim.moralis.io/api/v1/news?limit=20&order=desc_date",
      options
    );
    const data = await response.json();

    // Return the fetched data as a JSON response
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error(err);

    // Return an error response with a 500 status
    return NextResponse.json(
      { error: "Failed to fetch news data" },
      { status: 500 }
    );
  }
}
