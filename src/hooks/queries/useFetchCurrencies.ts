import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiService from '@/services/apiService'; 
import { ApiResponse, Currency } from "@/lib/types";
import { useAuth } from '@/context/AuthContext';

interface UseFetchCurrenciesOptions {
  queryOptions?: Partial<UseQueryOptions<Currency[], Error, Currency[], string[]>>;
}

const fetchCurrencies = async (): Promise<Currency[]> => {
  console.log('fetchCurrencies: Attempting to fetch /currencies');
  const response = await apiService.get<Currency[]>(`/currencies`); 

  if (response.error || !response.data) { 
    const errorMessage = response.error || 'Failed to fetch currencies: No data object in response';
    console.error('fetchCurrencies: Error in response or no data object:', errorMessage);
    throw new Error(errorMessage);
  }
  return response.data; 
};

export const useFetchCurrencies = (options?: UseFetchCurrenciesOptions) => {
  const { token, isLoading: isAuthLoading } = useAuth();

  const queryIsEnabled = !isAuthLoading && !!token;

  return useQuery<Currency[], Error, Currency[], string[]>({ 
    queryKey: ['currencies'], 
    queryFn: fetchCurrencies, 
    enabled: queryIsEnabled,
    staleTime: 24 * 60 * 60 * 1000, 
    gcTime: 24 * 60 * 60 * 1000, 
    ...(options?.queryOptions), 
  });
};
