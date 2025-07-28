// app/dex/components/roadmap/feature-posts/FeaturePostDisplay.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  MessageSquare,
  Star,
  Calendar,
  Edit,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/firebase";
import { FeaturePost } from "./types";
import { FeaturePostComments } from "./FeaturePostComments";
import { formatDistanceToNow, parseISO } from "date-fns";

interface FeaturePostDisplayProps {
  post: FeaturePost;
  address?: string;
  isConnecting: boolean;
  isAdmin?: boolean;
  onEdit?: (post: FeaturePost) => void;
  tokenAddress?: string;
}

export function FeaturePostDisplay({
  post,
  address,
  isConnecting,
  isAdmin = false,
  onEdit,
  tokenAddress,
}: FeaturePostDisplayProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isUpvoting, setIsUpvoting] = React.useState(false);
  const { toast } = useToast();

  const hasUserUpvoted =
    address && Array.isArray(post.upvotes) && post.upvotes.includes(address);
  const upvoteCount = Array.isArray(post.upvotes) ? post.upvotes.length : 0;
  const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;

  const handleUpvote = async () => {
    if (isConnecting || isUpvoting) return;

    if (!address) {
      toast({
        title: "Authentication required",
        description: "Please connect your wallet to upvote posts.",
        variant: "destructive",
      });
      return;
    }

    setIsUpvoting(true);

    try {
      const collectionName = tokenAddress
        ? "tokenFeaturePosts"
        : "featurePosts";
      const postRef = doc(db, collectionName, post.id);

      await updateDoc(postRef, {
        upvotes: hasUserUpvoted ? arrayRemove(address) : arrayUnion(address),
      });
    } catch (error) {
      console.error("Error updating upvote:", error);
      toast({
        title: "Error",
        description: "Failed to update vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpvoting(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Show truncated content when collapsed
  const shouldTruncate = post.content.length > 200;
  const displayContent =
    isExpanded || !shouldTruncate
      ? post.content
      : post.content.slice(0, 200) + "...";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`bg-card/50 border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-300 ${
          post.isFeatured
            ? "ring-2 ring-yellow-400/30 border-yellow-400/50"
            : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              {/* Title and Featured Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-foreground leading-tight">
                  {post.title}
                </h3>
                {post.isFeatured && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400/30 flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Featured
                  </Badge>
                )}
              </div>

              {/* Author and Date */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {post.authorAddress.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-mono">
                    {formatAddress(post.authorAddress)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatTimestamp(post.createdAt)}</span>
                </div>
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <span className="text-xs opacity-70">
                    (edited {formatTimestamp(post.updatedAt)})
                  </span>
                )}
              </div>
            </div>

            {/* Admin Edit Button */}
            {isAdmin && onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(post)}
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/20 flex-shrink-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Content */}
          <div className="space-y-2">
            <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {displayContent}
            </p>

            {/* Expand/Collapse Button for long content */}
            {shouldTruncate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary hover:text-primary/80 p-0 h-auto font-normal"
              >
                <div className="flex items-center gap-1">
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Show more
                    </>
                  )}
                </div>
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Upvote Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUpvote}
                disabled={isConnecting || isUpvoting}
                className={`flex items-center gap-1 transition-colors ${
                  hasUserUpvoted
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <ChevronUp className="h-4 w-4" />
                <span>{upvoteCount}</span>
              </Button>

              {/* Comments Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{commentCount}</span>
              </Button>
            </div>

            {/* Expand Comments Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Comments Section */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-border/50">
                  <FeaturePostComments
                    post={post}
                    address={address}
                    isConnecting={isConnecting}
                    tokenAddress={tokenAddress}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
