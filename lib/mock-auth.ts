export interface MockUser {
  id: string;
  username: string;
  email: string;
  role: string;
  name: string;
}

export class MockAuth {
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const user = localStorage.getItem('mock_user');
    return user !== null;
  }

  static getCurrentUser(): MockUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const user = localStorage.getItem('mock_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  static login(username: string, password: string): Promise<{ success: boolean; user?: MockUser; error?: string }> {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        if (username && password) {
          const user: MockUser = {
            id: 'mock_user_1',
            username,
            email: `${username}@mock.com`,
            role: 'admin',
            name: username
          };
          
          localStorage.setItem('mock_user', JSON.stringify(user));
          resolve({ success: true, user });
        } else {
          resolve({ success: false, error: 'Username and password are required' });
        }
      }, 1000);
    });
  }

  static logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('mock_user');
    localStorage.removeItem('activeTab');
  }

  static signup(username: string, password: string, email: string): Promise<{ success: boolean; user?: MockUser; error?: string }> {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        if (username && password && email) {
          const user: MockUser = {
            id: 'mock_user_' + Date.now(),
            username,
            email,
            role: 'user',
            name: username
          };
          
          localStorage.setItem('mock_user', JSON.stringify(user));
          resolve({ success: true, user });
        } else {
          resolve({ success: false, error: 'All fields are required' });
        }
      }, 1000);
    });
  }
}
