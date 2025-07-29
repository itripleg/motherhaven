// app/bots/components/BotConfiguration.tsx
"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Settings } from "lucide-react";
import { BotConfig } from "./detailHelpers";

interface BotConfigurationProps {
  showConfig: boolean;
  config: BotConfig;
}

const BotConfiguration: React.FC<BotConfigurationProps> = ({
  showConfig,
  config,
}) => (
  <AnimatePresence>
    {showConfig && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-8"
      >
        <Card className="unified-card border-primary/30 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Bot Configuration
              <Badge
                variant="outline"
                className="text-primary border-primary/50"
              >
                Live Config
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Trading Parameters */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Trading Parameters
                </h3>
                <div>
                  <label className="text-muted-foreground text-sm">
                    Buy Bias
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={(config.buyBias ?? 0.5) * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-foreground text-sm">
                      {(config.buyBias ?? 0.5) * 100}%
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">
                    Risk Tolerance
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={(config.riskTolerance ?? 0.5) * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-foreground text-sm">
                      {(config.riskTolerance ?? 0.5) * 100}%
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">
                    Trading Range
                  </label>
                  <div className="bg-secondary/50 border border-border text-foreground text-sm p-2 rounded mt-1">
                    {`${config.minTradeAmount}-${config.maxTradeAmount} AVAX`}
                  </div>
                </div>
              </div>

              {/* Timing & Behavior */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Timing & Behavior
                </h3>
                <div>
                  <label className="text-muted-foreground text-sm">
                    Interval Range
                  </label>
                  <div className="bg-secondary/50 border border-border text-foreground text-sm p-2 rounded mt-1">
                    {`${config.minInterval}-${config.maxInterval} seconds`}
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">
                    Create Token Chance
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress
                      value={(config.createTokenChance ?? 0.01) * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-foreground text-sm">
                      {((config.createTokenChance ?? 0.01) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Personality */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Personality
                </h3>
                {config.buyPhrases && (
                  <div>
                    <label className="text-muted-foreground text-sm">
                      Buy Phrases
                    </label>
                    <div className="text-sm text-muted-foreground bg-secondary/30 border border-border/50 p-2 rounded max-h-20 overflow-y-auto mt-1">
                      {config.buyPhrases.slice(0, 3).map((phrase, i) => (
                        <div key={i} className="italic">
                          &ldquo;{phrase}&rdquo;
                        </div>
                      ))}
                      {config.buyPhrases.length > 3 && (
                        <div className="text-xs opacity-70 mt-1">
                          +{config.buyPhrases.length - 3} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {config.sellPhrases && (
                  <div>
                    <label className="text-muted-foreground text-sm">
                      Sell Phrases
                    </label>
                    <div className="text-sm text-muted-foreground bg-secondary/30 border border-border/50 p-2 rounded max-h-20 overflow-y-auto mt-1">
                      {config.sellPhrases.slice(0, 3).map((phrase, i) => (
                        <div key={i} className="italic">
                          &ldquo;{phrase}&rdquo;
                        </div>
                      ))}
                      {config.sellPhrases.length > 3 && (
                        <div className="text-xs opacity-70 mt-1">
                          +{config.sellPhrases.length - 3} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )}
  </AnimatePresence>
);

export default BotConfiguration;
