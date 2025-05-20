import React from 'react';
import { useFetchAccounts } from '@/hooks/queries/useFetchAccounts';
import { AccountType } from '@/lib/types';
import ErrorBoundary from './error-boundary';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const { state: workplaceState } = useWorkplace();
  const workplaceId = workplaceState.selectedWorkplace?.workplaceID;

  const { data: allAccounts, isLoading, error } = useFetchAccounts(workplaceId);

  if (!workplaceId) {
    return <span className={`${className} opacity-75`}>Context...</span>;
  }

  if (isLoading) {
    return <span className={`${className} opacity-75`}>Loading...</span>;
  }

  if (error) {
    return <span className={`${className} text-red-500`}>Error</span>;
  }

  const account = allAccounts?.find(acc => acc.accountID === accountId);

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

  const accountDisplay = (
    <span className={`${className} ${getAccountTypeStyle(account.accountType)}`}>
      {account.name}
      {showBalance && <span className="ml-2 opacity-75">[{account.balance}]</span>}
    </span>
  );

  if (account.cfid) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {accountDisplay}
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col">
              <span>Customer ID: {account.cfid}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return accountDisplay;
};

// Wrapped version with error boundary
export const SafeAccountDisplay: React.FC<AccountDisplayProps> = (props) => (
  <ErrorBoundary fallback={<span className={props.className}>{props.accountId}</span>}>
    <AccountDisplay {...props} />
  </ErrorBoundary>
);

export default SafeAccountDisplay; 