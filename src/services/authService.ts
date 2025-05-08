
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
        localStorage.setItem('auth_token', response.data.token);
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

  logout: (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    // Optionally: redirect the user or update application state
  },

  getAuthToken: (): string | null => {
    return localStorage.getItem('auth_token');
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
