import { authService } from './authService';
import { 
  ApiResponse, 
  User, 
  Workplace, 
  WorkplaceMember, 
  UserWorkplaceRole,
  ProfitAndLossReport, 
  TrialBalanceReport, 
  BalanceSheetReport 
} from '../lib/types';

// API base URL from environment variables
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Check if the environment variable is set
if (!API_BASE_URL) {
  console.error("VITE_API_BASE_URL is not defined. Please check your .env file and restart the application.");
  // Optionally, throw an error or set a default, but logging is often preferred during startup.
  API_BASE_URL = 'http://localhost:8080/api/v1';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; // Specify allowed methods
  body?: object;
  params?: Record<string, string | number | boolean>;
  maxRetries?: number; // Maximum number of retries
  retryDelay?: number; // Initial delay between retries in ms
}

// --- Report Parameter Types (Exported at top level) ---
export interface FetchProfitAndLossParams {
  workplaceId: string;
  fromDate: string; // e.g., 'YYYY-MM-DD'
  toDate: string;   // e.g., 'YYYY-MM-DD'
}

export interface FetchTrialBalanceParams {
  workplaceId: string;
  asOfDate: string; // e.g., 'YYYY-MM-DD'
}

export interface FetchBalanceSheetParams {
  workplaceId: string;
  asOfDate: string; // e.g., 'YYYY-MM-DD'
}
// --- End Report Parameter Types ---

// Track in-flight requests to prevent duplicates
const pendingRequests = new Map<string, Promise<any>>();

// --- State for Token Refresh ---
let isRefreshing = false;
// Type for the subscriber function, expects new token or null if refresh failed
type RefreshSubscriber = (newAccessToken: string | null) => void;
const refreshSubscribers: RefreshSubscriber[] = [];
// --- End State for Token Refresh ---

// TEMPORARILY DISABLED: Rate limiting
// const lastRequestTimes = new Map<string, number>();
// const MIN_REQUEST_INTERVAL = 1000; // 1 second between identical requests

/**
 * Creates a request key based on the endpoint, method, and params
 */
const createRequestKey = (endpoint: string, options: RequestOptions): string => {
  return `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.params)}`;
};

/**
 * Exponential backoff for retry delay
 */
const getRetryDelay = (retryCount: number, initialDelay: number): number => {
  return initialDelay * Math.pow(2, retryCount);
};

// --- Internal Refresh Token Function (does not use callApi to avoid recursion) ---
const refreshAccessTokenInternal = async (): Promise<boolean> => {
  console.log('Attempting to refresh access token...');
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Browser should automatically send the HttpOnly refresh token cookie
      },
      // No body needed for refresh token request as specified
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        authService.setAuthToken(data.token);
        console.log('Access token refreshed successfully.');
        // Notify subscribers with the new token
        refreshSubscribers.forEach(callback => callback(data.token));
        return true;
      }
    }
    // If response not ok or token not in data, refresh failed
    console.error('Failed to refresh access token, status:', response.status);
    authService.logout(); // Critical: if refresh fails, log out the user
    refreshSubscribers.forEach(callback => callback(null)); // Notify subscribers of failure
    return false;
  } catch (error) {
    console.error('Error during token refresh:', error);
    authService.logout(); // Critical: if refresh fails, log out the user
    refreshSubscribers.forEach(callback => callback(null)); // Notify subscribers of failure
    return false;
  } finally {
    isRefreshing = false;
    refreshSubscribers.length = 0; // Clear subscribers after processing
  }
};
// --- End Internal Refresh Token Function ---

const apiService = {
  callApi: async <T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
    const token = authService.getAuthToken();
    let url = `${API_BASE_URL}${endpoint}`;
    
    // Set default retry options
    const maxRetries = options.maxRetries || 2;
    const retryDelay = options.retryDelay || 1000;
    
    // Create a unique key for this request
    const requestKey = createRequestKey(endpoint, options);
    
    // TEMPORARILY DISABLED: Rate limiting check
    /*
    const now = Date.now();
    const lastRequestTime = lastRequestTimes.get(requestKey) || 0;
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      console.log(`Throttling request to ${requestKey}, too frequent`);
      return { error: "Request throttled. Please try again in a moment." };
      }
    */
    
    // Check if there's already an in-flight request for this exact endpoint+options
    if (pendingRequests.has(requestKey)) {
      console.log(`Request to ${requestKey} already in progress, reusing promise`);
      return pendingRequests.get(requestKey);
    }

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

    // Create the request promise with retry logic
    const requestPromise = (async () => {
      let retryCount = 0;
      
      // TEMPORARILY DISABLED: Track last request time
      // lastRequestTimes.set(requestKey, now);
      
      while (true) {
        try {
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
            // Add specific signal with timeout to prevent hanging requests
            signal: AbortSignal.timeout(30000), // 30 second timeout
          };

          const response = await fetch(url, fetchOptions);

          // Check for 401 Unauthorized
          if (response.status === 401) {
            if (endpoint === '/auth/login') {
              // If 401 is from the login endpoint itself, it's a failed login, not an expired token.
              // Do not attempt refresh. Let the standard error handling proceed.
              console.log('callApi: 401 from /auth/login. Treating as failed login.');
            } else if (!isRefreshing) {
              isRefreshing = true;
              console.log('callApi: Access token expired or invalid. Attempting refresh...');
              const refreshSuccessful = await refreshAccessTokenInternal(); // This now also notifies subscribers
              // refreshAccessTokenInternal handles isRefreshing = false and clearing subscribers

              if (refreshSuccessful) {
                console.log('callApi: Token refresh successful. Retrying original request.');
                // Token has been updated by refreshAccessTokenInternal via authService.setAuthToken
                // Retry the request with the new token (it will be picked up by getAuthToken() on next loop iteration or recursive call)
                // To avoid deep recursion, we can just update token and let the existing retry logic handle it or make one direct retry.
                // For simplicity, let's make one direct retry here. Ensure to get the NEW token.
                const newToken = authService.getAuthToken();
                const retryFetchOptions: RequestInit = {
                  ...fetchOptions,
                  headers: {
                    ...fetchOptions.headers,
                    ...(newToken && { 'Authorization': `Bearer ${newToken}` }),
                  },
                };
                const retryResponse = await fetch(url, retryFetchOptions);
                if (retryResponse.status === 401) {
                  // If it still fails with 401 after refresh, then logout
                  console.error('callApi: Request failed with 401 even after token refresh. Logging out.');
                  authService.logout();
                  return { error: 'Session expired. Please log in again.' }; 
                }
                // Process the successful retryResponse
                if (!retryResponse.ok) {
                  try {
                    const errorBody = await retryResponse.json();
                    return { error: errorBody.message || errorBody.error || `HTTP error ${retryResponse.status}`, statusCode: retryResponse.status };
                  } catch (e) {
                    return { error: `HTTP error ${retryResponse.status} - Non-JSON response`, statusCode: retryResponse.status };
                  }
                }
                const data = await retryResponse.json().catch(() => null); // Handle empty or non-JSON responses
                return { data, statusCode: retryResponse.status };
              } else {
                // Refresh failed, logout was called by refreshAccessTokenInternal
                console.log('callApi: Token refresh failed. User should be logged out.');
                return { error: 'Session expired. Please log in again.' }; 
              }
            } else {
              // Another request is already refreshing the token, queue this one
              console.log('callApi: Token refresh in progress. Queuing request.');
              return new Promise<ApiResponse<T>>((resolve) => {
                refreshSubscribers.push((newAccessToken: string | null) => {
                  if (newAccessToken) {
                    console.log('callApi (queued): New token received. Retrying request.');
                    // Retry the request with the new token
                    const newFetchOptions: RequestInit = {
                       ...fetchOptions,
                        headers: {
                          ...fetchOptions.headers,
                          'Authorization': `Bearer ${newAccessToken}`,
                        },
                      };
                    fetch(url, newFetchOptions)
                      .then(async res => {
                        if (!res.ok) {
                          try {
                            const errorBody = await res.json();
                            resolve({ error: errorBody.message || errorBody.error || `HTTP error ${res.status}`, statusCode: res.status });
                          } catch (e) {
                            resolve({ error: `HTTP error ${res.status} - Non-JSON response`, statusCode: res.status });
                          }
                          return;
                        }
                        const data = await res.json().catch(() => null);
                        resolve({ data, statusCode: res.status });
                      })
                      .catch(err => {
                        console.error('callApi (queued): Retry failed.', err);
                        resolve({ error: err.message || 'Queued request retry failed.' });
                      });
                  } else {
                    // Refresh failed, propagate error
                    console.log('callApi (queued): Token refresh failed. Not retrying.');
                    resolve({ error: 'Session expired. Please log in again.' });
                  }
                });
              });
            }
          }

          // Standard response processing for non-401 responses
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
            
            // Determine if we should retry based on status code
            const shouldRetry = (
              retryCount < maxRetries && 
              (response.status >= 500 || response.status === 429)
            );
            
            if (shouldRetry) {
              retryCount++;
              const delay = getRetryDelay(retryCount, retryDelay);
              console.log(`Retrying ${options.method} ${endpoint} in ${delay}ms (${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            console.error(`API Error on ${options.method} ${endpoint}:`, errorMessage, { status: response.status, body: errorBody });
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
          // For network errors or timeouts, we may want to retry
          const isNetworkError = error.name === 'TypeError' && error.message === 'Failed to fetch';
          const isTimeoutError = error.name === 'TimeoutError' || error.name === 'AbortError';
          const shouldRetry = (retryCount < maxRetries) && (isNetworkError || isTimeoutError);
          
          if (shouldRetry) {
            retryCount++;
            const delay = getRetryDelay(retryCount, retryDelay);
            console.log(`Retrying ${options.method} ${endpoint} after error in ${delay}ms (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
      
          console.error(`Network or unexpected error on ${options.method} ${endpoint}:`, error);
          // Corrected: Return only the error message string
          const message = error?.message || 'An unexpected error occurred.';
          return { error: message };
        }
      }
    })();
    
    // Store the promise for this request
    pendingRequests.set(requestKey, requestPromise);
    
    try {
      // Wait for the promise to resolve
      return await requestPromise;
    } finally {
      // Clean up the pending request
      pendingRequests.delete(requestKey);
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
    const token = authService.getAuthToken(); // Get the token
    if (!token) {
      console.warn('[apiService.getUserDetails] No auth token found. Aborting call.');
      return {
        data: null,
        error: 'Authentication token not found. Please log in.',
        statusCode: 401 // Or another appropriate status code
      };
    }
    // If token exists, proceed with the call
    return apiService.callApi<User>(`/users/${userId}`, { method: 'GET' });
  },

  // Add function to create a new workplace
  createWorkplace: async (workplaceData: { name: string; description?: string; defaultCurrencyCode: string }): Promise<ApiResponse<Workplace>> => {
    return apiService.callApi<Workplace>('/workplaces', {
      method: 'POST',
      body: workplaceData
    });
  },
  
  // Workplace member management functions
  getWorkplaceMembers: async (workplaceId: string): Promise<ApiResponse<WorkplaceMember[] | { members: WorkplaceMember[] } | { users: WorkplaceMember[] }>> => {
    return apiService.callApi<WorkplaceMember[] | { members: WorkplaceMember[] } | { users: WorkplaceMember[] }>(`/workplaces/${workplaceId}/users`, { method: 'GET' });
  },
  
  addWorkplaceMember: async (workplaceId: string, userId: string, role: string): Promise<ApiResponse<WorkplaceMember>> => {
    return apiService.callApi<WorkplaceMember>(`/workplaces/${workplaceId}/users`, {
      method: 'POST',
      body: { userID: userId, role }
    });
  },
  
  updateWorkplaceMemberRole: async (workplaceId: string, userId: string, role: string): Promise<ApiResponse<void>> => {
    return apiService.callApi<void>(`/workplaces/${workplaceId}/users/${userId}`, {
      method: 'PUT',
      body: { role }
    });
  },
  
  removeWorkplaceMember: async (workplaceId: string, userId: string): Promise<ApiResponse<void>> => {
    return apiService.callApi<void>(`/workplaces/${workplaceId}/users/${userId}`, {
      method: 'DELETE'
    });
  },
  
  // Workplace activation/deactivation
  activateWorkplace: async (workplaceId: string): Promise<ApiResponse<void>> => {
    return apiService.callApi<void>(`/workplaces/${workplaceId}/activate`, {
      method: 'POST'
    });
  },
  
  deactivateWorkplace: async (workplaceId: string): Promise<ApiResponse<void>> => {
    return apiService.callApi<void>(`/workplaces/${workplaceId}/deactivate`, {
      method: 'POST'
    });
  },

  // --- Server Logout Function ---
  serverLogout: async (): Promise<ApiResponse<void>> => {
    const token = authService.getAuthToken(); // Get the token
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if your backend logout requires it
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      if (!response.ok) {
        // Log error but don't necessarily block client logout
        console.error('Server logout call failed:', response.status, await response.text());
        return { error: `Server logout failed with status ${response.status}` };
      }
      console.log('Server logout successful.');
      return { data: undefined }; // Or an appropriate success response
    } catch (error: any) {
      console.error('Error during server logout call:', error);
      return { error: error.message || 'Error during server logout' };
    }
  },
  // --- End Server Logout Function ---

  // --- Report Fetching Functions (Now correctly part of the apiService object) ---
  async fetchProfitAndLossReport(params: FetchProfitAndLossParams): Promise<ApiResponse<ProfitAndLossReport>> {
    const { workplaceId, fromDate, toDate } = params;
    return apiService.get<ProfitAndLossReport>(
      `/workplaces/${workplaceId}/reports/profit-and-loss`,
      { fromDate, toDate }
    );
  },

  async fetchTrialBalanceReport(params: FetchTrialBalanceParams): Promise<ApiResponse<TrialBalanceReport>> {
    const { workplaceId, asOfDate } = params;
    return apiService.get<TrialBalanceReport>(
      `/workplaces/${workplaceId}/reports/trial-balance`,
      { asOf: asOfDate }
    );
  },

  async fetchBalanceSheetReport(params: FetchBalanceSheetParams): Promise<ApiResponse<BalanceSheetReport>> {
    const { workplaceId, asOfDate } = params;
    return apiService.get<BalanceSheetReport>(
      `/workplaces/${workplaceId}/reports/balance-sheet`,
      { asOf: asOfDate }
    );
  },
  // --- End Report Fetching Functions ---

};

export default apiService;
