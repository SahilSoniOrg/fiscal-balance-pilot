import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';

interface CurrencyDisplayProps {
  amount: string | number;
  currencyCode?: string;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ 
  amount, 
  currencyCode = 'USD', 
  className = ''
}) => {
  // Use a try-catch block to handle any potential errors
  try {
    const { state, getCurrencyByCode } = useCurrency();
    
    // Only try to get currency if not loading and we have a valid code
    const currency = !state.isLoading && currencyCode 
      ? getCurrencyByCode(currencyCode) 
      : undefined;

    console.log(`Currency for ${currencyCode}:`, currency); // Debug log
    
    // Safely parse the amount to a number
    let numericAmount: number;
    try {
      numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    } catch {
      numericAmount = 0;
    }
    
    // Use a default of 2 decimal places if not specified
    const precision = currency?.precision !== undefined ? currency.precision : 2;
    
    // Format the amount based on currency specifications with fallbacks
    const formattedAmount = !isNaN(numericAmount) 
      ? numericAmount.toFixed(precision) 
      : '0.00';

    // Use the symbol from the currency object if available, otherwise default to $
    const symbol = currency?.symbol || '$';

    return (
      <span className={className}>
        {symbol}{formattedAmount}
      </span>
    );
  } catch (error) {
    // Fallback rendering in case of any error
    console.error('Error in CurrencyDisplay:', error);
    return <span className={className}>$0.00</span>;
  }
};

export default CurrencyDisplay; 