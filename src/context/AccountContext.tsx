import React, { createContext, useContext, useState, useEffect } from 'react';
import { Account } from '@/lib/types';
import apiService from '@/services/apiService';
import { useWorkplace } from '@/context/WorkplaceContext';

interface AccountState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
}

// Create the context
const AccountContext = createContext<{
  state: AccountState;
  getAccountById: (accountId: string) => Account | undefined;
  refreshAccounts: () => Promise<void>;
}>({
  state: {
    accounts: [],
    isLoading: false,
    error: null
  },
  getAccountById: () => undefined,
  refreshAccounts: async () => {}
});

// Create the provider component
export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AccountState>({
    accounts: [],
    isLoading: false,
    error: null
  });

  const { state: workplaceState } = useWorkplace();
  const selectedWorkplaceId = workplaceState.selectedWorkplace?.workplaceID;

  const fetchAccounts = async (workplaceId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await apiService.get<{ accounts: Account[] }>(
        `/workplaces/${workplaceId}/accounts`,
        { limit: 100 } // Fetch up to 100 accounts
      );
      
      if (response.data && Array.isArray(response.data.accounts)) {
        console.log('Accounts loaded:', response.data.accounts.length);
        setState({
          accounts: response.data.accounts,
          isLoading: false,
          error: null
        });
      } else if (response.error) {
        throw new Error(response.error);
      } else {
        throw new Error('Invalid response format from accounts API');
      }
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load accounts'
      }));
    }
  };

  // Refresh accounts for the current workplace
  const refreshAccounts = async () => {
    if (selectedWorkplaceId) {
      await fetchAccounts(selectedWorkplaceId);
    }
  };

  // Fetch accounts when workplace changes
  useEffect(() => {
    if (selectedWorkplaceId) {
      fetchAccounts(selectedWorkplaceId);
    } else {
      // Clear accounts when no workplace is selected
      setState({
        accounts: [],
        isLoading: false,
        error: null
      });
    }
  }, [selectedWorkplaceId]);

  // Helper function to get account by ID
  const getAccountById = (accountId: string): Account | undefined => {
    if (!state.accounts || !Array.isArray(state.accounts)) {
      return undefined;
    }
    return state.accounts.find(account => account.accountID === accountId);
  };

  return (
    <AccountContext.Provider value={{ state, getAccountById, refreshAccounts }}>
      {children}
    </AccountContext.Provider>
  );
};

// Custom hook to use the account context
export const useAccounts = () => useContext(AccountContext); 