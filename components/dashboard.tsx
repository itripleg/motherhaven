"use client";
import { CalendarComponent } from "./CalendarComponent";
import Projection from "./projection";
import { RecurringRevenueComponent } from "./RecurringRevenue";
import { BalanceOverview } from "./BalanceOverview";
import { Events } from "./Events";
import { useGlobalFinance } from "@/contexts/GlobalFinanceContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
// import { BudgetManager } from "./BudgetManager";

export function Dashboard() {
  const currentSpending = 1500;
  const targetBudget = 2000;

  const { globalTotal } = useGlobalFinance();

  const Nav = () => {
    return (
      <div className="text-black ">
        <NavigationMenu className="border border-white w-full p-2 space-x-2">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
              <span className="text-white">{globalTotal}</span>
              <NavigationMenuContent>
                <NavigationMenuLink>Link</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-8 scrollbar scrollbar-hide">
      <Nav />
      <div className="flex text-center justify-center md:justify-between hidden">
        <h1 className="text-3xl font-bold text-primary hidden md:block">
          Budget Dashboard
        </h1>
        <h1 className="text- text-6xl font-bold text-primary ">
          ${globalTotal}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="items-center text-center ">
          <CalendarComponent />
        </div>
        <div className="space-y-8">
          <Projection
            spending={currentSpending}
            target={targetBudget}
            onUpdate={() => {
              console.log("projection updated");
            }}
          />
        </div>
        <Events />
        <BalanceOverview />
        <div className="space-y-8 col-span-1 md:col-span-2">
          <RecurringRevenueComponent />
        </div>
      </div>
    </div>
  );
}
