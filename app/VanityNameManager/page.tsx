// app/VanityNameManager/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { Container } from "@/components/craft";
import { AuthWrapper } from "@/components/AuthWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Crown,
  Sparkles,
  History,
  Search,
  Settings,
  Flame,
  TrendingUp,
  Users,
  Award,
  Activity,
} from "lucide-react";
import {
  VanityRequestStatus,
  VANITY_NAME_CONSTANTS,
  type VanityNameData,
  type VanityRequestDocument,
  type VanityNameStats as VanityStatsType,
} from "@/types/vanity";

// We'll import these components once we create them
import { VanityNameRequest } from "./components/VanityNameRequest";
import { VanityNameHistory } from "./components/VanityNameHistory";
import { VanityNameSearch } from "./components/VanityNameSearch";
import { VanityNameSettings } from "./components/VanityNameSettings";
import { VanityNameStats } from "./components/VanityNameStats";
import { VanityNameLeaderboard } from "./components/VanityNameLeaderboard";

interface VanityNameManagerPageProps {}

export default function VanityNameManagerPage({}: VanityNameManagerPageProps) {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("request");
  const [isLoading, setIsLoading] = useState(true);
  const [userVanityData, setUserVanityData] = useState<VanityNameData | null>(
    null
  );
  const [pendingRequests, setPendingRequests] = useState<
    VanityRequestDocument[]
  >([]);
  const [systemStats, setSystemStats] = useState<VanityStatsType | null>(null);

  // Load user's vanity name data
  useEffect(() => {
    const loadUserData = async () => {
      if (!address || !isConnected) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // TODO: Implement these API calls
        const [vanityData, requests, stats] = await Promise.all([
          fetchUserVanityData(address),
          fetchUserPendingRequests(address),
          fetchSystemStats(),
        ]);

        setUserVanityData(vanityData);
        setPendingRequests(requests);
        setSystemStats(stats);
      } catch (error) {
        console.error("Error loading vanity data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [address, isConnected]);

  // Mock functions - replace with actual API calls
  const fetchUserVanityData = async (
    userAddress: string
  ): Promise<VanityNameData> => {
    // TODO: Implement actual API call
    return {
      current: "",
      history: [],
      totalChanges: 0,
      lastChanged: null,
    };
  };

  const fetchUserPendingRequests = async (
    userAddress: string
  ): Promise<VanityRequestDocument[]> => {
    // TODO: Implement actual API call
    return [];
  };

  const fetchSystemStats = async (): Promise<VanityStatsType> => {
    // TODO: Implement actual API call
    return {
      totalNames: 0,
      totalRequests: 0,
      pendingRequests: 0,
      confirmedRequests: 0,
      rejectedRequests: 0,
      activeUsers: 0,
      popularNames: [],
    };
  };

  // Handle successful name request
  const handleNameRequestSuccess = () => {
    // Refresh user data
    if (address) {
      fetchUserVanityData(address).then(setUserVanityData);
      fetchUserPendingRequests(address).then(setPendingRequests);
    }
  };

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
                    Access vanity name management and customize your digital
                    identity.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                {[
                  { icon: Crown, text: "Claim Your Name" },
                  { icon: History, text: "Track Changes" },
                  { icon: Search, text: "Find Users" },
                  { icon: Award, text: "Leaderboard" },
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
                  Loading Vanity Names
                </h3>
                <p className="text-muted-foreground">
                  Fetching your identity data...
                </p>
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
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gradient bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
                  Vanity Names
                </h1>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Beta
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg">
                Customize your digital identity with unique vanity names
              </p>
            </div>

            {/* Current Name Display */}
            {userVanityData?.current && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="max-w-md mx-auto"
              >
                <Card className="unified-card border-primary/30 bg-primary/10">
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <Crown className="h-5 w-5 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Your Current Name
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {userVanityData.current}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      Changed {userVanityData.totalChanges} time
                      {userVanityData.totalChanges !== 1 ? "s" : ""}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Pending Requests Alert */}
            {pendingRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-md mx-auto"
              >
                <Card className="unified-card border-yellow-400/30 bg-yellow-500/10">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">
                        {pendingRequests.length} Pending Request
                        {pendingRequests.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your name change requests are being processed
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
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
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-8">
                <TabsTrigger
                  value="request"
                  className="flex items-center gap-2"
                >
                  <Crown className="h-4 w-4" />
                  <span className="hidden sm:inline">Request</span>
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                </TabsTrigger>
                <TabsTrigger
                  value="leaderboard"
                  className="flex items-center gap-2"
                >
                  <Award className="h-4 w-4" />
                  <span className="hidden sm:inline">Leaders</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Stats</span>
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
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
                  <TabsContent value="request" className="mt-0">
                    {address && (
                      <VanityNameRequest
                        userAddress={address}
                        currentName={userVanityData?.current || ""}
                        pendingRequests={pendingRequests}
                        onSuccess={handleNameRequestSuccess}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="mt-0">
                    {address && (
                      <VanityNameHistory
                        userAddress={address}
                        vanityData={userVanityData}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="search" className="mt-0">
                    <VanityNameSearch />
                  </TabsContent>

                  <TabsContent value="leaderboard" className="mt-0">
                    <VanityNameLeaderboard />
                  </TabsContent>

                  <TabsContent value="stats" className="mt-0">
                    <VanityNameStats stats={systemStats} />
                  </TabsContent>

                  <TabsContent value="settings" className="mt-0">
                    {address && (
                      <VanityNameSettings
                        userAddress={address}
                        vanityData={userVanityData}
                      />
                    )}
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
