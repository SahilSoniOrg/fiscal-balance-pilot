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
  logout: () => Promise<void>; // logout should now be async
  loginWithToken: (token: string) => void; // New method for OAuth
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Key for localStorage
const AUTH_TOKEN_KEY = 'auth_token'; // New key to match authService.ts
const USER_ID_KEY = 'userId'; // Key for storing user ID in localStorage

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
  const [userId, setUserId] = useState<string | null>(() => {
    const userIdFromToken = getUserIdFromToken(token);
    if (userIdFromToken) {
      localStorage.setItem('userId', userIdFromToken);
    }
    return userIdFromToken;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading
  const [error, setError] = useState<string | null>(null); // Add error state
  const { toast } = useToast();

  // Effect to fetch user details when userId is available (derived from token)
  useEffect(() => {
    const RENDER_ID = Math.random().toString(36).substring(2, 7); // Shorter unique ID
    console.log(`[Effect ${RENDER_ID}] Start. Token state: ${token}. LS token: ${localStorage.getItem(AUTH_TOKEN_KEY)}`);

    const fetchAndSetUserDetails = async () => {
      const tokenFromStorage = localStorage.getItem(AUTH_TOKEN_KEY);
      const userIdFromTokenConst = getUserIdFromToken(tokenFromStorage);
      console.log(`[Effect ${RENDER_ID}] LS token: ${tokenFromStorage}, userIdFromToken: ${userIdFromTokenConst}`);

      if (!tokenFromStorage || !userIdFromTokenConst) {
        console.log(`[Effect ${RENDER_ID}] No token/userId in LS. Clearing states. Current token state: ${token}`);
        if (token !== null) setToken(null);
        if (user !== null) setUser(null);
        if (userId !== null) setUserId(null);
        setIsLoading(false);
        return;
      }

      setUserId(userIdFromTokenConst);
      setIsLoading(true);
      console.log(`[Effect ${RENDER_ID}] Attempting fetch for user: ${userIdFromTokenConst}`);
      try {
        const response = await apiService.getUserDetails(userIdFromTokenConst);
        if (response.data) {
          console.log(`[Effect ${RENDER_ID}] User details fetched successfully for ${userIdFromTokenConst}`);
          setUser(response.data);
          if (token !== tokenFromStorage) {
            console.log(`[Effect ${RENDER_ID}] Syncing token state with LS token.`);
            setToken(tokenFromStorage);
          }
        } else {
          console.warn(`[Effect ${RENDER_ID}] Fetch ok, but no data for ${userIdFromTokenConst}. Error: ${response.error}`);
          throw new Error(response.error || 'Failed to fetch user details, no data.');
        }
      } catch (error: any) {
        console.error(`[Effect ${RENDER_ID}] Error fetching user for ${userIdFromTokenConst}:`, error.message);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
        setUserId(null);
      } finally {
        setIsLoading(false);
        console.log(`[Effect ${RENDER_ID}] End.`);
      }
    };

    fetchAndSetUserDetails();
  }, [token, userId]); // Added userId to dependency array to re-run if it's externally nulled earlier by some logic

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

  const loginWithToken = (newToken: string) => {
    console.log('loginWithToken called with token:', newToken);
    localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    const newUserId = getUserIdFromToken(newToken);
    if (newUserId) {
      localStorage.setItem(USER_ID_KEY, newUserId);
    }
    setToken(newToken);
    // The effect will handle fetching user details
  };

  // Logout function
  const logout = async (): Promise<void> => {
    console.log('[AuthProvider.logout] Initiated.');
    setIsLoading(true); // Indicate activity
    try {
      // Get the current user ID before logging out
      const currentUserId = localStorage.getItem(USER_ID_KEY);
      
      // Call the auth service to handle server logout
      await authService.logout();
      console.log('[AuthProvider.logout] authService.logout completed.');
      
      // Clear the auth token but keep the user ID in localStorage
      localStorage.removeItem(AUTH_TOKEN_KEY);
      
      // State updates for local context cleanup
      setToken(null);
      setUser(null);
      setUserId(null);
      setError(null);
      
      // If we had a user ID, keep it for next login
      if (currentUserId) {
        localStorage.setItem(USER_ID_KEY, currentUserId);
      }
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      console.log('[AuthProvider.logout] Context state cleared, toast shown.');
    } catch (error: any) {
      console.error("[AuthProvider.logout] Error during context logout:", error);
      setError(error.message || 'Logout failed. Please try again.');
      toast({
        title: "Logout Failed",
        description: error.message || 'Could not log out properly.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      console.log('[AuthProvider.logout] Finished.');
    }
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
    loginWithToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
