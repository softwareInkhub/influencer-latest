'use client';

import { useState } from "react";
import { AppProvider } from "./contexts/AppContext";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { Auth } from "./pages/auth";
import Home from "./pages/home";

export default function MainPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Auth onAuthSuccess={handleAuthSuccess} />
        <Toaster />
      </div>
    );
  }

  return (
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Home onLogout={handleLogout} />
      </TooltipProvider>
    </AppProvider>
  );
}
