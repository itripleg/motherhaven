// pages/fidget.tsx
"use client";

import React, { useState } from "react";
import { Container } from "@/components/craft";
import FidgetCubeScene from "./components/FidgetCubeScene";

export default function FidgetPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // Handle game selection from the cube
  const handleGameSelect = (gameName: string) => {
    setActiveGame((prevGame) => (prevGame === gameName ? null : gameName));
  };

  return (
    <Container className="relative min-h-screen pt-16">
      <h1 className="text-4xl font-bold text-center z-10 relative">
        ADHD Fidget Cube
      </h1>

      {/* Main 3D scene - always visible and the primary interface */}
      <div className="fixed inset-0 z-0">
        <FidgetCubeScene
          onSelectGame={handleGameSelect}
          activeGame={activeGame}
        />
      </div>
    </Container>
  );
}
