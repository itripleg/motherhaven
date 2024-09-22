"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGlobalFinance } from "../contexts/GlobalFinanceContext";

type RecurringRevenue = {
  id: string;
  description: string;
  amount: number;
  isReceived: boolean;
};

export function RecurringRevenueComponent() {
  const { financialEvents, addFinancialEvent, updateFinancialEvent, loading } =
    useGlobalFinance();
  const [recurringRevenues, setRecurringRevenues] = useState<
    RecurringRevenue[]
  >([]);
  const [newRevenue, setNewRevenue] = useState({ description: "", amount: 0 });

  useEffect(() => {
    if (financialEvents.length > 0) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyRecurringRevenues = financialEvents.filter(
        (event) =>
          event.type === "income" &&
          event.recurring &&
          event.frequency === "monthly" &&
          event.date.getMonth() === currentMonth &&
          event.date.getFullYear() === currentYear
      );

      setRecurringRevenues(
        monthlyRecurringRevenues.map((event) => ({
          id: event.id!,
          description: event.description,
          amount: event.amount,
          isReceived: event.isReceived || false,
        }))
      );
    }
  }, [financialEvents]);

  const handleToggleReceived = async (id: string) => {
    const updatedRevenues = recurringRevenues.map((rev) =>
      rev.id === id ? { ...rev, isReceived: !rev.isReceived } : rev
    );
    setRecurringRevenues(updatedRevenues);

    const eventToUpdate = financialEvents.find((event) => event.id === id);
    if (eventToUpdate) {
      await updateFinancialEvent({
        ...eventToUpdate,
        isReceived: !eventToUpdate.isReceived,
      });
    }
  };

  const handleAddRevenue = async () => {
    if (newRevenue.description && newRevenue.amount > 0) {
      const newEvent = {
        date: new Date(),
        amount: newRevenue.amount,
        description: newRevenue.description,
        type: "income" as const,
        recurring: true,
        frequency: "monthly" as const,
        isReceived: false,
      };

      await addFinancialEvent(newEvent);
      setNewRevenue({ description: "", amount: 0 });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Recurring Revenue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recurringRevenues.map((revenue) => (
          <div key={revenue.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={revenue.id}
                checked={revenue.isReceived}
                onCheckedChange={() => handleToggleReceived(revenue.id)}
              />
              <Label htmlFor={revenue.id}>{revenue.description}</Label>
            </div>
            <span className="font-medium">${revenue.amount.toFixed(2)}</span>
          </div>
        ))}
        <div className="pt-4 border-t">
          <h3 className="text-lg font-semibold mb-2">
            Add New Recurring Revenue
          </h3>
          <div className="flex space-x-2">
            <Input
              placeholder="Description"
              value={newRevenue.description}
              onChange={(e) =>
                setNewRevenue((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
            <Input
              type="number"
              placeholder="Amount"
              value={newRevenue.amount || ""}
              onChange={(e) =>
                setNewRevenue((prev) => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0,
                }))
              }
            />
            <Button onClick={handleAddRevenue}>Add</Button>
          </div>
        </div>
        <div className="pt-4 border-t">
          <h3 className="text-lg font-semibold">Total MRR</h3>
          <p className="text-2xl font-bold">
            $
            {recurringRevenues
              .reduce((total, rev) => total + rev.amount, 0)
              .toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">
            Received: $
            {recurringRevenues
              .filter((rev) => rev.isReceived)
              .reduce((total, rev) => total + rev.amount, 0)
              .toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
