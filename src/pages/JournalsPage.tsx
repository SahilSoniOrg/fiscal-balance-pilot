import React, { useState, useRef } from 'react';
import JournalsList from '../components/journals/JournalsList';
import JournalDetail from '../components/journals/JournalDetail';
import { Journal } from '../lib/types';
import { useWorkplace } from '@/context/WorkplaceContext';
import apiService from '@/services/apiService';
import { useToast } from "@/hooks/use-toast";

const JournalsPage: React.FC = () => {
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const { state: workplaceState } = useWorkplace();
  const { toast } = useToast();
  const journalsListRef = useRef<{ refresh: () => Promise<void> } | null>(null);

  const handleNavigateToJournal = async (journalId: string) => {
    if (!workplaceState.selectedWorkplace?.workplaceID) {
      toast({
        title: "Error",
        description: "Cannot navigate: No workspace selected.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiService.get<Journal>(`/workplaces/${workplaceState.selectedWorkplace.workplaceID}/journals/${journalId}`);
      if (response.data) {
        // Add workplaceID to the journal data for the detail view
        setSelectedJournal({
          ...response.data,
          workplaceID: workplaceState.selectedWorkplace.workplaceID
        });
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (error: any) {
      console.error('Error navigating to journal:', error);
      toast({
        title: "Navigation Failed",
        description: error.message || "Could not load the journal.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
      <div className="md:col-span-1 h-full">
        <JournalsList 
          ref={journalsListRef}
          onSelectJournal={setSelectedJournal} 
        />
      </div>
      <div className="md:col-span-2 h-full">
        <JournalDetail 
          journal={selectedJournal} 
          onNavigateToJournal={handleNavigateToJournal}
          refreshJournals={async () => {
            if (journalsListRef.current?.refresh) {
              await journalsListRef.current.refresh();
            }
          }}
        />
      </div>
    </div>
  );
};

export default JournalsPage;
