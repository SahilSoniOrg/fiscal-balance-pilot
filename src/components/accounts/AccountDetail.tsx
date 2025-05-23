import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Account, Transaction, AccountType } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import CurrencyDisplay from '@/components/ui/currency-display';
import ErrorBoundary from '@/components/ui/error-boundary';
import { useFetchAccounts } from '@/hooks/queries/useFetchAccounts';
import AccountDialog from './AccountDialog';

// Import our refactored components and hooks
import usePaginatedData from '@/hooks/usePaginatedData';
import ResourceHeader from '@/components/ui/resource-header';
import EmptyState from '@/components/ui/empty-state';
import LoadingState from '@/components/ui/loading-state';
import ErrorDisplay from '@/components/ui/error-display';
import PaginationControls from '@/components/ui/pagination-controls';

interface AccountDetailProps {
  account: (Account & { workplaceID: string }) | null;
}

interface AccountTransaction extends Omit<Transaction, 'journalName'> {
  // Add any other fields specific to this view if needed
}

const AccountDetail: React.FC<AccountDetailProps> = ({ account }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const {
    data: allAccounts,
    isLoading: isLoadingAccounts,
    error: accountsError
  } = useFetchAccounts();

  // If we have an account from the accounts context, use that to get the latest balance
  const foundInFetched = account && allAccounts ? allAccounts.find(acc => acc.accountID === account.accountID) : undefined;
  const latestAccount = account ? (foundInFetched || account) : null;

  // Use the pagination hook for transactions
  const {
    data: transactions,
    isLoading,
    isPaginationLoading,
    error,
    hasMore,
    loadMore,
    refresh: refreshTransactions
  } = usePaginatedData<AccountTransaction>(
    account ? `/workplaces/${account.workplaceID}/accounts/${account.accountID}/transactions` : '',
    {
      dataKey: 'transactions',
      limit: 20,
      fetchOnMount: !!account,
      deps: [account?.accountID, account?.workplaceID]
    }
  );

  const handleAccountUpdated = (updatedAccount: Account) => {
    // Refresh transactions to ensure we have the latest data
    refreshTransactions();
  };

  if (!account) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <EmptyState
            message="Select an account to view details"
            type="default"
            showIcon={false}
          />
        </CardContent>
      </Card>
    );
  }

  // Determine balance display style
  const getBalanceClass = (type: AccountType, balance: string | undefined): string => {
    const numBalance = parseFloat(balance || "0");

    switch (type) {
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

  return (
    <Card className="h-full">
      <CardHeader>
        <ResourceHeader
          title={account.name}
          subtitle={account.description || 'No description'}
          actions={
            <div className="space-x-2">
              <Badge variant={account.isActive ? "default" : "outline"}>
                {account.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">{account.accountType}</Badge>
              <Badge variant="outline">{account.currencyCode}</Badge>
            </div>
          }
          primaryActionText="Edit"
          primaryActionIcon={null}
          onPrimaryAction={() => setIsEditDialogOpen(true)}
        />

        {account.cfid && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-muted-foreground text-sm">Customer ID:</span>
            <span className="text-sm font-medium">{account.cfid}</span>
          </div>
        )}
        <div className="mt-4 flex items-center space-x-2">
          <span className="text-muted-foreground">Balance:</span>
          {isLoadingAccounts ? (
            <span className="text-xl font-semibold opacity-75">Loading...</span>
          ) : accountsError ? (
            <span className="text-xl font-semibold text-red-500">Error</span>
          ) : (
            <span className={`text-xl font-semibold ${getBalanceClass(account.accountType, latestAccount?.balance)}`}>
              <ErrorBoundary fallback={<span>${latestAccount?.balance || "0.00"}</span>}>
                <CurrencyDisplay
                  amount={latestAccount?.balance || "0"}
                  currencyCode={account.currencyCode}
                />
              </ErrorBoundary>
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div>
          <h3 className="text-lg font-medium mb-4">Recent Transactions</h3>

          {isLoading ? (
            <LoadingState message="Loading transactions..." />
          ) : error ? (
            <ErrorDisplay
              message={error}
              title="Error Loading Transactions"
            />
          ) : transactions.length === 0 ? (
            <EmptyState
              message="No transactions found for this account."
              title="No Transactions"
            />
          ) : (
            <div className="space-y-3">
              {transactions.map(transaction => {
                const displayDate = transaction.journalDate || transaction.createdAt;
                const formattedDate = displayDate && !isNaN(new Date(displayDate).getTime())
                  ? formatDistanceToNow(new Date(displayDate), { addSuffix: true })
                  : 'Invalid date';

                const hasDescription = Boolean(transaction.journalDescription);
                const hasNotes = Boolean(transaction.notes);

                return (
                  <div key={transaction.transactionID} className="group flex justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">
                          {hasDescription ? transaction.journalDescription : (hasNotes ? transaction.notes : '-')}
                        </p>
                        <Link 
                          to={`/workplaces/${account?.workplaceID}/journals/${transaction.journalID}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="View Journal"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {transaction.journalID.substring(0, 8)}...
                        </span>
                      </div>

                      {/* Show notes below if both description and notes exist */}
                      {hasDescription && hasNotes && (
                        <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {formattedDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${transaction.transactionType === 'DEBIT' ? 'text-finance-blue-dark' : 'text-finance-red'
                        }`}>
                        <ErrorBoundary fallback={<span>{transaction.transactionType === 'DEBIT' ? '+' : '-'} ${Number(transaction.amount).toFixed(2)}</span>}>
                          {transaction.transactionType === 'DEBIT' ? '+' : '-'}
                          <CurrencyDisplay
                            amount={transaction.amount}
                            currencyCode={transaction.currencyCode}
                          />
                        </ErrorBoundary>
                      </p>
                      <p className="text-xs text-muted-foreground">{transaction.transactionType}</p>
                    </div>
                  </div>
                );
              })}


              <PaginationControls
                hasMore={hasMore}
                isLoading={isPaginationLoading}
                onLoadMore={loadMore}
              />
            </div>
          )}
        </div>
      </CardContent>

      <AccountDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSaved={handleAccountUpdated}
        initialData={account}
      />
    </Card>
  );
};

export default AccountDetail;
