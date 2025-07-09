// components/tokens/TokenTabs.tsx - Mobile-friendly version
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterBy } from "@/final-hooks/useTokenList";

interface TokenTabsProps {
  onCategoryChange: (category: string) => void;
  activeCategory?: FilterBy;
}

export const TokenTabs = ({
  onCategoryChange,
  activeCategory = FilterBy.ALL,
}: TokenTabsProps) => {
  // Map FilterBy enum to tab values
  const getTabValue = (filter: FilterBy): string => {
    switch (filter) {
      case FilterBy.ALL:
        return "all";
      case FilterBy.NEW:
        return "new";
      case FilterBy.TRADING:
        return "trading";
      case FilterBy.TRENDING:
        return "trending";
      case FilterBy.GOAL_REACHED:
        return "goal";
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
      className="mb-8 opacity-80"
    >
      <TabsList className="grid w-full grid-cols-5 h-auto">
        <TabsTrigger value="all" className="text-xs sm:text-sm px-2 py-2">
          <span className="hidden sm:inline">All Tokens</span>
          <span className="sm:hidden">All</span>
        </TabsTrigger>
        <TabsTrigger value="new" className="text-xs sm:text-sm px-2 py-2">
          <span className="hidden sm:inline">New (24h)</span>
          <span className="sm:hidden">New</span>
        </TabsTrigger>
        <TabsTrigger value="trading" className="text-xs sm:text-sm px-2 py-2">
          <span className="hidden sm:inline">Trading</span>
          <span className="sm:hidden">Trading</span>
        </TabsTrigger>
        <TabsTrigger value="trending" className="text-xs sm:text-sm px-2 py-2">
          <span className="hidden sm:inline">Trending</span>
          <span className="sm:hidden">Trend</span>
        </TabsTrigger>
        <TabsTrigger value="goal" className="text-xs sm:text-sm px-2 py-2">
          <span className="hidden sm:inline">Goal Reached</span>
          <span className="sm:hidden">Goal</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
