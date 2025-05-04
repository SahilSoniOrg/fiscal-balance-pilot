import { useState, useEffect, useCallback } from 'react';
import apiService from '@/services/apiService';

interface PaginatedState<T> {
  data: T[];
  isLoading: boolean;
  isPaginationLoading: boolean;
  error: string | null;
  nextToken: string | null;
}

// A more specific type for the API response
interface PaginatedApiResponse<T> {
  // Dynamic data property that will be accessed via the dataKey
  [key: string]: any;
  nextToken?: string;
}

interface UsePaginatedDataOptions {
  /** The key in the response that contains the array of data */
  dataKey: string;
  /** Initial limit for pagination */
  limit?: number;
  /** Whether to fetch data immediately when the hook mounts */
  fetchOnMount?: boolean;
  /** Dependencies array for refetching when values change */
  deps?: any[];
  /** Transform function to modify each item before storing it */
  transformItem?: (item: any) => any;
  /** Additional parameters to include in the API request */
  params?: Record<string, any>;
}

/**
 * A custom hook for fetching paginated data with token-based pagination
 * 
 * @template T The type of data item to be fetched
 * @param url The API endpoint URL to fetch data from
 * @param options Configuration options for the hook
 * @returns An object containing the paginated data, loading states, error, and functions to control pagination
 * 
 * @example
 * const {
 *   data: journals,
 *   isLoading,
 *   isPaginationLoading,
 *   error,
 *   hasMore,
 *   loadMore,
 *   refresh
 * } = usePaginatedData<Journal>(
 *   `/workplaces/${workplaceId}/journals`,
 *   { 
 *     dataKey: 'journals', 
 *     limit: 20,
 *     params: { includeReversals: true }
 *   }
 * );
 */
function usePaginatedData<T>(
  url: string,
  options: UsePaginatedDataOptions
) {
  const {
    dataKey,
    limit = 20,
    fetchOnMount = true,
    deps = [],
    transformItem,
    params = {}
  } = options;
  
  const [state, setState] = useState<PaginatedState<T>>({
    data: [],
    isLoading: false,
    isPaginationLoading: false,
    error: null,
    nextToken: null
  });

  const fetchData = useCallback(async (reset: boolean = true, customParams: Record<string, any> = {}) => {
    if (!url) return;
    
    if (reset) {
      setState(prev => ({
        ...prev,
        isLoading: true,
        isPaginationLoading: false,
        error: null,
        data: [],
        nextToken: null
      }));
    } else {
      setState(prev => ({
        ...prev,
        isPaginationLoading: true,
        error: null
      }));
    }

    const requestParams = {
      limit,
      ...params,
      ...customParams,
      ...(state.nextToken && !reset ? { nextToken: state.nextToken } : {})
    };

    try {
      const response = await apiService.get<PaginatedApiResponse<T>>(url, requestParams);
      
      if (response.error) {
        throw new Error(response.error || 'Failed to fetch data');
      }
      
      if (response.data && Array.isArray(response.data[dataKey])) {
        const newItems = transformItem
          ? (response.data[dataKey] as T[]).map(transformItem)
          : (response.data[dataKey] as T[]);
          
        setState(prev => ({
          data: reset ? newItems : [...prev.data, ...newItems],
          isLoading: false,
          isPaginationLoading: false,
          error: null,
          nextToken: response.data.nextToken || null
        }));
      } else {
        console.warn('Invalid paginated response format:', response.data);
        throw new Error(`Expected array at response.data.${dataKey}`);
      }
    } catch (error: any) {
      console.error(`Error fetching paginated data from ${url}:`, error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isPaginationLoading: false,
        error: error.message || 'An unexpected error occurred'
      }));
    }
  }, [url, dataKey, limit, transformItem, state.nextToken, params]);

  const loadMore = useCallback(() => {
    if (state.nextToken) {
      fetchData(false);
    }
  }, [fetchData, state.nextToken]);

  const refresh = useCallback((customParams?: Record<string, any>) => {
    fetchData(true, customParams);
  }, [fetchData]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchData(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOnMount, ...deps]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    isPaginationLoading: state.isPaginationLoading,
    error: state.error,
    hasMore: !!state.nextToken,
    loadMore,
    refresh
  };
}

export default usePaginatedData; 