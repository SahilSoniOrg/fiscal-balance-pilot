
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkplace } from '@/context/WorkplaceContext';
import { Journal, JournalWithTransactions } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import JournalForm from './JournalForm';
import apiService from '@/services/apiService';

interface JournalEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (journal: Journal) => void;
  initialData?: JournalWithTransactions;
}

const JournalEntryDialog: React.FC<JournalEntryDialogProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialData
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const { state: workplaceState } = useWorkplace();
  const { toast } = useToast();
  
  const handleSave = async (journalData: JournalWithTransactions) => {
    if (!workplaceState.selectedWorkplace) {
      toast({
        title: "Error",
        description: "No workplace selected",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Determine if this is a create or update operation
      const isUpdate = !!initialData?.journalID;
      const endpoint = isUpdate 
        ? `/workplaces/${workplaceState.selectedWorkplace.workplaceID}/journals/${initialData.journalID}`
        : `/workplaces/${workplaceState.selectedWorkplace.workplaceID}/journals`;
      
      const method = isUpdate ? 'put' : 'post';
      
      // Make API call
      const response = await apiService[method]<Journal>(endpoint, journalData);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        toast({
          title: "Success",
          description: isUpdate ? "Journal updated successfully" : "Journal created successfully"
        });
        
        onSaved(response.data);
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving journal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save journal",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Create'} Journal Entry</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
          <JournalForm
            onSave={handleSave}
            onCancel={onClose}
            initialData={initialData}
            isSaving={isSaving}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JournalEntryDialog;
