'use client';

import { useState, useEffect } from "react";
import { AppProvider } from "./contexts/AppContext";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { MockAuth } from "./pages/mock-auth";
import { MockAuth as MockAuthClass } from "../lib/mock-auth";
import Home from "./pages/home";

export default function MainPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = () => {
      const isAuth = MockAuthClass.isAuthenticated();
      setIsAuthenticated(isAuth);
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    MockAuthClass.logout();
    setIsAuthenticated(false);
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <MockAuth onAuthSuccess={handleAuthSuccess} />
        <Toaster />
      </div>
    );
  }

  // Show main app if authenticated
  return (
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Home onLogout={handleLogout} />
      </TooltipProvider>
    </AppProvider>
  );
}
