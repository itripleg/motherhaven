// app/dashboard/components/QuickActions.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  TrendingUp,
  Search,
  Star,
  Zap,
  Target,
  ArrowUpRight,
  Sparkles,
  Crown,
  RefreshCw,
  BarChart3,
  Wallet,
  Settings,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: () => void;
  badge?: string;
  disabled?: boolean;
  external?: boolean;
}

export function QuickActions() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAction = async (actionId: string, action: () => void) => {
    setIsLoading(actionId);
    try {
      await action();
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsLoading(null), 500);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: "create-token",
      title: "Create Token",
      description: "Launch your own token",
      icon: Plus,
      color:
        "bg-green-500/20 text-green-400 border-green-400/30 hover:bg-green-500/30",
      action: () => router.push("/factory"),
      badge: "Popular",
    },
    {
      id: "explore-tokens",
      title: "Explore Tokens",
      description: "Discover trending tokens",
      icon: Search,
      color:
        "bg-blue-500/20 text-blue-400 border-blue-400/30 hover:bg-blue-500/30",
      action: () => router.push("/dex"),
    },
    {
      id: "trade-bot",
      title: "Trading Bot",
      description: "Automate your trades",
      icon: Zap,
      color:
        "bg-purple-500/20 text-purple-400 border-purple-400/30 hover:bg-purple-500/30",
      action: () => {
        toast({
          title: "Coming Soon!",
          description: "Trading bot features are in development.",
        });
      },
      badge: "Soon",
      disabled: true,
    },
    {
      id: "portfolio-analysis",
      title: "Deep Analysis",
      description: "Advanced portfolio insights",
      icon: BarChart3,
      color:
        "bg-orange-500/20 text-orange-400 border-orange-400/30 hover:bg-orange-500/30",
      action: () => {
        toast({
          title: "Analysis Ready",
          description:
            "Portfolio analysis tools available in the Portfolio tab.",
        });
      },
    },
    {
      id: "yield-farming",
      title: "Yield Farming",
      description: "Earn rewards on your tokens",
      icon: Target,
      color:
        "bg-yellow-500/20 text-yellow-400 border-yellow-400/30 hover:bg-yellow-500/30",
      action: () => {
        toast({
          title: "Coming Soon!",
          description: "Yield farming features are in development.",
        });
      },
      badge: "New",
      disabled: true,
    },
    {
      id: "manage-watchlist",
      title: "Manage Watchlist",
      description: "Track your favorite tokens",
      icon: Star,
      color:
        "bg-pink-500/20 text-pink-400 border-pink-400/30 hover:bg-pink-500/30",
      action: () => {
        toast({
          title: "Watchlist",
          description: "Check the 'My Tokens' tab to manage your watchlist.",
        });
      },
    },
  ];

  const popularActions = quickActions.slice(0, 3);
  const otherActions = quickActions.slice(3);

  return (
    <Card className="unified-card border-primary/20">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Access key features and tools instantly
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Popular Actions - Larger Buttons */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Popular
          </h4>
          <div className="space-y-3">
            {popularActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Button
                  variant="outline"
                  className={`w-full h-auto p-4 justify-start ${action.color} ${
                    action.disabled
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:scale-105"
                  } transition-all duration-300 group`}
                  onClick={() =>
                    !action.disabled && handleAction(action.id, action.action)
                  }
                  disabled={action.disabled || isLoading === action.id}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="relative">
                      {isLoading === action.id ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <action.icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {action.title}
                        </p>
                        {action.badge && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-0.5 bg-primary/20 text-primary border-primary/30"
                          >
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Other Actions - Compact Grid */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">
            More Tools
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {otherActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 3) * 0.1, duration: 0.3 }}
              >
                <Button
                  variant="ghost"
                  className={`w-full h-auto p-3 justify-start ${action.color} ${
                    action.disabled
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:scale-105"
                  } transition-all duration-200 group`}
                  onClick={() =>
                    !action.disabled && handleAction(action.id, action.action)
                  }
                  disabled={action.disabled || isLoading === action.id}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="relative">
                      {isLoading === action.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <action.icon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground text-sm">
                          {action.title}
                        </p>
                        {action.badge && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary border-primary/30"
                          >
                            {action.badge}
                          </Badge>
                        )}
                        {action.external && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="pt-4 border-t border-border/50">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">6</p>
              <p className="text-xs text-muted-foreground">Available Tools</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-400">2</p>
              <p className="text-xs text-muted-foreground">Coming Soon</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
