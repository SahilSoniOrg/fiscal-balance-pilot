import React, { useMemo } from 'react';
import { Account } from '@/lib/types';
import { useWorkplace } from '@/context/WorkplaceContext';
import accountService from '@/services/accountService';
import { useToast } from '@/hooks/use-toast';
import { 
  createContextProvider, 
  BaseState
} from '@/lib/createContextProvider';

// Define the state interface
interface AccountState extends BaseState {
  accounts: Account[];
}

// Define action types
const FETCH_ACCOUNTS_REQUEST = 'FETCH_ACCOUNTS_REQUEST';
const FETCH_ACCOUNTS_SUCCESS = 'FETCH_ACCOUNTS_SUCCESS';
const FETCH_ACCOUNTS_FAILURE = 'FETCH_ACCOUNTS_FAILURE';
const CLEAR_ACCOUNTS = 'CLEAR_ACCOUNTS';
const ADD_ACCOUNT = 'ADD_ACCOUNT';
const UPDATE_ACCOUNT = 'UPDATE_ACCOUNT';
const REMOVE_ACCOUNT = 'REMOVE_ACCOUNT';

// Define action interfaces
type AccountAction = 
  | { type: typeof FETCH_ACCOUNTS_REQUEST }
  | { type: typeof FETCH_ACCOUNTS_SUCCESS; payload: Account[] }
  | { type: typeof FETCH_ACCOUNTS_FAILURE; payload: string }
  | { type: typeof CLEAR_ACCOUNTS }
  | { type: typeof ADD_ACCOUNT; payload: Account }
  | { type: typeof UPDATE_ACCOUNT; payload: Account }
  | { type: typeof REMOVE_ACCOUNT; payload: string };

// Action creators
const actions = {
  request: (): AccountAction => ({ type: FETCH_ACCOUNTS_REQUEST }),
  success: (accounts: Account[]): AccountAction => ({ type: FETCH_ACCOUNTS_SUCCESS, payload: accounts }),
  failure: (error: string): AccountAction => ({ type: FETCH_ACCOUNTS_FAILURE, payload: error }),
  clear: (): AccountAction => ({ type: CLEAR_ACCOUNTS }),
  addAccount: (account: Account): AccountAction => ({ type: ADD_ACCOUNT, payload: account }),
  updateAccount: (account: Account): AccountAction => ({ type: UPDATE_ACCOUNT, payload: account }),
  removeAccount: (accountId: string): AccountAction => ({ type: REMOVE_ACCOUNT, payload: accountId })
};

// Define the context value interface
interface AccountContextValue {
  state: AccountState;
  getAccountById: (accountId: string) => Account | undefined;
  refreshAccounts: () => Promise<void>;
  addAccount: (account: Account) => void;
  updateAccount: (account: Account) => void;
  removeAccount: (accountId: string) => void;
}

// Initial state
const initialState: AccountState = {
  accounts: [],
  isLoading: false,
  error: null
};

// Reducer function
const accountReducer = (state: AccountState, action: AccountAction): AccountState => {
  switch (action.type) {
    case FETCH_ACCOUNTS_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case FETCH_ACCOUNTS_SUCCESS:
      return {
        ...state,
        accounts: action.payload,
        isLoading: false,
        error: null
      };
    case FETCH_ACCOUNTS_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case CLEAR_ACCOUNTS:
      return initialState;
    case ADD_ACCOUNT:
      return {
        ...state,
        accounts: [...state.accounts, action.payload]
      };
    case UPDATE_ACCOUNT:
      return {
        ...state,
        accounts: state.accounts.map(account => 
          account.accountID === action.payload.accountID ? action.payload : account
        )
      };
    case REMOVE_ACCOUNT:
      return {
        ...state,
        accounts: state.accounts.filter(account => account.accountID !== action.payload)
      };
    default:
      return state;
  }
};

// Create the account context provider
const { Provider, useContext } = createContextProvider<AccountState, AccountAction, AccountContextValue>({
  name: 'Account',
  initialState,
  reducer: accountReducer,
  
  // Define functions that will be exposed through the context
  getContextValue: (state, dispatch) => {
    const { toast } = useToast();
    const { state: workplaceState } = useWorkplace();
    const workplaceId = workplaceState.selectedWorkplace?.workplaceID;
    
    // Function to fetch accounts
    const fetchAccounts = async () => {
      if (!workplaceId) return;
      
      dispatch(actions.request());
      
      try {
        const response = await accountService.getAccounts(workplaceId);
        
        if (response.error) {
          dispatch(actions.failure(response.error));
          toast({
            title: "Error Loading Accounts",
            description: response.error,
            variant: "destructive"
          });
        } else if (response.data && response.data.accounts) {
          dispatch(actions.success(response.data.accounts));
        } else {
          dispatch(actions.failure('Received invalid data format for accounts.'));
        }
      } catch (error: any) {
        console.error('Failed to fetch accounts:', error);
        dispatch(actions.failure(error.message || 'An unexpected error occurred while loading accounts.'));
      }
    };
    
    return {
      // Helper function to get account by ID
      getAccountById: (accountId: string): Account | undefined => {
        return state.accounts.find(account => account.accountID === accountId);
      },
      
      // Refresh accounts
      refreshAccounts: async () => {
        await fetchAccounts();
      },
      
      // Optimistic update functions
      addAccount: (account: Account) => {
        dispatch(actions.addAccount(account));
      },
      
      updateAccount: (account: Account) => {
        dispatch(actions.updateAccount(account));
      },
      
      removeAccount: (accountId: string) => {
        dispatch(actions.removeAccount(accountId));
      },
    };
  },
  
  // Fetch on mount and when workplace changes
  dependencies: () => {
    const { state } = useWorkplace();
    return useMemo(() => ({ 
      workplaceId: state.selectedWorkplace?.workplaceID 
    }), [state.selectedWorkplace?.workplaceID]);
  },
  
  // Fetch function to be called on mount and when dependencies change
  fetchOnMount: async (dispatch, dependencies) => {
    const { workplaceId } = dependencies;
    
    // Get current state to check loading status
    const state = localStorage.getItem(`context_accounts`);
    const currentState = state ? JSON.parse(state) : null;
    const isLoading = currentState?.isLoading || false;
    
    // Skip if already in a loading state to prevent continuous calls
    if (isLoading) return;
    
    if (workplaceId) {
      dispatch(actions.request());
      
      try {
        const response = await accountService.getAccounts(workplaceId);
        
        if (response.error) {
          dispatch(actions.failure(response.error));
        } else if (response.data && response.data.accounts) {
          dispatch(actions.success(response.data.accounts));
        } else {
          dispatch(actions.failure('Received invalid data format for accounts.'));
        }
      } catch (error: any) {
        console.error('Failed to fetch accounts:', error);
        dispatch(actions.failure(error.message || 'An unexpected error occurred while loading accounts.'));
      }
    } else {
      dispatch(actions.clear());
    }
  },
  
  // Enable caching
  cache: {
    enabled: true,
    key: 'accounts',
    expiryMs: 5 * 60 * 1000 // 5 minutes
  }
});

// Export the provider component
export const AccountProvider = Provider;

// Export the custom hook
export const useAccounts = useContext; 