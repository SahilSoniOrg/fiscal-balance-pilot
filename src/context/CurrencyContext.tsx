import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency, CurrencyState } from '@/lib/types';
import apiService from '@/services/apiService';

// Create the context
const CurrencyContext = createContext<{
  state: CurrencyState;
  getCurrencyByCode: (code: string) => Currency | undefined;
}>({
  state: {
    currencies: [],
    isLoading: false,
    error: null
  },
  getCurrencyByCode: () => undefined
});

// Create the provider component
export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CurrencyState>({
    currencies: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        // Try to fetch currencies
        const response = await apiService.get<{ currencies: Currency[] } | Currency[]>('/currencies');
        
        if (response.data) {
          console.log('Raw currency data from API:', response.data);
          
          // Handle different response structures
          let currencies: Currency[];
          
          if (Array.isArray(response.data)) {
            // If response.data is already an array
            currencies = response.data;
          } else if (response.data.currencies && Array.isArray(response.data.currencies)) {
            // If response.data has a currencies property that's an array
            currencies = response.data.currencies;
          } else {
            // Unknown structure
            console.error('Unexpected currencies response format:', response.data);
            currencies = [];
          }
          
          setState({
            currencies,
            isLoading: false,
            error: null
          });
          
          console.log('Processed currencies:', currencies);
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (error: any) {
        console.error('Failed to fetch currencies:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to load currencies'
        }));
      }
    };

    fetchCurrencies();
  }, []);

  // Helper function to get currency by code
  const getCurrencyByCode = (code: string): Currency | undefined => {
    // Ensure currencies exists and is an array before using find
    if (!state.currencies || !Array.isArray(state.currencies)) {
      console.warn('No currencies available when looking for:', code);
      return undefined;
    }
    
    const currency = state.currencies.find(currency => currency.currencyCode === code);
    console.log(`Looking for currency with code ${code}:`, currency);
    return currency;
  };

  return (
    <CurrencyContext.Provider value={{ state, getCurrencyByCode }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to use the currency context
export const useCurrency = () => useContext(CurrencyContext); 