import { useState, useEffect, useCallback } from 'react';
import apiService from '@/services/apiService';

interface ApiResourceState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseApiResourceOptions {
  /** Whether to fetch data immediately when the hook mounts */
  fetchOnMount?: boolean;
  /** Dependencies array for refetching when values change */
  deps?: any[];
  /** Transform function to modify the API response before storing it */
  transform?: (data: any) => any;
}

/**
 * A custom hook for fetching data from the API with standardized loading and error states
 * 
 * @template T The type of data to be fetched
 * @param url The API endpoint URL to fetch data from
 * @param params Optional query parameters for the API request
 * @param options Additional options for controlling the hook behavior
 * @returns An object containing the data, loading state, error, and refetch function
 * 
 * @example
 * const { data: accounts, isLoading, error, refetch } = useApiResource<Account[]>(
 *   `/workplaces/${workplaceId}/accounts`,
 *   { limit: 20 }
 * );
 */
function useApiResource<T>(
  url: string,
  params: Record<string, any> = {},
  options: UseApiResourceOptions = {}
) {
  const { fetchOnMount = true, deps = [], transform } = options;
  
  const [state, setState] = useState<ApiResourceState<T>>({
    data: null,
    isLoading: false,
    error: null
  });

  const fetchData = useCallback(async (resetData: boolean = true) => {
    if (!url) return;
    
    if (resetData) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      const response = await apiService.get<T>(url, params);
      
      if (response.error) {
        throw new Error(response.error || 'Failed to fetch data');
      }
      
      if (response.data) {
        const transformedData = transform ? transform(response.data) : response.data;
        setState({
          data: transformedData,
          isLoading: false,
          error: null
        });
      } else {
        console.warn('Empty data response from API:', url);
        setState({
          data: null,
          isLoading: false,
          error: 'No data available'
        });
      }
    } catch (error: any) {
      console.error(`Error fetching data from ${url}:`, error);
      setState({
        data: null,
        isLoading: false,
        error: error.message || 'An unexpected error occurred'
      });
    }
  }, [url, params, transform]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
    // Include all dependencies for the useEffect, including fetchData
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOnMount, ...deps]);

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    refetch: fetchData,
    reset
  };
}

export default useApiResource; 