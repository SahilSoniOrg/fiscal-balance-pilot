import { authService } from './authService';
import { ApiResponse, User } from '../lib/types';

// API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Check if the environment variable is set
if (!API_BASE_URL) {
  console.error("VITE_API_BASE_URL is not defined. Please check your .env file and restart the application.");
  // Optionally, throw an error or set a default, but logging is often preferred during startup.
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; // Specify allowed methods
  body?: object;
  params?: Record<string, string | number | boolean>;
}

const apiService = {
  callApi: async <T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
    const token = authService.getAuthToken();
    let url = `${API_BASE_URL}${endpoint}`;

    // Append query parameters if they exist
    if (options.params) {
      const queryParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: options.method || 'GET', // Default to GET
      headers: {
        'Accept': 'application/json',
        // Add Authorization header if token exists
        ...(token && { 'Authorization': `Bearer ${token}` }),
        // Add Content-Type for relevant methods if body exists
        ...(options.body && (options.method === 'POST' || options.method === 'PUT') && { 'Content-Type': 'application/json' }),
      },
      // Add body if it exists and method allows it
      ...(options.body && (options.method === 'POST' || options.method === 'PUT') && { body: JSON.stringify(options.body) }),
    };

    try {
      const response = await fetch(url, fetchOptions);

      // Handle non-OK responses
      if (!response.ok) {
        let errorBody: any = null;
        let errorMessage = `API error: ${response.status} ${response.statusText}`;
        try {
          // Try parsing the error response body
          errorBody = await response.json();
          // Use message from error body if available
          errorMessage = errorBody?.message || errorBody?.error || errorMessage; 
        } catch (e) {
          // Ignore if response body is not valid JSON or empty
          console.debug("Could not parse error response body as JSON", e);
        }
        console.error(`API Error on ${options.method} ${endpoint}:`, errorMessage, { status: response.status, body: errorBody });
        // Corrected: Return only the error message string according to ApiResponse type
        return { error: errorMessage };
      }

      // Handle successful responses
      // Check if response body is expected (e.g., not for 204 No Content)
      if (response.status === 204) {
         return { data: undefined as unknown as T }; // Or handle appropriately
      }

      // Assuming successful responses are JSON
      const data: T = await response.json();
      return { data };

    } catch (error: any) {
      console.error(`Network or unexpected error on ${options.method} ${endpoint}:`, error);
      // Corrected: Return only the error message string
      const message = error?.message || 'An unexpected error occurred.';
      return { error: message };
    }
  },
  
  // Helper methods for common request types
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> => {
    return apiService.callApi<T>(endpoint, { method: 'GET', params });
  },
  
  post: <T>(endpoint: string, body: object): Promise<ApiResponse<T>> => {
    return apiService.callApi<T>(endpoint, { method: 'POST', body });
  },
  
  put: <T>(endpoint: string, body: object): Promise<ApiResponse<T>> => {
    return apiService.callApi<T>(endpoint, { method: 'PUT', body });
  },
  
  delete: <T>(endpoint: string): Promise<ApiResponse<T>> => {
    return apiService.callApi<T>(endpoint, { method: 'DELETE' });
  },

  // Add function to get user details (matching reference)
  getUserDetails: async (userId: string): Promise<ApiResponse<User>> => {
    // No token needed here if callApi handles it automatically
    return apiService.callApi<User>(`/users/${userId}`, { method: 'GET' });
  },
};

export default apiService;
