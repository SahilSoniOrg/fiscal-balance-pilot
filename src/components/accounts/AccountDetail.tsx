
import React, { useEffect, useState } from 'react';
import { Account, Transaction } from '@/lib/types';
import apiService from '@/services/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AccountDetailProps {
  account: Account | null;
}

const AccountDetail: React.FC<AccountDetailProps> = ({ account }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (account) {
      // In a real app, we would fetch transactions for this account
      // For now, we'll use mock data
      const accountTransactions = apiService.mockData.journals.flatMap(journal => 
        journal.transactions.filter(t => t.accountId === account.accountId)
      ) as Transaction[];
      
      setTransactions(accountTransactions);
    }
  }, [account]);

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
            <CardTitle className="text-2xl font-bold">{account.accountName}</CardTitle>
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
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Balance</h3>
          <p className={`text-2xl font-bold ${
            account.accountType === 'LIABILITY' || account.accountType === 'REVENUE'
              ? 'text-finance-red'
              : 'text-finance-blue'
          }`}>
            ${account.balance !== undefined ? Math.abs(account.balance).toFixed(2) : '0.00'}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground">No transactions found for this account.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map(transaction => {
                const journal = apiService.mockData.journals.find(j => j.journalId === transaction.journalId);
                return (
                  <div key={transaction.transactionId} className="flex justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">{journal?.name}</p>
                      <p className="text-sm text-muted-foreground">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.transactionDate), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.transactionType === 'DEBIT' ? 'text-finance-blue-dark' : 'text-finance-red'
                      }`}>
                        {transaction.transactionType === 'DEBIT' ? '+' : '-'} ${transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{transaction.transactionType}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountDetail;
