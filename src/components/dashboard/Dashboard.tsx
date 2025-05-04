import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkplace } from '@/context/WorkplaceContext';
import { AccountType, Account, JournalWithTransactions, Transaction } from '@/lib/types';
import apiService from '@/services/apiService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

// Define structure for nested accounts response
interface FetchAccountsResponse {
  accounts: Account[];
}
// Define structure for nested journals response
interface FetchJournalsResponse {
  journals: JournalWithTransactions[];
}

const Dashboard: React.FC = () => {
  const { state } = useWorkplace();
  const workplace = state.selectedWorkplace;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<JournalWithTransactions[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!workplace) {
        setIsLoading(false);
        setError('Please select a workplace to view the dashboard.'); 
        setAccounts([]);
        setJournals([]);
        return;
      }
      if (!workplace.workplaceID) {
         setIsLoading(false);
         setError('Selected workplace is missing an ID.');
         setAccounts([]);
         setJournals([]);
         return;
      }

      setIsLoading(true);
      setError(null);
      setAccounts([]);
      setJournals([]);

      try {
        const [accountsResponse, journalsResponse] = await Promise.all([
          apiService.get<FetchAccountsResponse>(`/workplaces/${workplace.workplaceID}/accounts`),
          apiService.get<FetchJournalsResponse>(
            `/workplaces/${workplace.workplaceID}/journals`, 
            { 
              limit: 10,
              includeReversals: true 
            }
          ) 
        ]);

        if (accountsResponse.data && Array.isArray(accountsResponse.data.accounts)) {
          console.log('Fetched accounts raw data:', accountsResponse.data.accounts);
          setAccounts(accountsResponse.data.accounts);
        } else if (accountsResponse.error) { 
          throw new Error(accountsResponse.error || 'Failed to fetch accounts');
        } else {
           console.warn('Invalid accounts response format:', accountsResponse.data);
           throw new Error('Received invalid format for accounts data');
        }

        if (journalsResponse.data && Array.isArray(journalsResponse.data.journals)) {
          const sortedJournals = journalsResponse.data.journals.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setJournals(sortedJournals);
        } else if (journalsResponse.error) {
           throw new Error(journalsResponse.error || 'Failed to fetch journals');
        } else {
           console.warn('Invalid journals response format:', journalsResponse.data);
           throw new Error('Received invalid format for journals data');
        }

      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.message || 'An error occurred while loading dashboard data.');
        setAccounts([]); 
        setJournals([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workplace?.workplaceID]);
  
  const assetAccounts = accounts.filter(a => a.accountType === AccountType.ASSET);
  const liabilityAccounts = accounts.filter(a => a.accountType === AccountType.LIABILITY);
  const expenseAccounts = accounts.filter(a => a.accountType === AccountType.EXPENSE);
  const revenueAccounts = accounts.filter(a => a.accountType === AccountType.REVENUE);
  const equityAccounts = accounts.filter(a => a.accountType === AccountType.EQUITY);
  
  console.log('Filtered Asset Accounts:', assetAccounts);
  console.log('Filtered Liability Accounts:', liabilityAccounts);
  console.log('Filtered Expense Accounts:', expenseAccounts);
  console.log('Filtered Revenue Accounts:', revenueAccounts);
  console.log('Filtered Equity Accounts:', equityAccounts);
  
  const safeBalance = (balance: string | undefined | null): number => {
      if (balance === null || balance === undefined) return 0;
      const num = Number(balance);
      return isNaN(num) ? 0 : num;
  }; 

  const totalAssets = assetAccounts.reduce((sum, account) => {
    console.log(`Processing asset account ${account.accountID} - balance: '${account.balance}'`);
    const balanceValue = safeBalance(account.balance);
    console.log(` -> safeBalance result: ${balanceValue}`);
    return sum + balanceValue;
  }, 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, account) => sum + safeBalance(account.balance), 0);
  const totalExpenses = expenseAccounts.reduce((sum, account) => sum + safeBalance(account.balance), 0);
  const totalRevenue = revenueAccounts.reduce((sum, account) => sum + Math.abs(safeBalance(account.balance)), 0);
  const totalEquity = equityAccounts.reduce((sum, account) => sum + safeBalance(account.balance), 0);
  
  console.log('Calculated Totals:', { totalAssets, totalLiabilities, totalEquity, totalExpenses, totalRevenue });
  
  const netWorth = totalAssets - totalLiabilities;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!workplace) {
     return (
       <Alert>
         <AlertTitle>No Workplace Selected</AlertTitle>
         <AlertDescription>Please select or create a workplace to view the dashboard.</AlertDescription>
       </Alert>
     );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Financial Dashboard</h1>
        <p className="text-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Total Assets</CardDescription>
            <CardTitle className="text-2xl text-finance-blue">
              ${totalAssets.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Total Liabilities</CardDescription>
            <CardTitle className="text-2xl text-finance-red-dark">
              ${Math.abs(totalLiabilities).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Net Worth</CardDescription>
            <CardTitle className={`text-2xl ${netWorth >= 0 ? 'text-finance-green' : 'text-finance-red'}`}>
              ${netWorth.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Total Equity</CardDescription>
            <CardTitle className="text-2xl text-finance-green-dark">
              ${Math.abs(totalEquity).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription>Revenue vs Expenses</CardDescription>
            <CardTitle className={`text-2xl ${totalRevenue > totalExpenses ? 'text-finance-green' : 'text-finance-red'}`}>
              ${(totalRevenue - totalExpenses).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <Tabs defaultValue="recent-journals" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="recent-journals">Recent Journals</TabsTrigger>
          <TabsTrigger value="accounts-summary">Accounts Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent-journals">
          <Card>
            <CardHeader>
              <CardTitle>Recent Journal Entries</CardTitle>
              <CardDescription>Your latest financial activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {journals.length === 0 ? (
                  <p className="text-muted-foreground text-center">No recent journal entries found.</p>
                ) : ( journals.map(journal => (
                  <div key={journal.journalID} className="border-b pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium truncate">{journal.description || journal.journalID}</h4>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {journal.date && !isNaN(new Date(journal.date).getTime()) 
                          ? new Date(journal.date).toLocaleDateString() 
                          : 'Invalid Date'}
                      </span>
                    </div>
                    <div className="space-y-1 mt-2">
                      {Array.isArray(journal.transactions) && journal.transactions.map(transaction => (
                        <div key={transaction.transactionID} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{transaction.accountID}</span>
                          <span className={transaction.transactionType === 'DEBIT' ? 'text-finance-blue-dark' : 'text-finance-red'}>
                            {transaction.transactionType === 'DEBIT' ? 'DR' : 'CR'} 
                            ${Number(transaction.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {(!journal.transactions || !Array.isArray(journal.transactions)) && <p className="text-xs text-muted-foreground">Transaction details not loaded or invalid.</p>}
                    </div>
                  </div>
                ))) }
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="accounts-summary">
          <Card>
            <CardHeader>
              <CardTitle>Accounts Summary</CardTitle>
              <CardDescription>Overview of your account balances</CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <p className="text-muted-foreground text-center">No accounts found.</p>
              ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-2">Assets</h3>
                  <div className="space-y-1">
                    {assetAccounts.map(account => (
                        <div key={account.accountID} className="flex justify-between py-1 border-b">
                          <span>{account.name}</span>
                          <span className="font-medium">${safeBalance(account.balance).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-2">Liabilities</h3>
                  <div className="space-y-1">
                    {liabilityAccounts.map(account => (
                        <div key={account.accountID} className="flex justify-between py-1 border-b">
                          <span>{account.name}</span>
                          <span className="font-medium text-finance-red-dark">${Math.abs(safeBalance(account.balance)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-2">Equity</h3>
                  <div className="space-y-1">
                    {equityAccounts.map(account => (
                        <div key={account.accountID} className="flex justify-between py-1 border-b">
                          <span>{account.name}</span>
                          <span className="font-medium text-finance-green-dark">${Math.abs(safeBalance(account.balance)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-lg mb-2">Revenue</h3>
                    <div className="space-y-1">
                      {revenueAccounts.map(account => (
                          <div key={account.accountID} className="flex justify-between py-1 border-b">
                            <span>{account.name}</span>
                            <span className="font-medium text-finance-green">${Math.abs(safeBalance(account.balance)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-2">Expenses</h3>
                    <div className="space-y-1">
                      {expenseAccounts.map(account => (
                          <div key={account.accountID} className="flex justify-between py-1 border-b">
                            <span>{account.name}</span>
                            <span className="font-medium">${safeBalance(account.balance).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
