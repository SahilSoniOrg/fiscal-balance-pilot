
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkplace } from '@/context/WorkplaceContext';
import { AccountType } from '@/lib/types';
import apiService from '@/services/apiService';

const Dashboard: React.FC = () => {
  const { state } = useWorkplace();
  const workplace = state.selectedWorkplace;
  const accounts = apiService.mockData.accounts;
  
  const assetAccounts = accounts.filter(a => a.accountType === AccountType.ASSET);
  const liabilityAccounts = accounts.filter(a => a.accountType === AccountType.LIABILITY);
  const expenseAccounts = accounts.filter(a => a.accountType === AccountType.EXPENSE);
  const revenueAccounts = accounts.filter(a => a.accountType === AccountType.REVENUE);
  
  const totalAssets = assetAccounts.reduce((sum, account) => sum + account.balance!, 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, account) => sum + account.balance!, 0);
  const totalExpenses = expenseAccounts.reduce((sum, account) => sum + account.balance!, 0);
  const totalRevenue = revenueAccounts.reduce((sum, account) => sum + Math.abs(account.balance!), 0);
  
  const netWorth = totalAssets - Math.abs(totalLiabilities);
  
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
                {apiService.mockData.journals.map(journal => (
                  <div key={journal.journalId} className="border-b pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{journal.name}</h4>
                        <p className="text-sm text-muted-foreground">{journal.description}</p>
                      </div>
                      <span className="text-sm">{new Date(journal.journalDate).toLocaleDateString()}</span>
                    </div>
                    <div className="space-y-1 mt-2">
                      {journal.transactions.map(transaction => (
                        <div key={transaction.transactionId} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{transaction.accountName}</span>
                          <span className={transaction.transactionType === 'DEBIT' ? 'text-finance-blue-dark' : 'text-finance-red'}>
                            {transaction.transactionType === 'DEBIT' ? 'DR' : 'CR'} ${transaction.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-2">Assets</h3>
                  <div className="space-y-1">
                    {assetAccounts.map(account => (
                      <div key={account.accountId} className="flex justify-between py-1 border-b">
                        <span>{account.accountName}</span>
                        <span className="font-medium">${account.balance!.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-2">Liabilities</h3>
                  <div className="space-y-1">
                    {liabilityAccounts.map(account => (
                      <div key={account.accountId} className="flex justify-between py-1 border-b">
                        <span>{account.accountName}</span>
                        <span className="font-medium text-finance-red-dark">${Math.abs(account.balance!).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-lg mb-2">Revenue</h3>
                    <div className="space-y-1">
                      {revenueAccounts.map(account => (
                        <div key={account.accountId} className="flex justify-between py-1 border-b">
                          <span>{account.accountName}</span>
                          <span className="font-medium text-finance-green">${Math.abs(account.balance!).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg mb-2">Expenses</h3>
                    <div className="space-y-1">
                      {expenseAccounts.map(account => (
                        <div key={account.accountId} className="flex justify-between py-1 border-b">
                          <span>{account.accountName}</span>
                          <span className="font-medium">${account.balance!.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
