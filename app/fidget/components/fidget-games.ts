// components/fidget/fidget-games.ts

export interface FidgetGame {
  id: string;
  name: string;
  description: string;
  color: string;
  hoverColor: string;
}

export const FIDGET_GAMES: FidgetGame[] = [
  {
    id: "typing",
    name: "Random Typing",
    description: "Type random letters and discover words!",
    color: "#4f46e5",
    hoverColor: "#6366f1",
  },
  {
    id: "future2",
    name: "Coming Soon",
    description: "More fidget games coming soon!",
    color: "#16a34a",
    hoverColor: "#22c55e",
  },
  {
    id: "future3",
    name: "Coming Soon",
    description: "More fidget games coming soon!",
    color: "#ea580c",
    hoverColor: "#f97316",
  },
  {
    id: "future4",
    name: "Coming Soon",
    description: "More fidget games coming soon!",
    color: "#0284c7",
    hoverColor: "#0ea5e9",
  },
  {
    id: "future5",
    name: "Coming Soon",
    description: "More fidget games coming soon!",
    color: "#7c3aed",
    hoverColor: "#8b5cf6",
  },
  {
    id: "future6",
    name: "Coming Soon",
    description: "More fidget games coming soon!",
    color: "#be123c",
    hoverColor: "#e11d48",
  },
];
