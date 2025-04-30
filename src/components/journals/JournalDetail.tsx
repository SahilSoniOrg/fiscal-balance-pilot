
import React, { useEffect, useState } from 'react';
import { Journal, JournalWithTransactions, TransactionType } from '@/lib/types';
import apiService from '@/services/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface JournalDetailProps {
  journal: Journal | null;
}

const JournalDetail: React.FC<JournalDetailProps> = ({ journal }) => {
  const [journalWithTransactions, setJournalWithTransactions] = useState<JournalWithTransactions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBalanced, setIsBalanced] = useState(true);

  useEffect(() => {
    if (journal) {
      fetchJournalTransactions();
    } else {
      setJournalWithTransactions(null);
    }
  }, [journal]);

  const fetchJournalTransactions = async () => {
    if (!journal) return;
    
    setIsLoading(true);
    try {
      // In a real app, we would make an API call to get the journal with transactions
      // For now, we'll use mock data
      const foundJournal = apiService.mockData.journals.find(j => j.journalId === journal.journalId);
      if (foundJournal) {
        setJournalWithTransactions({
          ...journal,
          transactions: foundJournal.transactions as any
        });
        
        // Check if journal is balanced
        const debits = foundJournal.transactions
          .filter(t => t.transactionType === TransactionType.DEBIT)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const credits = foundJournal.transactions
          .filter(t => t.transactionType === TransactionType.CREDIT)
          .reduce((sum, t) => sum + t.amount, 0);
        
        setIsBalanced(Math.abs(debits - credits) < 0.01); // Allow for tiny floating point differences
      }
    } catch (error) {
      console.error('Error fetching journal transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!journal) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">Select a journal to view details</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">{journal.name}</CardTitle>
            <CardDescription>{journal.description || 'No description'}</CardDescription>
            <p className="text-sm mt-1">
              Date: {new Date(journal.journalDate).toLocaleDateString()}
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center">Loading transactions...</div>
        ) : !journalWithTransactions ? (
          <div className="text-center text-muted-foreground">
            No transaction data available.
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center">
              <div className={`px-3 py-1 text-sm rounded-full mr-2 ${
                isBalanced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isBalanced ? 'Balanced' : 'Unbalanced'}
              </div>
              <p className="text-sm text-muted-foreground">
                Journal ID: {journal.journalId}
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Account</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-right">Debit</th>
                    <th className="px-4 py-2 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {journalWithTransactions.transactions.map(transaction => (
                    <tr key={transaction.transactionId} className="border-b">
                      <td className="px-4 py-3">{transaction.accountName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {transaction.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {transaction.transactionType === TransactionType.DEBIT
                          ? `$${transaction.amount.toFixed(2)}`
                          : ''}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {transaction.transactionType === TransactionType.CREDIT
                          ? `$${transaction.amount.toFixed(2)}`
                          : ''}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted">
                    <td colSpan={2} className="px-4 py-2 font-medium">Total</td>
                    <td className="px-4 py-2 text-right font-medium">
                      ${journalWithTransactions.transactions
                        .filter(t => t.transactionType === TransactionType.DEBIT)
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      ${journalWithTransactions.transactions
                        .filter(t => t.transactionType === TransactionType.CREDIT)
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default JournalDetail;
