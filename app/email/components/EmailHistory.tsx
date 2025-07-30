// app/email/components/EmailHistory.tsx
"use client";

import { useEffect, useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  RefreshCw,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  TrendingUp,
  Activity,
  AlertTriangle,
  Crown,
  Calendar,
  User,
  Eye,
  ExternalLink,
} from "lucide-react";
import { useEmailStats, useEmailHistory } from "../hooks/useEmail";
import { EmailMessage, EMAIL_STATUSES } from "../types";

export function EmailHistory() {
  const { isConnected } = useAccount();
  const {
    stats,
    fetchStats,
    isLoading: statsLoading,
    isAdmin: statsAdmin,
  } = useEmailStats();
  const {
    emails,
    fetchHistory,
    refreshHistory,
    isLoading: historyLoading,
    isAdmin: historyAdmin,
  } = useEmailHistory();

  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const isAdmin = statsAdmin && historyAdmin;
  const isLoading = statsLoading || historyLoading;

  // Fetch data on mount
  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchHistory();
    }
  }, [isAdmin, fetchStats, fetchHistory]);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 7) {
      return date.toLocaleDateString();
    } else if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? `${diffMinutes}m ago` : "Just now";
    }
  };

  // Get status info
  const getStatusInfo = (status: EmailMessage["status"]) => {
    const statusInfo = EMAIL_STATUSES.find((s) => s.value === status);
    return (
      statusInfo || { value: status, label: status, color: "text-gray-400" }
    );
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Extract plain text from HTML
  const extractTextFromHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  // Handle refresh
  const handleRefresh = () => {
    if (isAdmin) {
      fetchStats();
      refreshHistory();
    }
  };

  // Access control
  if (!isConnected) {
    return (
      <Card className="unified-card border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground opacity-50" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Connect Wallet
            </h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to view email statistics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="unified-card border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground opacity-50" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Admin Access Required
            </h3>
            <p className="text-sm text-muted-foreground">
              Only admin can view email history and statistics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card className="unified-card border-primary/20">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                Email Statistics
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin Only
                </Badge>
              </CardTitle>
              <CardDescription>
                Overview of your email sending activity
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className="hover:bg-primary/20"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="unified-card border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Send className="h-4 w-4 text-green-400" />
                <span className="text-xs text-muted-foreground">
                  Total Sent
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalSent}
              </p>
              <p className="text-xs text-green-400">All time</p>
            </div>

            <div className="unified-card border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span className="text-xs text-muted-foreground">Failed</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalFailed}
              </p>
              <p className="text-xs text-red-400">All time</p>
            </div>

            <div className="unified-card border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats.sent24h}
              </p>
              <p className="text-xs text-blue-400">Last 24h</p>
            </div>

            <div className="unified-card border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">
                  Success Rate
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats.totalSent > 0
                  ? Math.round(
                      ((stats.totalSent - stats.totalFailed) /
                        stats.totalSent) *
                        100
                    )
                  : 100}
                %
              </p>
              <p className="text-xs text-purple-400">Delivery rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email History */}
      <Card className="unified-card border-primary/20">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              Recent Emails
            </CardTitle>
            {emails.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {emails.length} emails
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">
                No Emails Sent
              </h3>
              <p className="text-sm text-muted-foreground">
                Your sent emails will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {emails.map((email, index) => {
                  const statusInfo = getStatusInfo(email.status);
                  const isExpanded = expandedEmail === email.id;

                  return (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="unified-card border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          {/* Email Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-foreground truncate">
                                {email.subject}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`${statusInfo.color} border-current`}
                              >
                                {statusInfo.value === "sent" && (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                {statusInfo.value === "failed" && (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {statusInfo.value === "sending" && (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                {statusInfo.label}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {email.to}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatTimestamp(email.createdAt)}
                              </span>
                            </div>

                            {/* Preview content */}
                            {email.htmlContent && (
                              <p className="text-sm text-muted-foreground">
                                {truncateText(
                                  extractTextFromHtml(email.htmlContent),
                                  100
                                )}
                              </p>
                            )}

                            {/* Failure reason */}
                            {email.status === "failed" &&
                              email.failureReason && (
                                <Alert variant="destructive" className="mt-3">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertDescription className="text-xs">
                                    {email.failureReason}
                                  </AlertDescription>
                                </Alert>
                              )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedEmail(isExpanded ? null : email.id)
                              }
                              className="h-8 px-3 text-xs hover:bg-primary/20"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {isExpanded ? "Hide" : "View"}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-4 pt-4 border-t border-border/50 overflow-hidden"
                            >
                              <div className="space-y-4">
                                {/* Email Details */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground mb-1">
                                      Sent At:
                                    </p>
                                    <p className="text-foreground">
                                      {email.sentAt
                                        ? new Date(
                                            email.sentAt
                                          ).toLocaleString()
                                        : "Not sent yet"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground mb-1">
                                      Status:
                                    </p>
                                    <p className={statusInfo.color}>
                                      {statusInfo.label}
                                    </p>
                                  </div>
                                </div>

                                {/* Email Content */}
                                {email.htmlContent && (
                                  <div>
                                    <p className="text-muted-foreground mb-2 text-sm">
                                      Content:
                                    </p>
                                    <div className="p-4 bg-background/50 rounded-lg border max-h-60 overflow-y-auto">
                                      <div
                                        className="prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{
                                          __html: email.htmlContent,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Text Content */}
                                {email.textContent && (
                                  <div>
                                    <p className="text-muted-foreground mb-2 text-sm">
                                      Plain Text:
                                    </p>
                                    <div className="p-4 bg-background/50 rounded-lg border max-h-40 overflow-y-auto">
                                      <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                                        {email.textContent}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
