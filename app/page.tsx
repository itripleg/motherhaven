"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/craft";
import { Dashboard } from "@/components/dashboard";
import Chart from "@/components/chart"; // Assume you have a Chart component
import MyMenu from "@/components/my-menu"; // Your Menubar component
import TradingViewWidget from "@/components/chart";

type View = "dashboard" | "chart";

function Page() {
  const [currentView, setCurrentView] = useState<View>("dashboard"); // Default view is "dashboard"

  // Load the saved view from localStorage on component mount
  useEffect(() => {
    const savedView = localStorage.getItem("currentView");
    if (savedView && (savedView === "dashboard" || savedView === "chart")) {
      setCurrentView(savedView as View);
    }
  }, []);

  // Save the current view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("currentView", currentView);
  }, [currentView]);

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "chart":
        return <Chart />;
      default:
        return <Dashboard />; // Fallback to dashboard
    }
  };

  return (
    <div>
      {/* Pass setCurrentView to MyMenu */}
      <MyMenu setCurrentView={setCurrentView} />
      <Container className="mt-8">{renderView()}</Container>
    </div>
  );
}

export default Page;
