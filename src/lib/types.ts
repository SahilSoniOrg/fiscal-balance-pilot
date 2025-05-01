// Authentication Types
export interface User {
  userID: string;
  name: string;
}

export interface DecodedToken {
  sub: string;
  exp: number;
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
  workplaceID: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
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
  accountID: string;
  workplaceID: string;
  name: string;
  accountType: AccountType;
  currencyCode: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  balance: string;
}

// Journal Types
export interface Journal {
  journalID: string;
  workplaceID: string;
  date: string;
  description?: string;
  currencyCode: string;
  createdAt: string;
  createdBy: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  transactions?: Transaction[];
}

// Transaction Types
export enum TransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export interface Transaction {
  transactionID: string;
  journalID: string;
  accountID: string;
  amount: string;
  transactionType: TransactionType;
  currencyCode: string;
  notes: string;
  createdAt: string;
  createdBy: string;
}

// Journal with transactions - may be redundant if list endpoint returns transactions
// For now, keep it extending Journal, ensuring field consistency
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
