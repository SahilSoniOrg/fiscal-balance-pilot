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
  onNavigateToJournal,
  refreshJournals 
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
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {journal?.journalID || 'N/A'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {journal?.date ? new Date(journal.date).toLocaleDateString() : 'No date'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setIsReverseAlertOpen(true)}
              disabled={reverseState.isReversing}
            >
              {reverseState.isReversing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Reverse
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {fetchState.isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : fetchState.error ? (
          <Alert variant="destructive">
            <AlertTitle>Error loading journal</AlertTitle>
            <AlertDescription>{fetchState.error}</AlertDescription>
          </Alert>
        ) : journalWithTransactions ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reference</p>
                <p>{journalWithTransactions.reference || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p>{new Date(journalWithTransactions.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge 
                  variant={journalWithTransactions.status === 'posted' ? 'default' : 'outline'}
                  className="capitalize"
                >
                  {journalWithTransactions.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p>{new Date(journalWithTransactions.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Transactions</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Account</th>
                      <th className="text-left px-4 py-2 font-medium">Description</th>
                      <th className="text-right px-4 py-2 font-medium">Debit</th>
                      <th className="text-right px-4 py-2 font-medium">Credit</th>
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
                            ? <ErrorBoundary fallback={
                                <CurrencyDisplay 
                                  amount={0}
                                  currencyCode={transaction.currencyCode || journalWithTransactions.currencyCode}
                                  className="text-sm font-medium"
                                />
                              }>
                                <CurrencyDisplay 
                                  amount={transaction.amount} 
                                  currencyCode={transaction.currencyCode || journalWithTransactions.currencyCode} 
                                />
                              </ErrorBoundary>
                            : ''}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {transaction.transactionType === TransactionType.CREDIT
                            ? <ErrorBoundary fallback={
                                <CurrencyDisplay 
                                  amount={0}
                                  currencyCode={transaction.currencyCode || journalWithTransactions.currencyCode}
                                  className="text-sm font-medium"
                                />
                              }>
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
                        <ErrorBoundary fallback={
                            <CurrencyDisplay 
                              amount={0}
                              currencyCode={journalWithTransactions.currencyCode}
                              className="text-sm font-medium"
                            />
                          }>
                          <CurrencyDisplay 
                            amount={journalWithTransactions.transactions
                              .filter(t => t.transactionType === TransactionType.DEBIT)
                              .reduce((sum, t) => sum + Number(t.amount), 0)} 
                            currencyCode={journalWithTransactions.currencyCode} 
                          />
                        </ErrorBoundary>
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        <ErrorBoundary fallback={
                            <CurrencyDisplay 
                              amount={0}
                              currencyCode={journalWithTransactions.currencyCode}
                              className="text-sm font-medium"
                            />
                          }>
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
            </div>

            {journalWithTransactions.notes && (
              <div>
                <h3 className="text-lg font-medium mb-2">Notes</h3>
                <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap">
                  {journalWithTransactions.notes}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">No journal data available</p>
        )}
      </CardContent>

      <AlertDialog open={isReverseAlertOpen} onOpenChange={setIsReverseAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverse Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reverse this journal entry? This action cannot be undone.
              <br /><br />
              A new reversing entry will be created with the opposite amounts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reverseState.isReversing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReverse}
              disabled={reverseState.isReversing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {reverseState.isReversing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reverse Journal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {journal && (
        <JournalEntryDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          initialData={journalWithTransactions || undefined}
          onSaved={handleJournalUpdated}
        />
      )}
    </Card>
  );
};

export default JournalDetail;
