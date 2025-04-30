
import React, { useState } from 'react';
import AccountsList from '../components/accounts/AccountsList';
import AccountDetail from '../components/accounts/AccountDetail';
import { Account } from '../lib/types';

const AccountsPage: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
      <div className="md:col-span-1">
        <AccountsList onSelectAccount={setSelectedAccount} />
      </div>
      <div className="md:col-span-2">
        <AccountDetail account={selectedAccount} />
      </div>
    </div>
  );
};

export default AccountsPage;
