// pet/components/ErrorState.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
  ZapOff,
  ExternalLink,
  Copy,
  CheckCircle,
  Home,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ErrorStateProps } from "../types";

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  const [copiedError, setCopiedError] = useState(false);

  // Determine error type and appropriate messaging
  const getErrorInfo = (errorMessage: string) => {
    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes("network") || lowerError.includes("fetch")) {
      return {
        type: "network",
        title: "🌐 Network Error",
        description: "Unable to connect to the blockchain network",
        icon: <WifiOff className="h-6 w-6 text-red-500" />,
        suggestions: [
          "Check your internet connection",
          "Try switching to a different RPC endpoint",
          "Wait a moment and try again",
        ],
      };
    }

    if (lowerError.includes("contract") || lowerError.includes("revert")) {
      return {
        type: "contract",
        title: "📜 Contract Error",
        description: "Smart contract interaction failed",
        icon: <ZapOff className="h-6 w-6 text-orange-500" />,
        suggestions: [
          "Ensure the contract is deployed correctly",
          "Check if you have the right network selected",
          "Try connecting your wallet again",
        ],
      };
    }

    if (lowerError.includes("wallet") || lowerError.includes("metamask")) {
      return {
        type: "wallet",
        title: "👛 Wallet Error",
        description: "Wallet connection or interaction failed",
        icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
        suggestions: [
          "Check if your wallet is connected",
          "Try refreshing the page",
          "Make sure you're on the correct network",
        ],
      };
    }

    if (lowerError.includes("timeout") || lowerError.includes("slow")) {
      return {
        type: "timeout",
        title: "⏰ Timeout Error",
        description: "Request took too long to complete",
        icon: <AlertTriangle className="h-6 w-6 text-blue-500" />,
        suggestions: [
          "The network might be congested",
          "Try again in a few moments",
          "Consider increasing gas fees if making a transaction",
        ],
      };
    }

    // Generic error
    return {
      type: "generic",
      title: "😵 Something Went Wrong",
      description: "An unexpected error occurred",
      icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
      suggestions: [
        "Try refreshing the page",
        "Check your wallet connection",
        "Contact support if the problem persists",
      ],
    };
  };

  const errorInfo = getErrorInfo(error);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
      toast({
        title: "Success!",
        description: "Successfully reconnected to your pet!",
      });
    } catch (err) {
      toast({
        title: "Retry Failed",
        description: "Still having trouble connecting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const copyErrorToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(error);
      setCopiedError(true);
      toast({
        title: "Error Copied",
        description: "Error message copied to clipboard",
      });
      setTimeout(() => setCopiedError(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy error to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                <div className="text-6xl">😵</div>
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {errorInfo.icon}
                </motion.div>
              </motion.div>
            </div>

            <CardTitle className="text-2xl font-bold text-foreground">
              {errorInfo.title}
            </CardTitle>

            <p className="text-muted-foreground mt-2">
              {errorInfo.description}
            </p>

            <Badge variant="outline" className="mt-3 mx-auto w-fit">
              Error Type: {errorInfo.type}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Details */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-mono text-sm break-all">
                {error}
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="min-w-[140px]"
                size="lg"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>

              <Button
                onClick={copyErrorToClipboard}
                variant="outline"
                size="lg"
                className="min-w-[140px]"
              >
                {copiedError ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Error
                  </>
                )}
              </Button>
            </div>

            <Separator />

            {/* Troubleshooting Steps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-500" />
                Troubleshooting Steps
              </h3>

              <div className="space-y-3">
                {errorInfo.suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1 text-sm">{suggestion}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Actions</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="justify-start"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>

                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                  className="justify-start"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    window.open("https://status.avalanche.com", "_blank")
                  }
                  className="justify-start"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Network Status
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    window.open("https://discord.gg/your-server", "_blank")
                  }
                  className="justify-start"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get Help
                </Button>
              </div>
            </div>

            {/* Pet Care Message */}
            <motion.div
              className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">🐕💭</div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-blue-700 dark:text-blue-300">
                    Don't worry, I'll wait for you!
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                    Your pet is safe on the blockchain. Once we fix this
                    connection issue, you'll be able to check on them again.
                    Technical difficulties happen, but the community will keep
                    caring for our digital companion!
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Connection Status */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Wifi className="h-4 w-4" />
              </motion.div>
              <span>Checking connection status...</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// Inline error component for smaller spaces
export const InlineErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 rounded-lg"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-red-700 dark:text-red-300 text-sm">
            Connection Error
          </div>
          <div className="text-red-600 dark:text-red-400 text-xs mt-1 break-words">
            {error}
          </div>
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            variant="outline"
            size="sm"
            className="mt-2 h-7 text-xs"
          >
            {isRetrying ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Retry
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Simple error badge for status indicators
export const ErrorBadge: React.FC<{ error: string }> = ({ error }) => {
  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="h-3 w-3" />
      Error
    </Badge>
  );
};
