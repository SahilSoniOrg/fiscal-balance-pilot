import { authService } from './authService';
import { ApiResponse, PaginatedResponse } from '../lib/types';

// API base URL - in a real app, this would come from environment variables
const API_BASE_URL = 'https://api.fiscalbalance.com'; // This is a placeholder

interface RequestOptions {
  method?: string;
  body?: object;
  params?: Record<string, string | number | boolean>;
}

// We'll create mock data for our demo
export const mockData = {
  workplaces: [
    {
      workplaceId: 'workplace-1',
      name: 'Personal Finances',
      description: 'My personal financial tracking',
      ownerUserId: 'user-123',
    },
    {
      workplaceId: 'workplace-2',
      name: 'Small Business',
      description: 'Tracking business expenses and income',
      ownerUserId: 'user-123',
    },
  ],
  accounts: [
    {
      accountId: 'account-1',
      workplaceId: 'workplace-1',
      accountName: 'Checking Account',
      accountType: 'ASSET',
      currencyCode: 'USD',
      description: 'Main checking account',
      isActive: true,
      balance: 2500.75
    },
    {
      accountId: 'account-2',
      workplaceId: 'workplace-1',
      accountName: 'Credit Card',
      accountType: 'LIABILITY',
      currencyCode: 'USD',
      description: 'Main credit card',
      isActive: true,
      balance: -750.25
    },
    {
      accountId: 'account-3',
      workplaceId: 'workplace-1',
      accountName: 'Salary',
      accountType: 'REVENUE',
      currencyCode: 'USD',
      description: 'Income from employment',
      isActive: true,
      balance: -5000.00
    },
    {
      accountId: 'account-4',
      workplaceId: 'workplace-1',
      accountName: 'Groceries',
      accountType: 'EXPENSE',
      currencyCode: 'USD',
      description: 'Food and household items',
      isActive: true,
      balance: 650.50
    },
  ],
  journals: [
    {
      journalId: 'journal-1',
      workplaceId: 'workplace-1',
      journalDate: '2025-04-15',
      name: 'Salary Payment',
      description: 'Monthly salary deposit',
      transactions: [
        {
          transactionId: 'trans-1',
          journalId: 'journal-1',
          accountId: 'account-1', // Checking account
          accountName: 'Checking Account',
          amount: 3000.00,
          transactionType: 'DEBIT',
          currencyCode: 'USD',
          description: 'Salary deposit',
          transactionDate: '2025-04-15',
        },
        {
          transactionId: 'trans-2',
          journalId: 'journal-1',
          accountId: 'account-3', // Salary account
          accountName: 'Salary',
          amount: 3000.00,
          transactionType: 'CREDIT',
          currencyCode: 'USD',
          description: 'Monthly salary',
          transactionDate: '2025-04-15',
        },
      ],
    },
    {
      journalId: 'journal-2',
      workplaceId: 'workplace-1',
      journalDate: '2025-04-16',
      name: 'Grocery Shopping',
      description: 'Weekly grocery run',
      transactions: [
        {
          transactionId: 'trans-3',
          journalId: 'journal-2',
          accountId: 'account-4', // Groceries account
          accountName: 'Groceries',
          amount: 120.50,
          transactionType: 'DEBIT',
          currencyCode: 'USD',
          description: 'Weekly groceries',
          transactionDate: '2025-04-16',
        },
        {
          transactionId: 'trans-4',
          journalId: 'journal-2',
          accountId: 'account-1', // Checking account
          accountName: 'Checking Account',
          amount: 120.50,
          transactionType: 'CREDIT',
          currencyCode: 'USD',
          description: 'Payment for groceries',
          transactionDate: '2025-04-16',
        },
      ],
    },
  ]
};

const apiService = {
  callApi: async <T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
    const token = authService.getAuthToken();
    
    // In a real application, this would make an actual API call
    // For now, we'll simulate API responses with mock data
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If not authenticated, return error
      if (!token && !endpoint.includes('login')) {
        return { error: 'Not authenticated' };
      }
      
      // Handle different endpoints with mock responses
      if (endpoint === '/workplaces') {
        return { data: mockData.workplaces as unknown as T };
      }
      
      if (endpoint.includes('/accounts') && !endpoint.includes('/transactions')) {
        // If this is a request for a specific account
        if (endpoint.match(/\/accounts\/[^/]+$/)) {
          const accountId = endpoint.split('/').pop();
          const account = mockData.accounts.find(a => a.accountId === accountId);
          return account ? { data: account as unknown as T } : { error: 'Account not found' };
        }
        // Otherwise return all accounts for the workplace
        const workplaceId = endpoint.split('/')[2];
        const accounts = mockData.accounts.filter(a => a.workplaceId === workplaceId);
        return { data: accounts as unknown as T };
      }
      
      if (endpoint.includes('/journals') && !endpoint.includes('/transactions')) {
        // If this is a request for a specific journal
        if (endpoint.match(/\/journals\/[^/]+$/)) {
          const journalId = endpoint.split('/').pop();
          const journal = mockData.journals.find(j => j.journalId === journalId);
          return journal ? { data: journal as unknown as T } : { error: 'Journal not found' };
        }
        // Otherwise return all journals for the workplace
        const workplaceId = endpoint.split('/')[2];
        const journals = mockData.journals.filter(j => j.workplaceId === workplaceId);
        return { data: journals as unknown as T };
      }
      
      // Handle transactions for a specific journal
      if (endpoint.includes('/journals') && endpoint.includes('/transactions')) {
        const journalId = endpoint.split('/')[4];
        const journal = mockData.journals.find(j => j.journalId === journalId);
        if (!journal) return { error: 'Journal not found' };
        return { data: journal.transactions as unknown as T };
      }
      
      // Default response for unhandled endpoints
      return { error: 'Endpoint not implemented in mock API' };
    } catch (error) {
      return { error: 'An error occurred while making the request.' };
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
};

export default apiService;
