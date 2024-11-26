"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Coins, Rocket, Award, ChevronRight } from "lucide-react";
import Link from "next/link";

export function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] text-[var(--color-text)]">
      <motion.div
        className="container mx-auto px-4 py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-6 text-center"
          variants={itemVariants}
        >
          Motherhaven
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl text-center mb-12 max-w-3xl mx-auto"
          variants={itemVariants}
        >
          Empowering Decentralized Ecosystems: Analytics, Trading, and Community
          Building in One Hub.
        </motion.p>

        {/* Call-to-Actions */}
        <motion.div
          className="flex justify-center mb-16"
          variants={itemVariants}
        >
          <Link href="/dashboard">
            <Button
              size="lg"
              className="mr-4 bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
            >
              Dashboard <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dex">
            <Button
              size="lg"
              variant="outline"
              className="text-[black] border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)]"
            >
              Enter DEX <Coins className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Informational Section */}
        <motion.div className="mb-16 text-center" variants={itemVariants}>
          <h2 className="text-3xl font-semibold mb-4">How It Works</h2>
          <p className="max-w-3xl mx-auto">
            Launch tokens with a bonding curve with a max supply of 1 billion
            tokens. 20% of the supply is locked in the bonding curve until the
            funding goal is met. When the target is reached, the raised funds
            are added to a liquidity pool and the LP tokens burned, ensuring a
            fair market.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
        >
          <motion.div
            className="bg-[var(--color-card-bg)] p-6 rounded-lg shadow-lg border border-[var(--color-card-border)]"
            variants={itemVariants}
          >
            <Coins className="h-12 w-12 mb-4 text-blue-400" />
            <h2 className="text-2xl font-semibold mb-2">Analytics Dashboard</h2>
            <p>
              Track wallet activity, on-chain data, and real-time token
              performance in one unified view.
            </p>
          </motion.div>

          <motion.div
            className="bg-[var(--color-card-bg)] p-6 rounded-lg shadow-lg border border-[var(--color-card-border)]"
            variants={itemVariants}
          >
            <Award className="h-12 w-12 mb-4 text-green-400" />
            <h2 className="text-2xl font-semibold mb-2">
              Decentralized Exchange
            </h2>
            <p>
              Trade tokens seamlessly on a bonding curve, ensuring dynamic and
              fair pricing.
            </p>
          </motion.div>

          <motion.div
            className="bg-[var(--color-card-bg)] p-6 rounded-lg shadow-lg border border-[var(--color-card-border)]"
            variants={itemVariants}
          >
            <Rocket className="h-12 w-12 mb-4 text-purple-400" />
            <h2 className="text-2xl font-semibold mb-2">Casino</h2>
            <p>
              Engage with fun and innovative blockchain-based games at our
              crypto-powered casino.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
