'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppProvider } from "./contexts/AppContext";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import AuthPage from "./authPage/page";

export default function MainPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      const tokenExpires = localStorage.getItem('token_expires');
      
      if (token) {
        // Check if token is expired
        if (tokenExpires) {
          const expiryTime = parseInt(tokenExpires);
          if (Date.now() > expiryTime) {
            // Token is expired, clear it
            localStorage.removeItem('access_token');
            localStorage.removeItem('id_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('token_expires');
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
          }
        }

        // Try to validate token with API, but don't fail immediately on network errors
        let validationTimeout: NodeJS.Timeout;
        
        const validateToken = async () => {
          try {
            const controller = new AbortController();
            validationTimeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch('https://brmh.in/auth/validate', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            });
            
            clearTimeout(validationTimeout);
            
            if (response.ok) {
              setIsAuthenticated(true);
              // Start periodic token refresh
              startTokenRefresh();
              // Update URL if we're on the root path
              if (pathname === '/') {
                router.push('/dashboard');
              }
            } else if (response.status === 401) {
              // Token is definitely invalid
              localStorage.removeItem('access_token');
              localStorage.removeItem('id_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('token_expires');
              setIsAuthenticated(false);
            } else {
              // Other API errors, but token might still be valid
              // Keep the user logged in for now
              setIsAuthenticated(true);
              startTokenRefresh();
              // Update URL if we're on the root path
              if (pathname === '/') {
                router.push('/dashboard');
              }
            }
          } catch (error) {
            clearTimeout(validationTimeout);
            
            if (error.name === 'AbortError') {
              // Request timed out, assume token is still valid
              console.warn('Token validation timed out, assuming token is valid');
              setIsAuthenticated(true);
              startTokenRefresh();
              // Update URL if we're on the root path
              if (pathname === '/') {
                router.push('/dashboard');
              }
            } else {
              // Network error or other issues
              console.warn('Token validation failed due to network error, assuming token is valid');
              // Don't log out on network errors - keep the user logged in
              setIsAuthenticated(true);
              startTokenRefresh();
              // Update URL if we're on the root path
              if (pathname === '/') {
                router.push('/dashboard');
              }
            }
          } finally {
            setIsLoading(false);
          }
        };

        validateToken();
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    const startTokenRefresh = () => {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      // Check token every 5 minutes
      refreshIntervalRef.current = setInterval(() => {
        const token = localStorage.getItem('access_token');
        const tokenExpires = localStorage.getItem('token_expires');
        
        if (token && tokenExpires) {
          const expiryTime = parseInt(tokenExpires);
          const timeUntilExpiry = expiryTime - Date.now();
          
          // If token expires in less than 10 minutes, try to refresh it
          if (timeUntilExpiry < 10 * 60 * 1000) {
            refreshToken();
          }
        }
      }, 5 * 60 * 1000); // 5 minutes
    };

    const refreshToken = async () => {
      const refreshTokenValue = localStorage.getItem('refresh_token');
      if (!refreshTokenValue) return;

      try {
        const response = await fetch('https://brmh.in/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: refreshTokenValue
          })
        });

        if (response.ok) {
          const tokens = await response.json();
          localStorage.setItem('id_token', tokens.id_token);
          localStorage.setItem('access_token', tokens.access_token);
          localStorage.setItem('refresh_token', tokens.refresh_token);
          localStorage.setItem('token_expires', (Date.now() + (tokens.expires_in * 1000)).toString());
        }
      } catch (error) {
        console.warn('Token refresh failed:', error);
      }
    };

    checkAuth();

    // Listen for auth success events
    const handleAuthSuccess = () => {
      setIsAuthenticated(true);
      startTokenRefresh();
      // Redirect to dashboard after successful login using environment variable
      router.push(process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL || '/dashboard');
    };

    // Listen for logout events
    const handleAuthLogout = () => {
      setIsAuthenticated(false);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      // Clear any stored tab preference
      localStorage.removeItem('activeTab');
      // Clear all auth-related tokens to ensure complete logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires');
      // Redirect to root using environment variable - this is a backup in case the layout redirect fails
      router.push(process.env.NEXT_PUBLIC_BASE_URL || '/');
    };

    window.addEventListener('auth-success', handleAuthSuccess);
    window.addEventListener('auth-logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth-success', handleAuthSuccess);
      window.removeEventListener('auth-logout', handleAuthLogout);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [router, pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // If authenticated, redirect to dashboard (this should not happen here anymore)
  // The router.push('/dashboard') above should handle this
  return null;
}
