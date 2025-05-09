import React from 'react';
import { TrialBalanceReport, TrialBalanceRow } from '@/lib/types';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import CurrencyDisplay from '@/components/ui/currency-display';

interface TrialBalanceDisplayProps {
  reportData: TrialBalanceReport | null | undefined;
}

export const TrialBalanceDisplay: React.FC<TrialBalanceDisplayProps> = ({ reportData }) => {
  if (!reportData) {
    return null; // Or a placeholder/loading state
  }

  const { rows, asOf, currencyCode, totals } = reportData; // Use asOf and currencyCode from reportData

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground mt-2">
        No trial balance data available as of {new Date(asOf).toLocaleDateString()}.
      </p>
    );
  }

  // Use totals from reportData if available, otherwise calculate (though API should provide them)
  const totalDebits = parseFloat(totals.debit);
  const totalCredits = parseFloat(totals.credit);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60%]">Account</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row: TrialBalanceRow) => (
            <TableRow key={row.accountID}>
              <TableCell className="py-2">{row.accountName}</TableCell> {/* Use accountName */}
              <TableCell className="text-right py-2">
                <CurrencyDisplay amount={parseFloat(row.debit)} currencyCode={currencyCode} /> {/* Parse to float */}
              </TableCell>
              <TableCell className="text-right py-2">
                <CurrencyDisplay amount={parseFloat(row.credit)} currencyCode={currencyCode} /> {/* Parse to float */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="text-base font-semibold bg-muted/50 hover:bg-muted/50">
            <TableCell className="py-3">Totals</TableCell>
            <TableCell className="text-right py-3">
              <CurrencyDisplay amount={totalDebits} currencyCode={currencyCode} />
            </TableCell>
            <TableCell className="text-right py-3">
              <CurrencyDisplay amount={totalCredits} currencyCode={currencyCode} />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default TrialBalanceDisplay;
