"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  amount: number;
  description: string;
  date: Date;
  type: "income" | "expense";
  isReceived: boolean;
};

type DailyEvents = {
  [date: string]: FinancialEvent[];
};

export function CalendarComponent() {
  const { financialEvents, addFinancialEvent, loading } = useGlobalFinance();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<DailyEvents>({});
  const [newEvent, setNewEvent] = useState<FinancialEvent>({
    amount: 0,
    description: "",
    date: new Date(),
    type: "expense",
    isReceived: false,
  });

  useEffect(() => {
    if (financialEvents.length > 0) {
      const groupedEvents = financialEvents.reduce((acc, event) => {
        const dateString = event.date.toISOString().split("T")[0];
        if (!acc[dateString]) {
          acc[dateString] = [];
        }
        acc[dateString].push(event);
        return acc;
      }, {} as DailyEvents);

      setEvents(groupedEvents);
    }
  }, [financialEvents]);

  const addEvent = async () => {
    if (date) {
      await addFinancialEvent({
        ...newEvent,
        date: date,
        isReceived: newEvent.isReceived ?? false,
      });
    }
  };

  const getDayContent = (day: Date) => {
    const dateString = day.toISOString().split("T")[0];
    const dailyEvents = events[dateString];

    if (dailyEvents && dailyEvents.length > 0) {
      const total = dailyEvents.reduce(
        (sum, event) =>
          sum + (event.type === "income" ? event.amount : -event.amount),
        0
      );

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`w-full h-full flex items-center justify-center rounded-full ${
                  total >= 0 ? "bg-green-400" : "bg-red-400"
                }`}
              >
                {day.getDate()}
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-primary text-white shadow-md relative">
              <div className="text-sm">
                <p className="font-bold">Net: ${total.toFixed(2)}</p>
                <ul className="list-disc list-inside">
                  {dailyEvents.map((event, index) => (
                    <li
                      key={index}
                      className={
                        event.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {event.description}: ${event.amount.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center">
        {day.getDate()}
      </div>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md flex justify-center"
        components={{
          DayContent: ({ date }) => getDayContent(date),
        }}
      />
      <Dialog>
        <DialogTrigger asChild>
          <Button>Add Event</Button>
        </DialogTrigger>
        <DialogContent className="text-muted-foreground">
          <DialogHeader className="text-primary ">
            <DialogTitle>
              {date
                ? `Record Financial Event for ${date.toDateString()}`
                : "No date selected"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Amount"
              value={newEvent.amount || ""}
              onChange={(e) =>
                setNewEvent((prev) => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0,
                }))
              }
            />
            <Input
              placeholder="Description"
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
            <Select
              value={newEvent.type}
              onValueChange={(value: "income" | "expense") =>
                setNewEvent((prev) => ({ ...prev, type: value }))
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
            <Button onClick={addEvent}>Add Event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
