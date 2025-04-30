
// Authentication Types
export interface User {
  userId: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Workplace Types
export interface Workplace {
  workplaceId: string;
  name: string;
  description?: string;
  ownerUserId: string;
}

export interface WorkplaceState {
  workplaces: Workplace[];
  selectedWorkplace: Workplace | null;
  isLoading: boolean;
  error: string | null;
}

// Account Types
export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export interface Account {
  accountId: string;
  workplaceId: string;
  accountName: string;
  accountType: AccountType;
  currencyCode: string;
  description?: string;
  isActive: boolean;
  balance?: number; // Calculated value, not stored directly
}

// Journal Types
export interface Journal {
  journalId: string;
  workplaceId: string;
  journalDate: string;
  name: string;
  description?: string;
}

// Transaction Types
export enum TransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export interface Transaction {
  transactionId: string;
  journalId: string;
  accountId: string;
  amount: number;
  transactionType: TransactionType;
  currencyCode: string;
  description?: string;
  transactionDate: string; // Usually same as Journal date
  accountName?: string; // For display purposes
}

// Journal with transactions - used when creating or viewing full journal
export interface JournalWithTransactions extends Journal {
  transactions: Transaction[];
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
