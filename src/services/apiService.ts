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
    // No token needed here if callApi handles it automatically
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
