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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Wallet,
  TrendingUp,
  Activity,
  Target,
  Crown,
  Sparkles,
  BarChart3,
  Coins,
  PieChart,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  RefreshCw,
  Star,
  Trophy,
  Zap,
  Timer,
  DollarSign,
} from "lucide-react";

// Import your updated components
import TokenBalanceLookup from "./TokenBalanceLookup";

// We'll create these new components in the next steps
import { UserPortfolioOverview } from "./components/UserPortfolioOverview";
import { UserTokensCreated } from "./components/UserTokensCreated";
import { UserTradingActivity } from "./components/UserTradingActivity";
import { UserWatchlist } from "./components/UserWatchlist";
import { QuickActions } from "./components/QuickActions";
import { MarketInsights } from "./components/MarketInsights";

interface DashboardStats {
  totalPortfolioValue: string;
  totalTokensCreated: number;
  totalTrades: number;
  pnl24h: number;
  activePositions: number;
  watchlistCount: number;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPortfolioValue: "0.00",
    totalTokensCreated: 0,
    totalTrades: 0,
    pnl24h: 0,
    activePositions: 0,
    watchlistCount: 0,
  });

  // Simulate loading dashboard data
  useEffect(() => {
    if (isConnected && address) {
      // TODO: Replace with actual data fetching
      setTimeout(() => {
        setDashboardStats({
          totalPortfolioValue: "125.47",
          totalTokensCreated: 3,
          totalTrades: 47,
          pnl24h: 12.34,
          activePositions: 8,
          watchlistCount: 15,
        });
        setIsLoading(false);
      }, 1500);
    } else {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen animated-bg floating-particles">
        <Container className="py-8 pt-24">
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
                    Access your personalized dashboard with portfolio tracking,
                    trading history, and advanced analytics.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                {[
                  { icon: BarChart3, text: "Portfolio Analytics" },
                  { icon: Target, text: "Token Creation" },
                  { icon: Activity, text: "Trading History" },
                  { icon: Star, text: "Watchlists" },
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
      <div className="min-h-screen animated-bg floating-particles pt-20">
        <Container className="py-8 pt-24 space-y-8">
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
                Track your portfolio, manage tokens, and analyze performance
              </p>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                {
                  icon: DollarSign,
                  label: "Portfolio",
                  value: `${dashboardStats.totalPortfolioValue} AVAX`,
                  change: dashboardStats.pnl24h,
                  color: "text-green-400",
                },
                {
                  icon: Crown,
                  label: "Created",
                  value: dashboardStats.totalTokensCreated.toString(),
                  color: "text-yellow-400",
                },
                {
                  icon: Activity,
                  label: "Trades",
                  value: dashboardStats.totalTrades.toString(),
                  color: "text-blue-400",
                },
                {
                  icon: Target,
                  label: "Positions",
                  value: dashboardStats.activePositions.toString(),
                  color: "text-purple-400",
                },
                {
                  icon: Star,
                  label: "Watchlist",
                  value: dashboardStats.watchlistCount.toString(),
                  color: "text-orange-400",
                },
                {
                  icon: Trophy,
                  label: "Rank",
                  value: "#42",
                  color: "text-emerald-400",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="unified-card border-primary/20 bg-primary/5 p-4 hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="font-bold text-foreground">{stat.value}</p>
                      {stat.change && (
                        <p
                          className={`text-xs ${
                            stat.change > 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {stat.change > 0 ? "+" : ""}
                          {stat.change.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
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
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="portfolio"
                  className="flex items-center gap-2"
                >
                  <PieChart className="h-4 w-4" />
                  <span className="hidden sm:inline">Portfolio</span>
                </TabsTrigger>
                <TabsTrigger value="tokens" className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  <span className="hidden sm:inline">My Tokens</span>
                </TabsTrigger>
                <TabsTrigger
                  value="trading"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Trading</span>
                </TabsTrigger>
                <TabsTrigger value="tools" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Tools</span>
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
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-0">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      {/* Main Portfolio Card */}
                      <div className="xl:col-span-2">
                        <UserPortfolioOverview />
                      </div>

                      {/* Side Panel */}
                      <div className="space-y-6">
                        <QuickActions />
                        <MarketInsights />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Portfolio Tab */}
                  <TabsContent value="portfolio" className="mt-0">
                    <TokenBalanceLookup />
                  </TabsContent>

                  {/* My Tokens Tab */}
                  <TabsContent value="tokens" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <UserTokensCreated />
                      <UserWatchlist />
                    </div>
                  </TabsContent>

                  {/* Trading Tab */}
                  <TabsContent value="trading" className="mt-0">
                    <UserTradingActivity />
                  </TabsContent>

                  {/* Tools Tab */}
                  <TabsContent value="tools" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Tool Cards */}
                      {[
                        {
                          title: "Token Creator",
                          description: "Launch your own token",
                          icon: Plus,
                          action: "Create Token",
                          href: "/dex/factory",
                          color:
                            "bg-green-500/20 text-green-400 border-green-400/30",
                        },
                        {
                          title: "Portfolio Analytics",
                          description: "Deep dive into your performance",
                          icon: BarChart3,
                          action: "View Analytics",
                          color:
                            "bg-blue-500/20 text-blue-400 border-blue-400/30",
                        },
                        {
                          title: "Market Scanner",
                          description: "Find trending opportunities",
                          icon: Target,
                          action: "Scan Market",
                          href: "/dex",
                          color:
                            "bg-purple-500/20 text-purple-400 border-purple-400/30",
                        },
                        {
                          title: "Trading Bot",
                          description: "Automate your trading strategy",
                          icon: Zap,
                          action: "Coming Soon",
                          disabled: true,
                          color:
                            "bg-orange-500/20 text-orange-400 border-orange-400/30",
                        },
                        {
                          title: "Risk Calculator",
                          description: "Assess portfolio risk",
                          icon: Timer,
                          action: "Calculate",
                          color: "bg-red-500/20 text-red-400 border-red-400/30",
                        },
                        {
                          title: "Yield Farming",
                          description: "Maximize your returns",
                          icon: Sparkles,
                          action: "Coming Soon",
                          disabled: true,
                          color:
                            "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
                        },
                      ].map((tool, index) => (
                        <motion.div
                          key={tool.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`unified-card border-primary/20 p-6 hover:bg-primary/5 transition-all duration-300 ${
                            tool.disabled
                              ? "opacity-60"
                              : "cursor-pointer hover:scale-105"
                          }`}
                          onClick={() =>
                            !tool.disabled &&
                            tool.href &&
                            (window.location.href = tool.href)
                          }
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <tool.icon className="h-8 w-8 text-primary" />
                              {tool.disabled && (
                                <Badge variant="outline" className="text-xs">
                                  Soon
                                </Badge>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground mb-2">
                                {tool.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                {tool.description}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`w-full ${tool.color}`}
                                disabled={tool.disabled}
                              >
                                {tool.action}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
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
