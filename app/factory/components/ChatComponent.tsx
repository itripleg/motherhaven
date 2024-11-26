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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp } from "lucide-react";
import { ServerInsertedHTMLContext } from "next/navigation";

interface Comment {
  id: string;
  text: string;
  userAddress: string;
  timestamp: any;
  likes: number;
}

export function ChatComponent({ tokenAddress }: { tokenAddress: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("tokenAddress", "==", tokenAddress),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedComments: Comment[] = [];
      querySnapshot.forEach((doc) => {
        fetchedComments.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [tokenAddress]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address || !newComment.trim()) return;

    await addDoc(collection(db, "comments"), {
      text: newComment,
      userAddress: address,
      tokenAddress,
      timestamp: serverTimestamp(),
      likes: 0,
    });

    setNewComment("");
  };

  const handleLike = async (commentId: string) => {
    // Find the comment in the current state
    const updatedComments = comments.map((comment) =>
      comment.id === commentId
        ? { ...comment, likes: (comment.likes || 0) + 1 }
        : comment
    );

    // Optimistically update the UI
    setComments(updatedComments);

    try {
      // Perform the like update in Firestore
      const commentRef = doc(db, "comments", commentId);
      await updateDoc(commentRef, {
        likes: increment(1),
      });
    } catch (error) {
      // If the update fails, revert the optimistic update
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
        <ScrollArea className="h-[400px] pr-4 text-black">
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
                  <p className="font-semibold">{`${comment.userAddress.slice(
                    0,
                    6
                  )}...${comment.userAddress.slice(-4)}`}</p>
                  <p>{comment.text}</p>
                  <div className="flex items-center mt-1 justify-start">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(comment.id)}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {comment.likes}
                    </Button>
                    <span className="text-xs text-muted-foreground ml-2">
                      {comment.timestamp
                        ? comment.timestamp.toDate().toLocaleString()
                        : "Invalid date"}
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
              />
              <Button type="submit">Send</Button>
            </div>
          </form>
        ) : (
          <p className="mt-4 text-center">
            Please connect your wallet to comment.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
