// app/roadmap/components/DroppableColumn.tsx (Tailwind-only version)
"use client";

import { Badge } from "@/components/ui/badge";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { RoadmapItem as RoadmapItemType } from "../types";
import { RoadmapItem } from "./RoadmapItem";

interface DroppableColumnProps {
  status: RoadmapItemType["status"];
  items: RoadmapItemType[];
  onUpvote: (itemId: string) => void;
  isConnecting: boolean;
  address?: string;
  expandedItemId: string | null;
  onExpand: (itemId: string | null) => void;
}

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
}: DroppableColumnProps) {
  const config = statusConfig[status];

  return (
    <div className="space-y-4">
      {/* Column Header */}
      <div
        className={`p-4 rounded-lg ${config.bgColor} border ${config.borderColor}`}
      >
        <div className="flex items-center justify-between">
          <h2 className={`font-semibold ${config.color}`}>{config.label}</h2>
          <Badge
            variant="outline"
            className={`${config.color} border-current bg-transparent`}
          >
            {items.length}
          </Badge>
        </div>
      </div>

      {/* Scrollable Items Container */}
      <div className="relative">
        <div
          className="min-h-[200px] max-h-[600px] space-y-3 overflow-y-auto pr-1 scrollbar-thin"
          style={scrollbarStyles}
        >
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
              />
            ))}
          </SortableContext>

          {/* Empty State */}
          {items.length === 0 && (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center h-32">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-sm">Drop items here</p>
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
