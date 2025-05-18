import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Journal, Transaction } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import JournalEntryDialog from './JournalEntryDialog';
import CurrencyDisplay from '@/components/ui/currency-display';
import ErrorBoundary from '@/components/ui/error-boundary';

// Import our refactored components and hooks
import usePaginatedData from '@/hooks/usePaginatedData';
import ResourceHeader from '@/components/ui/resource-header';
import ResourceListItem from '@/components/ui/resource-list-item';
import EmptyState from '@/components/ui/empty-state';
import LoadingState from '@/components/ui/loading-state';
import ErrorDisplay from '@/components/ui/error-display';
import PaginationControls from '@/components/ui/pagination-controls';
import journalService from '@/services/journalService';

interface JournalsListProps {
  onSelectJournal: (journal: Journal | null) => void;
}

interface JournalWithTransactions extends Journal {
  transactions?: Transaction[];
  parsedDate?: Date;
}

interface JournalsListRef {
  refresh: () => Promise<void>;
}

const JournalsList = forwardRef<JournalsListRef, JournalsListProps>(({ onSelectJournal }, ref) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [includeReversals, setIncludeReversals] = useState(false);
  const { state: workplaceState } = useWorkplace();
  const workplaceId = workplaceState.selectedWorkplace?.workplaceID || '';

  // Use the pagination hook for journals
  const {
    data: journals,
    isLoading,
    isPaginationLoading,
    error,
    hasMore,
    loadMore,
    refresh: refreshJournals
  } = usePaginatedData<JournalWithTransactions>(
    workplaceId ? `/workplaces/${workplaceId}/journals` : '',
    {
      dataKey: 'journals',
      limit: 20,
      fetchOnMount: !!workplaceId,
      deps: [workplaceId, includeReversals],
      params: { includeReversals },
      transformItem: (journal) => {
        // Parse date for proper sorting
        if (journal.date) {
          try {
            journal.parsedDate = new Date(journal.date);
          } catch (e) {
            console.error(`Invalid date for journal ${journal.journalID}:`, e);
          }
        }
        return journal;
      }
    }
  );

  // Select the first journal by default when data loads
  useEffect(() => {
    if (journals && journals.length > 0) {
      const sorted = [...journals].sort((a, b) => 
        (b.parsedDate?.getTime() || 0) - (a.parsedDate?.getTime() || 0)
      );
      onSelectJournal(sorted[0]);
    } else {
      onSelectJournal(null);
    }
  }, [journals, onSelectJournal]);

  const handleJournalCreated = (newJournal: Journal) => {
    refreshJournals();
  };

  const filteredJournals = journals.filter(journal => 
    (journal.description && journal.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    journal.journalID.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedJournals = [...filteredJournals].sort((a, b) => 
    (b.parsedDate?.getTime() || 0) - (a.parsedDate?.getTime() || 0)
  );

  // Expose the refresh method via ref
  useImperativeHandle(ref, () => ({
    refresh: async () => {
      await refreshJournals();
    }
  }), [refreshJournals]);

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Use ResourceHeader component */}
        <ResourceHeader
          title="Journals"
          primaryActionText="New Journal"
          onPrimaryAction={() => setIsEntryDialogOpen(true)}
          compact
        />
        
        {/* Search bar */}
        <div className="relative mb-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search journals..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading || !!error}
          />
        </div>

        {/* Filter options */}
        <div className="flex items-center mb-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeReversals"
              checked={includeReversals}
              onCheckedChange={(checked) => {
                const newValue = checked === true;
                setIncludeReversals(newValue);
                refreshJournals({ includeReversals: newValue });
              }}
            />
            <label
              htmlFor="includeReversals"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include reversed/reversing journals
            </label>
          </div>
        </div>

        {/* Content area with appropriate states */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <LoadingState message="Loading journals..." />
          ) : error ? (
            <ErrorDisplay message={error} />
          ) : journals.length === 0 ? (
            <EmptyState
              title="No journals found"
              message="Create your first journal to get started"
              actionText="Create Journal"
              onAction={() => setIsEntryDialogOpen(true)}
            />
          ) : sortedJournals.length === 0 && searchTerm ? (
            <EmptyState
              title="No results found"
              message={`No journals match "${searchTerm}"`}
              type="search"
            />
          ) : (
            <div className="space-y-2">
              {sortedJournals.map((journal) => (
                <ResourceListItem
                  key={journal.journalID}
                  title={journal.description || journal.journalID}
                  timestamp={journal.date && !isNaN(new Date(journal.date).getTime())
                    ? new Date(journal.date).toLocaleDateString()
                    : 'Invalid Date'}
                  value={
                    <ErrorBoundary fallback={<span>$0.00</span>}>
                      <CurrencyDisplay
                        amount={journal.amount || '0'}
                        currencyCode={journal.currencyCode}
                      />
                    </ErrorBoundary>
                  }
                  badges={
                    (journal.originalJournalID || journal.reversingJournalID) ? (
                      <div className="flex gap-1">
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
                    ) : null
                  }
                  onClick={() => onSelectJournal(journal)}
                />
              ))}
              
              <PaginationControls
                hasMore={hasMore}
                isLoading={isPaginationLoading}
                onLoadMore={loadMore}
              />
            </div>
          )}
        </div>
      </CardContent>
      
      <JournalEntryDialog
        isOpen={isEntryDialogOpen}
        onClose={() => setIsEntryDialogOpen(false)}
        onSaved={handleJournalCreated}
      />
    </Card>
  );
});

JournalsList.displayName = 'JournalsList';

export default JournalsList;
