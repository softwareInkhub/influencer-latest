'use client';

import { useState, useEffect } from "react";
import { AppProvider } from "./contexts/AppContext";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { Auth } from "./pages/auth";
import Home from "./pages/home";
import { BRMHAuthUtils } from "../lib/brmh-auth-utils";

export default function MainPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
             console.log('🔍 Checking authentication status...');
       const tokens = BRMHAuthUtils.getStoredTokens();
      
      if (!tokens) {
        console.log('❌ No tokens found');
        setIsLoading(false);
        return;
      }

      console.log('✅ Tokens found, validating...');

      try {
        // Validate token with backend
        const isValid = await BRMHAuthUtils.validateToken();
        
        if (isValid) {
          console.log('✅ Token validation successful');
          setIsAuthenticated(true);
        } else {
          console.log('❌ Token validation failed');
          // Token is invalid, clear it
          BRMHAuthUtils.clearTokens();
        }
      } catch (error) {
        console.error('⚠️ Auth validation error:', error);
        // Check if we have valid tokens locally even if BRMH validation failed
        const tokens = BRMHAuthUtils.getStoredTokens();
        if (tokens && !BRMHAuthUtils.isTokenExpired()) {
          console.warn('🔄 BRMH validation failed, but tokens are valid locally. Allowing access.');
          setIsAuthenticated(true);
        } else {
          console.log('❌ Tokens are expired or invalid, clearing...');
          // Clear tokens only if they're actually expired or invalid
          BRMHAuthUtils.clearTokens();
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear all authentication data
    BRMHAuthUtils.clearTokens();
    // Clear stored tab state
    if (typeof window !== 'undefined') {
      localStorage.removeItem('activeTab');
    }
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
        <Auth onAuthSuccess={handleAuthSuccess} />
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
