// app/dex/components/roadmap/TokenRoadmap.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Map, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  addDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";

// Import from the roadmap components in the same directory structure
import { RoadmapItem as RoadmapItemType } from "../types";
import { DroppableColumn } from "./DroppableColumn";
import { AdminForm } from "./AdminForm";
import { RoadmapItem } from "./RoadmapItem";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

const statusKeys: RoadmapItemType["status"][] = [
  "considering",
  "planned",
  "in-progress",
  "completed",
];

interface TokenRoadmapProps {
  tokenAddress: string;
  creatorAddress?: string;
  isCreator?: boolean;
  compact?: boolean;
}

export function TokenRoadmap({
  tokenAddress,
  creatorAddress,
  isCreator = false,
  compact = true,
}: TokenRoadmapProps) {
  const [items, setItems] = React.useState<RoadmapItemType[]>([]);
  const [expandedItemId, setExpandedItemId] = React.useState<string | null>(
    null
  );
  const [activeItem, setActiveItem] = React.useState<RoadmapItemType | null>(
    null
  );
  const [mounted, setMounted] = React.useState(false);
  const [showAdminForm, setShowAdminForm] = React.useState(false);

  const { toast } = useToast();
  const { address, isConnecting, isDisconnected } = useAccount();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch roadmap items for this specific token
  React.useEffect(() => {
    if (!mounted || !tokenAddress) return;

    const q = query(
      collection(db, "tokenRoadmapItems"),
      where("tokenAddress", "==", tokenAddress.toLowerCase()),
      orderBy("createdAt", "desc")
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
        console.error("Error fetching token roadmap:", error);
        toast({
          title: "Error",
          description: "Failed to load roadmap items",
          variant: "destructive",
        });
      }
    );

    return () => unsubscribe();
  }, [mounted, tokenAddress, toast]);

  // Custom form handler for token-specific road maps
  const handleAddTokenRoadmapItem = async (formData: {
    title: string;
    notes: string;
    status: RoadmapItemType["status"];
  }) => {
    try {
      await addDoc(collection(db, "tokenRoadmapItems"), {
        title: formData.title.trim(),
        status: formData.status,
        notes: formData.notes.trim(),
        upvotes: [],
        comments: [],
        tokenAddress: tokenAddress.toLowerCase(),
        creatorAddress: creatorAddress?.toLowerCase() || address?.toLowerCase(),
        createdAt: new Date().toISOString(),
      });

      setShowAdminForm(false);
      toast({
        title: "Item added",
        description: "The roadmap item has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding token roadmap item:", error);
      toast({
        title: "Error",
        description: "Failed to add roadmap item. Please try again.",
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
      const itemRef = doc(db, "tokenRoadmapItems", itemId);
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
      if (!isCreator) {
        toast({
          title: "Permission denied",
          description: "Only the token creator can change roadmap status.",
          variant: "destructive",
        });
        return;
      }

      try {
        const itemRef = doc(db, "tokenRoadmapItems", activeItem.id);
        await updateDoc(itemRef, {
          status: newStatus,
        });

        toast({
          title: "Status updated",
          description: `Item moved to ${newStatus.replace("-", " ")}`,
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

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-48 bg-background/50 backdrop-blur-sm rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-foreground">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  // Empty state for non-creators with no items
  if (items.length === 0 && !isCreator) {
    return (
      <div className="h-full bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="text-3xl opacity-50">🗺️</div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              No roadmap yet
            </p>
            <p className="text-xs text-muted-foreground/70">
              The creator hasn&apos;t shared their plans
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Compact view (for sidebar)
  if (compact) {
    return (
      <div className="h-full bg-background/50 backdrop-blur-sm rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/20 bg-background/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Development Roadmap</span>
              {isCreator && <Crown className="h-3 w-3 text-primary" />}
            </div>

            {isCreator && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAdminForm(!showAdminForm)}
                className="h-6 w-6 text-primary hover:bg-primary/20"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Admin Form */}
        <AnimatePresence>
          {showAdminForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-border/20 bg-primary/5"
            >
              <div className="p-3">
                <AdminForm
                  isAdmin={isCreator}
                  onCustomSubmit={handleAddTokenRoadmapItem}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact Roadmap */}
        <div className="flex-1 overflow-y-auto p-3">
          {items.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="text-2xl opacity-30">🚀</div>
              <p className="text-xs text-muted-foreground">
                Add your first roadmap item
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-4">
                {statusKeys.map((status) => {
                  const statusItems = getItemsByStatus(status);
                  if (statusItems.length === 0) return null;

                  return (
                    <div key={status} className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {status.replace("-", " ")} ({statusItems.length})
                      </h4>
                      <div className="space-y-2">
                        {statusItems.map((item) => (
                          <div
                            key={item.id}
                            className="text-xs p-2 bg-background/30 rounded border border-border/20 hover:bg-background/50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-foreground font-medium line-clamp-1">
                                {item.title}
                              </span>
                              <button
                                onClick={() => handleUpvote(item.id)}
                                disabled={!address}
                                className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                              >
                                <span>
                                  {Array.isArray(item.upvotes)
                                    ? item.upvotes.length
                                    : 0}
                                </span>
                                <span>👍</span>
                              </button>
                            </div>
                            {item.notes && (
                              <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <DragOverlay>
                {activeItem ? (
                  <RoadmapItem
                    item={activeItem}
                    onUpvote={handleUpvote}
                    isConnecting={isConnecting}
                    address={address}
                    isExpanded={false}
                    onExpand={() => {}}
                    isDragging={true}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>
    );
  }

  // Full roadmap view (for main area or modal)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
            🗺️
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Development Roadmap
            </h2>
            <p className="text-muted-foreground">
              Track progress and vote on features
            </p>
          </div>
          {isCreator && (
            <Badge
              className="bg-primary/20 text-primary border-primary/30"
              variant="outline"
            >
              Creator Access
            </Badge>
          )}
          {!isCreator && (
            <Badge
              className="bg-secondary/20 text-secondary-foreground border-secondary/30"
              variant="outline"
            >
              Read Only
            </Badge>
          )}
        </div>
      </div>

      {/* Admin Form */}
      {isCreator && (
        <AdminForm
          isAdmin={isCreator}
          onCustomSubmit={handleAddTokenRoadmapItem}
        />
      )}

      {/* Full Roadmap Grid */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statusKeys.map((status) => (
            <DroppableColumn
              key={status}
              status={status}
              items={getItemsByStatus(status)}
              onUpvote={handleUpvote}
              isConnecting={isConnecting}
              address={address}
              expandedItemId={expandedItemId}
              onExpand={setExpandedItemId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem ? (
            <RoadmapItem
              item={activeItem}
              onUpvote={handleUpvote}
              isConnecting={isConnecting}
              address={address}
              isExpanded={false}
              onExpand={() => {}}
              isDragging={true}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
