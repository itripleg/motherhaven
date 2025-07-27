// app/shop/components/ShopItemTabs.tsx
"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterBy } from "./ShopItemsContainer";
import {
  ShoppingBag,
  User,
  Sparkles,
  Star,
  Trophy,
  CheckCircle,
  DollarSign,
} from "lucide-react";

interface ShopItemTabsProps {
  onCategoryChange: (category: string) => void;
  activeCategory?: FilterBy;
}

export const ShopItemTabs = ({
  onCategoryChange,
  activeCategory = FilterBy.ALL,
}: ShopItemTabsProps) => {
  // Map FilterBy enum to tab values
  const getTabValue = (filter: FilterBy): string => {
    switch (filter) {
      case FilterBy.ALL:
        return "all";
      case FilterBy.VANITY:
        return "vanity";
      case FilterBy.UPGRADES:
        return "upgrades";
      case FilterBy.EFFECTS:
        return "effects";
      case FilterBy.COLLECTIBLES:
        return "collectibles";
      case FilterBy.AVAILABLE:
        return "available";
      case FilterBy.AFFORDABLE:
        return "affordable";
      default:
        return "all";
    }
  };

  const handleTabChange = (value: string) => {
    onCategoryChange(value);
  };

  return (
    <Tabs
      value={getTabValue(activeCategory)}
      onValueChange={handleTabChange}
      className="mb-8 opacity-90"
    >
      <TabsList className="grid w-full grid-cols-7 h-auto bg-secondary/30">
        <TabsTrigger
          value="all"
          className="text-xs sm:text-sm px-2 py-2 flex items-center gap-1"
        >
          <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">All Items</span>
          <span className="sm:hidden">All</span>
        </TabsTrigger>

        <TabsTrigger
          value="vanity"
          className="text-xs sm:text-sm px-2 py-2 flex items-center gap-1"
        >
          <User className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Vanity</span>
          <span className="sm:hidden">Name</span>
        </TabsTrigger>

        <TabsTrigger
          value="upgrades"
          className="text-xs sm:text-sm px-2 py-2 flex items-center gap-1"
        >
          <Star className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Upgrades</span>
          <span className="sm:hidden">Up</span>
        </TabsTrigger>

        <TabsTrigger
          value="effects"
          className="text-xs sm:text-sm px-2 py-2 flex items-center gap-1"
        >
          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Effects</span>
          <span className="sm:hidden">FX</span>
        </TabsTrigger>

        <TabsTrigger
          value="collectibles"
          className="text-xs sm:text-sm px-2 py-2 flex items-center gap-1"
        >
          <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Collectibles</span>
          <span className="sm:hidden">Rare</span>
        </TabsTrigger>

        <TabsTrigger
          value="available"
          className="text-xs sm:text-sm px-2 py-2 flex items-center gap-1"
        >
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Available</span>
          <span className="sm:hidden">Live</span>
        </TabsTrigger>

        <TabsTrigger
          value="affordable"
          className="text-xs sm:text-sm px-2 py-2 flex items-center gap-1"
        >
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Affordable</span>
          <span className="sm:hidden">$$$</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
