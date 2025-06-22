import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Token } from "@/types"; // 1. Use the main Token type
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// 2. The component now accepts a single, complete Token object
export const TokenCard = ({ token }: { token: Token }) => {
  const router = useRouter();

  // 3. Access all data directly from the token object's top-level properties
  const { name, symbol, imageUrl, address, currentPrice, collateral } = token;

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Card className="h-full relative overflow-hidden flex flex-col">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col flex-grow">
          <CardHeader>
            <CardTitle className="text-white truncate">{name}</CardTitle>
            <CardDescription className="text-gray-200">
              Ticker: ${symbol}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-grow space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="backdrop-blur-sm bg-white/10 p-3 rounded-lg">
                <Label className="text-gray-300 text-xs">Price</Label>
                <p className="text-white font-semibold truncate">
                  {currentPrice} AVAX
                </p>
              </div>
              <div className="backdrop-blur-sm bg-white/10 p-3 rounded-lg">
                <Label className="text-gray-300 text-xs">Collateral</Label>
                <p className="text-white font-semibold truncate">
                  {collateral} AVAX
                </p>
              </div>
            </div>
            {/* You can add more fields like virtualSupply here if you wish */}
          </CardContent>

          <CardFooter>
            <Button
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              onClick={() => router.push(`/dex/${address}`)}
            >
              View & Trade
            </Button>
          </CardFooter>
        </div>
      </Card>
    </motion.div>
  );
};
