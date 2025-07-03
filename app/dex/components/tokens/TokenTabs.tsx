// components/tokens/TokenTabs.tsx - Fixed to work with filters
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface TokenTabsProps {
  onCategoryChange: (category: string) => void;
}

export const TokenTabs = ({ onCategoryChange }: TokenTabsProps) => {
  const [activeTab, setActiveTab] = useState("all");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onCategoryChange(value);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
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
