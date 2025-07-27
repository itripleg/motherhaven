// app/shop/components/ShopItemTabs.tsx
"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterBy } from "./ShopItemsContainer";
import { ShoppingBag, User, Sparkles, Crown } from "lucide-react";

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
      case FilterBy.NAMES:
        return "names";
      case FilterBy.EFFECTS:
        return "effects";
      case FilterBy.PREMIUM:
        return "premium";
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
      <TabsList className="grid w-full grid-cols-4 h-auto bg-secondary/30">
        <TabsTrigger
          value="all"
          className="text-xs sm:text-sm px-2 py-2 flex items-center gap-1"
        >
          <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">All Items</span>
          <span className="sm:hidden">All</span>
        </TabsTrigger>

        <TabsTrigger
          value="names"
          className="text-xs sm:text-sm px-2 py-2 flex items-center gap-1"
        >
          <User className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Names</span>
          <span className="sm:hidden">Names</span>
        </TabsTrigger>

        <TabsTrigger
          value="effects"
          className="text-xs sm:text-sm px-2 py-2 flex items-center gap-1"
        >
          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Effects</span>
          <span className="sm:hidden">Effects</span>
        </TabsTrigger>

        <TabsTrigger
          value="premium"
          className="text-xs sm:text-sm px-2 py-2 flex items-center gap-1"
        >
          <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Premium</span>
          <span className="sm:hidden">Premium</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
