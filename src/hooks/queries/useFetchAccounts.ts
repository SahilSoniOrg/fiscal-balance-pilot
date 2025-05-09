import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import accountService from '@/services/accountService';
import { Account, ApiResponse } from '@/lib/types';

// TQueryFnData for useQuery is ApiResponse<{ accounts: Account[] }>
// TError is Error
// TData (after select) is Account[]
// TQueryKey is readonly (string | undefined)[]
type UseFetchAccountsOptions = Omit<
  UseQueryOptions<ApiResponse<{ accounts: Account[] }>, Error, Account[], readonly (string | undefined)[] >,
  'queryKey' | 'queryFn' | 'select'
>;

const fetchAccountsByWorkplace = async (workplaceId: string): Promise<ApiResponse<{ accounts: Account[] }>> => {
  const response = await accountService.getAccounts(workplaceId);
  if (response.error || !response.data) {
    throw new Error(response.error || 'Failed to fetch accounts');
  }
  return response;
};

export const useFetchAccounts = (workplaceId?: string, options?: UseFetchAccountsOptions) => {
  return useQuery<ApiResponse<{ accounts: Account[] }>, Error, Account[]>({ // Explicitly type useQuery arguments
    queryKey: ['accounts', workplaceId], // Use passed workplaceId
    queryFn: () => {
      if (!workplaceId) {
        // This should ideally be caught by the 'enabled' option or pre-flight checks
        return Promise.reject(new Error('workplaceId is required to fetch accounts.'));
      }
      return fetchAccountsByWorkplace(workplaceId);
    },
    select: (response) => response.data.accounts,
    enabled: !!workplaceId, // Default: Enable if workplaceId is provided
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options, // Allow overriding 'enabled' and other options
  });
};
