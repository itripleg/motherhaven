// app/email/page.tsx
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Send,
  BarChart3,
  History,
  Crown,
  AlertTriangle,
  Wallet,
  Settings,
  Info,
  Inbox as InboxIcon,
} from "lucide-react";
import { ComposeEmail } from "./components/ComposeEmail";
import { EmailHistory } from "./components/EmailHistory";
import { Inbox } from "./components/Inbox";

// Admin address - must match your other components
const ADMIN_ADDRESS = "0xd85327505Ab915AB0C1aa5bC6768bF4002732258";

export default function EmailPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"compose" | "history" | "inbox">(
    "compose"
  );

  // Check if current user is admin
  const isAdmin = address && address === ADMIN_ADDRESS;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Email Management
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Send emails from your motherhaven.app domain
                  </p>
                </div>
              </div>

              {isAdmin && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin Access
                </Badge>
              )}
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-3">
              {isConnected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm text-green-400">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                  <Wallet className="h-3 w-3 text-red-400" />
                  <span className="text-sm text-red-400">Not Connected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!isConnected ? (
            // Not Connected State
            <motion.div
              key="not-connected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="unified-card border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                  <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                    <Wallet className="h-12 w-12 text-primary" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">
                      Connect Your Wallet
                    </h2>
                    <p className="text-muted-foreground max-w-md">
                      Connect your wallet to access email management features.
                      Only the admin wallet can send emails from this domain.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Info className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-blue-400">
                      Use the wallet connection button in the navigation
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : !isAdmin ? (
            // Not Admin State
            <motion.div
              key="not-admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="unified-card border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                  <div className="p-4 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                    <AlertTriangle className="h-12 w-12 text-yellow-500" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">
                      Admin Access Required
                    </h2>
                    <p className="text-muted-foreground max-w-md">
                      Only the admin wallet can send emails from the
                      motherhaven.app domain. Your current wallet does not have
                      admin privileges.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border">
                      <span className="text-xs text-muted-foreground">
                        Your Address:
                      </span>
                      <code className="text-xs font-mono text-foreground bg-background px-2 py-1 rounded">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </code>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="text-xs text-primary">
                        Admin access is restricted to authorized addresses
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            // Admin Dashboard
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Welcome Banner */}
              <Card className="unified-card border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/20 border border-primary/30">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground mb-1">
                        Welcome, Admin
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        You have full access to email management features. Send
                        emails and view delivery statistics.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as any)}
                className="space-y-6"
              >
                <div className="flex items-center justify-center">
                  <TabsList className="grid w-full max-w-2xl grid-cols-3">
                    <TabsTrigger
                      value="compose"
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Compose
                    </TabsTrigger>
                    <TabsTrigger
                      value="inbox"
                      className="flex items-center gap-2"
                    >
                      <InboxIcon className="h-4 w-4" />
                      Inbox
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      History & Stats
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="compose" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <ComposeEmail />
                  </motion.div>
                </TabsContent>

                <TabsContent value="inbox" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Inbox />
                  </motion.div>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <EmailHistory />
                  </motion.div>
                </TabsContent>
              </Tabs>

              {/* Footer Info */}
              <Card className="unified-card border-primary/20 bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Settings className="h-4 w-4" />
                      <span>Powered by SendGrid & Firebase</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Domain: motherhaven.app</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
