import apiService from './apiService';
import { Account, AccountType, ApiResponse } from '@/lib/types';

export interface AccountRequest {
  name: string;
  accountType: AccountType;
  currencyCode: string;
  description?: string;
  parentAccountID?: string | null;
  isActive?: boolean;
}

/**
 * Service for account-related API operations
 */
const accountService = {
  /**
   * Get all accounts for a workplace
   * 
   * @param workplaceId The ID of the workplace
   * @param includeInactive Whether to include inactive accounts
   * @returns Promise with accounts response
   */
  getAccounts: (
    workplaceId: string, 
    includeInactive: boolean = false
  ): Promise<ApiResponse<{ accounts: Account[] }>> => {
    return apiService.get<{ accounts: Account[] }>(
      `/workplaces/${workplaceId}/accounts`,
      { includeInactive }
    );
  },

  /**
   * Get a specific account by ID
   * 
   * @param workplaceId The ID of the workplace
   * @param accountId The ID of the account
   * @returns Promise with account response
   */
  getAccount: (
    workplaceId: string, 
    accountId: string
  ): Promise<ApiResponse<Account>> => {
    return apiService.get<Account>(`/workplaces/${workplaceId}/accounts/${accountId}`);
  },

  /**
   * Create a new account
   * 
   * @param workplaceId The ID of the workplace
   * @param accountData The account data to create
   * @returns Promise with created account response
   */
  createAccount: (
    workplaceId: string, 
    accountData: AccountRequest
  ): Promise<ApiResponse<Account>> => {
    return apiService.post<Account>(`/workplaces/${workplaceId}/accounts`, accountData);
  },

  /**
   * Update an existing account
   * 
   * @param workplaceId The ID of the workplace
   * @param accountId The ID of the account to update
   * @param accountData The account data to update
   * @returns Promise with updated account response
   */
  updateAccount: (
    workplaceId: string, 
    accountId: string, 
    accountData: AccountRequest
  ): Promise<ApiResponse<Account>> => {
    return apiService.put<Account>(`/workplaces/${workplaceId}/accounts/${accountId}`, accountData);
  },

  /**
   * Get account transactions with pagination
   * 
   * @param workplaceId The ID of the workplace
   * @param accountId The ID of the account
   * @param limit The maximum number of transactions to return
   * @param nextToken Pagination token for retrieving the next page
   * @returns Promise with account transactions response
   */
  getAccountTransactions: (
    workplaceId: string, 
    accountId: string, 
    limit: number = 20,
    nextToken?: string
  ): Promise<ApiResponse<{ transactions: any[], nextToken?: string }>> => {
    const params: Record<string, string | number | boolean> = { limit };
    if (nextToken) {
      params.nextToken = nextToken;
    }

    return apiService.get<{ transactions: any[], nextToken?: string }>(
      `/workplaces/${workplaceId}/accounts/${accountId}/transactions`,
      params
    );
  },

  /**
   * Toggle account active status
   * 
   * @param workplaceId The ID of the workplace
   * @param accountId The ID of the account
   * @param isActive The new active status
   * @returns Promise with updated account response
   */
  toggleAccountStatus: (
    workplaceId: string, 
    accountId: string, 
    isActive: boolean
  ): Promise<ApiResponse<Account>> => {
    return apiService.put<Account>(
      `/workplaces/${workplaceId}/accounts/${accountId}`, 
      { isActive }
    );
  },

  /**
   * Get parent accounts for a specific account type
   * 
   * @param workplaceId The ID of the workplace
   * @param accountType The account type to filter by
   * @returns Promise with parent accounts response
   */
  getParentAccounts: (
    workplaceId: string, 
    accountType: AccountType
  ): Promise<ApiResponse<{ accounts: Account[] }>> => {
    return apiService.get<{ accounts: Account[] }>(
      `/workplaces/${workplaceId}/accounts`, 
      { 
        accountType,
        includeInactive: false
      }
    );
  }
};

export default accountService; 