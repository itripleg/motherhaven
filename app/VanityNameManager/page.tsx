// app/VanityNameManager/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useReadContract } from "wagmi";
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
  VANITY_NAME_CONSTANTS,
  type VanityNameData,
  type VanityNameStats as VanityStatsType,
} from "@/types/vanity";
import { Address } from "viem";

// Updated component imports
import { VanityNameRequest } from "./components/VanityNameRequest";
import { VanityNameHistory } from "./components/VanityNameHistory";
import { VanityNameSearch } from "./components/VanityNameSearch";
import { VanityNameSettings } from "./components/VanityNameSettings";
import { VanityNameStats } from "./components/VanityNameStats";
import { VanityNameLeaderboard } from "./components/VanityNameLeaderboard";

// Contract addresses
const VANITY_BURN_MANAGER_ADDRESS = process.env
  .NEXT_PUBLIC_VANITY_BURN_MANAGER_ADDRESS as Address;

// Contract ABI for reading user's current vanity name
const VANITY_BURN_MANAGER_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserVanityName",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserBurnInfo",
    outputs: [
      { name: "totalBurned", type: "uint256" },
      { name: "totalSpent", type: "uint256" },
      { name: "availableBalance", type: "uint256" },
      { name: "possibleNameChanges", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface VanityNameManagerPageProps {}

export default function VanityNameManagerPage({}: VanityNameManagerPageProps) {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("request");
  const [refreshKey, setRefreshKey] = useState(0);
  const [userVanityData, setUserVanityData] = useState<VanityNameData | null>(
    null
  );

  // Read current vanity name directly from contract
  const { data: currentVanityName, refetch: refetchVanityName } =
    useReadContract({
      address: VANITY_BURN_MANAGER_ADDRESS,
      abi: VANITY_BURN_MANAGER_ABI,
      functionName: "getUserVanityName",
      args: address ? [address] : undefined,
      query: {
        enabled: !!address && !!VANITY_BURN_MANAGER_ADDRESS,
        refetchInterval: 5000,
      },
    });

  const { data: burnInfo, refetch: refetchBurnInfo } = useReadContract({
    address: VANITY_BURN_MANAGER_ADDRESS,
    abi: VANITY_BURN_MANAGER_ABI,
    functionName: "getUserBurnInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!VANITY_BURN_MANAGER_ADDRESS,
      refetchInterval: 5000,
    },
  });

  // Load user's vanity name data from API and contract
  useEffect(() => {
    const loadUserData = async () => {
      if (!address || !isConnected) {
        return;
      }

      try {
        // Fetch user data from API (Firebase) - this will provide name history
        const response = await fetch(`/api/vanity-name/user/${address}`);
        if (response.ok) {
          const apiData = await response.json();
          console.log("📊 Loaded user data from API:", apiData);

          // Update user vanity data with API response
          const updatedUserData: VanityNameData = {
            current: apiData.currentName || currentVanityName || "",
            history: apiData.nameHistory || [],
            totalChanges: apiData.stats?.totalChanges || 0,
            lastChanged: apiData.stats?.lastChanged || null,
          };

          // Only update if we have new data or if current data differs
          setUserVanityData((prev) => {
            if (
              !prev ||
              prev.current !== updatedUserData.current ||
              prev.history.length !== updatedUserData.history.length
            ) {
              return updatedUserData;
            }
            return prev;
          });
        } else {
          console.log("ℹ️ No API data found, using contract data only");
          // Fallback to contract-only data
          const contractOnlyData: VanityNameData = {
            current: currentVanityName || "",
            history: [],
            totalChanges:
              burnInfo?.[1] && burnInfo?.[0]
                ? Number(burnInfo[1] / BigInt("1000000000000000000000"))
                : 0,
            lastChanged: null,
          };
          setUserVanityData(contractOnlyData);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Fallback to contract data
        const fallbackData: VanityNameData = {
          current: currentVanityName || "",
          history: [],
          totalChanges: 0,
          lastChanged: null,
        };
        setUserVanityData(fallbackData);
      }
    };

    loadUserData();
  }, [address, isConnected, currentVanityName, burnInfo]);

  // Empty system stats - will be populated when you build analytics
  const systemStats: VanityStatsType = {
    totalNames: 0,
    totalRequests: 0,
    pendingRequests: 0,
    confirmedRequests: 0,
    rejectedRequests: 0,
    activeUsers: 0,
    popularNames: [],
  };

  // Handle successful name request
  const handleNameRequestSuccess = () => {
    // Refresh contract data
    refetchVanityName();
    refetchBurnInfo();

    // Refresh API data
    if (address) {
      fetch(`/api/vanity-name/user/${address}`)
        .then((response) => response.json())
        .then((apiData) => {
          const updatedUserData: VanityNameData = {
            current: apiData.currentName || "",
            history: apiData.nameHistory || [],
            totalChanges: apiData.stats?.totalChanges || 0,
            lastChanged: apiData.stats?.lastChanged || null,
          };
          setUserVanityData(updatedUserData);
        })
        .catch((error) => console.error("Error refreshing user data:", error));
    }

    // Force re-render of components
    setRefreshKey((prev) => prev + 1);
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
                Burn VAIN tokens to earn unique vanity names
              </p>
            </div>

            {/* Info Card for New System */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="unified-card border-blue-400/30 bg-blue-500/10">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Flame className="h-5 w-5 text-blue-400" />
                    <span className="text-lg font-semibold text-blue-400">
                      Burn-to-Earn System
                    </span>
                  </div>
                  <p className="text-blue-300 text-sm leading-relaxed">
                    🔥 Burn VAIN tokens to earn name changes • 🎭 Set vanity
                    names instantly • ⚡ No approvals needed!
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
                  key={`${activeTab}-${refreshKey}`}
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
