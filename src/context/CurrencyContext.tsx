import React, { useMemo } from 'react';
import { Currency } from '../lib/types';
import apiService from '../services/apiService';
import { useToast } from "@/hooks/use-toast";
import { 
  createContextProvider, 
  BaseState
} from '@/lib/createContextProvider';
import { useWorkplace } from '@/context/WorkplaceContext';
import { useAuth } from '@/context/AuthContext';

// Define the state interface
interface CurrencyContextState extends BaseState {
  currencies: Currency[];
  baseCurrency: Currency | null;
}

// Define action types
const FETCH_CURRENCIES_REQUEST = 'FETCH_CURRENCIES_REQUEST';
const FETCH_CURRENCIES_SUCCESS = 'FETCH_CURRENCIES_SUCCESS';
const FETCH_CURRENCIES_FAILURE = 'FETCH_CURRENCIES_FAILURE';
const SET_BASE_CURRENCY = 'SET_BASE_CURRENCY';

// Define action interfaces
type CurrencyAction = 
  | { type: typeof FETCH_CURRENCIES_REQUEST }
  | { type: typeof FETCH_CURRENCIES_SUCCESS; payload: Currency[] }
  | { type: typeof FETCH_CURRENCIES_FAILURE; payload: string }
  | { type: typeof SET_BASE_CURRENCY; payload: Currency };

// Action creators
const actions = {
  request: (): CurrencyAction => ({ type: FETCH_CURRENCIES_REQUEST }),
  success: (currencies: Currency[]): CurrencyAction => ({ type: FETCH_CURRENCIES_SUCCESS, payload: currencies }),
  failure: (error: string): CurrencyAction => ({ type: FETCH_CURRENCIES_FAILURE, payload: error }),
  setBase: (currency: Currency): CurrencyAction => ({ type: SET_BASE_CURRENCY, payload: currency })
};

// Define the context value interface
interface CurrencyContextValue {
  state: CurrencyContextState;
  setBaseCurrency: (currency: Currency) => void;
  fetchCurrencies: () => Promise<void>;
  getCurrencyByCode: (code: string) => Currency | undefined;
}

// Initial state
const initialState: CurrencyContextState = {
  currencies: [],
  baseCurrency: null,
  isLoading: false,
  error: null
};

// Currency reducer
const currencyReducer = (state: CurrencyContextState, action: CurrencyAction): CurrencyContextState => {
  switch (action.type) {
    case FETCH_CURRENCIES_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case FETCH_CURRENCIES_SUCCESS:
      // Find USD or first available currency as base
      const usdCurrency = action.payload.find(c => c.currencyCode === 'USD');
      const baseCurrency = usdCurrency || action.payload[0] || null;
      
      return {
        ...state,
        isLoading: false,
        currencies: action.payload,
        baseCurrency: state.baseCurrency || baseCurrency,
        error: null,
      };
    case FETCH_CURRENCIES_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case SET_BASE_CURRENCY:
      return {
        ...state,
        baseCurrency: action.payload,
      };
    default:
      return state;
  }
};

// Create the currency context provider
const { Provider, useContext } = createContextProvider<CurrencyContextState, CurrencyAction, CurrencyContextValue>({
  name: 'Currency',
  initialState,
  reducer: currencyReducer,
  
  // Define functions that will be exposed through the context
  getContextValue: (state, dispatch) => {
    const { toast } = useToast();
    
    // Function to fetch currencies
    const fetchCurrencies = async () => {
      // Don't fetch if already loading
      if (state.isLoading) return;
      
      dispatch(actions.request());
      
      try {
        const response = await apiService.get<{ currencies: Currency[] }>('/currencies');
        
        if (response.error) {
          dispatch(actions.failure(response.error));
          toast({
            title: "Error Loading Currencies",
            description: response.error,
            variant: "destructive"
          });
        } else if (response.data && response.data.currencies) {
          dispatch(actions.success(response.data.currencies));
        } else {
          dispatch(actions.failure('Received invalid data format for currencies.'));
          toast({
            title: "Error",
            description: "Received invalid data format for currencies.",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        console.error('Failed to fetch currencies:', error);
        dispatch(actions.failure(error.message || 'An unexpected error occurred while loading currencies.'));
      }
    };
    
    // Function to set base currency
    const setBaseCurrency = (currency: Currency) => {
      dispatch(actions.setBase(currency));
      toast({
        title: "Base Currency Changed",
        description: `Base currency is now: ${currency.currencyCode}`,
      });
    };
    
    // Function to get a currency by its code
    const getCurrencyByCode = (code: string): Currency | undefined => {
      return state.currencies.find(c => c.currencyCode === code);
    };
    
    return {
      fetchCurrencies,
      setBaseCurrency,
      getCurrencyByCode
    };
  },
  
  // Dependencies for fetching data - using useMemo to prevent frequent regeneration
  dependencies: () => {
    const { state } = useWorkplace();
    const { token, isLoading: isAuthLoading } = useAuth();
    
    const deps = useMemo(() => ({
      workplaceId: state.selectedWorkplace?.workplaceID,
      token,
      isAuthLoading
    }), [state.selectedWorkplace?.workplaceID, token, isAuthLoading]);
    
    console.log("CurrencyContext deps created:", { 
      workplaceId: !!deps.workplaceId, 
      token: !!deps.token, 
      isAuthLoading: deps.isAuthLoading 
    });
    
    return deps;
  },
  
  // Fetch function to be called on mount and when dependencies change
  fetchOnMount: async (dispatch, dependencies) => {
    const { workplaceId, token, isAuthLoading } = dependencies;
    
    console.log("CurrencyContext fetchOnMount called with:", { 
      workplaceId: !!workplaceId, 
      token: !!token, 
      isAuthLoading 
    });
    
    // Only fetch if authenticated and auth loading is complete
    if (!isAuthLoading && token && workplaceId) {
      dispatch(actions.request());
      
      try {
        const response = await apiService.get<{ currencies: Currency[] }>('/currencies');
        
        if (response.error) {
          dispatch(actions.failure(response.error));
        } else if (response.data && response.data.currencies) {
          dispatch(actions.success(response.data.currencies));
        } else {
          dispatch(actions.failure('Received invalid data format for currencies.'));
        }
      } catch (error: any) {
        console.error('Failed to fetch currencies:', error);
        dispatch(actions.failure(error.message || 'An unexpected error occurred while loading currencies.'));
      }
    }
  },
  
  // Enable caching
  cache: {
    enabled: true,
    key: 'currencies',
    expiryMs: 24 * 60 * 60 * 1000 // 24 hours
  }
});

// Export the custom hook
export const useCurrency = useContext;

// Export the provider component
export default Provider; 