// app/VanityNameManager/components/VanityNameSettings.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Bell,
  Eye,
  Shield,
  User,
  Crown,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink,
  Copy,
  Download,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type VanityNameData } from "@/types/vanity";

interface VanityNameSettingsProps {
  userAddress: string;
  vanityData: VanityNameData | null;
}

interface UserPreferences {
  notifications: {
    requestUpdates: boolean;
    systemAnnouncements: boolean;
    leaderboardUpdates: boolean;
  };
  privacy: {
    showInLeaderboard: boolean;
    showNameHistory: boolean;
    allowDirectMessages: boolean;
  };
  display: {
    showVanityNameInProfile: boolean;
    showBadges: boolean;
    animatedEffects: boolean;
  };
}

export function VanityNameSettings({
  userAddress,
  vanityData,
}: VanityNameSettingsProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications: {
      requestUpdates: true,
      systemAnnouncements: true,
      leaderboardUpdates: false,
    },
    privacy: {
      showInLeaderboard: true,
      showNameHistory: false,
      allowDirectMessages: true,
    },
    display: {
      showVanityNameInProfile: true,
      showBadges: true,
      animatedEffects: true,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePreferenceChange = (
    category: keyof UserPreferences,
    setting: string,
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save preferences
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay

      toast({
        title: "Settings Saved! ✅",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Unable to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    const exportData = {
      userAddress,
      vanityData,
      preferences,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vanity-name-data-${userAddress.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported! 📥",
      description: "Your vanity name data has been downloaded.",
    });
  };

  const handleDeleteVanityName = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement API call to delete vanity name
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Mock delay

      toast({
        title: "Vanity Name Deleted",
        description: "Your vanity name has been removed from the system.",
      });

      setShowDeleteConfirm(false);
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Unable to delete vanity name. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(userAddress);
    toast({
      title: "Address Copied! 📋",
      description: "Your address has been copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Account Settings</h2>
        <p className="text-muted-foreground">
          Manage your vanity name preferences and account settings
        </p>
      </div>

      {/* Account Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="unified-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              Account Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">
                    Wallet Address
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <code className="text-xs text-foreground">
                    {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </code>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">
                  Current Vanity Name
                </Label>
                <div className="p-3 bg-muted/30 rounded-lg">
                  {vanityData?.current ? (
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">
                        {vanityData.current}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No vanity name set
                    </span>
                  )}
                </div>
              </div>
            </div>

            {vanityData?.current && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Total Changes
                  </Label>
                  <div className="text-2xl font-bold text-foreground">
                    {vanityData.totalChanges}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Last Changed
                  </Label>
                  <div className="text-sm text-foreground">
                    {vanityData.lastChanged
                      ? new Date(vanityData.lastChanged).toLocaleDateString()
                      : "Never"}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="unified-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Request Updates
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about your vanity name request status
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications.requestUpdates}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange(
                      "notifications",
                      "requestUpdates",
                      checked
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    System Announcements
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive updates about new features and changes
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications.systemAnnouncements}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange(
                      "notifications",
                      "systemAnnouncements",
                      checked
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Leaderboard Updates
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when you move up in rankings
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications.leaderboardUpdates}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange(
                      "notifications",
                      "leaderboardUpdates",
                      checked
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Privacy Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="unified-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              Privacy Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Show in Leaderboard
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Display your vanity name in public rankings
                  </p>
                </div>
                <Switch
                  checked={preferences.privacy.showInLeaderboard}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange(
                      "privacy",
                      "showInLeaderboard",
                      checked
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Show Name History
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow others to see your previous vanity names
                  </p>
                </div>
                <Switch
                  checked={preferences.privacy.showNameHistory}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange(
                      "privacy",
                      "showNameHistory",
                      checked
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Allow Direct Messages
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Let other users contact you about your vanity name
                  </p>
                </div>
                <Switch
                  checked={preferences.privacy.allowDirectMessages}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange(
                      "privacy",
                      "allowDirectMessages",
                      checked
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Display Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="unified-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              Display Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Show Vanity Name in Profile
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Display your vanity name instead of wallet address
                  </p>
                </div>
                <Switch
                  checked={preferences.display.showVanityNameInProfile}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange(
                      "display",
                      "showVanityNameInProfile",
                      checked
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Show Achievement Badges
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Display badges for milestones and achievements
                  </p>
                </div>
                <Switch
                  checked={preferences.display.showBadges}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange("display", "showBadges", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Animated Effects
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enable animations and visual effects
                  </p>
                </div>
                <Switch
                  checked={preferences.display.animatedEffects}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange(
                      "display",
                      "animatedEffects",
                      checked
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="unified-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={handleExportData}
                className="h-12 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export My Data
              </Button>

              <Button
                variant="outline"
                disabled
                className="h-12 flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Data
                <Badge variant="secondary" className="ml-2">
                  Soon
                </Badge>
              </Button>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You can export your vanity name data including history,
                preferences, and statistics. This data is yours and portable
                across platforms.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      {vanityData?.current && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="unified-card border-red-400/30 bg-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These actions cannot be undone. Your vanity name and history
                  will be permanently deleted.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button
                  variant="destructive"
                  onClick={handleDeleteVanityName}
                  disabled={isLoading}
                  className="w-full h-12"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Deleting...
                    </div>
                  ) : showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Click Again to Confirm Delete
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete My Vanity Name
                    </div>
                  )}
                </Button>

                {showDeleteConfirm && (
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Save Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-center"
      >
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
          size="lg"
          className="w-full md:w-auto px-8"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
              Saving Settings...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Save All Settings
            </div>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
