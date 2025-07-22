// app/dex/components/roadmap/DroppableColumn.tsx - UPDATED: Added editable column titles
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { RoadmapItem as RoadmapItemType } from "./types";
import { RoadmapItem } from "./RoadmapItem";

interface DroppableColumnProps {
  status: RoadmapItemType["status"];
  items: RoadmapItemType[];
  onUpvote: (itemId: string) => void;
  isConnecting: boolean;
  address?: string;
  expandedItemId: string | null;
  onExpand: (itemId: string | null) => void;
  collection?: "roadmap" | "tokenRoadmapItems";
  // New props for editable titles
  isCreator?: boolean;
  columnTitle?: string;
  onTitleUpdate?: (status: RoadmapItemType["status"], newTitle: string) => void;
}

const defaultStatusConfig = {
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

const scrollbarStyles = {
  scrollbarWidth: "thin" as const,
  scrollbarColor: "hsl(var(--border)) transparent",
} as React.CSSProperties;

export function DroppableColumn({
  status,
  items,
  onUpvote,
  isConnecting,
  address,
  expandedItemId,
  onExpand,
  collection = "roadmap",
  isCreator = false,
  columnTitle,
  onTitleUpdate,
}: DroppableColumnProps) {
  const config = defaultStatusConfig[status];
  const displayTitle = columnTitle || config.label;

  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(displayTitle);

  // Create droppable zone for the entire column
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${status}`,
    data: {
      type: "column",
      status: status,
    },
  });

  const handleStartEdit = () => {
    setEditTitle(displayTitle);
    setIsEditing(true);
  };

  const handleSaveTitle = () => {
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle && trimmedTitle !== displayTitle && onTitleUpdate) {
      onTitleUpdate(status, trimmedTitle);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(displayTitle);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Column Header */}
      <div
        className={`p-4 rounded-lg ${config.bgColor} border ${config.borderColor} group`}
      >
        <div className="flex items-center justify-between">
          {isEditing ? (
            // Edit Mode
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`text-sm font-semibold ${config.color} bg-transparent border-none p-0 h-auto focus-visible:ring-1 focus-visible:ring-primary`}
                maxLength={50}
                autoFocus
                onBlur={handleSaveTitle}
              />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-green-500 hover:bg-green-500/20"
                  onClick={handleSaveTitle}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:bg-muted/20"
                  onClick={handleCancelEdit}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            // Display Mode
            <div className="flex items-center gap-2 flex-1">
              <h2 className={`font-semibold ${config.color} flex-1`}>
                {displayTitle}
              </h2>
              {isCreator && onTitleUpdate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/20 opacity-70 hover:opacity-100 transition-all duration-200"
                  onClick={handleStartEdit}
                  title="Edit column title"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {!isEditing && (
            <Badge
              variant="outline"
              className={`${config.color} border-current bg-transparent ml-2`}
            >
              {items.length}
            </Badge>
          )}
        </div>

        {/* Character count during editing */}
        {isEditing && (
          <div className="text-xs text-muted-foreground/70 mt-1 text-right">
            {editTitle.length}/50 characters
          </div>
        )}
      </div>

      {/* Droppable Items Container */}
      <div
        ref={setNodeRef}
        className={`relative transition-all duration-200 group ${
          isOver
            ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
            : ""
        }`}
      >
        <div
          className={`min-h-[200px] max-h-[600px] space-y-3 overflow-y-auto pr-1 scrollbar-thin rounded-lg transition-all duration-200 p-1 ${
            isOver ? "bg-primary/5" : ""
          }`}
          style={scrollbarStyles}
        >
          {items.length > 0 ? (
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <RoadmapItem
                  key={item.id}
                  item={item}
                  onUpvote={onUpvote}
                  isConnecting={isConnecting}
                  address={address}
                  isExpanded={expandedItemId === item.id}
                  onExpand={onExpand}
                  collection={collection}
                />
              ))}
            </SortableContext>
          ) : (
            /* Enhanced Empty State with Drop Zone */
            <div
              className={`text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-48 transition-all duration-200 ${
                isOver
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-border/60"
              }`}
            >
              <div
                className={`text-4xl mb-2 transition-all duration-200 ${
                  isOver ? "scale-110" : ""
                }`}
              >
                {isOver ? "👋" : "📝"}
              </div>
              <p className="text-sm font-medium">
                {isOver ? "Drop item here!" : "No items yet"}
              </p>
              <p className="text-xs opacity-70 mt-1">
                {isOver ? "" : "Drag items here or add new ones"}
              </p>
            </div>
          )}
        </div>

        {/* Scroll Indicator */}
        {items.length > 5 && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/90 via-background/60 to-transparent pointer-events-none flex items-end justify-center pb-1">
            <div className="text-xs text-muted-foreground/70 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border/40 shadow-sm">
              <span className="font-medium">{items.length}</span> items • Scroll
              for more
            </div>
          </div>
        )}

        {/* Top Fade Indicator (when scrolled) */}
        {items.length > 3 && (
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-background/50 to-transparent pointer-events-none z-10" />
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: hsl(var(--border));
          border-radius: 3px;
          transition: background-color 0.2s ease;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: hsl(var(--border) / 0.8);
        }
      `}</style>
    </div>
  );
}
