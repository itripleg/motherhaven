"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  BarChart2,
  ClipboardList,
  DollarSign,
  CheckCircle,
} from "lucide-react"; // Icons for different features
import Link from "next/link";

export function GeneralLandingPage() {
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
    <div className="min-h-screen bg-background text-foreground">
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
          Personal Finance & Task Management
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl text-center mb-12"
          variants={itemVariants}
        >
          Simplify your finances and stay on top of your tasks, all in one
          place.
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
            className="bg-muted text-muted-foreground p-6 rounded-lg shadow-lg dark:bg-muted dark:text-muted-foreground"
            variants={itemVariants}
          >
            <DollarSign className="h-12 w-12 mb-4 text-green-400" />
            <h2 className="text-2xl font-semibold mb-2">
              Manage Your Finances
            </h2>
            <p>
              Track your expenses, set budgets, and gain insights into your
              personal finances with easy-to-use tools.
            </p>
          </motion.div>
          <motion.div
            className="bg-muted text-muted-foreground p-6 rounded-lg shadow-lg dark:bg-muted dark:text-muted-foreground"
            variants={itemVariants}
          >
            <ClipboardList className="h-12 w-12 mb-4 text-yellow-400" />
            <h2 className="text-2xl font-semibold mb-2">Task Management</h2>
            <p>
              Stay organized with to-do lists, task tracking, and reminders to
              make sure nothing slips through the cracks.
            </p>
          </motion.div>
          <motion.div
            className="bg-muted text-muted-foreground p-6 rounded-lg shadow-lg dark:bg-muted dark:text-muted-foreground"
            variants={itemVariants}
          >
            <CheckCircle className="h-12 w-12 mb-4 text-purple-400" />
            <h2 className="text-2xl font-semibold mb-2">Financial Goals</h2>
            <p>
              Set and achieve financial goals, monitor your progress, and stay
              motivated with personalized insights.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
