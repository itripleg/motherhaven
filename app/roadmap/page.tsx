"use client";

import * as React from "react";
import { ChevronUp, MessageSquare, Plus, Filter } from "lucide-react";
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
import { motion } from "framer-motion";

interface RoadmapItem {
  id: string;
  title: string;
  status: "considering" | "planned" | "in-progress" | "completed";
  upvotes: string[];
  comments: number;
  notes?: string;
  createdAt?: string;
}

const ADMIN_ADDRESSES = ["0xd85327505Ab915AB0C1aa5bC6768bF4002732258"];

export default function Roadmap() {
  const [items, setItems] = React.useState<RoadmapItem[]>([]);
  const [filter, setFilter] = React.useState<string>("top");
  const [title, setTitle] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] =
    React.useState<RoadmapItem["status"]>("considering");
  const [mounted, setMounted] = React.useState(false);
  const { toast } = useToast();
  const { address, isConnecting, isDisconnected } = useAccount();

  const isAdmin = address && ADMIN_ADDRESSES.includes(address);

  // Handle hydration
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    const q = query(collection(db, "roadmap"), orderBy("upvotes", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const roadmapItems: RoadmapItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Ensure upvotes is always an array
          const upvotes = Array.isArray(data.upvotes) ? data.upvotes : [];
          roadmapItems.push({
            id: doc.id,
            ...data,
            upvotes,
          } as RoadmapItem);
        });
        setItems(roadmapItems);
      },
      (error) => {
        console.error("Error fetching roadmap items:", error);
        toast({
          title: "Error",
          description: "Failed to load roadmap items",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [mounted, toast]);

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

    try {
      const itemRef = doc(db, "roadmap", itemId);
      const item = items.find((i) => i.id === itemId);
      if (item) {
        // Ensure upvotes is an array before checking includes
        const upvotes = Array.isArray(item.upvotes) ? item.upvotes : [];
        const hasUpvoted = upvotes.includes(address);

        await updateDoc(itemRef, {
          upvotes: hasUpvoted ? arrayRemove(address) : arrayUnion(address),
        });
      }
    } catch (error) {
      console.error("Error updating upvote:", error);
      toast({
        title: "Error",
        description: "Failed to update vote. Please try again.",
        variant: "destructive",
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
      console.error("Error adding roadmap item:", error);
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

  const statusConfig = {
    considering: {
      label: "Considering",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    planned: {
      label: "Planned",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
    "in-progress": {
      label: "In Progress",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
    completed: {
      label: "Completed",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:pt-12">
      <div className="relative z-10">
        <Container className="py-8 pt-24">
          {/* Page Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                  <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
                    🛣️
                  </div>
                  Road 2 Riches
                  <Badge
                    className="bg-primary/20 text-primary border-primary/30"
                    variant="outline"
                  >
                    Community Driven
                  </Badge>
                </h1>
                <p className="text-muted-foreground text-lg">
                  Vote on features and help shape the future of our platform
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="border-border text-foreground w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top upvoted</SelectItem>
                    <SelectItem value="new">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Admin Add Item Form */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <Card className="bg-card/50 border-border backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Add Roadmap Item
                    <Badge
                      variant="outline"
                      className="text-primary border-primary"
                    >
                      Admin Only
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Item title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-card border-border text-foreground"
                  />
                  <Textarea
                    placeholder="Admin notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-24 bg-card border-border text-foreground"
                  />
                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setStatus(value as RoadmapItem["status"])
                    }
                  >
                    <SelectTrigger className="bg-card border-border text-foreground">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="considering">Considering</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddItem}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Roadmap Grid */}
          <motion.div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {(
              ["considering", "planned", "in-progress", "completed"] as const
            ).map((statusKey, columnIndex) => {
              const config = statusConfig[statusKey];
              const statusItems = getItemsByStatus(statusKey);

              return (
                <motion.div
                  key={statusKey}
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + columnIndex * 0.1 }}
                >
                  {/* Column Header */}
                  <div
                    className={`p-4 rounded-lg ${config.bgColor} border ${config.borderColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className={`font-semibold ${config.color}`}>
                        {config.label}
                      </h2>
                      <Badge
                        variant="outline"
                        className={`${config.color} border-current bg-transparent`}
                      >
                        {statusItems.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Items */}
                  {statusItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                    >
                      <Card className="bg-card/50 border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-300 group">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </CardTitle>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {item.notes}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`flex items-center gap-1 transition-colors ${
                                address &&
                                Array.isArray(item.upvotes) &&
                                item.upvotes.includes(address)
                                  ? "text-primary bg-primary/10"
                                  : "text-muted-foreground hover:text-primary"
                              }`}
                              onClick={() => handleUpvote(item.id)}
                              disabled={isConnecting}
                            >
                              <ChevronUp className="h-4 w-4" />
                              {Array.isArray(item.upvotes)
                                ? item.upvotes.length
                                : 0}
                            </Button>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MessageSquare className="h-4 w-4" />
                              {item.comments}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                  {/* Empty State */}
                  {statusItems.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <div className="text-4xl mb-2">📝</div>
                      <p className="text-sm">No items yet</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Footer CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center py-12"
          >
            <Card className="bg-card/50 border-border backdrop-blur-sm max-w-2xl mx-auto">
              <CardContent className="p-8 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">
                    🗳️ Have an Idea?
                  </h3>
                  <p className="text-muted-foreground">
                    Join our community and help us prioritize what to build next
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                      if (!address) {
                        toast({
                          title: "Connect Wallet",
                          description:
                            "Please connect your wallet to participate",
                          variant: "default",
                        });
                      }
                    }}
                  >
                    🚀 Vote Now
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="border-border text-foreground hover:bg-accent"
                  >
                    Join Discord
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </div>
    </div>
  );
}
