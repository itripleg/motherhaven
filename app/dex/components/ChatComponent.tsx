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
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, Send } from "lucide-react";

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

export function ChatComponent({
  tokenAddress,
  creatorAddress,
}: {
  tokenAddress: string;
  creatorAddress?: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const { address, isConnected } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!tokenAddress) {
      console.log("No token address provided");
      return;
    }

    console.log("Setting up comments listener for token:", tokenAddress);

    const q = query(
      collection(db, "comments"),
      where("tokenAddress", "==", tokenAddress),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        console.log("Received snapshot with size:", querySnapshot.size);

        const fetchedComments: Comment[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Comment data:", data);
          fetchedComments.push({
            id: doc.id,
            text: data.text,
            userAddress: data.userAddress,
            tokenAddress: data.tokenAddress,
            timestamp: data.timestamp,
            likes: data.likes || 0,
          });
        });
        console.log("Processed comments:", fetchedComments);
        setComments(fetchedComments);
      },
      (error) => {
        console.error("Error fetching comments:", error);
      }
    );

    return () => unsubscribe();
  }, [tokenAddress]);

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

  return (
    <Card className="w-full max-w-md bg-background border-primary shadow-lg flex flex-col justify-between">
      <CardHeader className="border-b border-border dark:border-gray-700">
        <CardTitle className="text-2xl font-bold text-foreground dark:text-white">
          Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="md:h-[500px] px-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="py-4 border-b border-border dark:border-gray-700 last:border-0"
            >
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage
                    src={`https://avatar.vercel.sh/${comment.userAddress}`}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {comment.userAddress.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center">
                    <p className="font-semibold text-sm text-foreground dark:text-gray-200">
                      {`${comment.userAddress.slice(
                        0,
                        6
                      )}...${comment.userAddress.slice(-4)}`}
                    </p>
                    {creatorAddress &&
                      comment.userAddress.toLowerCase() ===
                        creatorAddress.toLowerCase() && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                          dev
                        </span>
                      )}
                    <span className="ml-auto text-xs text-muted-foreground dark:text-gray-400">
                      {comment.timestamp?.toDate().toLocaleString() ||
                        "Just now"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground dark:text-gray-300">
                    {comment.text}
                  </p>
                  <div className="flex items-center mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(comment.id)}
                      disabled={!isConnected}
                      className="text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {comment.likes || 0}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
        {isConnected ? (
          <form
            onSubmit={handleSubmitComment}
            className="p-4 border-t border-border dark:border-gray-700"
          >
            <div className="flex space-x-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your comment..."
                disabled={isSubmitting}
                className="flex-1 bg-background dark:bg-gray-700 text-foreground dark:text-white"
              />
              <Button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <p className="p-4 text-center text-muted-foreground dark:text-gray-400 border-t border-border dark:border-gray-700">
            Please connect your wallet to comment.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
