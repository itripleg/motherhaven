// app/dex/components/roadmap/page.tsx - UPDATED: Added editable column titles for global roadmap
"use client";

import * as React from "react";
import { Filter } from "lucide-react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAccount } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Container } from "@/components/craft";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  RoadmapItem as RoadmapItemType,
  ADMIN_ADDRESSES,
  statusKeys,
} from "./types";
import { DroppableColumn } from "./components/DroppableColumn";
import { RoadmapItem } from "./components/RoadmapItem";
import { AdminForm } from "./components/AdminForm";

// --- TYPES ---
interface GlobalColumnTitles {
  considering: string;
  planned: string;
  "in-progress": string;
  completed: string;
}

const defaultGlobalColumnTitles: GlobalColumnTitles = {
  considering: "Considering",
  planned: "Planned",
  "in-progress": "In Progress",
  completed: "Completed",
};

// --- HOOKS ---
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

// --- MAIN ROADMAP COMPONENT ---
export default function Roadmap() {
  const [items, setItems] = React.useState<RoadmapItemType[]>([]);
  const [columnTitles, setColumnTitles] = React.useState<GlobalColumnTitles>(defaultGlobalColumnTitles);
  const [expandedItemId, setExpandedItemId] = React.useState<string | null>(
    null
  );
  const [activeItem, setActiveItem] = React.useState<RoadmapItemType | null>(
    null
  );
  const [mounted, setMounted] = React.useState(false);
  const [filter, setFilter] = React.useState<string>("top");
  const [draggedItemWasExpanded, setDraggedItemWasExpanded] =
    React.useState(false);

  const { toast } = useToast();
  const { address, isConnecting, isDisconnected } = useAccount();
  const isAdmin = address && ADMIN_ADDRESSES.includes(address);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  const isLg = useMediaQuery("(min-width: 1024px)");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch global column titles
  React.useEffect(() => {
    if (!mounted) return;

    const fetchGlobalColumnTitles = async () => {
      try {
        const titlesDoc = await getDoc(doc(db, "globalRoadmapSettings", "columnTitles"));
        if (titlesDoc.exists()) {
          const data = titlesDoc.data();
          setColumnTitles(data.columnTitles || defaultGlobalColumnTitles);
        }
      } catch (error) {
        console.error("Error fetching global column titles:", error);
        // Use default titles on error
      }
    };

    fetchGlobalColumnTitles();
  }, [mounted]);

  React.useEffect(() => {
    if (!mounted) return;

    const q = query(
      collection(db, "roadmap"),
      orderBy(
        filter === "new" ? "createdAt" : "upvotes",
        filter === "new" ? "desc" : "desc"
      )
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const roadmapItems: RoadmapItemType[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          roadmapItems.push({
            id: doc.id,
            ...data,
            upvotes: Array.isArray(data.upvotes) ? data.upvotes : [],
            comments: Array.isArray(data.comments) ? data.comments : [],
          } as RoadmapItemType);
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
  }, [mounted, toast, filter]);

  // Handle global column title updates
  const handleGlobalTitleUpdate = async (status: RoadmapItemType["status"], newTitle: string) => {
    if (!isAdmin) return;

    try {
      const updatedTitles = { ...columnTitles, [status]: newTitle };
      
      // Update Firestore
      await setDoc(
        doc(db, "globalRoadmapSettings", "columnTitles"),
        {
          columnTitles: updatedTitles,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Update local state
      setColumnTitles(updatedTitles);

      toast({
        title: "Column updated",
        description: `Global column renamed to "${newTitle}"`,
      });
    } catch (error) {
      console.error("Error updating global column title:", error);
      toast({
        title: "Error",
        description: "Failed to update column title. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const handleDragStart = (event: DragStartEvent) => {
    const draggedItem = items.find((item) => item.id === event.active.id);
    setActiveItem(draggedItem || null);
    setDraggedItemWasExpanded(expandedItemId === event.active.id);
    setExpandedItemId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeItem = items.find((item) => item.id === active.id);
    if (!activeItem) return;

    let newStatus: RoadmapItemType["status"];
    const overId = over.id.toString();

    if (overId.includes("considering")) {
      newStatus = "considering";
    } else if (overId.includes("planned")) {
      newStatus = "planned";
    } else if (overId.includes("in-progress")) {
      newStatus = "in-progress";
    } else if (overId.includes("completed")) {
      newStatus = "completed";
    } else {
      const targetItem = items.find((item) => item.id === overId);
      if (targetItem) {
        newStatus = targetItem.status;
      } else {
        return;
      }
    }

    if (activeItem.status !== newStatus) {
      if (!isAdmin) {
        toast({
          title: "Admin required",
          description: "Only admins can change item status.",
          variant: "destructive",
        });
        return;
      }

      try {
        const itemRef = doc(db, "roadmap", activeItem.id);
        await updateDoc(itemRef, {
          status: newStatus,
        });

        toast({
          title: "Status updated",
          description: `"${activeItem.title}" moved to ${columnTitles[newStatus]}`,
        });
      } catch (error) {
        console.error("Error updating item status:", error);
        toast({
          title: "Error",
          description: "Failed to update item status. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getItemsByStatus = (status: RoadmapItemType["status"]) =>
    items.filter((item) => item.status === status);

  const expandedItemDetails = items.find((item) => item.id === expandedItemId);
  const expandedStatusIndex = expandedItemDetails
    ? statusKeys.indexOf(expandedItemDetails.status)
    : -1;

  const getHiddenColumnIndex = (expandedIndex: number) => {
    if (expandedIndex === statusKeys.length - 1) {
      return expandedIndex - 1;
    } else {
      return expandedIndex + 1;
    }
  };

  const hiddenColumnIndex =
    expandedStatusIndex !== -1 ? getHiddenColumnIndex(expandedStatusIndex) : -1;

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <AdminForm isAdmin={!!isAdmin} />
          </motion.div>

          {/* Roadmap Grid */}
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              <AnimatePresence>
                {statusKeys.map((status, index) => {
                  const isColumnExpanded =
                    isLg && expandedStatusIndex === index;
                  const shouldBeHidden =
                    isLg &&
                    expandedStatusIndex !== -1 &&
                    index === hiddenColumnIndex;

                  if (shouldBeHidden) return null;

                  return (
                    <motion.div
                      key={status}
                      layoutId={`column-${status}`}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        mass: 0.6,
                      }}
                      className={
                        isColumnExpanded
                          ? index === statusKeys.length - 1
                            ? "lg:col-span-2 lg:col-start-3"
                            : "lg:col-span-2"
                          : "lg:col-span-1"
                      }
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <DroppableColumn
                        status={status}
                        items={getItemsByStatus(status)}
                        onUpvote={handleUpvote}
                        isConnecting={isConnecting}
                        address={address}
                        expandedItemId={expandedItemId}
                        onExpand={setExpandedItemId}
                        collection="roadmap"
                        isCreator={!!isAdmin}
                        columnTitle={columnTitles[status]}
                        onTitleUpdate={handleGlobalTitleUpdate}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <DragOverlay>
              {activeItem ? (
                draggedItemWasExpanded ? (
                  <div className="w-[230px]">
                    <RoadmapItem
                      item={activeItem}
                      onUpvote={handleUpvote}
                      isConnecting={isConnecting}
                      address={address}
                      isExpanded={false}
                      onExpand={() => {}}
                      isDragging={true}
                      collection="roadmap"
                    />
                  </div>
                ) : (
                  <RoadmapItem
                    item={activeItem}
                    onUpvote={handleUpvote}
                    isConnecting={isConnecting}
                    address={address}
                    isExpanded={false}
                    onExpand={() => {}}
                    isDragging={true}
                    collection="roadmap"
                  />
                )
              ) : null}
            </DragOverlay>
          </DndContext>

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