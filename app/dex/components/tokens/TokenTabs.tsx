// components/tokens/TokenTabs.tsx - Updated to work with activeCategory prop
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
      className="mb-8"
    >
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="all">All Tokens</TabsTrigger>
        <TabsTrigger value="new">New (24h)</TabsTrigger>
        <TabsTrigger value="trading">Trading</TabsTrigger>
        <TabsTrigger value="trending">Trending</TabsTrigger>
        <TabsTrigger value="goal">Goal Reached</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
