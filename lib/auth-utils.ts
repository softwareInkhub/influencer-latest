const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

// Mock mode for testing without backend
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' || !process.env.NEXT_PUBLIC_BACKEND_URL;

export interface AuthTokens {
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in?: number;
}

export class AuthUtils {
  static getStoredTokens(): AuthTokens | null {
    const access_token = localStorage.getItem('access_token');
    const id_token = localStorage.getItem('id_token');
    const refresh_token = localStorage.getItem('refresh_token');

    if (!access_token || !id_token || !refresh_token) {
      return null;
    }

    return {
      access_token,
      id_token,
      refresh_token,
      expires_in: parseInt(localStorage.getItem('token_expires') || '0')
    };
  }

  static storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('id_token', tokens.id_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    
    if (tokens.expires_in) {
      const expiresAt = Date.now() + (tokens.expires_in * 1000);
      localStorage.setItem('token_expires', expiresAt.toString());
    }
  }

  static clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires');
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('phone_signup_username');
  }

  static isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('token_expires');
    if (!expiresAt) return true;
    
    return Date.now() > parseInt(expiresAt);
  }

  static async validateToken(): Promise<boolean> {
    if (MOCK_MODE) {
      // In mock mode, just check if tokens exist and are not expired
      const tokens = this.getStoredTokens();
      return tokens !== null && !this.isTokenExpired();
    }

    const tokens = this.getStoredTokens();
    if (!tokens) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  static async refreshToken(): Promise<boolean> {
    if (MOCK_MODE) {
      // In mock mode, generate new tokens
      const newTokens: AuthTokens = {
        access_token: `mock_access_${Date.now()}`,
        id_token: `mock_id_${Date.now()}`,
        refresh_token: `mock_refresh_${Date.now()}`,
        expires_in: 3600
      };
      this.storeTokens(newTokens);
      return true;
    }

    const tokens = this.getStoredTokens();
    if (!tokens) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: tokens.refresh_token
        })
      });

      if (response.ok) {
        const newTokens = await response.json();
        this.storeTokens(newTokens);
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    return false;
  }

  static getAuthHeaders(): Record<string, string> {
    const tokens = this.getStoredTokens();
    if (!tokens) {
      return { 'Content-Type': 'application/json' };
    }

    return {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  static async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = this.getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    // If token is expired, try to refresh
    if (response.status === 401 && this.isTokenExpired()) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the request with new token
        const newHeaders = this.getAuthHeaders();
        return fetch(url, {
          ...options,
          headers: {
            ...newHeaders,
            ...options.headers
          }
        });
      } else {
        // Refresh failed, clear tokens
        this.clearTokens();
        throw new Error('Authentication failed');
      }
    }

    return response;
  }

  static async login(username: string, password: string): Promise<{ success: boolean; error?: string; tokens?: AuthTokens }> {
    if (MOCK_MODE) {
      // Mock login - accept any credentials
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      if (username && password) {
        const tokens: AuthTokens = {
          access_token: `mock_access_${Date.now()}`,
          id_token: `mock_id_${Date.now()}`,
          refresh_token: `mock_refresh_${Date.now()}`,
          expires_in: 3600
        };
        
        this.storeTokens(tokens);
        return { success: true, tokens };
      } else {
        return { success: false, error: 'Username and password are required' };
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success && data.result) {
        const tokens: AuthTokens = {
          access_token: data.result.accessToken.jwtToken,
          id_token: data.result.idToken.jwtToken,
          refresh_token: data.result.refreshToken.token
        };
        
        this.storeTokens(tokens);
        return { success: true, tokens };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  static async signup(username: string, password: string, email: string): Promise<{ success: boolean; error?: string }> {
    if (MOCK_MODE) {
      // Mock signup - accept any data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      if (username && password && email) {
        return { success: true };
      } else {
        return { success: false, error: 'All fields are required' };
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, email })
      });

      const data = await response.json();
      return { success: data.success, error: data.error };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  static async phoneSignup(phoneNumber: string, password: string, email?: string): Promise<{ success: boolean; error?: string; username?: string }> {
    if (MOCK_MODE) {
      // Mock phone signup
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      if (phoneNumber && password) {
        return { 
          success: true, 
          username: phoneNumber.replace(/\D/g, '') // Remove non-digits
        };
      } else {
        return { success: false, error: 'Phone number and password are required' };
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/phone/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber, password, email })
      });

      const data = await response.json();
      return { 
        success: data.success, 
        error: data.error,
        username: data.username
      };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  static async phoneLogin(phoneNumber: string, password: string): Promise<{ success: boolean; error?: string; tokens?: AuthTokens }> {
    if (MOCK_MODE) {
      // Mock phone login
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      if (phoneNumber && password) {
        const tokens: AuthTokens = {
          access_token: `mock_access_${Date.now()}`,
          id_token: `mock_id_${Date.now()}`,
          refresh_token: `mock_refresh_${Date.now()}`,
          expires_in: 3600
        };
        
        this.storeTokens(tokens);
        return { success: true, tokens };
      } else {
        return { success: false, error: 'Phone number and password are required' };
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/phone/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber, password })
      });

      const data = await response.json();

      if (data.success && data.result) {
        const tokens: AuthTokens = {
          access_token: data.result.accessToken.jwtToken,
          id_token: data.result.idToken.jwtToken,
          refresh_token: data.result.refreshToken.token
        };
        
        this.storeTokens(tokens);
        return { success: true, tokens };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  static async verifyOTP(phoneNumber: string, code: string, username?: string): Promise<{ success: boolean; error?: string }> {
    if (MOCK_MODE) {
      // Mock OTP verification - accept any 6-digit code
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      if (code && code.length === 6) {
        return { success: true };
      } else {
        return { success: false, error: 'Please enter a valid 6-digit code' };
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/phone/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber, code, username })
      });

      const data = await response.json();
      return { success: data.success, error: data.error };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  static async resendOTP(phoneNumber: string, username?: string): Promise<{ success: boolean; error?: string }> {
    if (MOCK_MODE) {
      // Mock resend OTP
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      return { success: true };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/phone/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber, username })
      });

      const data = await response.json();
      return { success: data.success, error: data.error };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}
