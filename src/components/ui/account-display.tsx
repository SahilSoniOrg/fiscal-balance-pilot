import React from 'react';
import { useAccounts } from '@/context/AccountContext';
import { AccountType } from '@/lib/types';
import ErrorBoundary from './error-boundary';

interface AccountDisplayProps {
  accountId: string;
  showBalance?: boolean;
  className?: string;
}

export const AccountDisplay: React.FC<AccountDisplayProps> = ({ 
  accountId, 
  showBalance = false,
  className = ''
}) => {
  const { getAccountById } = useAccounts();
  const account = getAccountById(accountId);

  if (!account) {
    return <span className={className}>{accountId}</span>;
  }

  const getAccountTypeStyle = (type: AccountType): string => {
    switch (type) {
      case AccountType.ASSET:
        return 'text-blue-600';
      case AccountType.LIABILITY:
        return 'text-red-600';
      case AccountType.EQUITY:
        return 'text-purple-600';
      case AccountType.REVENUE:
        return 'text-green-600';
      case AccountType.EXPENSE:
        return 'text-amber-600';
      default:
        return '';
    }
  };

  return (
    <span className={`${className} ${getAccountTypeStyle(account.accountType)}`}>
      {account.name}
      {showBalance && <span className="ml-2 opacity-75">[{account.balance}]</span>}
    </span>
  );
};

// Wrapped version with error boundary
export const SafeAccountDisplay: React.FC<AccountDisplayProps> = (props) => (
  <ErrorBoundary fallback={<span className={props.className}>{props.accountId}</span>}>
    <AccountDisplay {...props} />
  </ErrorBoundary>
);

export default SafeAccountDisplay; 