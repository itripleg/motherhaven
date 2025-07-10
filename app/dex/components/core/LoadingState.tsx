// / app/dex / components / core / LoadingState.tsx;
"use client";

import React from "react";
import { motion } from "framer-motion";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="min-h-screen animated-bg floating-particles">
      <div className="container mx-auto pt-20 p-4 space-y-8">
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur-sm border border-border/50">
            <div className="h-80 flex items-center justify-center">
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                />
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gradient bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {message}
                  </h2>
                  <p className="text-muted-foreground">
                    Fetching contract state and metadata...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
