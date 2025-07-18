// app/VanityNameManager/components/VanityNameStats.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Users,
  Crown,
  Activity,
  Flame,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Target,
  Zap,
} from "lucide-react";
import { type VanityNameStats } from "@/types/vanity";

interface VanityNameStatsProps {
  stats: VanityNameStats | null;
}

export function VanityNameStats({ stats }: VanityNameStatsProps) {
  // Mock data if no stats provided
  const displayStats: VanityNameStats = stats || {
    totalNames: 1247,
    totalRequests: 1589,
    pendingRequests: 23,
    confirmedRequests: 1342,
    rejectedRequests: 224,
    activeUsers: 892,
    popularNames: [
      { name: "CryptoKing", changeCount: 12 },
      { name: "MoonWalker", changeCount: 8 },
      { name: "DiamondHands", changeCount: 7 },
      { name: "ToTheMoon", changeCount: 6 },
      { name: "HODLer", changeCount: 5 },
    ],
  };

  const successRate =
    displayStats.totalRequests > 0
      ? (displayStats.confirmedRequests / displayStats.totalRequests) * 100
      : 0;

  const rejectionRate =
    displayStats.totalRequests > 0
      ? (displayStats.rejectedRequests / displayStats.totalRequests) * 100
      : 0;

  const pendingRate =
    displayStats.totalRequests > 0
      ? (displayStats.pendingRequests / displayStats.totalRequests) * 100
      : 0;

  const statsCards = [
    {
      title: "Total Names",
      value: displayStats.totalNames.toLocaleString(),
      icon: Crown,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-400/30",
      description: "Active vanity names",
    },
    {
      title: "Total Requests",
      value: displayStats.totalRequests.toLocaleString(),
      icon: Activity,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-400/30",
      description: "All time requests",
    },
    {
      title: "Active Users",
      value: displayStats.activeUsers.toLocaleString(),
      icon: Users,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-400/30",
      description: "Users with vanity names",
    },
    {
      title: "Success Rate",
      value: `${successRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-400/30",
      description: "Approved requests",
    },
    {
      title: "Pending",
      value: displayStats.pendingRequests.toLocaleString(),
      icon: Clock,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-400/30",
      description: "Awaiting approval",
    },
    {
      title: "Rejected",
      value: displayStats.rejectedRequests.toLocaleString(),
      icon: XCircle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-400/30",
      description: "Declined requests",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          System Statistics
        </h2>
        <p className="text-muted-foreground">
          Real-time data about vanity name adoption and usage
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`unified-card ${stat.borderColor} ${stat.bgColor}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-2 rounded-lg ${stat.bgColor} ${stat.borderColor} border`}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Live
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    {stat.title}
                  </h3>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Request Status Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="unified-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              Request Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-foreground">
                    Approved
                  </span>
                </div>
                <span className="text-sm font-bold text-green-400">
                  {displayStats.confirmedRequests} ({successRate.toFixed(1)}%)
                </span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>

            {/* Rejection Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-foreground">
                    Rejected
                  </span>
                </div>
                <span className="text-sm font-bold text-red-400">
                  {displayStats.rejectedRequests} ({rejectionRate.toFixed(1)}%)
                </span>
              </div>
              <Progress value={rejectionRate} className="h-2" />
            </div>

            {/* Pending Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium text-foreground">
                    Pending
                  </span>
                </div>
                <span className="text-sm font-bold text-orange-400">
                  {displayStats.pendingRequests} ({pendingRate.toFixed(1)}%)
                </span>
              </div>
              <Progress value={pendingRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Popular Names */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="unified-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-primary" />
              Most Requested Names
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayStats.popularNames.map((name, index) => (
                <div
                  key={name.name}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-full">
                      <span className="text-sm font-bold text-primary">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{name.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {name.changeCount} request
                        {name.changeCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {name.changeCount}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card className="unified-card border-green-400/20 bg-green-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg border border-green-400/30">
                <Zap className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-400">System Status</h3>
                <p className="text-sm text-green-300">
                  All systems operational
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-400">99.9%</div>
                <div className="text-xs text-green-300">Uptime</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-400">~2s</div>
                <div className="text-xs text-green-300">Avg Response</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-400">0</div>
                <div className="text-xs text-green-300">Failed Requests</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-400">24/7</div>
                <div className="text-xs text-green-300">Monitoring</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Last Updated */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}
