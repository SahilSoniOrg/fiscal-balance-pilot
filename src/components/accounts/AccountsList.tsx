import React, { useState, useEffect } from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Account, AccountType } from '@/lib/types';
import apiService from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import CurrencyDisplay from '@/components/ui/currency-display';
import ErrorBoundary from '@/components/ui/error-boundary';
import AccountDialog from './AccountDialog';

interface AccountsListProps {
  onSelectAccount: (account: Account | null) => void;
}

interface FetchAccountsResponse {
  accounts: Account[];
}

const AccountsList: React.FC<AccountsListProps> = ({ onSelectAccount }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreationDialogOpen, setIsCreationDialogOpen] = useState(false);
  const { state: workplaceState } = useWorkplace();

  useEffect(() => {
    if (workplaceState.selectedWorkplace?.workplaceID) {
      fetchAccounts(workplaceState.selectedWorkplace.workplaceID);
    } else {
      setAccounts([]);
      setError(null);
      onSelectAccount(null);
    }
  }, [workplaceState.selectedWorkplace?.workplaceID]);

  const fetchAccounts = async (workplaceId: string) => {
    setIsLoading(true);
    setError(null);
    setAccounts([]);
    onSelectAccount(null);

    try {
      const response = await apiService.get<FetchAccountsResponse>(
        `/workplaces/${workplaceId}/accounts`,
        { limit: 100 } // Fetch up to 100 accounts
      );
      
      if (response.data && Array.isArray(response.data.accounts)) {
        console.log('Accounts loaded:', response.data.accounts.length);
        setAccounts(response.data.accounts);
        if (response.data.accounts.length > 0) {
          onSelectAccount(response.data.accounts[0]);
        } else {
          onSelectAccount(null);
        }
      } else if (response.error) {
        throw new Error(response.error || 'Failed to fetch accounts');
      } else {
        console.warn('Invalid accounts response format:', response.data);
        throw new Error('Received invalid format for accounts data');
      }
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      setError(error.message || 'Failed to load accounts.');
      setAccounts([]);
      onSelectAccount(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountCreated = (newAccount: Account) => {
    // Refresh accounts list after creating a new one
    if (workplaceState.selectedWorkplace?.workplaceID) {
      fetchAccounts(workplaceState.selectedWorkplace.workplaceID);
    }
  };

  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.description && account.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (account.accountType && account.accountType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedAccounts: Record<AccountType, Account[]> = {
    [AccountType.ASSET]: [],
    [AccountType.LIABILITY]: [],
    [AccountType.EQUITY]: [],
    [AccountType.REVENUE]: [],
    [AccountType.EXPENSE]: [],
  };

  filteredAccounts.forEach(account => {
    if (groupedAccounts[account.accountType]) {
      groupedAccounts[account.accountType].push(account);
    }
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Accounts</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsCreationDialogOpen(true)}
            disabled={!workplaceState.selectedWorkplace}
          >
            <Plus className="h-4 w-4 mr-1" /> New Account
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading || !!error}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-2 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading accounts...
          </div>
        ) : error ? (
           <Alert variant="destructive" className="m-4">
               <AlertDescription>{error}</AlertDescription>
           </Alert>
        ) : accounts.length === 0 && !searchTerm ? (
          <div className="p-4 text-center text-muted-foreground">
            No accounts found. Create your first account.
          </div>
        ) : filteredAccounts.length === 0 && searchTerm ? (
           <div className="p-4 text-center text-muted-foreground">
             No accounts match "{searchTerm}".
          </div>
        ) : (
          <div className="space-y-4">
            {(Object.keys(AccountType) as Array<keyof typeof AccountType>).map((typeKey) => {
                const type = AccountType[typeKey];
                const accountsOfType = groupedAccounts[type];
                return accountsOfType.length > 0 ? (
                <div key={type} className="space-y-1">
                    <h3 className="font-medium text-sm text-muted-foreground px-3">
                      {type}
                    </h3>
                  <div className="space-y-1">
                      {accountsOfType.map((account) => (
                      <button
                          key={account.accountID}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-accent flex justify-between items-center"
                        onClick={() => onSelectAccount(account)}
                      >
                          <span className={`${!account.isActive ? 'text-muted-foreground line-through' : ''}`}>
                            {account.name}
                          </span>
                          <span className="text-sm">
                            <ErrorBoundary fallback={<span>${account.balance || "0.00"}</span>}>
                              <CurrencyDisplay 
                                amount={account.balance || "0"}
                                currencyCode={account.currencyCode}
                                className={getAccountBalanceClass(account.accountType, account.balance)}
                              />
                            </ErrorBoundary>
                          </span>
                      </button>
                    ))}
                  </div>
                </div>
                ) : null;
            })}
          </div>
        )}
      </CardContent>
      
      <AccountDialog
        isOpen={isCreationDialogOpen}
        onClose={() => setIsCreationDialogOpen(false)}
        onSaved={handleAccountCreated}
      />
    </Card>
  );
};

// Helper function to get appropriate CSS class for account balances
const getAccountBalanceClass = (accountType: AccountType, balance: string | undefined): string => {
  const numBalance = parseFloat(balance || "0");
  
  // Different account types have different representations of positive/negative
  switch (accountType) {
    case AccountType.ASSET:
      return numBalance >= 0 ? 'text-green-600' : 'text-red-600';
    case AccountType.LIABILITY:
      return numBalance <= 0 ? 'text-green-600' : 'text-red-600';
    case AccountType.EQUITY:
      return numBalance <= 0 ? 'text-green-600' : 'text-red-600';
    case AccountType.REVENUE:
      return numBalance <= 0 ? 'text-green-600' : 'text-red-600';
    case AccountType.EXPENSE:
      return numBalance >= 0 ? 'text-amber-600' : 'text-green-600';
    default:
      return '';
  }
};

export default AccountsList;
