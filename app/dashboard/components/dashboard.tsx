"use client";
import { useState, useEffect } from "react";
// import { CalendarComponent } from "./CalendarComponent";
// import Projection from "./projection";
// import { RecurringRevenueComponent } from "./RecurringRevenue";
// import { BalanceOverview } from "./BalanceOverview";
// import { Events } from "./Events";
// import { useGlobalFinance } from "@/contexts/GlobalFinanceContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const Nav = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="text-black">
      <NavigationMenu className="border border-white w-full p-2 space-x-2">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink asChild>
                <a href="#">Link</a>
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

export function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const currentSpending = 1500;
  const targetBudget = 2000;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-8 scrollbar scrollbar-hide">
      <div className="flex text-center justify-center md:justify-between">
        <Nav />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="w-full md:col-span-full">
          {/* <BalanceOverview /> */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="text-center">{/* <CalendarComponent /> */}</div>
          <div className="text-center">{/* <Events /> */}</div>
        </div>
      </div>
    </div>
  );
}
