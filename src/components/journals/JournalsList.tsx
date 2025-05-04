import React, { useState, useEffect } from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Journal, Transaction, TransactionType } from '@/lib/types';
import apiService from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import JournalEntryDialog from './JournalEntryDialog';
import CurrencyDisplay from '@/components/ui/currency-display';
import ErrorBoundary from '@/components/ui/error-boundary';

interface JournalsListProps {
  onSelectJournal: (journal: Journal | null) => void;
}

interface FetchJournalsResponse {
  journals: (Journal & { transactions?: Transaction[] })[];
  nextToken?: string;
}

const JournalsList: React.FC<JournalsListProps> = ({ onSelectJournal }) => {
  const [journals, setJournals] = useState<(Journal & { transactions?: Transaction[] })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [includeReversals, setIncludeReversals] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const { state: workplaceState } = useWorkplace();

  useEffect(() => {
    if (workplaceState.selectedWorkplace?.workplaceID) {
      fetchJournals(workplaceState.selectedWorkplace.workplaceID, true);
    } else {
      setJournals([]);
      setError(null);
      setNextToken(null);
      onSelectJournal(null);
    }
  }, [workplaceState.selectedWorkplace?.workplaceID, includeReversals]);

  const fetchJournals = async (workplaceId: string, reset: boolean = false) => {
    if (reset) {
      setIsLoading(true);
      setError(null);
      setJournals([]);
      setNextToken(null);
      onSelectJournal(null);
    } else {
      setIsPaginationLoading(true);
    }

    try {
      const response = await apiService.get<FetchJournalsResponse>(
        `/workplaces/${workplaceId}/journals`,
        { 
          includeReversals,
          limit: 20,
          ...(nextToken && !reset ? { nextToken } : {})
        }
      );
      
      if (response.data && Array.isArray(response.data.journals)) {
        if (reset) {
          setJournals(response.data.journals);
          if (response.data.journals.length > 0) {
            const sorted = [...response.data.journals].sort((a, b) => 
               new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            onSelectJournal(sorted[0]);
          } else {
            onSelectJournal(null);
          }
        } else {
          setJournals(prevJournals => [...prevJournals, ...response.data.journals]);
        }
        
        // Store the next token for pagination
        setNextToken(response.data.nextToken || null);
      } else if (response.error) {
        throw new Error(response.error || 'Failed to fetch journals');
      } else {
        console.warn('Invalid journals response format:', response.data);
        throw new Error('Received invalid format for journals data');
      }
    } catch (error: any) {
      console.error('Error fetching journals:', error);
      setError(error.message || 'Failed to load journals.');
      if (reset) {
        setJournals([]);
        onSelectJournal(null);
      }
    } finally {
      setIsLoading(false);
      setIsPaginationLoading(false);
    }
  };

  const handleJournalCreated = (newJournal: Journal) => {
    // Refresh journals list after creating a new one
    if (workplaceState.selectedWorkplace?.workplaceID) {
      fetchJournals(workplaceState.selectedWorkplace.workplaceID, true);
    }
  };

  const handleLoadMore = () => {
    if (nextToken && workplaceState.selectedWorkplace?.workplaceID) {
      fetchJournals(workplaceState.selectedWorkplace.workplaceID, false);
    }
  };

  const formatAmount = (journal: Journal): string => {
    if (!journal.amount) return '0.00';
    try {
      const amount = parseFloat(journal.amount);
      return amount.toFixed(2);
    } catch (e) {
      console.error(`Error formatting amount for journal ${journal.journalID}:`, e);
      return '0.00';
    }
  };

  const filteredJournals = journals.filter(journal => 
    (journal.description && journal.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    journal.journalID.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedJournals = [...filteredJournals].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Journals</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEntryDialogOpen(true)}
            disabled={!workplaceState.selectedWorkplace}
          >
            <Plus className="h-4 w-4 mr-1" /> New Journal
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search journals..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading || !!error}
          />
        </div>
        <div className="flex items-center mt-2">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={includeReversals}
              onChange={(e) => setIncludeReversals(e.target.checked)}
              className="rounded"
            />
            <span>Include reversed/reversing journals</span>
          </label>
        </div>
      </CardHeader>
      <CardContent className="pt-2 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading journals...
          </div>
        ) : error ? (
           <Alert variant="destructive" className="m-4">
               <AlertDescription>{error}</AlertDescription>
           </Alert>
        ) : journals.length === 0 && !searchTerm ? (
          <div className="p-4 text-center text-muted-foreground">
            No journals found. Create your first journal.
          </div>
        ) : sortedJournals.length === 0 && searchTerm ? (
           <div className="p-4 text-center text-muted-foreground">
             No journals match "{searchTerm}".
           </div>
        ) : (
          <div className="space-y-2">
            {sortedJournals.map((journal) => journal && (
              <button
                key={journal.journalID}
                className="w-full text-left p-3 rounded-md hover:bg-accent flex flex-col"
                onClick={() => onSelectJournal(journal)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="font-medium break-words">{journal.description || journal.journalID}</div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {journal.date && !isNaN(new Date(journal.date).getTime()) 
                        ? new Date(journal.date).toLocaleDateString() 
                        : 'Invalid Date'}
                    </span>
                    <span className="text-sm font-medium whitespace-nowrap">
                      <ErrorBoundary fallback={<span>$0.00</span>}>
                        <CurrencyDisplay 
                          amount={journal.amount || '0'} 
                          currencyCode={journal.currencyCode} 
                        />
                      </ErrorBoundary>
                    </span>
                  </div>
                </div>
                {(journal.originalJournalID || journal.reversingJournalID) && (
                  <div className="flex gap-1 mt-1">
                    {journal.originalJournalID && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Reversal
                      </span>
                    )}
                    {journal.reversingJournalID && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                        Reversed
                      </span>
                    )}
                    {journal.originalJournalID && journal.reversingJournalID && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        Re-reversed
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
            
            {nextToken && (
              <div className="flex justify-center pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLoadMore}
                  disabled={isPaginationLoading}
                >
                  {isPaginationLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <JournalEntryDialog 
        isOpen={isEntryDialogOpen}
        onClose={() => setIsEntryDialogOpen(false)}
        onSaved={handleJournalCreated}
      />
    </Card>
  );
};

export default JournalsList;
