import React, { useEffect, useState } from 'react';
import { Account, Transaction } from '@/lib/types';
import apiService from '@/services/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AccountDetailProps {
  account: (Account & { workplaceID: string }) | null;
}

interface AccountTransaction extends Omit<Transaction, 'journalName'> {
  // Add any other fields specific to this view if needed
}

interface FetchAccountTransactionsResponse {
  transactions: AccountTransaction[];
}

const AccountDetail: React.FC<AccountDetailProps> = ({ account }) => {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [fetchState, setFetchState] = useState<{ isLoading: boolean; error: string | null }>({ isLoading: false, error: null });

  useEffect(() => {
    if (account && account.workplaceID && account.accountID) {
      fetchTransactions(account.workplaceID, account.accountID);
    } else {
      setTransactions([]);
      setFetchState({ isLoading: false, error: null });
    }
  }, [account]);

  const fetchTransactions = async (workplaceId: string, accountId: string) => {
    setFetchState({ isLoading: true, error: null });
    setTransactions([]);

    try {
      const response = await apiService.get<FetchAccountTransactionsResponse>(
        `/workplaces/${workplaceId}/accounts/${accountId}/transactions?limit=20&sort=createdAt:desc`
      );

      if (response.data && Array.isArray(response.data.transactions)) {
        setTransactions(response.data.transactions);
      } else if (response.error) {
        throw new Error(response.error || 'Failed to fetch transactions');
      } else {
        console.warn('Invalid transactions response format:', response.data);
        throw new Error('Received invalid format for transactions data');
      }
    } catch (err: any) {
      console.error("Failed to fetch account transactions:", err);
      setFetchState({ isLoading: false, error: err.message || 'An error occurred while loading transactions.' });
      setTransactions([]);
    } finally {
      setFetchState(prevState => ({ ...prevState, isLoading: false }));
    }
  };

  if (!account) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">Select an account to view details</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">{account.name}</CardTitle>
            <CardDescription>{account.description || 'No description'}</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={account.isActive ? "default" : "outline"}>
            {account.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline">{account.accountType}</Badge>
          <Badge variant="outline">{account.currencyCode}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div>
          <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
          {fetchState.isLoading ? (
            <div className="flex justify-center items-center py-5">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500 text-sm">Loading transactions...</span>
            </div>
          ) : fetchState.error ? (
            <Alert variant="destructive" className="my-4">
              <AlertTitle>Error Loading Transactions</AlertTitle>
              <AlertDescription>{fetchState.error}</AlertDescription>
            </Alert>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground">No transactions found for this account.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map(transaction => (
                <div key={transaction.transactionID} className="flex justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">Journal: {transaction.journalID.substring(0,12)}...</p>
                    <p className="text-sm text-muted-foreground">{transaction.notes || '-'}</p>
                    <p className="text-xs text-muted-foreground">
                      { transaction.createdAt && !isNaN(new Date(transaction.createdAt).getTime()) 
                        ? formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true }) 
                        : 'Invalid date'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.transactionType === 'DEBIT' ? 'text-finance-blue-dark' : 'text-finance-red'
                    }`}>
                      {transaction.transactionType === 'DEBIT' ? '+' : '-'} 
                      ${Number(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{transaction.transactionType}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountDetail;
