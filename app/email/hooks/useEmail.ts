// app/email/hooks/useEmail.ts
"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import {
  SendEmailRequest,
  EmailMessage,
  EmailStats,
  EmailApiResponse,
  ComposeEmailFormData,
  EmailFormErrors,
  DEFAULT_FROM_NAME,
} from "../types";

// Admin address - only this address can send emails
const ADMIN_ADDRESS = "0xd85327505Ab915AB0C1aa5bC6768bF4002732258";

export function useEmail() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recentEmails, setRecentEmails] = useState<EmailMessage[]>([]);

  // Check if current user is admin
  const isAdmin = address && address === ADMIN_ADDRESS;

  // Validate single email address
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Validate multiple email addresses (comma-separated)
  const validateMultipleEmails = useCallback(
    (emailString: string): { valid: boolean; invalidEmails: string[] } => {
      if (!emailString.trim()) {
        return { valid: false, invalidEmails: [] };
      }

      const emails = emailString
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);
      const invalidEmails = emails.filter((email) => !validateEmail(email));

      return {
        valid: invalidEmails.length === 0 && emails.length > 0,
        invalidEmails,
      };
    },
    [validateEmail]
  );

  // Validate form data
  const validateForm = useCallback(
    (data: ComposeEmailFormData): EmailFormErrors => {
      const errors: EmailFormErrors = {};

      if (!data.to.trim()) {
        errors.to = "Recipient email(s) are required";
      } else {
        const { valid, invalidEmails } = validateMultipleEmails(data.to);
        if (!valid) {
          if (invalidEmails.length > 0) {
            errors.to = `Invalid email address(es): ${invalidEmails.join(
              ", "
            )}`;
          } else {
            errors.to = "At least one recipient email is required";
          }
        }
      }

      if (!data.subject.trim()) {
        errors.subject = "Subject is required";
      } else if (data.subject.trim().length > 200) {
        errors.subject = "Subject must be less than 200 characters";
      }

      if (!data.htmlContent.trim() && !data.textContent.trim()) {
        errors.content = "Email content is required";
      }

      if (!data.fromName.trim()) {
        errors.fromName = "From name is required";
      }

      if (!data.fromEmail.trim()) {
        errors.fromEmail = "From email is required";
      } else if (!validateEmail(data.fromEmail.trim())) {
        errors.fromEmail = "Please enter a valid from email address";
      } else if (!data.fromEmail.endsWith("@motherhaven.app")) {
        errors.fromEmail = "From email must be from motherhaven.app domain";
      }

      return errors;
    },
    [validateMultipleEmails, validateEmail]
  );

  // Send email function
  const sendEmail = useCallback(
    async (emailData: ComposeEmailFormData): Promise<boolean> => {
      if (!isConnected || !address) {
        toast({
          title: "Authentication Required",
          description: "Please connect your wallet to send emails",
          variant: "destructive",
        });
        return false;
      }

      if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "Only admin can send emails from this domain",
          variant: "destructive",
        });
        return false;
      }

      // Validate form
      const errors = validateForm(emailData);
      if (Object.keys(errors).length > 0) {
        const firstError = Object.values(errors)[0];
        toast({
          title: "Validation Error",
          description: firstError,
          variant: "destructive",
        });
        return false;
      }

      setIsLoading(true);

      try {
        const request: SendEmailRequest = {
          to: emailData.to.trim(), // Send as string, API will parse it
          subject: emailData.subject.trim(),
          htmlContent: emailData.htmlContent,
          textContent: emailData.textContent || undefined,
          fromName: emailData.fromName || DEFAULT_FROM_NAME,
          fromEmail: emailData.fromEmail.trim(),
        };

        const response = await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...request,
            senderAddress: address, // Include wallet address for logging
            apiSecret: process.env.NEXT_PUBLIC_EMAIL_API_SECRET || "", // Add API secret
          }),
        });

        const result: EmailApiResponse<EmailMessage> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to send email");
        }

        // Add to recent emails if we got the email data back
        if (result.data) {
          setRecentEmails((prev) => [result.data!, ...prev.slice(0, 9)]); // Keep last 10
        }

        // Get recipient count for success message
        const recipientCount = emailData.to
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email).length;
        const recipientText =
          recipientCount === 1 ? "recipient" : `${recipientCount} recipients`;

        toast({
          title: "Email Sent!",
          description: `Email sent successfully to ${recipientText}`,
        });

        return true;
      } catch (error) {
        console.error("Error sending email:", error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to send email. Please try again.";

        toast({
          title: "Send Failed",
          description: errorMessage,
          variant: "destructive",
        });

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected, toast, validateForm, isAdmin]
  );

  return {
    sendEmail,
    validateEmail,
    validateMultipleEmails,
    validateForm,
    isLoading,
    recentEmails,
    isConnected,
    isAdmin,
  };
}

// Hook for email stats
export function useEmailStats() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<EmailStats>({
    totalSent: 0,
    totalFailed: 0,
    sent24h: 0,
    failed24h: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check if current user is admin
  const isAdmin = address && address === ADMIN_ADDRESS;

  const fetchStats = useCallback(async () => {
    if (!isConnected || !address || !isAdmin) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/email/stats?address=${address}`);
      const result: EmailApiResponse<EmailStats> = await response.json();

      if (response.ok && result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error fetching email stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, isAdmin]);

  return {
    stats,
    fetchStats,
    isLoading,
    isConnected,
    isAdmin,
  };
}

// Hook for recent email history
export function useEmailHistory() {
  const { address, isConnected } = useAccount();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if current user is admin
  const isAdmin = address && address === ADMIN_ADDRESS;

  const fetchHistory = useCallback(
    async (limit: number = 20) => {
      if (!isConnected || !address || !isAdmin) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/email/history?address=${address}&limit=${limit}`
        );
        const result: EmailApiResponse<EmailMessage[]> = await response.json();

        if (response.ok && result.success && result.data) {
          setEmails(result.data);
        }
      } catch (error) {
        console.error("Error fetching email history:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected, isAdmin]
  );

  const refreshHistory = useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    emails,
    fetchHistory,
    refreshHistory,
    isLoading,
    isConnected,
    isAdmin,
  };
}
