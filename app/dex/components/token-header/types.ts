// app/dex/components/token-header/types.ts
export interface ImagePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fit?: "cover" | "contain" | "fill";
}

export interface TokenHeaderData {
  address: string;
  name: string;
  symbol: string;
  imageUrl?: string;
  description?: string;
  creator?: string;
  currentPrice?: string;
  fundingGoal?: string;
  collateral?: string;
  state?: number;
  createdAt?: string;
  imagePosition?: ImagePosition;
}

export interface EditableImageConfig {
  canEdit: boolean;
  onSave?: (position: ImagePosition) => Promise<boolean>;
  isUpdating?: boolean;
}
