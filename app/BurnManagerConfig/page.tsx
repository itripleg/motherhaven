// app/BurnManagerConfig/page.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Container } from "@/components/craft";
import { AuthWrapper } from "@/components/AuthWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Flame, Settings, Coins, User, Sparkles } from "lucide-react";

// Import components (we'll create these next)
import { TokenManager } from "./components/TokenManager";
import { BurnManager } from "./components/BurnManager";

export default function BurnManagerConfigPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("tokens");

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
                  <User className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gradient bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent mb-3">
                    Connect Your Wallet
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                    Connect your wallet to configure burn managers for your
                    tokens.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                {[
                  { icon: Coins, text: "Manage Tokens" },
                  { icon: Flame, text: "Set Burn Managers" },
                  { icon: Settings, text: "Configure Settings" },
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
              <div className="flex items-center justify-center gap-3">
                <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
                  <Flame className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gradient bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
                  Burn Manager Config
                </h1>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Beta
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg">
                Configure burn managers and supported tokens for your contracts
              </p>
            </div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="unified-card border-blue-400/30 bg-blue-500/10">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Settings className="h-5 w-5 text-blue-400" />
                    <span className="text-lg font-semibold text-blue-400">
                      Configuration Hub
                    </span>
                  </div>
                  <p className="text-blue-300 text-sm leading-relaxed">
                    🔥 Set burn managers for your tokens • 🎯 Configure
                    supported tokens for burn managers • ⚡ Simple, secure
                    configuration
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="tokens" className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Token Manager
                </TabsTrigger>
                <TabsTrigger
                  value="burnmanager"
                  className="flex items-center gap-2"
                >
                  <Flame className="h-4 w-4" />
                  Burn Manager
                </TabsTrigger>
              </TabsList>

              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TabsContent value="tokens" className="mt-0">
                  {address && <TokenManager userAddress={address} />}
                </TabsContent>

                <TabsContent value="burnmanager" className="mt-0">
                  {address && <BurnManager userAddress={address} />}
                </TabsContent>
              </motion.div>
            </Tabs>
          </motion.div>
        </Container>
      </div>
    </AuthWrapper>
  );
}
