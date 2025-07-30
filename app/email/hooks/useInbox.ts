// app/email/hooks/useInbox.ts
"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { InboxMessage, InboxFilters, EmailApiResponse } from "../types";

// Admin address - only this address can access inbox
const ADMIN_ADDRESS = "0xd85327505Ab915AB0C1aa5bC6768bF4002732258";

export function useInbox() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if current user is admin
  const isAdmin = address && address === ADMIN_ADDRESS;

  // Fetch inbox messages
  const fetchMessages = useCallback(
    async (limit: number = 50, filters?: InboxFilters) => {
      if (!isConnected || !address || !isAdmin) return;

      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          address,
          limit: limit.toString(),
          apiSecret: process.env.NEXT_PUBLIC_EMAIL_API_SECRET || "",
        });

        // Add filters to query params
        if (filters) {
          if (filters.isRead !== undefined) {
            queryParams.append("isRead", filters.isRead.toString());
          }
          if (filters.searchQuery) {
            queryParams.append("search", filters.searchQuery);
          }
        }

        const response = await fetch(`/api/email/inbox?${queryParams}`);
        const result: EmailApiResponse<InboxMessage[]> = await response.json();

        if (response.ok && result.success && result.data) {
          setMessages(result.data);
        } else {
          throw new Error(result.error || "Failed to fetch messages");
        }
      } catch (error) {
        console.error("Error fetching inbox messages:", error);
        toast({
          title: "Error",
          description: "Failed to fetch inbox messages",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected, isAdmin, toast]
  );

  // Mark message as read/unread
  const markAsRead = useCallback(
    async (messageId: string, isRead: boolean): Promise<boolean> => {
      if (!isConnected || !address || !isAdmin) return false;

      try {
        const response = await fetch(`/api/email/inbox/read`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address,
            messageId,
            isRead,
            apiSecret: process.env.NEXT_PUBLIC_EMAIL_API_SECRET || "",
          }),
        });

        const result: EmailApiResponse = await response.json();

        if (response.ok && result.success) {
          // Update local state
          setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? { ...msg, isRead } : msg))
          );

          return true;
        } else {
          throw new Error(result.error || "Failed to update message");
        }
      } catch (error) {
        console.error("Error marking message as read:", error);
        toast({
          title: "Error",
          description: "Failed to update message status",
          variant: "destructive",
        });
        return false;
      }
    },
    [address, isConnected, isAdmin, toast]
  );

  // Refresh inbox
  const refreshInbox = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    isLoading,
    isConnected,
    isAdmin,
    fetchMessages,
    markAsRead,
    refreshInbox,
  };
}
