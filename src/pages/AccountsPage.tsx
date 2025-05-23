
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AccountsList from '../components/accounts/AccountsList';
import AccountDetail from '../components/accounts/AccountDetail';
import { Account } from '../lib/types';

const AccountsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const accountIdFromUrl = searchParams.get('accountId');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Handle account selection from URL
  useEffect(() => {
    if (accountIdFromUrl && accounts.length > 0) {
      const account = accounts.find(acc => acc.accountID === accountIdFromUrl);
      if (account) {
        setSelectedAccount(account);
      }
    }
  }, [accountIdFromUrl, accounts]);

  // Listen for account selection events from AccountDisplay
  useEffect(() => {
    const handleAccountSelected = (event: Event) => {
      const { accountId } = (event as CustomEvent).detail;
      const account = accounts.find(acc => acc.accountID === accountId);
      if (account) {
        setSelectedAccount(account);
      }
    };

    window.addEventListener('accountSelected', handleAccountSelected as EventListener);
    return () => {
      window.removeEventListener('accountSelected', handleAccountSelected as EventListener);
    };
  }, [accounts]);

  const handleAccountsLoaded = (accounts: Account[]) => {
    setAccounts(accounts);
    
    // Only auto-select first account on initial load if no account is selected from URL
    if (isInitialLoad && !accountIdFromUrl && accounts.length > 0) {
      setSelectedAccount(accounts[0]);
      setIsInitialLoad(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
      <div className="md:col-span-1">
        <AccountsList 
          onSelectAccount={setSelectedAccount} 
          onAccountsLoaded={handleAccountsLoaded}
        />
      </div>
      <div className="md:col-span-2">
        <AccountDetail account={selectedAccount} />
      </div>
    </div>
  );
};

export default AccountsPage;
