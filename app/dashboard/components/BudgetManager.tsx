"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import Projection from "./projection";

export function BudgetManager() {
  const [currentSpending, setCurrentSpending] = useState(0);
  const [targetBudget, setTargetBudget] = useState(1000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    setLoading(true);
    const docRef = doc(db, "budget", "current");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setCurrentSpending(data.currentSpending);
      setTargetBudget(data.targetBudget);
    } else {
      // If the document doesn't exist, initialize with default values
      await setDoc(doc(db, "budget", "current"), {
        currentSpending: 0,
        targetBudget: 1000,
      });
      setCurrentSpending(0);
      setTargetBudget(1000);
    }
    setLoading(false);
  };

  const updateBudgetData = async (newSpending: number, newTarget: number) => {
    await setDoc(doc(db, "budget", "current"), {
      currentSpending: newSpending,
      targetBudget: newTarget,
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Pass the current data and update function to Projection */}
      <Projection
        spending={currentSpending}
        target={targetBudget}
        onUpdate={(newSpending, newTarget) => {
          setCurrentSpending(newSpending);
          setTargetBudget(newTarget);
          updateBudgetData(newSpending, newTarget);
        }}
      />
    </div>
  );
}
