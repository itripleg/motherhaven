// app/dex/components/roadmap/feature-posts/types.ts

export interface FeaturePost {
  id: string;
  title: string;
  content: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt?: string;
  authorAddress: string;
  upvotes: string[];
  comments: FeaturePostComment[];
  tokenAddress?: string; // For token-specific posts
}

export interface FeaturePostComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  upvotes: string[];
}

export const FEATURE_POST_LIMITS = {
  TITLE_MAX_LENGTH: 100,
  CONTENT_MAX_LENGTH: 1000,
  COMMENT_MAX_LENGTH: 300,
  MAX_COMMENTS_PER_POST: 100,
} as const;
