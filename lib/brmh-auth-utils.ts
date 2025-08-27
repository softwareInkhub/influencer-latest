const BRMH_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in';
const USERS_TABLE = 'brmh-users';

export interface BRMUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  password?: string; // Hashed password
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  data?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    preferences?: any;
  };
}

export interface AuthTokens {
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in?: number;
  user_id: string;
}

export class BRMHAuthUtils {
  private static baseURL = `${BRMH_BASE_URL}/crud`;

  // Get stored tokens
  static getStoredTokens(): AuthTokens | null {
    const access_token = localStorage.getItem('access_token');
    const id_token = localStorage.getItem('id_token');
    const refresh_token = localStorage.getItem('refresh_token');
    const user_id = localStorage.getItem('user_id');

    if (!access_token || !id_token || !refresh_token || !user_id) {
      return null;
    }

    return {
      access_token,
      id_token,
      refresh_token,
      user_id,
      expires_in: parseInt(localStorage.getItem('token_expires') || '0')
    };
  }

  // Store tokens
  static storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('id_token', tokens.id_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('user_id', tokens.user_id);
    
    if (tokens.expires_in) {
      const expiresAt = Date.now() + (tokens.expires_in * 1000);
      localStorage.setItem('token_expires', expiresAt.toString());
    }
  }

  // Clear tokens
  static clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('token_expires');
    localStorage.removeItem('activeTab'); // Clear stored tab state
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('phone_signup_username');
  }

  // Check if token is expired
  static isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('token_expires');
    if (!expiresAt) return true;
    
    return Date.now() > parseInt(expiresAt);
  }

  // Validate token by checking user exists in BRM
  static async validateToken(): Promise<boolean> {
    const tokens = this.getStoredTokens();
    if (!tokens) return false;

    // First check if token is expired locally
    if (this.isTokenExpired()) {
      console.log('Token is expired locally');
      return false;
    }

    try {
      // Check if user exists in BRM
      const user = await this.getUserById(tokens.user_id);
      if (user !== null) {
        return true;
      }
      
      // If user not found in BRM, but token is not expired, 
      // we'll still allow access (network issues, BRM down, etc.)
      console.warn('User not found in BRM, but token is valid. Allowing access.');
      return true;
      
    } catch (error) {
      console.error('Token validation error:', error);
      // If there's a network error, but token is not expired locally,
      // we'll still allow access to prevent logout on network issues
      if (!this.isTokenExpired()) {
        console.warn('Network error during validation, but token is valid locally. Allowing access.');
        return true;
      }
      return false;
    }
  }

  // Get user by ID from BRM
  static async getUserById(userId: string): Promise<BRMUser | null> {
    try {
      const response = await fetch(`${this.baseURL}?tableName=${USERS_TABLE}&id=${userId}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.success && data.item) {
        return this.transformFromTableData(data.item);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Get user by username from BRM
  static async getUserByUsername(username: string): Promise<BRMUser | null> {
    try {
      // BRM doesn't have direct username search, so we'll get all users and filter
      const response = await fetch(`${this.baseURL}?tableName=${USERS_TABLE}&pagination=true&itemPerPage=100`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.success && data.items) {
        const user = data.items.find((item: any) => item.username === username);
        return user ? this.transformFromTableData(user) : null;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  }

  // Create user in BRM
  static async createUser(userData: Omit<BRMUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const tableData = this.transformToTableData(userData);
      
      const requestBody = { item: tableData };
      
      const response = await fetch(`${this.baseURL}?tableName=${USERS_TABLE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to create user: ${errorText}` };
      }

      const responseData = await response.json();
      return { success: true, userId: responseData.itemId };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Update user in BRM
  static async updateUser(userId: string, updates: Partial<BRMUser>): Promise<{ success: boolean; error?: string }> {
    try {
      const partialUpdates: any = {};
      if (updates.username !== undefined) partialUpdates.username = updates.username;
      if (updates.email !== undefined) partialUpdates.email = updates.email;
      if (updates.phone !== undefined) partialUpdates.phone = updates.phone;
      if (updates.password !== undefined) partialUpdates.password = updates.password;
      if (updates.role !== undefined) partialUpdates.role = updates.role;
      if (updates.status !== undefined) partialUpdates.status = updates.status;
      if (updates.data !== undefined) partialUpdates.data = JSON.stringify(updates.data);
      
      partialUpdates.updatedAt = new Date().toISOString();

      const requestBody = {
        key: { id: userId },
        updates: partialUpdates
      };
      
      const response = await fetch(`${this.baseURL}?tableName=${USERS_TABLE}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to update user: ${errorText}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Simple password hashing (in production, use bcrypt)
  private static hashPassword(password: string): string {
    // This is a simple hash for demo purposes
    // In production, use proper hashing like bcrypt
    return btoa(password + 'salt'); // Base64 encoding with salt
  }

  // Verify password
  private static verifyPassword(password: string, hashedPassword: string): boolean {
    const hashedInput = this.hashPassword(password);
    return hashedInput === hashedPassword;
  }

  // Transform user data to BRM table format
  private static transformToTableData(user: Omit<BRMUser, 'id' | 'createdAt' | 'updatedAt'>): any {
    return {
      id: crypto.randomUUID(),
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      password: user.password ? this.hashPassword(user.password) : '',
      role: user.role || 'user',
      status: user.status || 'active',
      data: user.data ? JSON.stringify(user.data) : '{}',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Transform BRM table data to user format
  private static transformFromTableData(tableData: any): BRMUser {
    let userData = {};
    try {
      if (tableData.data) {
        userData = typeof tableData.data === 'string' ? JSON.parse(tableData.data) : tableData.data;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }

    return {
      id: tableData.id || tableData._metadata?.originalId || tableData.originalId || '',
      username: tableData.username || '',
      email: tableData.email || '',
      phone: tableData.phone || '',
      password: tableData.password || '',
      role: tableData.role || 'user',
      status: tableData.status || 'active',
      data: userData,
      createdAt: tableData.createdAt,
      updatedAt: tableData.updatedAt
    };
  }

  // Login with username/password
  static async login(username: string, password: string): Promise<{ success: boolean; error?: string; tokens?: AuthTokens }> {
    try {
      const user = await this.getUserByUsername(username);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (!this.verifyPassword(password, user.password || '')) {
        return { success: false, error: 'Invalid password' };
      }

      if (user.status !== 'active') {
        return { success: false, error: 'Account is not active' };
      }

      // Generate tokens (in production, use JWT)
      const tokens: AuthTokens = {
        access_token: `brm_access_${Date.now()}_${user.id}`,
        id_token: `brm_id_${Date.now()}_${user.id}`,
        refresh_token: `brm_refresh_${Date.now()}_${user.id}`,
        user_id: user.id,
        expires_in: 3600
      };

      this.storeTokens(tokens);
      return { success: true, tokens };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Signup new user
  static async signup(username: string, password: string, email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByUsername(username);
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Create new user
      const userData: Omit<BRMUser, 'id' | 'createdAt' | 'updatedAt'> = {
        username,
        email,
        password,
        role: 'user',
        status: 'active',
        data: {}
      };

      const result = await this.createUser(userData);
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Signup failed' };
    }
  }

  // Phone signup
  static async phoneSignup(phoneNumber: string, password: string, email?: string): Promise<{ success: boolean; error?: string; username?: string }> {
    try {
      const username = phoneNumber.replace(/\D/g, ''); // Remove non-digits
      
      // Check if user already exists
      const existingUser = await this.getUserByUsername(username);
      if (existingUser) {
        return { success: false, error: 'Phone number already registered' };
      }

      // Create new user
      const userData: Omit<BRMUser, 'id' | 'createdAt' | 'updatedAt'> = {
        username,
        email: email || `${username}@phone.user`,
        phone: phoneNumber,
        password,
        role: 'user',
        status: 'pending_verification',
        data: {}
      };

      const result = await this.createUser(userData);
      
      if (result.success) {
        return { success: true, username };
      } else {
        return { success: false, error: result.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('Phone signup error:', error);
      return { success: false, error: 'Signup failed' };
    }
  }

  // Phone login
  static async phoneLogin(phoneNumber: string, password: string): Promise<{ success: boolean; error?: string; tokens?: AuthTokens }> {
    try {
      const username = phoneNumber.replace(/\D/g, ''); // Remove non-digits
      return await this.login(username, password);
    } catch (error) {
      console.error('Phone login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Verify OTP (simplified - just update user status)
  static async verifyOTP(phoneNumber: string, code: string, username?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const targetUsername = username || phoneNumber.replace(/\D/g, '');
      const user = await this.getUserByUsername(targetUsername);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Simple OTP verification (any 6-digit code works for demo)
      if (code.length === 6) {
        const result = await this.updateUser(user.id, { status: 'active' });
        return result;
      } else {
        return { success: false, error: 'Invalid OTP code' };
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  // Resend OTP (simplified)
  static async resendOTP(phoneNumber: string, username?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, this would send an SMS
      // For demo purposes, just return success
      return { success: true };
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { success: false, error: 'Failed to resend OTP' };
    }
  }

  // Get auth headers for API calls
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

  // Test BRMH connection
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${BRMH_BASE_URL}/test`);
      return response.ok;
    } catch (error) {
      console.error('BRMH connection test failed:', error);
      return false;
    }
  }

  // Check if we're in offline mode (no BRMH connection)
  static async isOfflineMode(): Promise<boolean> {
    try {
      const response = await fetch(`${BRMH_BASE_URL}/test`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      return !response.ok;
    } catch (error) {
      console.log('BRMH appears to be offline:', error);
      return true;
    }
  }
}
