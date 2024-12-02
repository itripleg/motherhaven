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
  addDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAccount } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Container } from "@/components/craft";

interface RoadmapItem {
  id: string;
  title: string;
  status: "considering" | "planned" | "in-progress" | "completed";
  upvotes: string[];
  comments: number;
}

const ADMIN_ADDRESSES = ["0xd85327505Ab915AB0C1aa5bC6768bF4002732258"];

export default function Roadmap() {
  const [items, setItems] = React.useState<RoadmapItem[]>([]);
  const [filter, setFilter] = React.useState<string>("top");
  const [title, setTitle] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] =
    React.useState<RoadmapItem["status"]>("considering");
  const { toast } = useToast();
  const { address, isConnecting, isDisconnected } = useAccount();

  const isAdmin = address && ADMIN_ADDRESSES.includes(address);

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
    if (isConnecting) return;

    if (isDisconnected || !address) {
      toast({
        title: "Authentication required",
        description: "Please connect your wallet to upvote items.",
        variant: "destructive",
      });
      return;
    }

    const itemRef = doc(db, "roadmap", itemId);
    const item = items.find((i) => i.id === itemId);
    if (item) {
      const hasUpvoted = item.upvotes.includes(address);

      await updateDoc(itemRef, {
        upvotes: hasUpvoted ? arrayRemove(address) : arrayUnion(address),
      });
    }
  };

  const handleAddItem = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the roadmap item.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDoc(collection(db, "roadmap"), {
        title: title.trim(),
        status,
        notes,
        upvotes: [],
        comments: 0,
        createdAt: new Date().toISOString(),
      });

      setTitle("");
      setNotes("");
      setStatus("considering");

      toast({
        title: "Item added",
        description: "The roadmap item has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add roadmap item. Please try again.",
        variant: "destructive",
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
    <Container>
      <div className="p-4 md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Road 2 Riches</h1>
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

        {isAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add Roadmap Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Item title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Admin notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-24"
              />
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as RoadmapItem["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="considering">Considering</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddItem} className="w-full">
                Add Item
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {(
            ["considering", "planned", "in-progress", "completed"] as const
          ).map((status) => (
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
          ))}
        </div>
      </div>
    </Container>
  );
}
