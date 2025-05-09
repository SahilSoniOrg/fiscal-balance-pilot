import React from 'react';
import { BalanceSheetReport, ReportAccountAmount } from '@/lib/types';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import CurrencyDisplay from '@/components/ui/currency-display';

interface BalanceSheetDisplayProps {
  reportData: BalanceSheetReport | null | undefined;
}

const AccountCategorySection: React.FC<{ 
  items: ReportAccountAmount[]; 
  title: string; 
  currencyCode: string; 
  showTotal?: boolean;
}> = ({ items, title, currencyCode, showTotal = true }) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground mt-2">No {title.toLowerCase()} data available for this date.</p>;
  }

  const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">{title}</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70%]">Account</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.accountID}>
                <TableCell className="py-2">{item.name}</TableCell>
                <TableCell className="text-right py-2">
                  <CurrencyDisplay amount={parseFloat(item.amount)} currencyCode={currencyCode} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {showTotal && (
            <TableFooter>
              <TableRow className="font-semibold bg-muted/50 hover:bg-muted/50">
                <TableCell className="py-3">Total {title}</TableCell>
                <TableCell className="text-right py-3">
                  <CurrencyDisplay amount={totalAmount} currencyCode={currencyCode} />
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
};

export const BalanceSheetDisplay: React.FC<BalanceSheetDisplayProps> = ({ reportData }) => {
  if (!reportData) {
    return null; 
  }

  const { assets, liabilities, equity, asOf, currencyCode, summary } = reportData;

  if (!assets.length && !liabilities.length && !equity.length) {
     return (
      <p className="text-sm text-muted-foreground mt-2">
        No balance sheet data available as of {new Date(asOf).toLocaleDateString()}.
      </p>
    );
  }

  const totalAssetsNum = parseFloat(summary.totalAssets);
  const totalLiabilitiesNum = parseFloat(summary.totalLiabilities);
  const totalEquityNum = parseFloat(summary.totalEquity);
  const totalLiabilitiesAndEquityNum = parseFloat(summary.totalLiabilitiesAndEquity);

  return (
    <div className="space-y-8">
      <AccountCategorySection items={assets} title="Assets" currencyCode={currencyCode} />
      <AccountCategorySection items={liabilities} title="Liabilities" currencyCode={currencyCode} />
      <AccountCategorySection items={equity} title="Equity" currencyCode={currencyCode} />

      <div className="mt-8 pt-6 border-t">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Summary</h3>
        <div className="rounded-md border">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-base w-[70%] py-3">Total Assets</TableCell>
                <TableCell className="text-right text-base py-3">
                  <CurrencyDisplay amount={totalAssetsNum} currencyCode={currencyCode} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base py-3">Total Liabilities</TableCell>
                <TableCell className="text-right text-base py-3">
                  <CurrencyDisplay amount={totalLiabilitiesNum} currencyCode={currencyCode} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-base py-3">Total Equity</TableCell>
                <TableCell className="text-right text-base py-3">
                  <CurrencyDisplay amount={totalEquityNum} currencyCode={currencyCode} />
                </TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow className="text-lg font-bold bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                <TableCell className="py-4">Total Liabilities & Equity</TableCell>
                <TableCell className="text-right py-4">
                  <CurrencyDisplay amount={totalLiabilitiesAndEquityNum} currencyCode={currencyCode} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        {Math.abs(totalAssetsNum - totalLiabilitiesAndEquityNum) > 0.005 && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-3">
            Note: Total Assets do not equal Total Liabilities and Equity. Difference: 
            <CurrencyDisplay amount={totalAssetsNum - totalLiabilitiesAndEquityNum} currencyCode={currencyCode} />
          </p>
        )}
      </div>
    </div>
  );
};

export default BalanceSheetDisplay;
