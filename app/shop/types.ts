// app/shop/types.ts - Updated for new shop container system

import { type Address } from "viem";

// =================================================================
//                       ENHANCED SHOP TYPES
// =================================================================

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number; // Cost in VAIN tokens (with decimals)
  rarity: ItemRarity;
  preview: string; // Emoji or icon
  category: ItemCategory; // New: categorization for filtering
  isAvailable: boolean;
  requiresBurnBalance?: number; // Minimum burn balance needed
  createdAt?: string; // New: for sorting by date
  isPurchased?: boolean; // New: track if user owns this item
  stock?: number; // New: limited quantity items (optional)
  salePrice?: number; // New: discounted price (optional)
  tags?: string[]; // New: for advanced search/filtering
}

export type ItemRarity = "common" | "rare" | "epic" | "legendary";

export type ItemCategory =
  | "vanity" // Name changes, profile customization
  | "upgrades" // Account upgrades, premium features
  | "effects" // Visual effects, animations
  | "collectibles" // Limited edition items, achievements
  | "utility"; // Functional items, tools

// =================================================================
//                       USER DATA TYPES
// =================================================================

export interface UserShopData {
  // From your existing vanity contract
  burnBalance: bigint; // Total tokens burned
  spentBalance: bigint; // Total spent on vanity names
  availableBalance: bigint; // Available for purchases
  possibleNameChanges: number; // How many name changes user can make

  // Current vanity name info
  currentVanityName: string;
  canSetName: boolean;

  // New: purchased items tracking
  purchasedItems: string[]; // Array of item IDs
  purchaseHistory: PurchaseRecord[];
}

export interface PurchaseRecord {
  itemId: string;
  purchaseDate: string;
  pricePaid: number;
  transactionHash?: string;
}

// =================================================================
//                       MERCHANT TYPES
// =================================================================

export interface MerchantState {
  currentMessage: string;
  pointingTarget: string | null; // Item ID being pointed at
  mood: "neutral" | "happy" | "excited" | "disappointed";
  lastInteraction?: string; // Track user interactions
}

// =================================================================
//                       TRANSACTION TYPES
// =================================================================

export interface PurchaseResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  newBalance?: bigint;
  item: ShopItem;
}

export interface PurchaseRequest {
  itemId: string;
  userAddress: Address;
  paymentMethod: "vain_burn" | "vain_transfer"; // Future: multiple payment methods
}

// =================================================================
//                       COMPONENT PROPS
// =================================================================

export interface ShopItemProps {
  item: ShopItem;
  canPurchase: boolean;
  userBalance: number;
  onHover?: (item: ShopItem | null) => void;
  onPurchase?: (item: ShopItem) => void;
  isLoading?: boolean;
}

export interface ShopItemCardProps extends ShopItemProps {
  // Additional props specific to card display
  showCategory?: boolean;
  showStock?: boolean;
  compact?: boolean;
}

export interface MerchantCharacterProps {
  state: MerchantState;
  onMessageChange: (message: string) => void;
  userBalance?: number;
  recentPurchases?: PurchaseRecord[];
}

export interface UserBalanceProps {
  balance: bigint | null;
  isLoading: boolean;
  showBreakdown?: boolean; // Show burned vs available
}

export interface ShopBackgroundProps {
  variant?: "default" | "minimal" | "premium";
  intensity?: "low" | "medium" | "high";
  theme?: "coins" | "sparkles" | "stars";
}

// =================================================================
//                       FILTERING & SORTING
// =================================================================

export interface ShopFilters {
  category?: ItemCategory;
  rarity?: ItemRarity;
  priceMin?: number;
  priceMax?: number;
  availableOnly?: boolean;
  affordableOnly?: boolean;
  ownedOnly?: boolean;
  tags?: string[];
}

export interface ShopSortOptions {
  field: "name" | "price" | "rarity" | "category" | "createdAt";
  direction: "asc" | "desc";
}

// =================================================================
//                       CONSTANTS
// =================================================================

export const RARITY_COLORS = {
  common: "#9CA3AF", // Gray
  rare: "#60A5FA", // Blue
  epic: "#A78BFA", // Purple
  legendary: "#FBBF24", // Gold
} as const;

export const CATEGORY_COLORS = {
  vanity: "#F59E0B", // Amber
  upgrades: "#10B981", // Emerald
  effects: "#8B5CF6", // Violet
  collectibles: "#F97316", // Orange
  utility: "#6B7280", // Gray
} as const;

export const RARITY_ORDER = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
} as const;

// Contract addresses - use environment variable
export const VANITY_BURN_MANAGER_ADDRESS = (process.env
  .NEXT_PUBLIC_VANITY_BURN_MANAGER_ADDRESS ||
  "0x28A22Aa2A6070ED4739EA8c183aD160075bFcBeb") as Address;

// =================================================================
//                       SHOP ITEMS - EXPANDABLE LIST
// =================================================================

export const SHOP_ITEMS: ShopItem[] = [
  // Vanity Items
  {
    id: "vanity_name_change",
    name: "Vanity Name Token",
    description: "Change your display name in the app",
    cost: 1000,
    rarity: "common",
    category: "vanity",
    preview: "📛",
    isAvailable: true,
    requiresBurnBalance: 1000,
    createdAt: "2024-01-01T00:00:00Z",
    tags: ["name", "identity", "customization"],
  },
  {
    id: "premium_name_reservation",
    name: "Premium Name Reserve",
    description:
      "Reserve a premium name for 30 days before it becomes available",
    cost: 2500,
    rarity: "rare",
    category: "vanity",
    preview: "🛡️",
    isAvailable: false, // Coming soon
    requiresBurnBalance: 2500,
    createdAt: "2024-01-15T00:00:00Z",
    tags: ["name", "reservation", "premium"],
  },

  // Effect Items
  {
    id: "rainbow_name_effect",
    name: "Rainbow Name Effect",
    description: "Make your name shimmer with rainbow colors",
    cost: 5000,
    rarity: "epic",
    category: "effects",
    preview: "🌈",
    isAvailable: false, // Future feature
    requiresBurnBalance: 5000,
    createdAt: "2024-02-01T00:00:00Z",
    tags: ["rainbow", "effect", "animation"],
  },
  {
    id: "sparkle_effect",
    name: "Sparkle Animation",
    description: "Add sparkling effects to your profile",
    cost: 3000,
    rarity: "rare",
    category: "effects",
    preview: "✨",
    isAvailable: false,
    requiresBurnBalance: 3000,
    createdAt: "2024-02-15T00:00:00Z",
    tags: ["sparkle", "effect", "profile"],
  },

  // Upgrade Items
  {
    id: "premium_account",
    name: "Premium Account",
    description: "Unlock premium features and priority support",
    cost: 10000,
    rarity: "epic",
    category: "upgrades",
    preview: "👑",
    isAvailable: false,
    requiresBurnBalance: 10000,
    createdAt: "2024-03-01T00:00:00Z",
    tags: ["premium", "upgrade", "features"],
  },

  // Collectible Items
  {
    id: "founder_badge",
    name: "Founder Badge",
    description: "Exclusive badge for early supporters",
    cost: 25000,
    rarity: "legendary",
    category: "collectibles",
    preview: "🏆",
    isAvailable: false,
    requiresBurnBalance: 25000,
    stock: 100, // Limited quantity
    createdAt: "2024-01-01T00:00:00Z",
    tags: ["founder", "badge", "exclusive", "limited"],
  },

  // Utility Items
  {
    id: "advanced_analytics",
    name: "Advanced Analytics",
    description: "Detailed insights into your trading performance",
    cost: 7500,
    rarity: "epic",
    category: "utility",
    preview: "📊",
    isAvailable: false,
    requiresBurnBalance: 7500,
    createdAt: "2024-03-15T00:00:00Z",
    tags: ["analytics", "trading", "insights"],
  },
];

// =================================================================
//                       CONTRACT INTEGRATION
// =================================================================

// Your existing vanity contract ABI (enhanced)
export const VANITY_BURN_MANAGER_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserBurnInfo",
    outputs: [
      { name: "totalBurned", type: "uint256" },
      { name: "totalSpent", type: "uint256" },
      { name: "availableBalance", type: "uint256" },
      { name: "possibleNameChanges", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "canUserSetName",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserVanityName",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "newName", type: "string" }],
    name: "setVanityName",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // New: for future shop functionality
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserPurchasedItems",
    outputs: [{ name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "itemId", type: "string" },
      { name: "cost", type: "uint256" },
    ],
    name: "purchaseItem",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// VAIN Token for burning/spending
export const VAIN_TOKEN_ADDRESS = "0x" as Address; // You'll need to provide this
export const VAIN_TOKEN_ABI = [
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
