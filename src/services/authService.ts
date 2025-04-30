
import { User, ApiResponse } from '../lib/types';

// API base URL - in a real app, this would come from environment variables
const API_BASE_URL = 'https://api.fiscalbalance.com'; // This is a placeholder

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Mock authentication for demonstration purposes
// In a real application, this would make actual API calls
export const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    // In a real application, this would be an actual API call
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock successful login - replace with actual API call
      if (credentials.email === 'demo@example.com' && credentials.password === 'password') {
        const response: ApiResponse<AuthResponse> = {
          data: {
            user: {
              userId: 'user-123',
              email: credentials.email,
              name: 'Demo User',
            },
            token: 'mock-jwt-token',
          },
        };
        
        // Store token in localStorage
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return response;
      } else {
        return { error: 'Invalid email or password' };
      }
    } catch (error) {
      return { error: 'An error occurred during login. Please try again.' };
    }
  },

  logout: (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  getAuthToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  getUser: (): User | null => {
    const userString = localStorage.getItem('user');
    if (!userString) return null;
    try {
      return JSON.parse(userString) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  }
};
