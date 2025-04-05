import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Dashboard from "../components/Dashboard";
import TimeTracker from "../components/TimeTracker";
import StressMonitor from "../components/StressMonitor";
import FocusTools from "../components/FocusTools";
import TaskManager from "../components/TaskManager";
import Settings from "../components/Settings";
import useAppStore from "../store/useAppStore";
import NoteManager from "../components/NoteSummariser";

const Index = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const { darkMode } = useAppStore();

  // Effect to handle hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setActivePage(hash);
      }
    };

    // Set initial state based on hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Function to render the active component
  const renderActiveComponent = () => {
    switch (activePage) {
      case "time-tracker":
        return <TimeTracker />;
      case "stress-monitor":
        return <StressMonitor />;
      case "focus-tools":
        return <FocusTools />;
      case "tasks":
        return <TaskManager />;
      case "settings":
        return <Settings />;
      case "ai-note":
        return <NoteManager />;
      case "dashboard":
      default:
        return <Dashboard />;
    }
  };

  return <Layout activePage={activePage}>{renderActiveComponent()}</Layout>;
};

export default Index;
