// app/dex/components/roadmap/TokenRoadmap.tsx - UPDATED: Added editable column titles
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Map, Crown, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";

// Import from the roadmap components in the same directory structure
import { RoadmapItem as RoadmapItemType } from "./types";
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

interface TokenColumnTitles {
  considering: string;
  planned: string;
  "in-progress": string;
  completed: string;
}

interface TokenRoadmapHeaders {
  title: string;
  subtitle: string;
}

const defaultColumnTitles: TokenColumnTitles = {
  considering: "Considering",
  planned: "Planned",
  "in-progress": "In Progress",
  completed: "Completed",
};

const defaultHeaders: TokenRoadmapHeaders = {
  title: "Development Roadmap",
  subtitle: "Track progress and vote on features",
};

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
  const [columnTitles, setColumnTitles] =
    React.useState<TokenColumnTitles>(defaultColumnTitles);
  const [headers, setHeaders] =
    React.useState<TokenRoadmapHeaders>(defaultHeaders);
  const [expandedItemId, setExpandedItemId] = React.useState<string | null>(
    null
  );
  const [activeItem, setActiveItem] = React.useState<RoadmapItemType | null>(
    null
  );
  const [mounted, setMounted] = React.useState(false);
  const [showAdminForm, setShowAdminForm] = React.useState(false);

  // Header editing state
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState("");
  const [editSubtitle, setEditSubtitle] = React.useState("");

  const { toast } = useToast();
  const { address, isConnecting, isDisconnected } = useAccount();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch column titles and headers for this token
  React.useEffect(() => {
    if (!mounted || !tokenAddress) return;

    const fetchTokenSettings = async () => {
      try {
        const settingsDoc = await getDoc(
          doc(db, "tokenRoadmapSettings", tokenAddress.toLowerCase())
        );
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setColumnTitles(data.columnTitles || defaultColumnTitles);
          setHeaders(data.headers || defaultHeaders);
        }
      } catch (error) {
        console.error("Error fetching token settings:", error);
        // Use default settings on error
      }
    };

    fetchTokenSettings();
  }, [mounted, tokenAddress]);

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

  // Handle header updates
  const handleHeaderUpdate = async (
    type: "title" | "subtitle",
    newValue: string
  ) => {
    if (!isCreator) return;

    try {
      const updatedHeaders = { ...headers, [type]: newValue };

      // Update Firestore
      await setDoc(
        doc(db, "tokenRoadmapSettings", tokenAddress.toLowerCase()),
        {
          tokenAddress: tokenAddress.toLowerCase(),
          headers: updatedHeaders,
          columnTitles: columnTitles, // Preserve existing column titles
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Update local state
      setHeaders(updatedHeaders);

      toast({
        title: `${type === "title" ? "Title" : "Subtitle"} updated`,
        description: `${
          type === "title" ? "Title" : "Subtitle"
        } updated to "${newValue}"`,
      });
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${type}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Header editing handlers
  const handleStartTitleEdit = () => {
    setEditTitle(headers.title);
    setIsEditingTitle(true);
  };

  const handleStartSubtitleEdit = () => {
    setEditSubtitle(headers.subtitle);
    setIsEditingSubtitle(true);
  };

  const handleSaveTitle = () => {
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle && trimmedTitle !== headers.title) {
      handleHeaderUpdate("title", trimmedTitle);
    }
    setIsEditingTitle(false);
  };

  const handleSaveSubtitle = () => {
    const trimmedSubtitle = editSubtitle.trim();
    if (trimmedSubtitle && trimmedSubtitle !== headers.subtitle) {
      handleHeaderUpdate("subtitle", trimmedSubtitle);
    }
    setIsEditingSubtitle(false);
  };

  const handleCancelTitleEdit = () => {
    setEditTitle(headers.title);
    setIsEditingTitle(false);
  };

  const handleCancelSubtitleEdit = () => {
    setEditSubtitle(headers.subtitle);
    setIsEditingSubtitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelTitleEdit();
    }
  };

  const handleSubtitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveSubtitle();
    } else if (e.key === "Escape") {
      handleCancelSubtitleEdit();
    }
  };
  // Handle column title updates
  const handleTitleUpdate = async (
    status: RoadmapItemType["status"],
    newTitle: string
  ) => {
    if (!isCreator) return;

    try {
      const updatedTitles = { ...columnTitles, [status]: newTitle };

      // Update Firestore
      await setDoc(
        doc(db, "tokenRoadmapSettings", tokenAddress.toLowerCase()),
        {
          tokenAddress: tokenAddress.toLowerCase(),
          columnTitles: updatedTitles,
          headers: headers, // Preserve existing headers
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Update local state
      setColumnTitles(updatedTitles);

      toast({
        title: "Column updated",
        description: `Column renamed to "${newTitle}"`,
      });
    } catch (error) {
      console.error("Error updating column title:", error);
      toast({
        title: "Error",
        description: "Failed to update column title. Please try again.",
        variant: "destructive",
      });
    }
  };

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
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    className="font-medium text-sm bg-transparent border-none p-0 h-auto focus-visible:ring-1 focus-visible:ring-primary"
                    maxLength={60}
                    autoFocus
                    onBlur={handleSaveTitle}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 text-green-500 hover:bg-green-500/20"
                    onClick={handleSaveTitle}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 text-muted-foreground hover:bg-muted/20"
                    onClick={handleCancelTitleEdit}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <span className="font-medium text-sm">{headers.title}</span>
                  {isCreator && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/20 opacity-70 hover:opacity-100 transition-all duration-200"
                      onClick={handleStartTitleEdit}
                      title="Edit title"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
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
                        {columnTitles[status]} ({statusItems.length})
                      </h4>
                      <div className="space-y-2">
                        {statusItems.map((item) => (
                          <RoadmapItem
                            key={item.id}
                            item={item}
                            onUpvote={handleUpvote}
                            isConnecting={isConnecting}
                            address={address}
                            isExpanded={expandedItemId === item.id}
                            onExpand={setExpandedItemId}
                            collection="tokenRoadmapItems"
                          />
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
                    collection="tokenRoadmapItems"
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
            {isEditingTitle ? (
              <div className="flex items-center gap-2 mb-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="text-2xl font-bold text-foreground bg-transparent border-none p-0 h-auto focus-visible:ring-1 focus-visible:ring-primary"
                  maxLength={60}
                  autoFocus
                  onBlur={handleSaveTitle}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-green-500 hover:bg-green-500/20"
                  onClick={handleSaveTitle}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:bg-muted/20"
                  onClick={handleCancelTitleEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group mb-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {headers.title}
                </h2>
                {isCreator && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/20 opacity-70 hover:opacity-100 transition-all duration-200"
                    onClick={handleStartTitleEdit}
                    title="Edit title"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {isEditingSubtitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  onKeyDown={handleSubtitleKeyDown}
                  className="text-muted-foreground bg-transparent border-none p-0 h-auto focus-visible:ring-1 focus-visible:ring-primary"
                  maxLength={100}
                  autoFocus
                  onBlur={handleSaveSubtitle}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-green-500 hover:bg-green-500/20"
                  onClick={handleSaveSubtitle}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:bg-muted/20"
                  onClick={handleCancelSubtitleEdit}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <p className="text-muted-foreground">{headers.subtitle}</p>
                {isCreator && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/20 opacity-70 hover:opacity-100 transition-all duration-200"
                    onClick={handleStartSubtitleEdit}
                    title="Edit subtitle"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
          {/* {isCreator && (
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
          )} */}
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
              collection="tokenRoadmapItems"
              isCreator={isCreator}
              columnTitle={columnTitles[status]}
              onTitleUpdate={handleTitleUpdate}
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
              collection="tokenRoadmapItems"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
