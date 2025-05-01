
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      // Format the date properly for API requirements - ensure it's in ISO format
      const formattedData = {
        ...journalData,
        date: new Date(journalData.date).toISOString()
      };
      
      // Determine if this is a create or update operation
      const isUpdate = !!initialData?.journalID;
      const endpoint = isUpdate 
        ? `/workplaces/${workplaceState.selectedWorkplace.workplaceID}/journals/${initialData.journalID}`
        : `/workplaces/${workplaceState.selectedWorkplace.workplaceID}/journals`;
      
      const method = isUpdate ? 'put' : 'post';
      
      // Make API call
      const response = await apiService[method]<Journal>(endpoint, formattedData);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        toast({
          title: "Success",
          description: isUpdate ? "Journal updated successfully" : "Journal created successfully"
        });
        
        onSaved(response.data);
      }
    } catch (error: any) {
      console.error('Error saving journal:', error);
      // Toast error but don't close the dialog
      toast({
        title: "Error",
        description: error.message || "Failed to save journal",
        variant: "destructive"
      });
      // We don't call onClose here, allowing the user to try again
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Only close if the dialog is being closed directly, not from a toast
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Create'} Journal Entry</DialogTitle>
          <DialogDescription>
            Enter the details for this journal entry. Make sure debits and credits are balanced.
          </DialogDescription>
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
