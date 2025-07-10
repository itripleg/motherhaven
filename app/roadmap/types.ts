// app/roadmap/types.ts

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  status: "considering" | "planned" | "in-progress" | "completed";
  upvotes: string[];
  comments: Comment[];
  notes?: string;
  createdAt?: string;
}

export const ADMIN_ADDRESSES = ["0xd85327505Ab915AB0C1aa5bC6768bF4002732258"];

export const statusKeys: RoadmapItem["status"][] = [
  "considering",
  "planned",
  "in-progress",
  "completed",
];
