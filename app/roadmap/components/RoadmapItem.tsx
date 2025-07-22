// app/roadmap/RoadmapItem.tsx
"use client";

import * as React from "react";
import { ChevronUp, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { RoadmapItem as RoadmapItemType } from "../types";
import { CommentsSection } from "./CommentsSection";

interface RoadmapItemProps {
  item: RoadmapItemType;
  onUpvote: (itemId: string) => void;
  isConnecting: boolean;
  address?: string;
  isExpanded: boolean;
  onExpand: (itemId: string | null) => void;
  isDragging?: boolean;
}

export function RoadmapItem({
  item,
  onUpvote,
  isConnecting,
  address,
  isExpanded,
  onExpand,
  isDragging = false,
}: RoadmapItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={`bg-card/50 border-border backdrop-blur-sm hover:bg-card/70 transition-all duration-300 group cursor-grab active:cursor-grabbing ${
          isDragging ? "shadow-lg rotate-3" : ""
        } ${isExpanded ? "ring-2 ring-primary/40" : ""}`}
        {...listeners}
      >
        <CardHeader className="pb-3 flex-row justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {item.title}
            </CardTitle>
            {item.notes && (
              <p className="text-xs text-muted-foreground mt-2">{item.notes}</p>
            )}
          </div>
          {isExpanded && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onExpand(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
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
              onClick={(e) => {
                e.stopPropagation();
                onUpvote(item.id);
              }}
              disabled={isConnecting}
            >
              <ChevronUp className="h-4 w-4" />
              {Array.isArray(item.upvotes) ? item.upvotes.length : 0}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onExpand(isExpanded ? null : item.id);
              }}
            >
              <MessageSquare className="h-4 w-4" />
              {item.comments?.length || 0}
            </Button>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mt-4 pt-4 border-t border-border/50 overflow-hidden"
              >
                <CommentsSection
                  itemId={item.id}
                  comments={item.comments || []}
                  address={address}
                  isConnecting={isConnecting}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
