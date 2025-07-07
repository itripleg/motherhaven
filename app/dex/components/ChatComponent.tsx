"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  increment,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Send, X, MessageCircle, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  text: string;
  userAddress: string;
  tokenAddress: string;
  timestamp: {
    toDate: () => Date;
  } | null;
  likes: number;
}

interface ChatComponentProps {
  tokenAddress: string;
  creatorAddress?: string;
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export function ChatComponent({
  tokenAddress,
  creatorAddress,
  className,
  isMobile = false,
  onClose,
}: ChatComponentProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { address, isConnected } = useAccount();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!tokenAddress || !mounted) {
      return;
    }

    const q = query(
      collection(db, "comments"),
      where("tokenAddress", "==", tokenAddress),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedComments: Comment[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedComments.push({
            id: doc.id,
            text: data.text,
            userAddress: data.userAddress,
            tokenAddress: data.tokenAddress,
            timestamp: data.timestamp,
            likes: data.likes || 0,
          });
        });
        setComments(fetchedComments);
      },
      (error) => {
        console.error("Error fetching comments:", error);
      }
    );

    return () => unsubscribe();
  }, [tokenAddress, mounted]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address || !newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      await addDoc(collection(db, "comments"), {
        text: newComment.trim(),
        userAddress: address,
        tokenAddress,
        timestamp: serverTimestamp(),
        likes: 0,
      });

      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!isConnected) return;

    const updatedComments = comments.map((comment) =>
      comment.id === commentId
        ? { ...comment, likes: (comment.likes || 0) + 1 }
        : comment
    );

    setComments(updatedComments);

    try {
      const commentRef = doc(db, "comments", commentId);
      await updateDoc(commentRef, {
        likes: increment(1),
      });
    } catch (error) {
      console.error("Failed to like comment:", error);
      setComments(comments);
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn("w-full h-full flex flex-col", className)}>
        <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm rounded-xl">
          <div className={cn("flex-shrink-0 p-4", isMobile && "px-4 pt-6")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold text-foreground">
                  Chat
                </span>
              </div>
              {isMobile && onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-primary/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm rounded-xl overflow-hidden">
        {/* Header - Mobile only for close button */}
        {isMobile && onClose && (
          <div className="flex-shrink-0 p-4 pb-2">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className={cn("space-y-4 p-4 pt-6", isMobile && "px-4 py-3")}>
              <AnimatePresence>
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-primary/20">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${comment.userAddress}`}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {comment.userAddress.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm text-foreground truncate">
                            {`${comment.userAddress.slice(
                              0,
                              6
                            )}...${comment.userAddress.slice(-4)}`}
                          </span>

                          {creatorAddress &&
                            comment.userAddress.toLowerCase() ===
                              creatorAddress.toLowerCase() && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                                <Crown className="h-3 w-3" />
                                <span className="text-xs font-medium">dev</span>
                              </div>
                            )}

                          <span className="text-xs text-muted-foreground">
                            {comment.timestamp?.toDate().toLocaleString() ||
                              "Just now"}
                          </span>
                        </div>

                        <div className="bg-secondary/30 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 mb-2 border border-border/20">
                          <p className="text-sm text-foreground break-words leading-relaxed">
                            {comment.text}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(comment.id)}
                          disabled={!isConnected}
                          className="h-6 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 -ml-2 transition-colors"
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          <span className="text-xs">{comment.likes || 0}</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {comments.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground py-12"
                >
                  <div className="text-4xl mb-3 opacity-50">💬</div>
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Be the first to start the conversation!
                  </p>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="flex-shrink-0 bg-background/30 backdrop-blur-sm">
            {isConnected ? (
              <form
                onSubmit={handleSubmitComment}
                className={cn("p-4", isMobile && "p-4 pb-6")}
              >
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Type a message..."
                      disabled={isSubmitting}
                      className="pr-12 !bg-input !border-border text-foreground placeholder:text-muted-foreground focus:!border-primary focus:!ring-2 focus:!ring-primary/20 focus:!ring-offset-0 rounded-full transition-all duration-200"
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting || !newComment.trim()}
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-3 h-3 border border-primary-foreground/30 border-t-primary-foreground rounded-full"
                        />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className={cn("p-4 text-center", isMobile && "p-4 pb-6")}>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to join the conversation
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
                    <MessageCircle className="h-3 w-3" />
                    <span>Share your thoughts about this token</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
