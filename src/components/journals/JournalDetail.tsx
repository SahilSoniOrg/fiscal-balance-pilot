
import React, { useEffect, useState } from 'react';
import { Journal, JournalWithTransactions, TransactionType } from '@/lib/types';
import apiService from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import JournalEntryDialog from './JournalEntryDialog';

interface JournalDetailProps {
  journal: (Journal & { workplaceID: string }) | null;
}

const JournalDetail: React.FC<JournalDetailProps> = ({ journal }) => {
  const [journalWithTransactions, setJournalWithTransactions] = useState<JournalWithTransactions | null>(null);
  const [fetchState, setFetchState] = useState<{ isLoading: boolean; error: string | null }>({ isLoading: false, error: null });
  const [isBalanced, setIsBalanced] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (journal && journal.journalID && journal.workplaceID) {
      fetchJournalTransactions(journal.workplaceID, journal.journalID);
    } else {
      setJournalWithTransactions(null);
      setFetchState({ isLoading: false, error: null });
    }
  }, [journal]);

  const fetchJournalTransactions = async (workplaceId: string, journalId: string) => {
    setFetchState({ isLoading: true, error: null });
    setJournalWithTransactions(null);
    
    try {
      const response = await apiService.get<JournalWithTransactions>(`/workplaces/${workplaceId}/journals/${journalId}`);
      
      if (response.data) {
        const fetchedJournal = response.data;
        setJournalWithTransactions(fetchedJournal);
        
        const transactions = fetchedJournal.transactions || [];
        const debits = transactions
          .filter(t => t.transactionType === TransactionType.DEBIT)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const credits = transactions
          .filter(t => t.transactionType === TransactionType.CREDIT)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        setIsBalanced(Math.abs(debits - credits) < 0.01);
        setFetchState({ isLoading: false, error: null });
      } else {
        throw new Error(response.error || 'Failed to fetch journal details');
      }
    } catch (error: any) {
      console.error('Error fetching journal transactions:', error);
      setFetchState({ isLoading: false, error: error.message || 'An unexpected error occurred.' });
    }
  };

  const handleJournalUpdated = (updatedJournal: Journal) => {
    if (journal && updatedJournal.journalID === journal.journalID) {
      fetchJournalTransactions(journal.workplaceID, journal.journalID);
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
            <CardTitle className="text-2xl font-bold">{journal?.description || journal?.journalID || 'Journal Detail'}</CardTitle>
            <p className="text-sm mt-1">
              Date: {journal?.date ? new Date(journal.date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => journalWithTransactions && setIsEditDialogOpen(true)}
            disabled={fetchState.isLoading || !!fetchState.error}
          >
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {fetchState.isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading transactions...</span>
          </div>
        ) : fetchState.error ? (
          <Alert variant="destructive" className="my-4">
            <AlertTitle>Error Loading Transactions</AlertTitle>
            <AlertDescription>{fetchState.error}</AlertDescription>
          </Alert>
        ) : !journalWithTransactions || !journalWithTransactions.transactions || journalWithTransactions.transactions.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            No transactions found for this journal.
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
                Journal ID: {journal?.journalID}
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
                    <tr key={transaction.transactionID} className="border-b">
                      <td className="px-4 py-3">{transaction.accountID}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {transaction.notes || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {transaction.transactionType === TransactionType.DEBIT
                          ? `$${Number(transaction.amount).toFixed(2)}`
                          : ''}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {transaction.transactionType === TransactionType.CREDIT
                          ? `$${Number(transaction.amount).toFixed(2)}`
                          : ''}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted">
                    <td colSpan={2} className="px-4 py-2 font-medium">Total</td>
                    <td className="px-4 py-2 text-right font-medium">
                      ${journalWithTransactions.transactions
                        .filter(t => t.transactionType === TransactionType.DEBIT)
                        .reduce((sum, t) => sum + Number(t.amount), 0)
                        .toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      ${journalWithTransactions.transactions
                        .filter(t => t.transactionType === TransactionType.CREDIT)
                        .reduce((sum, t) => sum + Number(t.amount), 0)
                        .toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {journalWithTransactions && (
          <JournalEntryDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            onSaved={handleJournalUpdated}
            initialData={journalWithTransactions}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default JournalDetail;
