// API Token Types
export interface ApiToken {
  id: string;
  name: string;
  lastUsedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface CreateTokenRequest {
  name: string;
  expiresIn?: number;
}

export interface CreateTokenResponse {
  token: string;
  details: ApiToken;
}

// Authentication Types
export interface User {
  userID: string;
  name: string;
  email?: string;
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
  defaultCurrencyCode?: string;
  isActive?: boolean;
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

// User roles in workplaces
export enum UserWorkplaceRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  REMOVED = 'REMOVED'
}

// Workplace member details
export interface WorkplaceMember {
  userID: string;
  userName: string;
  workplaceID: string;
  role: UserWorkplaceRole;
  joinedAt: string;
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
  cfid?: string; // Customer Facing ID
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
  status: string;
  originalJournalID?: string;
  reversingJournalID?: string;
  amount?: string;  // Total amount of the journal
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
  journalDate: string;
  journalDescription: string | null;
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
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Currency Types
export interface Currency {
  currencyCode: string;
  symbol: string;
  name: string;
  precision?: number;
}

export interface CurrencyState {
  currencies: Currency[];
  isLoading: boolean;
  error: string | null;
}

// REPORTING TYPES

// For Trial Balance Report
export interface TrialBalanceRow {
  accountID: string;
  accountName: string;
  accountType: AccountType; // Using existing enum
  debit: string; 
  credit: string; 
}

export interface TrialBalanceReport {
  asOf: string; 
  rows: TrialBalanceRow[];
  totals: {
    debit: string;
    credit: string;
  };
  currencyCode: string;
}

// For Profit and Loss Report
export interface ReportAccountAmount {
  accountID: string;
  name: string;
  amount: string; 
}

export interface ProfitAndLossReport {
  fromDate: string; 
  toDate: string;    
  revenue: ReportAccountAmount[];
  expenses: ReportAccountAmount[];
  summary: {
    totalRevenue: string;
    totalExpenses: string;
    netProfit: string;
  };
}

// For Balance Sheet Report
export interface BalanceSheetReport {
  asOf: string; 
  assets: ReportAccountAmount[];
  liabilities: ReportAccountAmount[];
  equity: ReportAccountAmount[];
  summary: {
    totalAssets: string;
    totalLiabilities: string;
    totalEquity: string;
    totalLiabilitiesAndEquity: string;
  };
  currencyCode: string;
}
