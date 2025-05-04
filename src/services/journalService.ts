import apiService from './apiService';
import { Journal, JournalWithTransactions, Transaction, ApiResponse } from '@/lib/types';

export interface JournalRequest {
  date: string;
  description?: string;
  currencyCode: string;
  transactions: JournalTransactionRequest[];
}

export interface JournalTransactionRequest {
  accountID: string;
  amount: string;
  transactionType: 'DEBIT' | 'CREDIT';
  notes?: string;
}

/**
 * Service for journal-related API operations
 */
const journalService = {
  /**
   * Get all journals for a workplace with pagination
   * 
   * @param workplaceId The ID of the workplace
   * @param limit The maximum number of journals to return
   * @param nextToken Pagination token for retrieving the next page
   * @param includeReversals Whether to include reversal journals
   * @returns Promise with journals response
   */
  getJournals: (
    workplaceId: string, 
    limit: number = 20,
    nextToken?: string,
    includeReversals: boolean = true
  ): Promise<ApiResponse<{ journals: Journal[], nextToken?: string }>> => {
    const params: Record<string, string | number | boolean> = { 
      limit,
      includeReversals
    };
    
    if (nextToken) {
      params.nextToken = nextToken;
    }

    return apiService.get<{ journals: Journal[], nextToken?: string }>(
      `/workplaces/${workplaceId}/journals`,
      params
    );
  },

  /**
   * Get a specific journal with its transactions
   * 
   * @param workplaceId The ID of the workplace
   * @param journalId The ID of the journal
   * @returns Promise with journal and transactions response
   */
  getJournal: (
    workplaceId: string, 
    journalId: string
  ): Promise<ApiResponse<JournalWithTransactions>> => {
    return apiService.get<JournalWithTransactions>(
      `/workplaces/${workplaceId}/journals/${journalId}`
    );
  },

  /**
   * Create a new journal entry
   * 
   * @param workplaceId The ID of the workplace
   * @param journalData The journal data to create
   * @returns Promise with created journal response
   */
  createJournal: (
    workplaceId: string, 
    journalData: JournalRequest
  ): Promise<ApiResponse<Journal>> => {
    // Ensure date is in ISO format if it's not already
    const formattedData = {
      ...journalData,
      date: new Date(journalData.date).toISOString()
    };

    return apiService.post<Journal>(
      `/workplaces/${workplaceId}/journals`, 
      formattedData
    );
  },

  /**
   * Update an existing journal
   * 
   * @param workplaceId The ID of the workplace
   * @param journalId The ID of the journal to update
   * @param journalData The journal data to update
   * @returns Promise with updated journal response
   */
  updateJournal: (
    workplaceId: string, 
    journalId: string,
    journalData: JournalRequest
  ): Promise<ApiResponse<Journal>> => {
    // Ensure date is in ISO format if it's not already
    const formattedData = {
      ...journalData,
      date: new Date(journalData.date).toISOString()
    };

    return apiService.put<Journal>(
      `/workplaces/${workplaceId}/journals/${journalId}`, 
      formattedData
    );
  },

  /**
   * Create a reversal journal for an existing journal
   * 
   * @param workplaceId The ID of the workplace
   * @param journalId The ID of the journal to reverse
   * @param reversalDate The date for the reversal journal
   * @returns Promise with created reversal journal response
   */
  reverseJournal: (
    workplaceId: string, 
    journalId: string,
    reversalDate: string
  ): Promise<ApiResponse<Journal>> => {
    // Ensure date is in ISO format if it's not already
    const formattedDate = new Date(reversalDate).toISOString();

    return apiService.post<Journal>(
      `/workplaces/${workplaceId}/journals/${journalId}/reverse`, 
      { date: formattedDate }
    );
  },

  /**
   * Search journals by various criteria
   * 
   * @param workplaceId The ID of the workplace
   * @param searchParams Search parameters
   * @returns Promise with search results
   */
  searchJournals: (
    workplaceId: string,
    searchParams: {
      description?: string;
      fromDate?: string;
      toDate?: string;
      accountId?: string;
      limit?: number;
      nextToken?: string;
    }
  ): Promise<ApiResponse<{ journals: Journal[], nextToken?: string }>> => {
    // Format dates to ISO strings if provided
    const params: Record<string, string | number | boolean> = {};
    
    // Copy all search params except dates which need special handling
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'fromDate' && key !== 'toDate') {
        params[key] = value;
      }
    });
    
    // Handle date formatting explicitly
    if (searchParams.fromDate) {
      params.fromDate = new Date(searchParams.fromDate).toISOString();
    }
    
    if (searchParams.toDate) {
      params.toDate = new Date(searchParams.toDate).toISOString();
    }

    return apiService.get<{ journals: Journal[], nextToken?: string }>(
      `/workplaces/${workplaceId}/journals/search`,
      params
    );
  }
};

export default journalService; 