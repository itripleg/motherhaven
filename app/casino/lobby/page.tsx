"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Container } from "@/components/craft";
// import { DiceIcon, CardsIcon, ChipIcon } from "lucide-react";
// import { Dice, Cards, Chip } from "lucide-react";

const games = [
  {
    id: 1,
    name: "Poker",
    category: "card",
    players: 1000,
    minBet: 0.01,
    link: "/games/poker",
    active: false,
  },
  {
    id: 2,
    name: "Blackjack",
    category: "card",
    players: 750,
    minBet: 0.05,
    link: "/games/blackjack",
    active: false,
  },
  {
    id: 3,
    name: "Roulette",
    category: "table",
    players: 500,
    minBet: 0.1,
    link: "/games/roulette",
    active: false,
  },
  {
    id: 4,
    name: "Slots",
    category: "machine",
    players: 2000,
    minBet: 0.01,
    link: "/games/slots",
    active: false,
  },
  {
    id: 5,
    name: "Magic Dice",
    category: "dice",
    players: 300,
    minBet: 0.25,
    link: "/casino/games/dice",
    active: true,
  },
  {
    id: 6,
    name: "Baccarat",
    category: "card",
    players: 400,
    minBet: 0.5,
    link: "/games/baccarat",
    active: false,
  },
];

const GameCard = ({ game }: any) => (
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{game.name}</CardTitle>
        <CardDescription>Min Bet: {game.minBet} ETH</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Badge variant="secondary">{game.category}</Badge>
          <span className="text-sm text-muted-foreground">
            {game.players} players
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={!game.active}
          onClick={() => {
            if (game.active) window.location.href = game.link;
          }}
        >
          {game.active ? "Play Now" : "Inactive"}
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
);

export default function LobbyPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredGames =
    activeCategory === "all"
      ? games
      : games.filter((game) => game.category === activeCategory);

  return (
    <Container>
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Game Lobby</h1>

        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" onClick={() => setActiveCategory("all")}>
              All
            </TabsTrigger>
            <TabsTrigger value="card" onClick={() => setActiveCategory("card")}>
              {/* <CardsIcon className="mr-2 h-4 w-4" /> */}
              Card
            </TabsTrigger>
            <TabsTrigger value="dice" onClick={() => setActiveCategory("dice")}>
              {/* <DiceIcon className="mr-2 h-4 w-4" /> */}
              Dice
            </TabsTrigger>
            <TabsTrigger
              value="table"
              onClick={() => setActiveCategory("table")}
            >
              {/* <ChipIcon className="mr-2 h-4 w-4" /> */}
              Table
            </TabsTrigger>
            <TabsTrigger
              value="machine"
              onClick={() => setActiveCategory("machine")}
            >
              Slots
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </motion.div>
      </div>
    </Container>
  );
}
