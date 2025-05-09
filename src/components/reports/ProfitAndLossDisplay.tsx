import React from 'react';
import { ProfitAndLossReport, ReportAccountAmount } from '@/lib/types';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import CurrencyDisplay from '@/components/ui/currency-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfitAndLossDisplayProps {
  reportData: ProfitAndLossReport | null | undefined;
  currencyCode?: string; 
}

const AccountSection: React.FC<{ 
  items: ReportAccountAmount[]; 
  title: string; 
  currencyForDisplay: string;
}> = ({ items, title, currencyForDisplay }) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground mt-2">No {title.toLowerCase()} data available for this period.</p>;
  }
  return (
    <>
      <h3 className="text-md font-semibold mt-4 mb-2 text-gray-700 dark:text-gray-300">{title}</h3>
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
                  <CurrencyDisplay amount={item.amount} currencyCode={currencyForDisplay} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export const ProfitAndLossDisplay: React.FC<ProfitAndLossDisplayProps> = ({ reportData, currencyCode }) => {
  if (!reportData) {
    return null; 
  }

  const displayCurrency = currencyCode || 'USD'; // Default to USD if not provided

  return (
    <div className="space-y-6">
      <AccountSection items={reportData.revenue} title="Revenue" currencyForDisplay={displayCurrency} />
      <AccountSection items={reportData.expenses} title="Expenses" currencyForDisplay={displayCurrency} />

      <div className="mt-6 pt-4 border-t">
        <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">Summary</h3>
        <div className="rounded-md border">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-[70%] py-2">Total Revenue</TableCell>
                <TableCell className="text-right py-2">
                  <CurrencyDisplay amount={reportData.summary.totalRevenue} currencyCode={displayCurrency} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium py-2">Total Expenses</TableCell>
                <TableCell className="text-right py-2">
                  <CurrencyDisplay amount={reportData.summary.totalExpenses} currencyCode={displayCurrency} />
                </TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow className="text-base font-semibold bg-muted/50 hover:bg-muted/50">
                <TableCell className="py-3">Net Profit / (Loss)</TableCell>
                <TableCell className="text-right py-3">
                  <CurrencyDisplay amount={reportData.summary.netProfit} currencyCode={displayCurrency} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ProfitAndLossDisplay;
