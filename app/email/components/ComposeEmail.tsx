// app/email/components/ComposeEmail.tsx
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Send,
  User,
  AtSign,
  FileText,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Crown,
} from "lucide-react";
import { useEmail } from "../hooks/useEmail";
import {
  ComposeEmailFormData,
  DEFAULT_FROM_NAME,
  DEFAULT_FROM_EMAIL,
} from "../types";

export function ComposeEmail() {
  const { isConnected } = useAccount();
  const { sendEmail, validateEmail, isLoading, isAdmin } = useEmail();

  const [formData, setFormData] = useState<ComposeEmailFormData>({
    to: "",
    subject: "",
    htmlContent: "",
    textContent: "",
    fromName: DEFAULT_FROM_NAME,
    fromEmail: DEFAULT_FROM_EMAIL,
  });

  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.to.trim()) {
      newErrors.to = "Recipient email(s) are required";
    } else {
      // Split by comma and validate each email
      const emails = formData.to
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);
      const invalidEmails = emails.filter((email) => !validateEmail(email));

      if (invalidEmails.length > 0) {
        newErrors.to = `Invalid email address(es): ${invalidEmails.join(", ")}`;
      }

      if (emails.length === 0) {
        newErrors.to = "At least one recipient email is required";
      }
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.trim().length > 200) {
      newErrors.subject = "Subject must be less than 200 characters";
    }

    if (!formData.htmlContent.trim() && !formData.textContent.trim()) {
      newErrors.content = "Email content is required";
    }

    if (!formData.fromName.trim()) {
      newErrors.fromName = "From name is required";
    }

    if (!formData.fromEmail.trim()) {
      newErrors.fromEmail = "From email is required";
    } else if (!validateEmail(formData.fromEmail.trim())) {
      newErrors.fromEmail = "Please enter a valid from email address";
    } else if (!formData.fromEmail.endsWith("@motherhaven.app")) {
      newErrors.fromEmail = "From email must be from motherhaven.app domain";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const success = await sendEmail(formData);
    if (success) {
      // Reset form on successful send
      setFormData({
        to: "",
        subject: "",
        htmlContent: "",
        textContent: "",
        fromName: DEFAULT_FROM_NAME,
        fromEmail: DEFAULT_FROM_EMAIL,
      });
      setErrors({});
      setActiveTab("compose");
    }
  };

  // Auto-generate text content from HTML
  const generateTextContent = () => {
    if (formData.htmlContent) {
      // Simple HTML to text conversion
      const textContent = formData.htmlContent
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<p[^>]*>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();

      setFormData((prev) => ({ ...prev, textContent }));
    }
  };

  // Access control - only show to admin
  if (!isConnected) {
    return (
      <Card className="unified-card border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <Mail className="h-12 w-12 text-muted-foreground opacity-50" />
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Connect Wallet
            </h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to access email features
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
              Only admin can send emails from this domain
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="unified-card border-primary/20">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-primary" />
          Compose Email
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <Crown className="h-3 w-3 mr-1" />
            Admin Only
          </Badge>
        </CardTitle>
        <CardDescription>
          Send emails from your motherhaven.app domain
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-6">
            {/* From Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* From Name */}
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fromName"
                    value={formData.fromName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fromName: e.target.value,
                      }))
                    }
                    className={errors.fromName ? "border-red-500" : ""}
                    placeholder="Your Name"
                  />
                </div>
                {errors.fromName && (
                  <p className="text-sm text-red-500">{errors.fromName}</p>
                )}
              </div>

              {/* From Email */}
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <div className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fromEmail"
                    type="email"
                    value={formData.fromEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fromEmail: e.target.value,
                      }))
                    }
                    className={errors.fromEmail ? "border-red-500" : ""}
                    placeholder="admin@motherhaven.app"
                  />
                </div>
                {errors.fromEmail && (
                  <p className="text-sm text-red-500">{errors.fromEmail}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be from @motherhaven.app domain
                </p>
              </div>
            </div>

            {/* Preview of sender */}
            <div className="p-3 bg-muted/30 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                Will appear as:{" "}
                <span className="text-foreground font-medium">
                  {formData.fromName || "Your Name"} &lt;{formData.fromEmail}
                  &gt;
                </span>
              </p>
            </div>

            {/* To Section */}
            <div className="space-y-2">
              <Label htmlFor="to">To (Recipients)</Label>
              <div className="flex items-center gap-2">
                <AtSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="to"
                  type="email"
                  value={formData.to}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, to: e.target.value }))
                  }
                  className={errors.to ? "border-red-500" : ""}
                  placeholder="recipient@example.com, another@example.com"
                />
              </div>
              {errors.to && <p className="text-sm text-red-500">{errors.to}</p>}
              <p className="text-xs text-muted-foreground">
                Separate multiple email addresses with commas
              </p>
            </div>

            {/* Subject Section */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                className={errors.subject ? "border-red-500" : ""}
                placeholder="Email subject"
                maxLength={200}
              />
              {errors.subject && (
                <p className="text-sm text-red-500">{errors.subject}</p>
              )}
              <p className="text-xs text-muted-foreground text-right">
                {formData.subject.length}/200 characters
              </p>
            </div>

            {/* Content Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="htmlContent">Email Content (HTML)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateTextContent}
                  className="text-xs"
                >
                  Generate Text Version
                </Button>
              </div>
              <Textarea
                id="htmlContent"
                value={formData.htmlContent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    htmlContent: e.target.value,
                  }))
                }
                className={`min-h-[200px] font-mono text-sm ${
                  errors.content ? "border-red-500" : ""
                }`}
                placeholder="<p>Your email content here...</p>"
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content}</p>
              )}
            </div>

            {/* Text Content (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="textContent">Plain Text Version (Optional)</Label>
              <Textarea
                id="textContent"
                value={formData.textContent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    textContent: e.target.value,
                  }))
                }
                className="min-h-[100px] font-mono text-sm"
                placeholder="Plain text fallback for email clients that don't support HTML"
              />
              <p className="text-xs text-muted-foreground">
                Automatically generated if left empty
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isLoading ? "Sending..." : "Send Email"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setActiveTab("preview")}
                disabled={!formData.htmlContent}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {/* Email Preview Header */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Email Preview</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("compose")}
                >
                  Edit
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <strong>From:</strong> {formData.fromName} &lt;
                  {formData.fromEmail}&gt;
                </p>
                <p>
                  <strong>To:</strong> {formData.to || "recipient@example.com"}
                </p>
                {formData.to.includes(",") && (
                  <p className="text-xs text-muted-foreground">
                    {
                      formData.to
                        .split(",")
                        .map((email) => email.trim())
                        .filter((email) => email).length
                    }{" "}
                    recipients
                  </p>
                )}
                <p>
                  <strong>Subject:</strong>{" "}
                  {formData.subject || "Email subject"}
                </p>
              </div>
            </div>

            {/* Email Content Preview */}
            <div className="border rounded-lg">
              <div className="p-4 border-b bg-muted/10">
                <h4 className="font-medium text-foreground">HTML Preview</h4>
              </div>
              <div className="p-6">
                {formData.htmlContent ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.htmlContent }}
                  />
                ) : (
                  <p className="text-muted-foreground italic">
                    No content to preview
                  </p>
                )}
              </div>
            </div>

            {/* Text Preview */}
            {formData.textContent && (
              <div className="border rounded-lg">
                <div className="p-4 border-b bg-muted/10">
                  <h4 className="font-medium text-foreground">
                    Plain Text Preview
                  </h4>
                </div>
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                    {formData.textContent}
                  </pre>
                </div>
              </div>
            )}

            {/* Send from Preview */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={
                  isLoading ||
                  !formData.to ||
                  !formData.subject ||
                  !formData.htmlContent
                }
                className="btn-primary flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isLoading ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
