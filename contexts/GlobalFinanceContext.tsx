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
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"; // Correct client-side hook

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

// Create the context
const GlobalFinanceContext = createContext<
  GlobalFinanceContextType | undefined
>(undefined);

// Provider component
export function GlobalFinanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    isAuthenticated,
    user: kindeUser,
    isLoading,
    error,
  } = useKindeBrowserClient(); // Use the client-side hook

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

  useEffect(() => {
    const initializeData = async () => {
      if (isLoading) return; // Wait until loading is complete

      if (isAuthenticated && kindeUser) {
        const currentUser: User = {
          uid: kindeUser.id,
          email: kindeUser.email || "",
          displayName: kindeUser.given_name || kindeUser.email || "",
        };
        setUser(currentUser);
        await fetchFinancialData(currentUser.uid);
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    initializeData();
    // Only run when authentication status or loading state changes
  }, [isAuthenticated, isLoading]);

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
            date: data.date.toDate(), // Convert Firestore Timestamp to JS Date
          } as FinancialEvent;
        }
      );

      setFinancialEvents(eventsList);

      // Separate recurring and pending payments
      const recurring = eventsList.filter((event) => event.recurring);
      const pending = eventsList.filter((event) => !event.isReceived);

      setRecurringEvents(recurring);
      setPendingPayments(pending);

      // Calculate totals for the last 30 days
      const now = new Date();
      const past30Days = new Date();
      past30Days.setDate(now.getDate() - 30);

      const last30DaysEvents = eventsList.filter(
        (event) => event.date >= past30Days && event.date <= now
      );

      const last30DaysIn = last30DaysEvents
        .filter((event) => event.type === "income")
        .reduce((acc, event) => acc + event.amount, 0);

      const last30DaysOut = last30DaysEvents
        .filter((event) => event.type === "expense")
        .reduce((acc, event) => acc + event.amount, 0);

      setLast30DaysIn(last30DaysIn);
      setLast30DaysOut(last30DaysOut);

      // Calculate total income and expenses
      const totalIncome = eventsList
        .filter((event) => event.type === "income")
        .reduce((acc, event) => acc + event.amount, 0);

      const totalExpenses = eventsList
        .filter((event) => event.type === "expense")
        .reduce((acc, event) => acc + event.amount, 0);

      setTotalIncome(totalIncome);
      setTotalExpenses(totalExpenses);

      // Fetch global total
      const totalDocRef = doc(db, "users", userId, "globalValues", "total");
      const totalDoc = await getDoc(totalDocRef);
      const totalData = totalDoc.data();
      setGlobalTotal(totalData?.total || 0);
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update global total
  const updateGlobalTotal = async (newTotal: number) => {
    if (!user) return;
    const totalRef = doc(db, "users", user.uid, "globalValues", "total");
    await updateDoc(totalRef, { total: newTotal });
    setGlobalTotal(newTotal);
  };

  // Add a new financial event
  const addFinancialEvent = async (event: Omit<FinancialEvent, "id">) => {
    if (!user) return;
    const docRef = await addDoc(
      collection(db, "users", user.uid, "financialEvents"),
      event
    );
    const newEvent = { ...event, id: docRef.id };
    setFinancialEvents((prevEvents) => [...prevEvents, newEvent]);
  };

  // Update an existing financial event
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

  // Delete a financial event
  const deleteFinancialEvent = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "financialEvents", id));
    setFinancialEvents((prevEvents) => prevEvents.filter((e) => e.id !== id));
  };

  // Provide context values
  return (
    <GlobalFinanceContext.Provider
      value={{
        user,
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

// Custom hook to use the finance context
export function useGlobalFinance() {
  const context = useContext(GlobalFinanceContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalFinance must be used within a GlobalFinanceProvider"
    );
  }
  return context;
}
