import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const TokenPriceChart = ({
  tokenSupply = 0, // Current token supply
  trades = [], // Array of actual trades
  maxSupply = 1_000_000_000, // 1B tokens
  initialPrice = 0.001, // Initial price in AVAX
  priceRate = 100, // Price rate multiplier
  initialMint = 200_000_000, // 20% initial mint
}) => {
  // Calculate bonding curve points
  const bondingCurveData = useMemo(() => {
    const points = [];
    const numPoints = 50; // Number of points to plot
    const supplyIncrement = (maxSupply - initialMint) / numPoints;

    for (let i = 0; i <= numPoints; i++) {
      const supply = initialMint + supplyIncrement * i;
      const currentSupply = supply - initialMint;
      const price =
        initialPrice +
        (initialPrice * currentSupply * priceRate) / (maxSupply - initialMint);

      points.push({
        supply: supply / 1e18, // Convert from wei to tokens
        theoreticalPrice: price / 1e18, // Convert from wei to AVAX
      });
    }
    return points;
  }, [maxSupply, initialPrice, priceRate, initialMint]);

  const combinedData = bondingCurveData.map((point) => ({
    ...point,
    actualPrice:
      trades.find(
        (trade) => Math.abs(trade.supply / 1e18 - point.supply) < 1000000
      )?.price || null,
  }));

  return (
    <Card className="w-full h-96">
      <CardHeader>
        <CardTitle>Token Price Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={combinedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="supply"
              label={{
                value: "Token Supply",
                position: "insideBottom",
                offset: -5,
              }}
              tickFormatter={(val) => `${(val / 1_000_000).toFixed(1)}M`}
            />
            <YAxis
              label={{
                value: "Price (AVAX)",
                angle: -90,
                position: "insideLeft",
              }}
              tickFormatter={(val) => val.toFixed(3)}
            />
            <Tooltip
              formatter={(value, name) => [
                `${value.toFixed(4)} AVAX`,
                name === "theoreticalPrice"
                  ? "Theoretical Price"
                  : "Actual Trade",
              ]}
              labelFormatter={(label) =>
                `Supply: ${(label / 1_000_000).toFixed(1)}M tokens`
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="theoreticalPrice"
              stroke="#8884d8"
              name="Bonding Curve"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actualPrice"
              stroke="#82ca9d"
              name="Actual Trades"
              dot={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TokenPriceChart;
