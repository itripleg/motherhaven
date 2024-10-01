"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, BarChart2, DollarSign, TrendingUp } from "lucide-react";
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
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white ">
      <motion.div
        className="container mx-auto px-4 py-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-6 text-center"
          variants={itemVariants}
        >
          CryptoTracker
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl text-center mb-12"
          variants={itemVariants}
        >
          Your all-in-one solution for tracking and managing cryptocurrencies
        </motion.p>

        <motion.div
          className="flex justify-center mb-16"
          variants={itemVariants}
        >
          <Link href="/dashboard">
            <Button size="lg" className="mr-4">
              Get Started
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-foreground">
              Log In
            </Button>
          </Link>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
        >
          <motion.div
            className="bg-gray-800 p-6 rounded-lg shadow-lg"
            variants={itemVariants}
          >
            <BarChart2 className="h-12 w-12 mb-4 text-blue-400" />
            <h2 className="text-2xl font-semibold mb-2">Real-time Tracking</h2>
            <p>
              Monitor your favorite cryptocurrencies with up-to-the-minute price
              updates and market data.
            </p>
          </motion.div>
          <motion.div
            className="bg-gray-800 p-6 rounded-lg shadow-lg"
            variants={itemVariants}
          >
            <DollarSign className="h-12 w-12 mb-4 text-green-400" />
            <h2 className="text-2xl font-semibold mb-2">
              Portfolio Management
            </h2>
            <p>
              Easily manage and track your crypto portfolio with intuitive tools
              and visualizations.
            </p>
          </motion.div>
          <motion.div
            className="bg-gray-800 p-6 rounded-lg shadow-lg"
            variants={itemVariants}
          >
            <TrendingUp className="h-12 w-12 mb-4 text-purple-400" />
            <h2 className="text-2xl font-semibold mb-2">Market Insights</h2>
            <p>
              Get valuable insights and analytics to make informed decisions
              about your crypto investments.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
