import React, { useEffect } from "react";
import {
  Sun,
  Moon,
  LayoutDashboard,
  Clock,
  Activity,
  Brain,
  Calendar,
  Settings,
} from "lucide-react";
import useAppStore from "../store/useAppStore";

const Layout = ({ children, activePage }) => {
  const { darkMode, toggleDarkMode } = useAppStore();

  // Apply dark mode class to the document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "#dashboard" },
    { icon: Clock, label: "Time Tracker", href: "#time-tracker" },
    { icon: Activity, label: "Stress Monitor", href: "#stress-monitor" },
    { icon: Brain, label: "Focus Tools", href: "#focus-tools" },
    { icon: Calendar, label: "Tasks", href: "#tasks" },
    { icon: Brain, label: "AI-NoteMaker", href: "#ai-note" },

    { icon: Settings, label: "Settings", href: "#settings" },
  ];

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-balance-300 to-balance-500 flex items-center justify-center text-white font-bold">
              B
            </div>
            <h1 className="text-xl font-bold">Balance</h1>
          </div>

          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <div className="container flex-1 flex flex-col md:flex-row gap-6 py-6">
        {/* Sidebar */}
        <aside className="md:w-64 shrink-0">
          <nav className="sticky top-24 space-y-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`nav-item ${
                  activePage === item.label.toLowerCase() ? "active" : ""
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        <div className="container">
          <p>
            © {new Date().getFullYear()} Balance - AI Work-Life Balance
            Assistant
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
