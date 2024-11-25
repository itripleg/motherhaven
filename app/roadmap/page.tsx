"use client";

import * as React from "react";
import { ChevronUp, MessageSquare } from "lucide-react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
/// If using the wagmi library for Ethereum wallet integration, uncomment the following line to import the `useAccount` hook, and comment out the `useKindeAuth` import.
// If using wagmi, uncomment the following line and comment out the Kinde import
// import { useAccount } from 'wagmi'

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface RoadmapItem {
  id: string;
  title: string;
  status: "considering" | "planned" | "in-progress" | "completed";
  upvotes: string[];
  comments: number;
}

export default function Roadmap() {
  const [items, setItems] = React.useState<RoadmapItem[]>([]);
  const [filter, setFilter] = React.useState<string>("top");
  const { toast } = useToast();

  // Use Kinde authentication
  const { user, isLoading } = useKindeBrowserClient();
  // If using wagmi, comment out the line above and uncomment the following line
  // const { address, isConnecting, isDisconnected } = useAccount()

  React.useEffect(() => {
    const q = query(collection(db, "roadmap"), orderBy("upvotes", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roadmapItems: RoadmapItem[] = [];
      snapshot.forEach((doc) => {
        roadmapItems.push({ id: doc.id, ...doc.data() } as RoadmapItem);
      });
      setItems(roadmapItems);
    });
    return () => unsubscribe();
  }, []);

  const handleUpvote = async (itemId: string) => {
    if (isLoading) return; // If using wagmi, change this to: if (isConnecting) return

    if (!user) {
      // If using wagmi, change this to: if (isDisconnected || !address) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upvote items.",
        variant: "destructive",
      });
      return;
    }

    const itemRef = doc(db, "roadmap", itemId);
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const userId = user.id; // If using wagmi, change this to: const userId = address
      const hasUpvoted = item.upvotes.includes(userId);

      await updateDoc(itemRef, {
        upvotes: hasUpvoted ? arrayRemove(userId) : arrayUnion(userId),
      });
    }
  };

  const getItemsByStatus = (status: RoadmapItem["status"]) => {
    return items.filter((item) => item.status === status);
  };

  const statusColors = {
    considering: "text-blue-400",
    planned: "text-purple-400",
    "in-progress": "text-yellow-400",
    completed: "text-green-400",
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roadmap</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top upvoted</SelectItem>
            <SelectItem value="new">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {(["considering", "planned", "in-progress", "completed"] as const).map(
          (status) => (
            <div key={status} className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold capitalize">
                  {status.replace("-", " ")}
                </h2>
                <Badge variant="outline" className={statusColors[status]}>
                  {getItemsByStatus(status).length}
                </Badge>
              </div>

              {getItemsByStatus(status).map((item) => (
                <Card key={item.id} className="bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleUpvote(item.id)}
                      >
                        <ChevronUp className="h-4 w-4" />
                        {item.upvotes.length}
                      </Button>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {item.comments}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
