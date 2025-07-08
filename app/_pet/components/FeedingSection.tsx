// pet/components/FeedingSection.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Utensils,
  Wallet,
  ExternalLink,
  Info,
  Zap,
  Heart,
  Code,
  ArrowRight,
  Copy,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FeedingSectionProps } from "../types";

export const FeedingSection: React.FC<FeedingSectionProps> = ({
  petName,
  petIsAlive,
  supportedTokens,
  onFeed,
  isConnected,
  isWritePending,
  isSimplified = false,
  contractAddress,
}) => {
  const { toast } = useToast();
  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyContractAddress = async () => {
    if (!contractAddress) return;

    try {
      await navigator.clipboard.writeText(contractAddress);
      setCopiedAddress(true);
      toast({
        title: "Address Copied!",
        description: "Contract address copied to clipboard",
      });
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleComingSoonFeed = () => {
    toast({
      title: "Coming Soon!",
      description:
        "Token feeding will be available when burn contracts are deployed.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
    >
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-green-500" />
            Feed {petName}
            {isSimplified && (
              <Badge variant="outline" className="ml-2">
                Simplified
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Pet Status Alert */}
          {!petIsAlive ? (
            <Alert variant="destructive">
              <Heart className="h-4 w-4" />
              <AlertDescription>
                {petName} is currently dead and cannot be fed. Please revive the
                pet first!
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                {petName} is alive and ready to eat! Feeding increases health by
                10 points.
              </AlertDescription>
            </Alert>
          )}

          {/* Feeding Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              How to Feed
            </h3>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="contract">Contract</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Get Supported Tokens</div>
                      <div className="text-sm text-muted-foreground">
                        Acquire tokens that support the pet feeding mechanism
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Burn Tokens</div>
                      <div className="text-sm text-muted-foreground">
                        Use the token&apos;s burn function to destroy tokens and
                        feed the pet
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Pet Gets Fed</div>
                      <div className="text-sm text-muted-foreground">
                        The burn automatically triggers feeding, adding +10
                        health to {petName}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-pink-500 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">
                        Community Pet Concept
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        This is a shared digital companion that lives on the
                        blockchain. Every community member can contribute to its
                        wellbeing by burning tokens, creating a collective
                        caring experience.
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="technical" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Feeding Mechanics</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium text-green-600 dark:text-green-400">
                        Health Gain
                      </div>
                      <div>+10 points per feeding</div>
                    </div>

                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium text-red-600 dark:text-red-400">
                        Health Decay
                      </div>
                      <div>-1 point per hour</div>
                    </div>

                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium text-blue-600 dark:text-blue-400">
                        Max Health
                      </div>
                      <div>100 points</div>
                    </div>

                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium text-orange-600 dark:text-orange-400">
                        Death Threshold
                      </div>
                      <div>0 points</div>
                    </div>
                  </div>

                  <Separator />

                  <h4 className="font-medium">Token Integration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Burn Function:</span>
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        burnAndFeed(uint256 amount)
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span>Notification:</span>
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        notifyBurn(address, uint256)
                      </code>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contract" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Contract Information</h4>

                  {contractAddress && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">
                            Pet Contract Address
                          </div>
                          <div className="text-xs font-mono text-muted-foreground break-all">
                            {contractAddress}
                          </div>
                        </div>
                        <Button
                          onClick={copyContractAddress}
                          variant="outline"
                          size="sm"
                        >
                          {copiedAddress ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Key Functions:</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          getPetStatus()
                        </code>
                        <span className="text-muted-foreground">
                          Get current pet state
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          getCurrentHealth()
                        </code>
                        <span className="text-muted-foreground">
                          Real-time health with decay
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          revivePet()
                        </code>
                        <span className="text-muted-foreground">
                          Bring pet back to life
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Feeding Action */}
          <div className="space-y-4">
            <Separator />

            {isSimplified ? (
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Ready to Feed?</h3>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-3">
                    <Code className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-left">
                      <div className="font-medium text-yellow-800 dark:text-yellow-200">
                        Development Phase
                      </div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Token contracts with burn-to-feed functionality are
                        currently being developed. Once deployed, you&apos;ll be
                        able to feed {petName} directly by burning supported
                        tokens.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleComingSoonFeed}
                    disabled={!petIsAlive || !isConnected}
                    className="min-w-[200px]"
                  >
                    <Utensils className="h-4 w-4 mr-2" />
                    Feed {petName}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  {!isConnected && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Connect wallet to interact
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground">
                  Supported tokens will appear here when available.
                </p>
              </div>
            )}
          </div>

          {/* Help Links */}
          <div className="pt-4 border-t border-border/50">
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Button variant="ghost" size="sm" className="h-8">
                <ExternalLink className="h-3 w-3 mr-1" />
                Documentation
              </Button>
              <Button variant="ghost" size="sm" className="h-8">
                <ExternalLink className="h-3 w-3 mr-1" />
                GitHub
              </Button>
              <Button variant="ghost" size="sm" className="h-8">
                <ExternalLink className="h-3 w-3 mr-1" />
                Discord
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
