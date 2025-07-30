// app/email/components/Inbox.tsx
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Inbox as InboxIcon,
  Mail,
  MailOpen,
  Search,
  RefreshCw,
  Calendar,
  User,
  AlertTriangle,
  Crown,
  Reply,
} from "lucide-react";
import { useInbox } from "../hooks/useInbox";
import { InboxMessage } from "../types";

export function Inbox() {
  const { isConnected } = useAccount();
  const { messages, isLoading, isAdmin, fetchMessages, markAsRead } =
    useInbox();

  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRead, setFilterRead] = useState<string>("all");

  // Fetch data on mount
  useEffect(() => {
    if (isAdmin) {
      fetchMessages();
    }
  }, [isAdmin, fetchMessages]);

  // Filter messages based on current filters
  const filteredMessages = messages.filter((message) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        message.subject.toLowerCase().includes(query) ||
        message.from.toLowerCase().includes(query) ||
        (message.fromName && message.fromName.toLowerCase().includes(query)) ||
        (message.textContent &&
          message.textContent.toLowerCase().includes(query));

      if (!matchesSearch) return false;
    }

    // Read status filter
    if (filterRead === "read" && !message.isRead) return false;
    if (filterRead === "unread" && message.isRead) return false;

    return true;
  });

  // Count unread messages
  const unreadCount = messages.filter((msg) => !msg.isRead).length;

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

  // Handle message click
  const handleMessageClick = async (message: InboxMessage) => {
    setSelectedMessage(message);

    // Mark as read if not already read
    if (!message.isRead) {
      await markAsRead(message.id, true);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    if (isAdmin) {
      fetchMessages();
    }
  };

  // Access control
  if (!isConnected) {
    return (
      <Card className="unified-card border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <InboxIcon className="h-12 w-12 text-muted-foreground opacity-50" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Connect Wallet
            </h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to access inbox features
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
              Only admin can access the inbox
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Simple Stats */}
      <Card className="unified-card border-primary/20">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <InboxIcon className="h-5 w-5 text-primary" />
                Inbox
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin Only
                </Badge>
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} unread</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {messages.length} total messages
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
      </Card>

      {/* Main Inbox Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-2">
          <Card className="unified-card border-primary/20">
            <CardHeader className="border-b border-border/50">
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterRead} onValueChange={setFilterRead}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-sm text-muted-foreground">
                  {filteredMessages.length} of {messages.length} messages
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                  />
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-8">
                  <InboxIcon className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">
                    No Messages
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {messages.length === 0
                      ? "Your inbox is empty"
                      : "No messages match your filters"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  <AnimatePresence>
                    {filteredMessages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 hover:bg-primary/5 cursor-pointer transition-colors ${
                          selectedMessage?.id === message.id
                            ? "bg-primary/10"
                            : ""
                        } ${
                          !message.isRead
                            ? "bg-muted/20 border-l-4 border-l-primary"
                            : ""
                        }`}
                        onClick={() => handleMessageClick(message)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {message.isRead ? (
                              <MailOpen className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Mail className="h-4 w-4 text-primary" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`font-medium ${
                                  !message.isRead
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {message.fromName || message.from}
                              </span>
                              {!message.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                              <span className="text-xs text-muted-foreground ml-auto">
                                {formatTimestamp(message.receivedAt)}
                              </span>
                            </div>

                            <h3
                              className={`font-medium mb-1 truncate ${
                                !message.isRead
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {message.subject || "(No Subject)"}
                            </h3>

                            {message.textContent && (
                              <p className="text-sm text-muted-foreground truncate">
                                {message.textContent.substring(0, 120)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Details */}
        <div className="lg:col-span-1">
          <Card className="unified-card border-primary/20 sticky top-6">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg">
                {selectedMessage ? "Message Details" : "Select a Message"}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              {selectedMessage ? (
                <div className="space-y-4">
                  {/* Message Header */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">From</p>
                      <p className="font-medium">
                        {selectedMessage.fromName &&
                        selectedMessage.fromName !== selectedMessage.from
                          ? `${selectedMessage.fromName} <${selectedMessage.from}>`
                          : selectedMessage.from}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Subject</p>
                      <p className="font-medium">
                        {selectedMessage.subject || "(No Subject)"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Received</p>
                      <p className="text-sm">
                        {new Date(selectedMessage.receivedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Message Content */}
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Content</p>
                    <div className="max-h-96 overflow-y-auto p-4 bg-muted/30 rounded-lg border">
                      {selectedMessage.htmlContent ? (
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: selectedMessage.htmlContent,
                          }}
                        />
                      ) : selectedMessage.textContent ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                          {selectedMessage.textContent}
                        </pre>
                      ) : (
                        <p className="text-muted-foreground italic">
                          No content available
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Simple Actions */}
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="flex items-center gap-2">
                      <Reply className="h-3 w-3" />
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        markAsRead(selectedMessage.id, !selectedMessage.isRead)
                      }
                    >
                      {selectedMessage.isRead ? "Mark Unread" : "Mark Read"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Select a message to view its contents
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
