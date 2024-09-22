"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/firebase";

type FinancialEvent = {
  isReceived: boolean;
  id?: string;
  date: Date;
  amount: number;
  description: string;
  type: "income" | "expense";
  recurring?: boolean;
  frequency?: "weekly" | "biweekly" | "monthly";
};

type GlobalFinanceContextType = {
  globalTotal: number;
  updateGlobalTotal: (newTotal: number) => Promise<void>;
  financialEvents: FinancialEvent[];
  addFinancialEvent: (event: Omit<FinancialEvent, "id">) => Promise<void>;
  updateFinancialEvent: (event: FinancialEvent) => Promise<void>;
  deleteFinancialEvent: (id: string) => Promise<void>;
  loading: boolean;
  last30DaysIn: number;
  last30DaysOut: number;
  totalIncome: number;
  totalExpenses: number;
  pendingPayments: FinancialEvent[];
  recurringEvents: FinancialEvent[];
};

const GlobalFinanceContext = createContext<
  GlobalFinanceContextType | undefined
>(undefined);

export function GlobalFinanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [globalTotal, setGlobalTotal] = useState(0);
  const [financialEvents, setFinancialEvents] = useState<FinancialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [last30DaysIn, setLast30DaysIn] = useState(0);
  const [last30DaysOut, setLast30DaysOut] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [pendingPayments, setPendingPayments] = useState<FinancialEvent[]>([]);
  const [recurringEvents, setRecurringEvents] = useState<FinancialEvent[]>([]);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);

    // Fetch financial events from Firestore
    const eventsCollection = collection(db, "financialEvents");
    const eventsSnapshot = await getDocs(eventsCollection);
    const eventsList = eventsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          date: new Date(doc.data().date.toDate()),
        } as FinancialEvent)
    );

    setFinancialEvents(eventsList);

    // Separate recurring and pending payments
    const recurring = eventsList.filter((event) => event.recurring);
    const pending = eventsList.filter((event) => !event.isReceived);

    setRecurringEvents(recurring);
    setPendingPayments(pending);

    // Calculate totals for the last 30 days, income, and expenses
    const last30DaysIn = eventsList
      .filter((event) => event.type === "income")
      .reduce((acc, event) => acc + event.amount, 0);

    const last30DaysOut = eventsList
      .filter((event) => event.type === "expense")
      .reduce((acc, event) => acc + event.amount, 0);

    setLast30DaysIn(last30DaysIn);
    setLast30DaysOut(last30DaysOut);

    const totalIncome = eventsList
      .filter((event) => event.type === "income")
      .reduce((acc, event) => acc + event.amount, 0);

    const totalExpenses = eventsList
      .filter((event) => event.type === "expense")
      .reduce((acc, event) => acc + event.amount, 0);

    setTotalIncome(totalIncome);
    setTotalExpenses(totalExpenses);

    // Fetch global total from Firestore
    const totalDoc = await getDocs(collection(db, "globalValues"));
    const totalData = totalDoc.docs[0]?.data();
    setGlobalTotal(totalData?.total || 0);

    setLoading(false);
  };

  const updateGlobalTotal = async (newTotal: number) => {
    const totalRef = doc(db, "globalValues", "total");
    await updateDoc(totalRef, { total: newTotal });
    setGlobalTotal(newTotal);
  };

  const addFinancialEvent = async (event: Omit<FinancialEvent, "id">) => {
    const docRef = await addDoc(collection(db, "financialEvents"), event);
    const newEvent = { ...event, id: docRef.id };
    setFinancialEvents([...financialEvents, newEvent]);
  };

  const updateFinancialEvent = async (event: FinancialEvent) => {
    if (event.id) {
      await updateDoc(doc(db, "financialEvents", event.id), event);
      setFinancialEvents(
        financialEvents.map((e) => (e.id === event.id ? event : e))
      );
    }
  };

  const deleteFinancialEvent = async (id: string) => {
    await deleteDoc(doc(db, "financialEvents", id));
    setFinancialEvents(financialEvents.filter((e) => e.id !== id));
  };

  return (
    <GlobalFinanceContext.Provider
      value={{
        globalTotal,
        updateGlobalTotal,
        financialEvents,
        addFinancialEvent,
        updateFinancialEvent,
        deleteFinancialEvent,
        loading,
        last30DaysIn,
        last30DaysOut,
        totalIncome,
        totalExpenses,
        pendingPayments,
        recurringEvents,
      }}
    >
      {children}
    </GlobalFinanceContext.Provider>
  );
}

export function useGlobalFinance() {
  const context = useContext(GlobalFinanceContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalFinance must be used within a GlobalFinanceProvider"
    );
  }
  return context;
}
