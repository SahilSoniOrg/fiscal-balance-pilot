
import React, { useState, useEffect } from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Journal } from '@/lib/types';
import apiService from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import JournalEntryDialog from './JournalEntryDialog';

interface JournalsListProps {
  onSelectJournal: (journal: Journal | null) => void;
}

interface FetchJournalsResponse {
  journals: Journal[];
}

const JournalsList: React.FC<JournalsListProps> = ({ onSelectJournal }) => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const { state: workplaceState } = useWorkplace();

  useEffect(() => {
    if (workplaceState.selectedWorkplace?.workplaceID) {
      fetchJournals(workplaceState.selectedWorkplace.workplaceID);
    } else {
      setJournals([]);
      setError(null);
      onSelectJournal(null);
    }
  }, [workplaceState.selectedWorkplace?.workplaceID]);

  const fetchJournals = async (workplaceId: string) => {
    setIsLoading(true);
    setError(null);
    setJournals([]);
    onSelectJournal(null);

    try {
      const response = await apiService.get<FetchJournalsResponse>(
        `/workplaces/${workplaceId}/journals`
      );
      
      if (response.data && Array.isArray(response.data.journals)) {
        setJournals(response.data.journals);
        if (response.data.journals.length > 0) {
          const sorted = [...response.data.journals].sort((a, b) => 
             new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          onSelectJournal(sorted[0]);
        } else {
          onSelectJournal(null);
        }
      } else if (response.error) {
        throw new Error(response.error || 'Failed to fetch journals');
      } else {
        console.warn('Invalid journals response format:', response.data);
        throw new Error('Received invalid format for journals data');
      }
    } catch (error: any) {
      console.error('Error fetching journals:', error);
      setError(error.message || 'Failed to load journals.');
      setJournals([]);
      onSelectJournal(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJournalCreated = (newJournal: Journal) => {
    // Refresh journals list after creating a new one
    if (workplaceState.selectedWorkplace?.workplaceID) {
      fetchJournals(workplaceState.selectedWorkplace.workplaceID);
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
            {sortedJournals.map((journal) => (
              <button
                key={journal.journalID}
                className="w-full text-left p-3 rounded-md hover:bg-accent flex flex-col"
                onClick={() => onSelectJournal(journal)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">{journal.description || journal.journalID}</span>
                  <span className="text-sm text-muted-foreground">
                    {journal.date && !isNaN(new Date(journal.date).getTime()) 
                       ? new Date(journal.date).toLocaleDateString() 
                       : 'Invalid Date'}
                  </span>
                </div>
              </button>
            ))}
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
