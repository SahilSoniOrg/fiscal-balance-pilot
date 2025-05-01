import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiService from '../services/apiService'; // Use our apiService
import { LoginCredentials } from '../services/authService'; // Keep LoginCredentials
import { User, DecodedToken } from '../lib/types'; // Use updated User and DecodedToken
import { useToast } from "@/hooks/use-toast";
import { authService } from '../services/authService';

// Define the shape of the context value
interface AuthContextType {
  token: string | null;
  userId: string | null;
  user: User | null; // Keep the user object
  isLoading: boolean;
  error: string | null; // Add error field
  login: (credentials: LoginCredentials) => Promise<void>; // Login takes credentials again
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Key for localStorage
const AUTH_TOKEN_KEY = 'authToken';

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to decode token and get userId
const getUserIdFromToken = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    if (decoded.exp * 1000 < Date.now()) {
      console.warn('Token expired');
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }
    return decoded.sub;
  } catch (error) {
    console.error('Failed to decode token:', error);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return null;
  }
};

// --- Custom Hook --- Define before Provider
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- Provider Component ---
// Make this the default export later if needed, keep named for now
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  // Initialize userId based on token from localStorage
  const [userId, setUserId] = useState<string | null>(() => getUserIdFromToken(token));
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading
  const [error, setError] = useState<string | null>(null); // Add error state
  const { toast } = useToast();

  // Effect to fetch user details when userId is available (derived from token)
  useEffect(() => {
    const fetchAndSetUserDetails = async () => {
      // Always get the latest token and derive userId
      const currentToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const currentUserId = getUserIdFromToken(currentToken);
      setUserId(currentUserId); // Update userId state

      if (currentUserId && currentToken) {
        // Only set loading true when we are actually going to fetch
        setIsLoading(true);
        setUser(null); // Clear previous user data while fetching
        setError(null);
        try {
          // Use the apiService.getUserDetails function we added
          const response = await apiService.getUserDetails(currentUserId);
          if (response.data) {
            setUser(response.data);
            console.log('User details fetched successfully:', response.data.name);
          } else {
             // Handle case where API call succeeded but returned no data or error message
             throw new Error(response.error || 'Failed to fetch user details after login.');
          }
        } catch (error: any) {
          console.error('Error fetching user details:', error);
          setError(error.message || 'Failed to load user data.');
          setUser(null);
          // If fetching user details fails (e.g., invalid token), log out
          console.warn('Logging out due to error fetching user details.');
          logout(); // Call the logout function
        } finally {
          setIsLoading(false);
        }
      } else {
        // No valid token/userId, ensure logged out state
        setUser(null);
        setToken(null); // Ensure token state is null if getUserIdFromToken cleared localStorage
        setIsLoading(false); 
      }
    };

    fetchAndSetUserDetails();
  // Depend on token state. When token changes (login/logout), this effect runs.  
  }, [token]); 

  // Login function - uses authService.login then sets token to trigger useEffect
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await authService.login(credentials);
        if (response.error || !response.data?.token) {
            throw new Error(response.error || 'Login failed: No token received.');
        }
        // Save token and update state - this triggers the useEffect
        localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
        setToken(response.data.token); 
        // User details will be fetched by the useEffect
        toast({
            title: "Login Initiated",
            description: "Fetching user details...",
        });
    } catch (error: any) {
        console.error("Login failed:", error);
        setError(error.message || 'Login failed.');
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
        setUserId(null);
        setIsLoading(false);
        toast({
            title: "Login Failed",
            description: error.message || 'Please check credentials.',
            variant: "destructive"
        });
    }
    // setIsLoading(false) will be handled by the useEffect completion
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setUserId(null);
    setError(null);
    setIsLoading(false); // Explicitly set loading to false on logout
    toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
    });
  };

  // Context value matching the new structure
  const contextValue = {
    token,
    userId,
    user,
    isLoading,
    error, // Add error to the provided value
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
