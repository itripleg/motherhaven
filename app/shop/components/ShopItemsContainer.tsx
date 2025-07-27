// app/shop/components/ShopItemsContainer.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SortAsc,
  SortDesc,
  RefreshCw,
  ChevronDown,
  Check,
  Grid3X3,
  LayoutGrid,
  Grid2X2,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ShopItemTabs } from "./ShopItemTab";
import { ShopItemGrid } from "./ShopItemGrid";
import { type ShopItem, type ItemRarity } from "../types";

interface ShopItemsContainerProps {
  searchQuery?: string;
  userBalance?: number;
  onPurchase?: (item: ShopItem) => void;
}

// Filter categories for shop items
export enum FilterBy {
  ALL = "all",
  VANITY = "vanity",
  UPGRADES = "upgrades",
  EFFECTS = "effects",
  COLLECTIBLES = "collectibles",
  AVAILABLE = "available",
  AFFORDABLE = "affordable",
}

// Sort options for shop items
export enum SortBy {
  NEWEST = "newest",
  OLDEST = "oldest",
  NAME = "name",
  PRICE_LOW = "price_low",
  PRICE_HIGH = "price_high",
  RARITY = "rarity",
}

export enum SortDirection {
  ASC = "asc",
  DESC = "desc",
}

// Grid layout type
type GridLayout = 3 | 4 | 5;

// localStorage keys
const STORAGE_KEYS = {
  FILTER: "shop-container-filter",
  SORT_BY: "shop-container-sort-by",
  SORT_DIRECTION: "shop-container-sort-direction",
  GRID_LAYOUT: "shop-container-grid-layout",
} as const;

// Helper functions for localStorage
const saveToStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Failed to save to localStorage:", error);
  }
};

const loadFromStorage = (key: string, defaultValue: string) => {
  try {
    const saved = localStorage.getItem(key);
    return saved !== null ? saved : defaultValue;
  } catch (error) {
    console.warn("Failed to load from localStorage:", error);
    return defaultValue;
  }
};

// Popover Dropdown Component
const PopoverDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-9 px-3 font-normal",
            className
          )}
        >
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div className="max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between",
                value === option.value && "bg-accent text-accent-foreground"
              )}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Grid Layout Button Component
const GridLayoutButton = ({
  currentLayout,
  onLayoutChange,
}: {
  currentLayout: GridLayout;
  onLayoutChange: (layout: GridLayout) => void;
}) => {
  const layouts: {
    value: GridLayout;
    icon: React.ComponentType<any>;
    label: string;
  }[] = [
    { value: 3, icon: Grid3X3, label: "3 Columns" },
    { value: 4, icon: LayoutGrid, label: "4 Columns" },
    { value: 5, icon: Grid2X2, label: "5 Columns" },
  ];

  const currentLayoutConfig =
    layouts.find((l) => l.value === currentLayout) || layouts[0];
  const CurrentIcon = currentLayoutConfig.icon;

  const cycleLayout = () => {
    const currentIndex = layouts.findIndex((l) => l.value === currentLayout);
    const nextIndex = (currentIndex + 1) % layouts.length;
    onLayoutChange(layouts[nextIndex].value);
  };

  return (
    <div className="w-[40px]">
      <Button
        variant="outline"
        size="sm"
        onClick={cycleLayout}
        className="w-full h-9 p-0"
        title={`Current: ${currentLayoutConfig.label}. Click to cycle.`}
      >
        <CurrentIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const ShopItemsContainer: React.FC<ShopItemsContainerProps> = ({
  searchQuery = "",
  userBalance = 0,
  onPurchase,
}) => {
  // Initialize state with localStorage values
  const [filter, setFilter] = useState<FilterBy>(() => {
    const saved = loadFromStorage(STORAGE_KEYS.FILTER, FilterBy.ALL);
    return Object.values(FilterBy).includes(saved as FilterBy)
      ? (saved as FilterBy)
      : FilterBy.ALL;
  });

  const [sortBy, setSortBy] = useState<SortBy>(() => {
    const saved = loadFromStorage(STORAGE_KEYS.SORT_BY, SortBy.NEWEST);
    return Object.values(SortBy).includes(saved as SortBy)
      ? (saved as SortBy)
      : SortBy.NEWEST;
  });

  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const saved = loadFromStorage(
      STORAGE_KEYS.SORT_DIRECTION,
      SortDirection.DESC
    );
    return Object.values(SortDirection).includes(saved as SortDirection)
      ? (saved as SortDirection)
      : SortDirection.DESC;
  });

  const [gridLayout, setGridLayout] = useState<GridLayout>(() => {
    const saved = loadFromStorage(STORAGE_KEYS.GRID_LAYOUT, "3");
    const layout = parseInt(saved) as GridLayout;
    return [3, 4, 5].includes(layout) ? layout : 3;
  });

  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sort options for the dropdown
  const sortOptions = [
    { value: SortBy.NEWEST, label: "Newest First" },
    { value: SortBy.OLDEST, label: "Oldest First" },
    { value: SortBy.NAME, label: "Name A-Z" },
    { value: SortBy.PRICE_LOW, label: "Price: Low to High" },
    { value: SortBy.PRICE_HIGH, label: "Price: High to Low" },
    { value: SortBy.RARITY, label: "Rarity" },
  ];

  // Save to localStorage when state changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.FILTER, filter);
  }, [filter]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SORT_BY, sortBy);
  }, [sortBy]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SORT_DIRECTION, sortDirection);
  }, [sortDirection]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.GRID_LAYOUT, gridLayout.toString());
  }, [gridLayout]);

  // TODO: Replace with actual data fetching
  useEffect(() => {
    setLoading(true);
    // Simulate loading
    setTimeout(() => {
      setShopItems([]); // Will be populated with real data
      setLoading(false);
    }, 1000);
  }, []);

  // Sorting and filtering logic
  const filteredAndSortedItems = useMemo(() => {
    let items = [...shopItems];

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    // Apply category filters
    if (filter === FilterBy.VANITY) {
      items = items.filter((item) => item.category === "vanity");
    } else if (filter === FilterBy.UPGRADES) {
      items = items.filter((item) => item.category === "upgrades");
    } else if (filter === FilterBy.EFFECTS) {
      items = items.filter((item) => item.category === "effects");
    } else if (filter === FilterBy.COLLECTIBLES) {
      items = items.filter((item) => item.category === "collectibles");
    } else if (filter === FilterBy.AVAILABLE) {
      items = items.filter((item) => item.isAvailable);
    } else if (filter === FilterBy.AFFORDABLE) {
      items = items.filter((item) => userBalance >= item.cost);
    }

    // Apply sorting
    items.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case SortBy.NAME:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case SortBy.PRICE_LOW:
        case SortBy.PRICE_HIGH:
          aValue = a.cost;
          bValue = b.cost;
          if (sortBy === SortBy.PRICE_HIGH) {
            [aValue, bValue] = [bValue, aValue];
          }
          break;
        case SortBy.RARITY:
          const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
          aValue = rarityOrder[a.rarity];
          bValue = rarityOrder[b.rarity];
          break;
        case SortBy.OLDEST:
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case SortBy.NEWEST:
        default:
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === SortDirection.ASC
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === SortDirection.ASC
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return items;
  }, [shopItems, searchQuery, filter, sortBy, sortDirection, userBalance]);

  // Map tab categories to FilterBy enum
  const handleTabChange = (category: string) => {
    switch (category) {
      case "all":
        setFilter(FilterBy.ALL);
        break;
      case "vanity":
        setFilter(FilterBy.VANITY);
        break;
      case "upgrades":
        setFilter(FilterBy.UPGRADES);
        break;
      case "effects":
        setFilter(FilterBy.EFFECTS);
        break;
      case "collectibles":
        setFilter(FilterBy.COLLECTIBLES);
        break;
      case "available":
        setFilter(FilterBy.AVAILABLE);
        break;
      case "affordable":
        setFilter(FilterBy.AFFORDABLE);
        break;
      default:
        setFilter(FilterBy.ALL);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4 min-h-[40px]">
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Show active search */}
          {searchQuery && (
            <Badge variant="secondary" className="flex-shrink-0">
              "{searchQuery}"
            </Badge>
          )}

          {/* Show item count */}
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredAndSortedItems.length} item
            {filteredAndSortedItems.length !== 1 ? "s" : ""} found
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Grid Layout Toggle */}
          <div className="hidden md:block">
            <GridLayoutButton
              currentLayout={gridLayout}
              onLayoutChange={setGridLayout}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="w-[140px]">
            <PopoverDropdown
              value={sortBy}
              onChange={(value) => setSortBy(value as SortBy)}
              options={sortOptions}
              className="w-full"
            />
          </div>

          {/* Sort Direction */}
          <div className="w-[40px]">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSortDirection(
                  sortDirection === SortDirection.ASC
                    ? SortDirection.DESC
                    : SortDirection.ASC
                )
              }
              className="w-full h-9"
            >
              {sortDirection === SortDirection.ASC ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Refresh */}
          <div className="w-[40px]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                // TODO: Implement refresh logic
                setTimeout(() => setLoading(false), 1000);
              }}
              className="w-full h-9"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <ShopItemTabs
        onCategoryChange={handleTabChange}
        activeCategory={filter}
      />

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-pulse flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading shop items...
          </div>
        </div>
      ) : error ? (
        <div className="text-center p-8">
          <div className="text-red-600 mb-2">{error}</div>
          <Button variant="outline">Try Again</Button>
        </div>
      ) : (
        <div className="">
          <ShopItemGrid
            items={filteredAndSortedItems}
            gridLayout={gridLayout}
            userBalance={userBalance}
            onPurchase={onPurchase}
          />
        </div>
      )}
    </div>
  );
};
