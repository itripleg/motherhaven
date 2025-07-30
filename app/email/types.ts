// app/email/types.ts

export interface SendEmailRequest {
  to: string | string[]; // Multiple email addresses (comma-separated string or array)
  subject: string;
  htmlContent?: string;
  textContent?: string;
  fromName?: string;
  fromEmail?: string; // Dynamic from email address
}

export interface EmailMessage {
  id: string;
  to: string | string[]; // Store multiple recipients
  subject: string;
  htmlContent?: string;
  textContent?: string;
  status: "sending" | "sent" | "failed";
  sentAt?: string;
  failureReason?: string;
  createdAt: string;
  fromName?: string;
  fromEmail?: string; // Store the from email used
}

// Inbox message (for received emails)
export interface InboxMessage {
  id: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  isRead: boolean;
  receivedAt: string;
  messageId?: string; // Email Message-ID header
}

export interface EmailStats {
  totalSent: number;
  totalFailed: number;
  sent24h: number;
  failed24h: number;
}

// Inbox filters
export interface InboxFilters {
  isRead?: boolean;
  searchQuery?: string;
}

// Form validation types
export interface EmailFormErrors {
  to?: string;
  subject?: string;
  content?: string;
  fromName?: string;
  fromEmail?: string;
  general?: string;
}

export interface ComposeEmailFormData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  fromName: string;
  fromEmail: string; // Dynamic from email
}

// API Response types
export interface EmailApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Constants
export const EMAIL_STATUSES = [
  { value: "sending", label: "Sending", color: "text-yellow-400" },
  { value: "sent", label: "Sent", color: "text-green-400" },
  { value: "failed", label: "Failed", color: "text-red-400" },
] as const;

export const DEFAULT_FROM_EMAIL = "noreply@motherhaven.app";
export const DEFAULT_FROM_NAME = "Mother Haven";
export const DOMAIN = "motherhaven.app";
