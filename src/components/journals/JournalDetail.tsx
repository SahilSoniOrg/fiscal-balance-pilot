import React, { useEffect, useState } from 'react';
import { Journal, JournalWithTransactions, TransactionType } from '@/lib/types';
import apiService from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Loader2, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import JournalEntryDialog from './JournalEntryDialog';
import { useWorkplace } from '@/context/WorkplaceContext';
import CurrencyDisplay from '@/components/ui/currency-display';
import ErrorBoundary from '@/components/ui/error-boundary';
import SafeAccountDisplay from '@/components/ui/account-display';

interface JournalDetailProps {
  journal: (Journal & { workplaceID: string }) | null;
  onJournalReversed?: (originalJournalId: string, newJournal: Journal) => void;
  onNavigateToJournal?: (journalId: string) => void;
  refreshJournals?: () => Promise<void>;
}

const JournalDetail: React.FC<JournalDetailProps> = ({ 
  journal, 
  onJournalReversed,
  onNavigateToJournal 
}) => {
  const [journalWithTransactions, setJournalWithTransactions] = useState<JournalWithTransactions | null>(null);
  const [fetchState, setFetchState] = useState<{ isLoading: boolean; error: string | null }>({ isLoading: false, error: null });
  const [reverseState, setReverseState] = useState<{ isReversing: boolean; error: string | null }>({ isReversing: false, error: null });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReverseAlertOpen, setIsReverseAlertOpen] = useState(false);
  const { toast } = useToast();
  const { state: workplaceState } = useWorkplace();

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
        console.log('[JournalDetail] Raw fetched journal data:', fetchedJournal);
        setJournalWithTransactions(fetchedJournal);
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

  const handleNavigateToJournal = async (journalId: string) => {
    if (!workplaceState.selectedWorkplace?.workplaceID) {
      toast({
        title: "Error",
        description: "Cannot navigate: No workspace selected.",
        variant: "destructive",
      });
      return;
    }

    if (onNavigateToJournal) {
      onNavigateToJournal(journalId);
    } else {
      // If no navigation callback provided, fetch the journal and load it
      try {
        const response = await apiService.get<Journal>(`/workplaces/${workplaceState.selectedWorkplace.workplaceID}/journals/${journalId}`);
        if (response.data) {
          // Create a synthesized journal with workplaceID for the detail view
          const journalWithWorkplace = {
            ...response.data,
            workplaceID: workplaceState.selectedWorkplace.workplaceID
          };
          // Update our own state
          setJournalWithTransactions(journalWithWorkplace as JournalWithTransactions);
        } else if (response.error) {
          throw new Error(response.error);
        }
      } catch (error: any) {
        console.error('Error fetching related journal:', error);
        toast({
          title: "Navigation Failed",
          description: error.message || "Could not load the related journal.",
          variant: "destructive",
        });
      }
    }
  };

  const handleReverse = async () => {
    if (!journal || !journal.journalID || !journal.workplaceID) {
      toast({
        title: "Error",
        description: "Cannot reverse journal: Missing ID.",
        variant: "destructive",
      });
      return;
    }

    setReverseState({ isReversing: true, error: null });

    try {
      const response = await apiService.post<Journal>(
        `/workplaces/${journal.workplaceID}/journals/${journal.journalID}/reverse`, 
        {}
      );

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        toast({
          title: "Success",
          description: `Journal ${journal.journalID} reversed successfully. New journal created: ${response.data.journalID}`,
        });
        setIsReverseAlertOpen(false);
        
        // Call the onJournalReversed callback if provided
        if (onJournalReversed) {
          onJournalReversed(journal.journalID, response.data);
        }
        
        // Refresh the journals list
        if (refreshJournals) {
          await refreshJournals();
        }
        
        // Refresh the current journal details
        if (journal.workplaceID) {
          await fetchJournalTransactions(journal.workplaceID, journal.journalID);
        }
      } else {
        throw new Error("No data returned from reverse operation.");
      }

    } catch (error: any) {
      console.error('Error reversing journal:', error);
      setReverseState({ isReversing: false, error: error.message || 'Failed to reverse journal' });
      toast({
        title: "Reversal Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      if (isReverseAlertOpen) {
        setReverseState(prevState => ({ ...prevState, isReversing: false }));
      }
    }
  };

  console.log('[JournalDetail] Rendering with journal prop:', journal);
  console.log('[JournalDetail] journalWithTransactions state:', journalWithTransactions);

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
            <div className="mt-2 flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                Journal ID: {journalWithTransactions?.journalID || journal?.journalID}
              </p>
              {journalWithTransactions && (
                <div className="flex gap-1">
                  {journalWithTransactions.reversingJournalID && (
                    <Badge 
                      variant="outline" 
                      className="border-orange-500 text-orange-600 cursor-pointer hover:bg-orange-50"
                      onClick={() => handleNavigateToJournal(journalWithTransactions.reversingJournalID!)}
                    >
                      Reversed (by {journalWithTransactions.reversingJournalID.substring(0,8)}...)
                    </Badge>
                  )}
                  {journalWithTransactions.originalJournalID && (
                    <Badge 
                      variant="outline" 
                      className="border-blue-500 text-blue-600 cursor-pointer hover:bg-blue-50"
                      onClick={() => handleNavigateToJournal(journalWithTransactions.originalJournalID!)}
                    >
                      Reversing Entry (for {journalWithTransactions.originalJournalID.substring(0,8)}...)
                    </Badge>
                  )}
                  {!journalWithTransactions.originalJournalID && !journalWithTransactions.reversingJournalID && journalWithTransactions.status && (
                    <Badge variant="secondary">{journalWithTransactions.status}</Badge>
                  )}
                  {journalWithTransactions.originalJournalID && journalWithTransactions.reversingJournalID && (
                    <Badge 
                      variant="outline" 
                      className="border-purple-500 text-purple-800"
                    >
                      Re-reversed
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => journalWithTransactions && setIsEditDialogOpen(true)}
              disabled={fetchState.isLoading || !!fetchState.error || reverseState.isReversing}
            >
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            <AlertDialog open={isReverseAlertOpen} onOpenChange={setIsReverseAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  disabled={
                    fetchState.isLoading || 
                    !!fetchState.error || 
                    reverseState.isReversing ||
                    !!journalWithTransactions?.reversingJournalID 
                  }
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Reverse
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reverse Journal Entry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will create a NEW journal entry that reverses the debits and credits of Journal ID: <span className="font-mono">{journal.journalID}</span>. The original journal will remain unchanged. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={reverseState.isReversing}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleReverse}
                    disabled={reverseState.isReversing}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {reverseState.isReversing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reversing...</>
                    ) : ( 
                      'Confirm Reverse' 
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
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
                      <td className="px-4 py-3">
                        <SafeAccountDisplay accountId={transaction.accountID} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {transaction.notes || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {transaction.transactionType === TransactionType.DEBIT
                          ? <ErrorBoundary fallback={<span>$0.00</span>}>
                              <CurrencyDisplay 
                                amount={transaction.amount} 
                                currencyCode={transaction.currencyCode || journalWithTransactions.currencyCode} 
                              />
                            </ErrorBoundary>
                          : ''}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {transaction.transactionType === TransactionType.CREDIT
                          ? <ErrorBoundary fallback={<span>$0.00</span>}>
                              <CurrencyDisplay 
                                amount={transaction.amount} 
                                currencyCode={transaction.currencyCode || journalWithTransactions.currencyCode} 
                              />
                            </ErrorBoundary>
                          : ''}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted">
                    <td colSpan={2} className="px-4 py-2 font-medium">Total</td>
                    <td className="px-4 py-2 text-right font-medium">
                      <ErrorBoundary fallback={<span>$0.00</span>}>
                        <CurrencyDisplay 
                          amount={journalWithTransactions.transactions
                            .filter(t => t.transactionType === TransactionType.DEBIT)
                            .reduce((sum, t) => sum + Number(t.amount), 0)} 
                          currencyCode={journalWithTransactions.currencyCode} 
                        />
                      </ErrorBoundary>
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      <ErrorBoundary fallback={<span>$0.00</span>}>
                        <CurrencyDisplay 
                          amount={journalWithTransactions.transactions
                            .filter(t => t.transactionType === TransactionType.CREDIT)
                            .reduce((sum, t) => sum + Number(t.amount), 0)} 
                          currencyCode={journalWithTransactions.currencyCode} 
                        />
                      </ErrorBoundary>
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
