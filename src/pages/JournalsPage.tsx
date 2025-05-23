import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JournalsList from '../components/journals/JournalsList';
import JournalDetail from '../components/journals/JournalDetail';
import { Journal } from '../lib/types';
import { useWorkplace } from '@/context/WorkplaceContext';
import apiService from '@/services/apiService';
import { useToast } from "@/hooks/use-toast";

const JournalsPage: React.FC = () => {
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const { journalId } = useParams<{ journalId?: string }>();
  const navigate = useNavigate();
  const { state: workplaceState } = useWorkplace();
  const { toast } = useToast();
  const journalsListRef = useRef<{ refresh: () => Promise<void> } | null>(null);

  // Load journal when journalId changes
  useEffect(() => {
    if (journalId && workplaceState.selectedWorkplace?.workplaceID) {
      loadJournal(journalId);
    } else if (!journalId) {
      setSelectedJournal(null);
    }
  }, [journalId, workplaceState.selectedWorkplace?.workplaceID]);

  const loadJournal = async (id: string) => {
    if (!workplaceState.selectedWorkplace?.workplaceID) return;

    try {
      const response = await apiService.get<Journal>(
        `/workplaces/${workplaceState.selectedWorkplace.workplaceID}/journals/${id}`
      );

      if (response.data) {
        setSelectedJournal({
          ...response.data,
          workplaceID: workplaceState.selectedWorkplace.workplaceID
        });
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (error: any) {
      console.error('Error loading journal:', error);
      toast({
        title: "Error",
        description: error.message || "Could not load the journal.",
        variant: "destructive",
      });
    }
  };

  const handleNavigateToJournal = async (journalId: string) => {
    if (!workplaceState.selectedWorkplace?.workplaceID) {
      toast({
        title: "Error",
        description: "No workplace selected",
        variant: "destructive",
      });
      return;
    }
    // Update the URL when a journal is selected
    navigate(`/workplaces/${workplaceState.selectedWorkplace.workplaceID}/journals/${journalId}`);
  };

  // Handle journal selection from the list
  const handleSelectJournal = (journal: Journal | null) => {
    if (journal) {
      setSelectedJournal(journal);
      // Update the URL to reflect the selected journal
      navigate(`/workplaces/${workplaceState.selectedWorkplace?.workplaceID}/journals/${journal.journalID}`, { replace: true });
    } else {
      setSelectedJournal(null);
      // If no journal is selected, remove the journal ID from the URL
      navigate(`/workplaces/${workplaceState.selectedWorkplace?.workplaceID}/journals`, { replace: true });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
      <div className="md:col-span-1 h-full">
        <JournalsList
          ref={journalsListRef}
          onSelectJournal={handleSelectJournal}
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
