// app/roadmap/components/CommentsSection.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/firebase";
import { Comment } from "../types";

interface CommentsSectionProps {
  itemId: string;
  comments: Comment[];
  address?: string;
  isConnecting: boolean;
}

const COMMENT_LIMIT = 100; // Character limit for comments
const MAX_COMMENTS_PER_ITEM = 50; // Maximum comments per item

export function CommentsSection({
  itemId,
  comments,
  address,
  isConnecting,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

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

    if (newComment.length > COMMENT_LIMIT) {
      toast({
        title: "Comment too long",
        description: `Comments must be ${COMMENT_LIMIT} characters or less.`,
        variant: "destructive",
      });
      return;
    }

    if (comments.length >= MAX_COMMENTS_PER_ITEM) {
      toast({
        title: "Comment limit reached",
        description: `This item has reached the maximum of ${MAX_COMMENTS_PER_ITEM} comments.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const comment: Comment = {
        id: Date.now().toString(),
        author: address,
        text: newComment.trim(),
        timestamp: new Date().toISOString(),
      };

      const itemRef = doc(db, "roadmap", itemId);
      await updateDoc(itemRef, {
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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? `${diffMinutes}m ago` : "Just now";
    }
  };

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.2 }}
              className="bg-background/30 rounded-lg p-3 border border-border/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs text-primary font-medium">
                    {comment.author.slice(2, 4).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatAddress(comment.author)}
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {formatTimestamp(comment.timestamp)}
                </span>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                {comment.text}
              </p>
            </motion.div>
          ))
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
            maxLength={COMMENT_LIMIT}
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
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>

        {/* Character Count and Limits Info */}
        <div className="flex justify-between text-xs text-muted-foreground/70">
          <span>
            {newComment.length}/{COMMENT_LIMIT} characters
          </span>
          <span>
            {comments.length}/{MAX_COMMENTS_PER_ITEM} comments
          </span>
        </div>
      </motion.div>
    </div>
  );
}
