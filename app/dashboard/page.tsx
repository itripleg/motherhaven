// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/craft";
import { AuthWrapper } from "@/components/AuthWrapper";
import { useAccount } from "wagmi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  Coins,
  TrendingUp,
  Plus,
  Activity,
  Crown,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Import simplified components
import { UserTokensCreated } from "./components/UserTokensCreated";
import { UserTradingActivity } from "./components/UserTradingActivity";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("tokens");
  const [isLoading, setIsLoading] = useState(true);

  // Simple loading simulation
  useEffect(() => {
    if (isConnected && address) {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } else {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen animated-bg floating-particles">
        <Container className="py-8 pt-16 md:pt-24">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 blur-xl rounded-full" />
                <div className="relative p-8 unified-card border-primary/30 bg-primary/5">
                  <Wallet className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gradient bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent mb-3">
                    Connect Your Wallet
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                    Access your personalized dashboard with token management and
                    trading history.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                {[
                  { icon: Crown, text: "My Tokens" },
                  { icon: Activity, text: "Trading History" },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-2 px-4 py-2 unified-card border-primary/20 bg-primary/5"
                  >
                    <feature.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">
                      {feature.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </Container>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen animated-bg floating-particles">
        <Container className="py-8 pt-24">
          <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
              />
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  Loading Dashboard
                </h3>
                <p className="text-muted-foreground">Gathering your data...</p>
              </div>
            </motion.div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="min-h-screen animated-bg floating-particles md:pt-20">
        <Container className="py-8 pt-16 md:pt-24 space-y-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-gradient bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
                Your Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your tokens and track your trading activity
              </p>
            </div>

            {/* Quick Action Row */}
            <div className="flex justify-center">
              <Button
                onClick={() => router.push("/dex/factory")}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Token
              </Button>
            </div>
          </motion.div>

          {/* Main Dashboard Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="tokens" className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  <span>My Tokens</span>
                </TabsTrigger>
                <TabsTrigger
                  value="trading"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Trading</span>
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* My Tokens Tab */}
                  <TabsContent value="tokens" className="mt-0">
                    <UserTokensCreated />
                  </TabsContent>

                  {/* Trading Tab */}
                  <TabsContent value="trading" className="mt-0">
                    <UserTradingActivity />
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </Container>
      </div>
    </AuthWrapper>
  );
}
