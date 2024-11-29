import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Token } from "@/types";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import useTokenDetails from "@/hooks/useTokenDetails";

export const TokenCard = ({ token }: { token: Token }) => {
  const router = useRouter();
  const { price, isLoading } = useTokenDetails(token.address as `0x${string}`);

  const displayPrice = isLoading
    ? "Loading..."
    : `$${Number(price).toFixed(4)}`;

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Card className="h-full relative overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: token.imageUrl ? `url(${token.imageUrl})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>

        <div className="relative z-10">
          <CardHeader>
            <CardTitle className="text-white">{token.name}</CardTitle>
            <CardDescription className="text-gray-200">
              Ticker: {token.symbol}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <Badge
                variant="secondary"
                className="bg-white/10 text-white border-white/20"
              >
                {token.symbol}
              </Badge>
              <span className="text-sm text-gray-200">{displayPrice}</span>
            </div>
            <p className="mt-2 text-sm text-gray-200">
              Address:{" "}
              {token.address
                ? `${token.address.slice(0, 6)}...${token.address.slice(-4)}`
                : "N/A"}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
              onClick={() => router.push(`/dex/${token.address}`)}
            >
              View Token
            </Button>
          </CardFooter>
        </div>

        {!token.imageUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
        )}
      </Card>
    </motion.div>
  );
};
