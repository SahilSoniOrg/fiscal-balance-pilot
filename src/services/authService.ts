import { User, ApiResponse } from '../lib/types';
import apiService from './apiService'; // Import the real apiService

// Use LoginCredentials type matching the API expectation (username/password)
// This interface might need to be moved to ../lib/types.ts if used elsewhere
export interface LoginCredentials {
  username: string; // Changed from email based on reference
  password: string;
}

// Define the registration credentials interface
export interface RegisterCredentials {
  username: string;
  password: string;
  name: string;
}

// Define user registration response
export interface RegisterResponse {
  userID: string;
  username: string;
  name: string;
}

// Define the expected structure of the API response for login
// This assumes the API returns an object with a token property upon successful login.
export interface LoginApiResponse {
  token: string;
}

// Updated authService using the real apiService
export const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginApiResponse>> => {
    try {
      // Call the actual API login endpoint using apiService
      const response = await apiService.post<LoginApiResponse>('/auth/login', credentials);

      // Check if the API call was successful (no error property)
      if (response.data && response.data.token) {
        // Store the received token in localStorage
        authService.setAuthToken(response.data.token); // Use the new setter
        // Remove storing user details here, fetch separately if needed
        localStorage.removeItem('user'); 
        return { data: response.data };
      } else {
        // Return the error received from apiService
        return { error: response.error || 'Login failed. Please check credentials.' };
      }
    } catch (error: any) {
      // Catch any unexpected errors during the process
      console.error("Unexpected error during login:", error);
      return { error: error.message || 'An unexpected error occurred during login.' };
    }
  },

  register: async (credentials: RegisterCredentials): Promise<ApiResponse<RegisterResponse>> => {
    try {
      const response = await apiService.post<RegisterResponse>('/auth/register', credentials);
      
      if (response.data) {
        return { data: response.data };
      } else {
        return { error: response.error || 'Registration failed.' };
      }
    } catch (error: any) {
      console.error("Unexpected error during registration:", error);
      return { error: error.message || 'An unexpected error occurred during registration.' };
    }
  },

  logout: async (): Promise<void> => { // Made async
    try {
      console.log('[authService.logout] Attempting server logout...');
      await apiService.serverLogout(); // Assuming apiService will have this method
      console.log('[authService.logout] Server logout successful.');
    } catch (error) {
      console.error('[authService.logout] Server logout failed:', error);
      console.error('[authService.logout] Detailed error:', error.message, error.stack);
      // Optionally, inform the user or log more detailed error for diagnostics
      // The function will proceed to clear local storage regardless.
    } finally {
      const currentTokenVal = localStorage.getItem('auth_token');
      console.log(`[authService.logout] Removing auth_token from localStorage. Current value: ${currentTokenVal}`);
      localStorage.removeItem('auth_token');
      const newTokenVal = localStorage.getItem('auth_token');
      console.log(`[authService.logout] auth_token removed. Value after removal: ${newTokenVal}`);
      console.log('[authService.logout] LocalStorage after logout:', localStorage);
      // Navigation will now be handled by AppLayout reacting to token state change in AuthContext
    }
  },

  getAuthToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  setAuthToken: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },

  // getUser might need to be updated later to fetch details if not stored
  getUser: (): User | null => {
    const userString = localStorage.getItem('user');
    if (!userString) return null;
    try {
      return JSON.parse(userString) as User;
    } catch {
      // If parsing fails or data is invalid, clear the bad data
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    // Check for the existence of the token
    return !!localStorage.getItem('auth_token');
  }
};
