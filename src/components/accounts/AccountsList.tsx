import React, { useState } from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Account, AccountType } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import CurrencyDisplay from '@/components/ui/currency-display';
import ErrorBoundary from '@/components/ui/error-boundary';
import AccountDialog from './AccountDialog';

// Import our refactored components and hooks
import useApiResource from '@/hooks/useApiResource';
import ResourceHeader from '@/components/ui/resource-header';
import ResourceListItem from '@/components/ui/resource-list-item';
import EmptyState from '@/components/ui/empty-state';
import LoadingState from '@/components/ui/loading-state';
import ErrorDisplay from '@/components/ui/error-display';
import accountService from '@/services/accountService';

interface AccountsListProps {
  onSelectAccount: (account: Account | null) => void;
  onAccountsLoaded?: (accounts: Account[]) => void;
}

interface FetchAccountsResponse {
  accounts: Account[];
}

const AccountsList: React.FC<AccountsListProps> = ({ 
  onSelectAccount,
  onAccountsLoaded 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreationDialogOpen, setIsCreationDialogOpen] = useState(false);
  const { state: workplaceState } = useWorkplace();
  const workplaceId = workplaceState.selectedWorkplace?.workplaceID || '';

  // Use our custom hook for data fetching
  const {
    data,
    isLoading,
    error,
    refetch: refreshAccounts
  } = useApiResource<FetchAccountsResponse>(
    workplaceId ? `/workplaces/${workplaceId}/accounts` : '',
    { limit: 100 },
    {
      deps: [workplaceId],
      fetchOnMount: true,
      transform: (data) => {
        const accounts = data?.accounts || [];
        // Notify parent component that accounts were loaded
        if (onAccountsLoaded) {
          onAccountsLoaded(accounts);
        }
        return data;
      }
    }
  );

  const handleAccountCreated = (newAccount: Account) => {
    refreshAccounts();
  };

  const filteredAccounts = data?.accounts?.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.description && account.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (account.accountType && account.accountType.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

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
      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Use ResourceHeader component */}
        <ResourceHeader
          title="Accounts"
          primaryActionText="New Account"
          onPrimaryAction={() => setIsCreationDialogOpen(true)}
          compact
        />

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading || !!error}
          />
        </div>

        {/* Content area with appropriate states */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <LoadingState message="Loading accounts..." />
          ) : error ? (
            <ErrorDisplay message={error} />
          ) : data?.accounts?.length === 0 ? (
            <EmptyState
              title="No accounts found"
              message="Create your first account to get started"
              actionText="Create Account"
              onAction={() => setIsCreationDialogOpen(true)}
            />
          ) : filteredAccounts.length === 0 && searchTerm ? (
            <EmptyState
              title="No results found"
              message={`No accounts match "${searchTerm}"`}
              type="search"
            />
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
                    <div className="space-y-0.5">
                      {accountsOfType.map((account) => {
                        // Create a subtitle that includes CFID if it exists
                        let subtitle = '';
                        if (account.cfid) {
                          subtitle = `ID: ${account.cfid}`;
                          if (account.description) {
                            subtitle = `${account.description} • ${subtitle}`;
                          }
                        } else if (account.description) {
                          subtitle = account.description;
                        }

                        return (
                          <ResourceListItem
                            key={account.accountID}
                            title={account.name}
                            subtitle={subtitle}
                            value={
                              <ErrorBoundary fallback={<span>${account.balance || "0.00"}</span>}>
                                <CurrencyDisplay
                                  amount={account.balance || "0"}
                                  currencyCode={account.currencyCode}
                                  className={getAccountBalanceClass(account.accountType, account.balance)}
                                />
                              </ErrorBoundary>
                            }
                            onClick={() => onSelectAccount(account)}
                            isDisabled={!account.isActive}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
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
