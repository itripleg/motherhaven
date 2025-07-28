// app/dex/components/roadmap/feature-posts/FeaturePostComments.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/firebase";
import { FeaturePost, FeaturePostComment, FEATURE_POST_LIMITS } from "./types";
import { formatDistanceToNow, parseISO } from "date-fns";

interface FeaturePostCommentsProps {
  post: FeaturePost;
  address?: string;
  isConnecting: boolean;
  tokenAddress?: string;
}

export function FeaturePostComments({
  post,
  address,
  isConnecting,
  tokenAddress,
}: FeaturePostCommentsProps) {
  const [newComment, setNewComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [upvotingComment, setUpvotingComment] = React.useState<string | null>(
    null
  );
  const { toast } = useToast();

  const comments = Array.isArray(post.comments) ? post.comments : [];
  const sortedComments = [...comments].sort((a, b) => {
    // Sort by upvotes first (descending), then by timestamp (ascending)
    const aUpvotes = Array.isArray(a.upvotes) ? a.upvotes.length : 0;
    const bUpvotes = Array.isArray(b.upvotes) ? b.upvotes.length : 0;

    if (aUpvotes !== bUpvotes) {
      return bUpvotes - aUpvotes;
    }

    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  const handleSubmitComment = async () => {
    if (!address) {
      toast({
        title: "Authentication required",
        description: "Please connect your wallet to comment.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment.",
        variant: "destructive",
      });
      return;
    }

    if (newComment.length > FEATURE_POST_LIMITS.COMMENT_MAX_LENGTH) {
      toast({
        title: "Comment too long",
        description: `Comments must be ${FEATURE_POST_LIMITS.COMMENT_MAX_LENGTH} characters or less.`,
        variant: "destructive",
      });
      return;
    }

    if (comments.length >= FEATURE_POST_LIMITS.MAX_COMMENTS_PER_POST) {
      toast({
        title: "Comment limit reached",
        description: `This post has reached the maximum of ${FEATURE_POST_LIMITS.MAX_COMMENTS_PER_POST} comments.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const comment: FeaturePostComment = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        author: address,
        content: newComment.trim(),
        timestamp: new Date().toISOString(),
        upvotes: [],
      };

      const collectionName = tokenAddress
        ? "tokenFeaturePosts"
        : "featurePosts";
      const postRef = doc(db, collectionName, post.id);

      await updateDoc(postRef, {
        comments: arrayUnion(comment),
      });

      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully.",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvoteComment = async (commentId: string) => {
    if (!address || isConnecting || upvotingComment === commentId) return;

    setUpvotingComment(commentId);

    try {
      const collectionName = tokenAddress
        ? "tokenFeaturePosts"
        : "featurePosts";
      const postRef = doc(db, collectionName, post.id);

      await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) {
          throw new Error("Post not found");
        }

        const currentPost = postDoc.data() as FeaturePost;
        const currentComments = Array.isArray(currentPost.comments)
          ? currentPost.comments
          : [];

        const updatedComments = currentComments.map((comment) => {
          if (comment.id === commentId) {
            const currentUpvotes = Array.isArray(comment.upvotes)
              ? comment.upvotes
              : [];
            const hasUpvoted = currentUpvotes.includes(address);

            return {
              ...comment,
              upvotes: hasUpvoted
                ? currentUpvotes.filter((addr) => addr !== address)
                : [...currentUpvotes, address],
            };
          }
          return comment;
        });

        transaction.update(postRef, { comments: updatedComments });
      });
    } catch (error) {
      console.error("Error upvoting comment:", error);
      toast({
        title: "Error",
        description: "Failed to update vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpvotingComment(null);
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

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedComments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          sortedComments.map((comment, index) => {
            const hasUserUpvoted =
              address &&
              Array.isArray(comment.upvotes) &&
              comment.upvotes.includes(address);
            const upvoteCount = Array.isArray(comment.upvotes)
              ? comment.upvotes.length
              : 0;
            const isUpvotingThis = upvotingComment === comment.id;

            return (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                className="bg-background/30 rounded-lg p-3 border border-border/30 space-y-3"
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {comment.author.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatAddress(comment.author)}
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      {formatTimestamp(comment.timestamp)}
                    </span>
                  </div>

                  {/* Comment Upvote */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpvoteComment(comment.id)}
                    disabled={isConnecting || isUpvotingThis}
                    className={`h-6 px-2 text-xs transition-colors ${
                      hasUserUpvoted
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    {isUpvotingThis ? (
                      <div className="h-3 w-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <ChevronUp className="w-3 h-3 mr-1" />
                    )}
                    <span>{upvoteCount}</span>
                  </Button>
                </div>

                {/* Comment Content */}
                <p className="text-sm text-foreground/90 whitespace-pre-wrap pl-8">
                  {comment.content}
                </p>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Comment Input */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.2 }}
        className="space-y-2"
      >
        <div className="flex gap-2">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 h-8 text-sm bg-background/50 border-border/50"
            disabled={isSubmitting || isConnecting}
            maxLength={FEATURE_POST_LIMITS.COMMENT_MAX_LENGTH}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
          />
          <Button
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={handleSubmitComment}
            disabled={isSubmitting || isConnecting || !newComment.trim()}
          >
            {isSubmitting ? (
              <div className="h-3 w-3 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Character Count and Limits Info */}
        <div className="flex justify-between text-xs text-muted-foreground/70">
          <span>
            {newComment.length}/{FEATURE_POST_LIMITS.COMMENT_MAX_LENGTH}{" "}
            characters
          </span>
          <span>
            {comments.length}/{FEATURE_POST_LIMITS.MAX_COMMENTS_PER_POST}{" "}
            comments
          </span>
        </div>

        {/* Keyboard Shortcut Hint */}
        {newComment.trim() && (
          <div className="text-xs text-muted-foreground/60 text-center">
            Press Enter to post
          </div>
        )}
      </motion.div>
    </div>
  );
}
