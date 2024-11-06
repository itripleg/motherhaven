"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  deleteDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

// Define User and FinancialEvent types
type User = {
  uid: string;
  email: string;
  displayName?: string;
};

type FinancialEvent = {
  id?: string;
  date: Date;
  amount: number;
  description: string;
  type: "income" | "expense";
  isReceived: boolean;
  recurring?: boolean;
  frequency?: "weekly" | "biweekly" | "monthly";
};

// Define the context type
type GlobalFinanceContextType = {
  user: User | null;
  globalTotal: number;
  financialEvents: FinancialEvent[];
  loading: boolean;
  last30DaysIn: number;
  last30DaysOut: number;
  totalIncome: number;
  totalExpenses: number;
  pendingPayments: FinancialEvent[];
  recurringEvents: FinancialEvent[];
  updateGlobalTotal: (newTotal: number) => Promise<void>;
  addFinancialEvent: (event: Omit<FinancialEvent, "id">) => Promise<void>;
  updateFinancialEvent: (event: FinancialEvent) => Promise<void>;
  deleteFinancialEvent: (id: string) => Promise<void>;
};

// Create the context
const GlobalFinanceContext = createContext<
  GlobalFinanceContextType | undefined
>(undefined);

export function GlobalFinanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    isAuthenticated,
    user: kindeUser,
    isLoading,
  } = useKindeBrowserClient();

  const [user, setUser] = useState<User | null>(null);
  const [globalTotal, setGlobalTotal] = useState<number>(0);
  const [financialEvents, setFinancialEvents] = useState<FinancialEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [last30DaysIn, setLast30DaysIn] = useState<number>(0);
  const [last30DaysOut, setLast30DaysOut] = useState<number>(0);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [pendingPayments, setPendingPayments] = useState<FinancialEvent[]>([]);
  const [recurringEvents, setRecurringEvents] = useState<FinancialEvent[]>([]);

  // Load initial user and financial data
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && kindeUser) {
      const currentUser: User = {
        uid: kindeUser.id || "",
        email: kindeUser.email || "",
        displayName: kindeUser.family_name || kindeUser.given_name || "User",
      };
      setUser(currentUser);
      fetchFinancialData(currentUser.uid);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [isAuthenticated, isLoading, kindeUser]);

  // Fetch financial data for the authenticated user
  const fetchFinancialData = async (userId: string) => {
    try {
      setLoading(true);

      // Fetch financial events
      const eventsCollection = collection(
        db,
        "users",
        userId,
        "financialEvents"
      );
      const eventsSnapshot = await getDocs(eventsCollection);
      const eventsList: FinancialEvent[] = eventsSnapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date.toDate(),
          } as FinancialEvent;
        }
      );
      setFinancialEvents(eventsList);

      // Separate recurring and pending payments
      setRecurringEvents(eventsList.filter((event) => event.recurring));
      setPendingPayments(eventsList.filter((event) => !event.isReceived));

      // Calculate 30-day totals, income, and expenses
      calculateTotals(eventsList);

      // Fetch global total
      const totalDocRef = doc(db, "users", userId, "globalValues", "total");
      const totalDoc = await getDoc(totalDocRef);
      setGlobalTotal(totalDoc.data()?.total || 0);
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate total income, expenses, and 30-day totals
  const calculateTotals = (eventsList: FinancialEvent[]) => {
    const now = new Date();
    const past30Days = new Date();
    past30Days.setDate(now.getDate() - 30);

    const last30DaysEvents = eventsList.filter(
      (event) => event.date >= past30Days && event.date <= now
    );
    setLast30DaysIn(
      last30DaysEvents
        .filter((event) => event.type === "income")
        .reduce((acc, event) => acc + event.amount, 0)
    );
    setLast30DaysOut(
      last30DaysEvents
        .filter((event) => event.type === "expense")
        .reduce((acc, event) => acc + event.amount, 0)
    );

    setTotalIncome(
      eventsList
        .filter((event) => event.type === "income")
        .reduce((acc, event) => acc + event.amount, 0)
    );
    setTotalExpenses(
      eventsList
        .filter((event) => event.type === "expense")
        .reduce((acc, event) => acc + event.amount, 0)
    );
  };

  // CRUD functions for financial events
  const updateGlobalTotal = async (newTotal: number) => {
    if (!user) return;
    const totalRef = doc(db, "users", user.uid, "globalValues", "total");
    await updateDoc(totalRef, { total: newTotal });
    setGlobalTotal(newTotal);
  };

  const addFinancialEvent = async (event: Omit<FinancialEvent, "id">) => {
    if (!user) return;
    const docRef = await addDoc(
      collection(db, "users", user.uid, "financialEvents"),
      event
    );
    setFinancialEvents((prevEvents) => [
      ...prevEvents,
      { ...event, id: docRef.id },
    ]);
  };

  const updateFinancialEvent = async (event: FinancialEvent) => {
    if (!user || !event.id) return;
    await updateDoc(
      doc(db, "users", user.uid, "financialEvents", event.id),
      event
    );
    setFinancialEvents((prevEvents) =>
      prevEvents.map((e) => (e.id === event.id ? event : e))
    );
  };

  const deleteFinancialEvent = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "financialEvents", id));
    setFinancialEvents((prevEvents) => prevEvents.filter((e) => e.id !== id));
  };

  return (
    <GlobalFinanceContext.Provider
      value={{
        user,
        globalTotal,
        financialEvents,
        loading,
        last30DaysIn,
        last30DaysOut,
        totalIncome,
        totalExpenses,
        pendingPayments,
        recurringEvents,
        updateGlobalTotal,
        addFinancialEvent,
        updateFinancialEvent,
        deleteFinancialEvent,
      }}
    >
      {children}
    </GlobalFinanceContext.Provider>
  );
}

// Custom hook to use the finance context
export function useGlobalFinance() {
  const context = useContext(GlobalFinanceContext);
  if (!context)
    throw new Error(
      "useGlobalFinance must be used within a GlobalFinanceProvider"
    );
  return context;
}
