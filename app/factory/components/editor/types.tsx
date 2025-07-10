// app/factory/components/editor/types.ts
export interface ImagePosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fit?: "cover" | "contain" | "fill";
}

export interface FactoryTokenData {
  name: string;
  symbol: string;
  imageUrl?: string;
  description?: string;
  imagePosition?: ImagePosition;
}

export interface EditableImageConfig {
  canEdit: boolean;
  onSave?: (position: ImagePosition, description?: string) => Promise<boolean>;
  isUpdating?: boolean;
}
