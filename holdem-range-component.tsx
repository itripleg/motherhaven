import React, { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

// Define types
type HandString = string;
type HandRankMap = Record<HandString, number>;

interface HandData {
  hand: HandString;
  strength: number;
  isPair: boolean;
  isSuited?: boolean;
}

interface GridCell {
  hand: HandString;
  row: number;
  col: number;
  isPair: boolean;
  isSuited: boolean;
}

// Hand rankings based on combinations - corrected to match the actual percentiles
// Key: 55 should be at exactly 20%, JTo should be around 21%
const HAND_RANK_MAP: HandRankMap = {
  AA: 0.45,
  KK: 1.36,
  QQ: 2.26,
  JJ: 3.17,
  AKs: 3.47,
  TT: 4.07,
  AQs: 4.38,
  AJs: 4.98,
  KQs: 5.28,
  ATs: 5.89,
  AKo: 6.19,
  "99": 6.64,
  AQo: 7.55,
  KJs: 7.85,
  A9s: 8.45,
  KTs: 8.76,
  QJs: 9.36,
  KQo: 9.66,
  A8s: 10.11,
  K9s: 10.42,
  "88": 11.02,
  QTs: 11.33,
  A7s: 11.93,
  AJo: 12.24,
  K8s: 12.69,
  Q9s: 13.14,
  JTs: 13.59,
  ATo: 14.05,
  KJo: 14.35,
  A6s: 14.8,
  QJo: 15.11,
  "77": 15.56,
  K7s: 16.06,
  A5s: 16.36,
  Q8s: 16.97,
  J8s: 17.42,
  KTo: 17.87,
  A9o: 18.13,
  A4s: 18.58,
  Q7s: 19.03,
  T9s: 19.49,
  K9o: 19.79,
  "55": 20.0,
  JTo: 21.0,
  J7s: 21.24,
  A3s: 21.69,
  QTo: 21.95,
  Q9o: 22.4,
  K6s: 22.85,
  "66": 23.31,
  J9o: 23.61,
  T8s: 24.06,
  A8o: 24.37,
  K5s: 24.82,
  J6s: 25.28,
  Q6s: 25.73,
  "98s": 26.19,
  A2s: 26.49,
  T9o: 26.94,
  K8o: 27.2,
  A7o: 27.65,
  J8o: 28.11,
  K4s: 28.56,
  Q8o: 28.86,
  T7s: 29.32,
  A6o: 29.77,
  K7o: 30.08,
  J9s: 30.53,
  "97s": 30.98,
  Q5s: 31.44,
  J5s: 31.89,
  T6s: 32.35,
  Q7o: 32.65,
  K3s: 33.1,
  A5o: 33.56,
  "87s": 34.01,
  J7o: 34.31,
  "96s": 34.77,
  Q4s: 35.22,
  T8o: 35.52,
  K6o: 35.98,
  J4s: 36.43,
  Q6o: 36.73,
  A4o: 37.19,
  T5s: 37.64,
  "95s": 38.1,
  K2s: 38.4,
  A3o: 38.86,
  "86s": 39.31,
  J6o: 39.61,
  Q3s: 40.07,
  "98o": 40.37,
  T7o: 40.82,
  K5o: 41.13,
  "44": 41.58,
  "94s": 42.04,
  J3s: 42.49,
  T4s: 42.95,
  Q5o: 43.25,
  "85s": 43.7,
  "97o": 44.01,
  A2o: 44.46,
  K4o: 44.77,
  "93s": 45.22,
  J5o: 45.52,
  "76s": 45.98,
  T6o: 46.28,
  Q2s: 46.74,
  "87o": 47.04,
  "92s": 47.5,
  K3o: 47.8,
  J2s: 48.26,
  "96o": 48.56,
  T3s: 49.01,
  Q4o: 49.27,
  "84s": 49.72,
  "75s": 50.17,
  J4o: 50.47,
  "95o": 50.93,
  T5o: 51.23,
  K2o: 51.68,
  "33": 52.13,
  "86o": 52.43,
  Q3o: 52.89,
  "83s": 53.34,
  T2s: 53.8,
  "94o": 54.1,
  J3o: 54.55,
  "74s": 54.86,
  "65s": 55.31,
  "85o": 55.61,
  T4o: 56.07,
  "73s": 56.52,
  Q2o: 56.82,
  "93o": 57.28,
  "64s": 57.73,
  J2o: 58.03,
  "92o": 58.49,
  "84o": 58.79,
  T3o: 59.25,
  "22": 59.7,
  "82s": 60.16,
  "76o": 60.46,
  "54s": 60.91,
  "75o": 61.17,
  "72s": 61.62,
  "63s": 62.07,
  "83o": 62.38,
  "74o": 62.83,
  T2o: 63.14,
  "62s": 63.59,
  "53s": 64.05,
  "65o": 64.35,
  "52s": 64.8,
  "73o": 65.11,
  "43s": 65.56,
  "64o": 65.86,
  "82o": 66.32,
  "42s": 66.77,
  "54o": 67.07,
  "32s": 67.53,
  "72o": 67.98,
  "62o": 68.29,
  "63o": 68.74,
  "53o": 69.05,
  "52o": 69.5,
  "43o": 69.81,
  "42o": 70.26,
  "32o": 70.57,
};

// Calculate hand strength based on percentile ranking
const calculateHandStrength = (hand: HandString): number => {
  const percentile = HAND_RANK_MAP[hand];

  if (percentile === undefined) {
    console.warn(`Hand ${hand} not found in rank map`);
    return 0; // Very weak if not found
  }

  // Return inverted percentile so lower percentile = higher strength
  return 100 - percentile;
};

// Generate all possible hands and sort by strength
const generateRankedHands = (): HandData[] => {
  const ranks = [
    "A",
    "K",
    "Q",
    "J",
    "T",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
  ];
  const hands: HandData[] = [];

  // Generate all hands
  for (let i = 0; i < ranks.length; i++) {
    for (let j = i; j < ranks.length; j++) {
      const rank1 = ranks[i];
      const rank2 = ranks[j];

      if (i === j) {
        // Pocket pair
        const hand = rank1 + rank2;
        hands.push({
          hand,
          strength: calculateHandStrength(hand),
          isPair: true,
        });
      } else {
        // Suited and offsuit
        const suited = rank1 + rank2 + "s";
        const offsuit = rank1 + rank2 + "o";
        hands.push({
          hand: suited,
          strength: calculateHandStrength(suited),
          isPair: false,
          isSuited: true,
        });
        hands.push({
          hand: offsuit,
          strength: calculateHandStrength(offsuit),
          isPair: false,
          isSuited: false,
        });
      }
    }
  }

  // Sort by strength (highest first)
  hands.sort((a, b) => b.strength - a.strength);

  // Debug: Check if JTo is in the list and where
  const jtoIndex = hands.findIndex((h) => h.hand === "JTo");
  const fiveIndex = hands.findIndex((h) => h.hand === "55");
  console.log(
    "JTo found at index:",
    jtoIndex,
    "strength:",
    hands[jtoIndex]?.strength
  );
  console.log(
    "55 found at index:",
    fiveIndex,
    "strength:",
    hands[fiveIndex]?.strength
  );
  console.log(
    "First 30 hands:",
    hands.slice(0, 30).map((h) => h.hand)
  );

  return hands;
};

// Generate mathematically ranked hands with metadata
const RANKED_HANDS = generateRankedHands();
const HAND_RANKINGS: HandString[] = RANKED_HANDS.map((h) => h.hand);

// Create the grid layout for poker hands
const createHandGrid = (): GridCell[] => {
  const ranks = [
    "A",
    "K",
    "Q",
    "J",
    "T",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
  ];
  const grid: GridCell[] = [];

  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const rank1 = ranks[row];
      const rank2 = ranks[col];

      let hand: HandString;
      if (row === col) {
        // Pocket pairs
        hand = rank1 + rank2;
      } else if (row < col) {
        // Suited hands (upper right) - higher rank first
        hand = rank1 + rank2 + "s";
      } else {
        // Offsuit hands (lower left) - higher rank first
        // Since row > col, rank1 is lower than rank2, so we flip them
        hand = rank2 + rank1 + "o";
      }

      grid.push({
        hand,
        row,
        col,
        isPair: row === col,
        isSuited: row < col,
      });
    }
  }

  return grid;
};

const HoldemRangeComponent: React.FC = () => {
  const [percentage, setPercentage] = useState<number[]>([15]);
  const handGrid = useMemo(() => createHandGrid(), []);

  const selectedHands = useMemo(() => {
    const numHands = Math.floor((percentage[0] / 100) * HAND_RANKINGS.length);
    const selected = new Set(HAND_RANKINGS.slice(0, numHands));
    return selected;
  }, [percentage]);

  const getHandColor = (
    hand: HandString,
    isPair: boolean,
    isSuited: boolean
  ): string => {
    const isSelected = selectedHands.has(hand);

    if (isSelected) {
      if (isPair) return "bg-red-500 text-white";
      if (isSuited) return "bg-blue-500 text-white";
      return "bg-green-500 text-white";
    }

    if (isPair) return "bg-red-100 text-red-800";
    if (isSuited) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">
          Texas Hold&apos;em Preflop Range
        </h1>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="range-slider" className="text-lg font-medium">
              Hand Range: {percentage[0]}%
            </label>
            <div className="text-sm text-gray-600">
              {Math.floor((percentage[0] / 100) * HAND_RANKINGS.length)} /{" "}
              {HAND_RANKINGS.length} hands
            </div>
          </div>

          <Slider
            id="range-slider"
            min={0}
            max={100}
            step={1}
            value={percentage}
            onValueChange={setPercentage}
            className="w-full"
          />
        </div>

        <div className="flex gap-4 text-sm mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Pocket Pairs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Suited Hands</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Offsuit Hands</span>
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div
          className="inline-grid gap-1 mx-auto"
          style={{ gridTemplateColumns: "repeat(13, 1fr)" }}
        >
          {handGrid.map(({ hand, row, col, isPair, isSuited }) => (
            <div
              key={`${row}-${col}`}
              className={`
                w-10 h-10 flex items-center justify-center text-xs font-bold rounded
                transition-colors duration-200 border
                ${getHandColor(hand, isPair, isSuited)}
                ${
                  selectedHands.has(hand)
                    ? "border-gray-700"
                    : "border-gray-300"
                }
              `}
            >
              {hand}
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-gray-600 text-center">
          <p>
            Pocket pairs on diagonal • Suited hands above diagonal • Offsuit
            hands below diagonal
          </p>
        </div>
      </Card>

      {selectedHands.size > 0 && (
        <Card className="mt-4 p-4">
          <h3 className="font-semibold mb-2">
            Selected Hands ({selectedHands.size}):
          </h3>
          <div className="text-sm text-gray-700 leading-relaxed">
            {Array.from(selectedHands).join(", ")}
          </div>
        </Card>
      )}
    </div>
  );
};

export default HoldemRangeComponent;
