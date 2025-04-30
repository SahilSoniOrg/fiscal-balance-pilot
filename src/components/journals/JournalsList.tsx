
import React, { useState, useEffect } from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Journal } from '@/lib/types';
import apiService from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';

interface JournalsListProps {
  onSelectJournal: (journal: Journal) => void;
}

const JournalsList: React.FC<JournalsListProps> = ({ onSelectJournal }) => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { state } = useWorkplace();

  useEffect(() => {
    if (state.selectedWorkplace) {
      fetchJournals();
    }
  }, [state.selectedWorkplace]);

  const fetchJournals = async () => {
    if (!state.selectedWorkplace) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.get<Journal[]>(
        `/workplaces/${state.selectedWorkplace.workplaceId}/journals`
      );
      
      if (response.data) {
        setJournals(response.data);
        if (response.data.length > 0) {
          onSelectJournal(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching journals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJournals = journals.filter(journal => 
    journal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (journal.description && journal.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort journals by date, newest first
  const sortedJournals = [...filteredJournals].sort((a, b) => 
    new Date(b.journalDate).getTime() - new Date(a.journalDate).getTime()
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Journals</CardTitle>
          <Button variant="outline" size="sm">
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
          />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <div className="p-4 text-center">Loading journals...</div>
        ) : journals.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No journals found. Create your first journal.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedJournals.map((journal) => (
              <button
                key={journal.journalId}
                className="w-full text-left p-3 rounded-md hover:bg-accent flex flex-col"
                onClick={() => onSelectJournal(journal)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{journal.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(journal.journalDate).toLocaleDateString()}
                  </span>
                </div>
                {journal.description && (
                  <span className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {journal.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JournalsList;
