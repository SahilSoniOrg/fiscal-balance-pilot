
import React, { useState, useEffect } from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Account, AccountType } from '@/lib/types';
import apiService from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';

interface AccountsListProps {
  onSelectAccount: (account: Account) => void;
}

const AccountsList: React.FC<AccountsListProps> = ({ onSelectAccount }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { state } = useWorkplace();

  useEffect(() => {
    if (state.selectedWorkplace) {
      fetchAccounts();
    }
  }, [state.selectedWorkplace]);

  const fetchAccounts = async () => {
    if (!state.selectedWorkplace) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.get<Account[]>(
        `/workplaces/${state.selectedWorkplace.workplaceId}/accounts`
      );
      
      if (response.data) {
        setAccounts(response.data);
        if (response.data.length > 0) {
          onSelectAccount(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(account => 
    account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedAccounts: Record<AccountType, Account[]> = {
    [AccountType.ASSET]: [],
    [AccountType.LIABILITY]: [],
    [AccountType.EQUITY]: [],
    [AccountType.REVENUE]: [],
    [AccountType.EXPENSE]: [],
  };

  filteredAccounts.forEach(account => {
    groupedAccounts[account.accountType].push(account);
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Accounts</CardTitle>
          <Button variant="outline" size="sm">
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
          />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <div className="p-4 text-center">Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No accounts found. Create your first account.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedAccounts).map(([type, accounts]) => 
              accounts.length > 0 ? (
                <div key={type} className="space-y-1">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    {type}
                  </h3>
                  <div className="space-y-1">
                    {accounts.map((account) => (
                      <button
                        key={account.accountId}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-accent flex justify-between items-center"
                        onClick={() => onSelectAccount(account)}
                      >
                        <span className={`${!account.isActive ? 'text-muted-foreground' : ''}`}>
                          {account.accountName}
                        </span>
                        <span className={`text-sm font-medium ${
                          account.accountType === AccountType.LIABILITY || account.accountType === AccountType.REVENUE
                            ? 'text-finance-red'
                            : 'text-finance-blue'
                        }`}>
                          {account.balance !== undefined ? `$${Math.abs(account.balance).toFixed(2)}` : '—'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountsList;
