import React from 'react';
import { useFetchCurrencies } from '@/hooks/queries/useFetchCurrencies';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Currency } from '@/lib/types';

interface CurrencyDisplayProps {
  amount: string | number;
  currencyCode?: string;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currencyCode,
  className = '',
}) => {
  const { 
    state: workplaceState, 
  } = useWorkplace(); 
  const selectedWorkplace = workplaceState.selectedWorkplace;

  const { 
    data: allCurrencies, 
    isLoading: isLoadingCurrencies, 
    error: currenciesError 
  } = useFetchCurrencies();
  
  if (isLoadingCurrencies || workplaceState.isLoading) {
    return <span className={className}>...</span>;
  }

  if (currenciesError) {
    console.error('Error fetching currencies in CurrencyDisplay:', currenciesError.message);
    const numericAmountFallback = typeof amount === 'string' ? parseFloat(amount) : amount;
    return <span className={className}>{!isNaN(numericAmountFallback) ? numericAmountFallback.toFixed(2) : String(amount)}</span>;
  }

  const effectiveCurrencyCode = currencyCode || selectedWorkplace?.defaultCurrencyCode || 'USD';
  const currencyDetails = allCurrencies?.find((c: Currency) => c.currencyCode === effectiveCurrencyCode);

  let numericAmount: number;
  try {
    numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) numericAmount = 0; 
  } catch {
    numericAmount = 0;
  }

  const precision = currencyDetails?.precision ?? 2;
  const symbol = currencyDetails?.symbol ?? (effectiveCurrencyCode === 'USD' ? '$' : effectiveCurrencyCode.toUpperCase()); 

  const formattedAmount = numericAmount.toFixed(precision);

  return (
    <span className={className}>
      {symbol}
      {formattedAmount}
    </span>
  );
};

export default CurrencyDisplay;