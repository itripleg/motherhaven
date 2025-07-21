// app/shop/types/index.ts - Simplified for vanity names only

import { type Address } from "viem";

// =================================================================
//                       SIMPLE SHOP TYPES
// =================================================================

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number; // Cost in VAIN tokens (with decimals)
  rarity: ItemRarity;
  preview: string; // Emoji
  position: { x: number; y: number }; // Position on shop rug (percentage)
  isAvailable: boolean;
  requiresBurnBalance?: number; // Minimum burn balance needed
}

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

// =================================================================
//                       USER DATA TYPES
// =================================================================

export interface UserShopData {
  // From your existing vanity contract
  burnBalance: bigint;        // Total tokens burned
  spentBalance: bigint;       // Total spent on vanity names
  availableBalance: bigint;   // Available for name changes
  possibleNameChanges: number; // How many name changes user can make
  
  // Current vanity name info
  currentVanityName: string;
  canSetName: boolean;
}

// =================================================================
//                       MERCHANT TYPES
// =================================================================

export interface MerchantState {
  currentMessage: string;
  pointingTarget: string | null; // Item ID being pointed at
  mood: 'neutral' | 'happy' | 'excited' | 'disappointed';
}

// =================================================================
//                       TRANSACTION TYPES
// =================================================================

export interface VanityPurchaseResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  newBurnBalance?: bigint;
}

// =================================================================
//                       COMPONENT PROPS
// =================================================================

export interface ShopItemProps {
  item: ShopItem;
  canPurchase: boolean;
  userBalance: number;
  onHover: (item: ShopItem | null) => void;
  onPurchase: (item: ShopItem) => void;
  isLoading?: boolean;
}

export interface MerchantCharacterProps {
  state: MerchantState;
  onMessageChange: (message: string) => void;
}

export interface UserBalanceProps {
  balance: bigint | null;
  isLoading: boolean;
}

export interface ShopBackgroundProps {
  variant?: 'default' | 'minimal';
  intensity?: 'low' | 'medium' | 'high';
}

// =================================================================
//                       CONSTANTS
// =================================================================

export const RARITY_COLORS = {
  common: '#9CA3AF',
  rare: '#60A5FA', 
  epic: '#A78BFA',
  legendary: '#FBBF24',
} as const;

export const VANITY_BURN_MANAGER_ADDRESS = '0xD4CfB3DE8E54D37b5e7e14755c13A8c384BaBf29' as Address;

// =================================================================
//                       SHOP ITEMS - SIMPLE LIST
// =================================================================

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'vanity_name_change',
    name: 'Vanity Name Token',
    description: 'Change your display name',
    cost: 1000, // 1000 VAIN tokens
    rarity: 'common',
    preview: '📛',
    position: { x: 40, y: 40 },
    isAvailable: true,
    requiresBurnBalance: 1000,
  },
  // Future items can be added here
  {
    id: 'premium_name_reservation', 
    name: 'Premium Name Reserve',
    description: 'Reserve a name for 30 days',
    cost: 2500,
    rarity: 'rare',
    preview: '🛡️',
    position: { x: 60, y: 30 },
    isAvailable: false, // Not implemented yet
    requiresBurnBalance: 2500,
  },
  {
    id: 'rainbow_name_effect',
    name: 'Rainbow Name Effect', 
    description: 'Make your name shimmer',
    cost: 5000,
    rarity: 'epic',
    preview: '🌈',
    position: { x: 30, y: 60 },
    isAvailable: false, // Future feature
    requiresBurnBalance: 5000,
  },
];

// =================================================================
//                       CONTRACT INTEGRATION
// =================================================================

// Your existing vanity contract ABI (simplified)
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
] as const;

// VAIN Token for burning
export const VAIN_TOKEN_ADDRESS = '0x' as Address; // You'll need to provide this
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
] as const;