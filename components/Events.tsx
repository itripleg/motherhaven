"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGlobalFinance } from "../contexts/GlobalFinanceContext";

type FinancialEvent = {
  id?: string;
  date?: Date;
  amount?: number;
  description?: string;
  type?: "income" | "expense";
  recurring?: boolean;
  frequency?: "weekly" | "biweekly" | "monthly";
};

export function Events() {
  const {
    financialEvents,
    addFinancialEvent,
    updateFinancialEvent,
    deleteFinancialEvent,
    loading,
  } = useGlobalFinance();

  const [newEvent, setNewEvent] = useState<FinancialEvent>({
    id: "",
    date: new Date(),
    amount: 0,
    description: "",
    type: "income",
    recurring: false,
    frequency: "monthly",
  });

  const [editEvent, setEditEvent] = useState<FinancialEvent | null | undefined>(
    null
  );

  const handleAddEvent = () => {
    // @ts-expect-error "may be null?"
    addFinancialEvent(newEvent);
    setNewEvent({
      id: "",
      date: new Date(),
      amount: 0,
      description: "",
      type: "income",
      recurring: false,
      frequency: "monthly",
    });
  };

  const handleEditEvent = (event: FinancialEvent) => {
    setEditEvent(event);
  };

  const handleUpdateEvent = () => {
    if (editEvent) {
      // @ts-expect-error "may be null?"
      updateFinancialEvent(editEvent);
      setEditEvent(null); // Close dialog
    }
  };

  const handleDeleteEvent = () => {
    if (editEvent) {
      // @ts-expect-error "may be null?"
      deleteFinancialEvent(editEvent.id);
      setEditEvent(null); // Close dialog
    }
  };

  const calculateProjectedBalance = (): number => {
    const today = new Date();
    const oneMonthFromNow = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate()
    );

    return financialEvents.reduce((total, event) => {
      if (event.date >= today && event.date <= oneMonthFromNow) {
        return total + (event.type === "income" ? event.amount : -event.amount);
      }
      return total;
    }, 0);
  };

  if (loading) {
    return <div>Loading financial events...</div>;
  }

  return (
    <Card className="w-full">
      {/* <CardHeader>
        <CardTitle>Financial Events</CardTitle>
      </CardHeader> */}
      <CardContent>
        {/* <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Amount"
              value={newEvent.amount}
              onChange={(e) =>
                setNewEvent({
                  ...newEvent,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
            />
            <Input
              placeholder="Description"
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
            />
            <Select
              value={newEvent.type}
              onValueChange={(value: "income" | "expense") =>
                setNewEvent({ ...newEvent, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddEvent}>Add Event</Button>
        </div> */}

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
          <ul className="space-y-2">
            {financialEvents
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .slice(0, 5)
              .map((event) => (
                <li
                  key={event.id}
                  className="flex justify-between items-center p-2"
                >
                  <span>
                    {event.date.toDateString()} - {event.description}
                  </span>
                  <span
                    className={
                      event.type === "income"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    ${event.amount.toFixed(2)}
                  </span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => handleEditEvent(event)}
                      >
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Event</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={editEvent?.amount || 0}
                          onChange={(e) =>
                            setEditEvent({
                              ...editEvent!,
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                        <Input
                          placeholder="Description"
                          value={editEvent?.description || ""}
                          onChange={(e) =>
                            setEditEvent({
                              ...editEvent!,
                              description: e.target.value,
                            })
                          }
                        />
                        <Button variant="outline" onClick={handleUpdateEvent}>
                          Update
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteEvent}
                        >
                          Delete
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </li>
              ))}
          </ul>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold">
            Projected Balance (Next 30 Days)
          </h3>
          <p className="text-2xl font-bold">
            ${calculateProjectedBalance().toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
