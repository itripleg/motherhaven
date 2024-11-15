"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const BondingCurveChart: React.FC = () => {
  // Constants
  const DECIMALS = 1e18;
  const MAX_SUPPLY = 1e9 * DECIMALS; // 1,000,000,000 tokens with decimals
  const INITIAL_SUPPLY = (MAX_SUPPLY * 20) / 100; // 20% of MAX_SUPPLY
  const LINEAR_COEFFICIENT = 46875;
  const OFFSET = 9.375e30; // Adjusted OFFSET
  const SCALING_FACTOR = 1e39;

  // Function to calculate price per token at a given supply
  const pricePerToken = (supply: number): number => {
    return (LINEAR_COEFFICIENT * supply + OFFSET) / SCALING_FACTOR;
  };

  // Generate data points
  const dataPoints = [];
  const SUPPLY_POINTS = 100; // Number of points to plot

  for (let i = 0; i <= SUPPLY_POINTS; i++) {
    const supply =
      INITIAL_SUPPLY + (i * (MAX_SUPPLY - INITIAL_SUPPLY)) / SUPPLY_POINTS;
    const supplyTokens = supply / DECIMALS; // Convert to tokens without decimals

    const price = pricePerToken(supply);

    dataPoints.push({
      supply: supplyTokens / 1e6, // Supply in millions
      price,
    });
  }

  // Prepare data for the chart
  const data = {
    labels: dataPoints.map((point) => point.supply.toFixed(2)), // X-axis labels
    datasets: [
      {
        label: "Price per Token (ETH)",
        data: dataPoints.map((point) => point.price),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Bonding Curve: Price per Token vs. Supply",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Token Supply (Millions)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Price per Token (ETH)",
        },
      },
    },
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Bonding Curve Visualization</h2>
      <Line data={data} options={options} />
    </div>
  );
};

export default BondingCurveChart;
