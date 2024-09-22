"use client";
import { CalendarComponent } from "./CalendarComponent";
import Projection from "./projection";
import { RecurringRevenueComponent } from "./RecurringRevenue";
import { BalanceOverview } from "./BalanceOverview";
import { Events } from "./Events";
import { useGlobalFinance } from "@/contexts/GlobalFinanceContext";
// import { BudgetManager } from "./BudgetManager";

export function Dashboard() {
  const currentSpending = 1500;
  const targetBudget = 2000;

  const { globalTotal } = useGlobalFinance();

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold text-primary">Budget Dashboard</h1>
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
