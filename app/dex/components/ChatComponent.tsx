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
import { ThumbsUp } from "lucide-react";

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
  creatorAddress, // Add this prop
}: {
  tokenAddress: string;
  creatorAddress?: string; // Optional in case we can't get it
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {comments.map((comment) => (
            <div key={comment.id} className="mb-4">
              <div className="flex items-start space-x-2">
                <Avatar>
                  <AvatarImage
                    src={`https://avatar.vercel.sh/${comment.userAddress}`}
                  />
                  <AvatarFallback>
                    {comment.userAddress.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {`${comment.userAddress.slice(
                      0,
                      6
                    )}...${comment.userAddress.slice(-4)}`}
                    {creatorAddress &&
                      comment.userAddress.toLowerCase() ===
                        creatorAddress.toLowerCase() && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                          dev
                        </span>
                      )}
                  </p>
                  <p className="mt-1">{comment.text}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(comment.id)}
                      disabled={!isConnected}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {comment.likes || 0}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {comment.timestamp?.toDate().toLocaleString() ||
                        "Just now"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
        {isConnected ? (
          <form onSubmit={handleSubmitComment} className="mt-4">
            <div className="flex space-x-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your comment..."
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? "Sending..." : "Send"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-4 text-center text-muted-foreground">
            Please connect your wallet to comment.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
