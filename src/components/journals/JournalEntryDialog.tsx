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
      // Determine if this is a create or update operation
      const isUpdate = !!initialData?.journalID;
      const endpoint = isUpdate 
        ? `/workplaces/${workplaceState.selectedWorkplace.workplaceID}/journals/${initialData.journalID}`
        : `/workplaces/${workplaceState.selectedWorkplace.workplaceID}/journals`;
      
      const method = isUpdate ? 'put' : 'post';
      
      let apiPayload: any;

      if (isUpdate) {
         // For PUT (update), send the slightly formatted data as before (assuming update might need more fields)
         // Consider refining this if the PUT endpoint has specific requirements
         apiPayload = {
           ...journalData,
           date: new Date(journalData.date).toISOString() // Ensure date is ISO string
         };
         // Remove potentially problematic fields for update if necessary
         delete apiPayload.createdAt; 
         delete apiPayload.createdBy;
         delete apiPayload.lastUpdatedAt;
         delete apiPayload.lastUpdatedBy;
         // Transform transaction amounts for update as well
         apiPayload.transactions = journalData.transactions.map(t => ({
             ...t, // Include other relevant transaction fields if needed for update
             amount: t.amount || '0' // Send amount as string
         }));

      } else {
        // For POST (create), construct the specific payload expected by the backend
        apiPayload = {
          currencyCode: journalData.currencyCode,
          date: new Date(journalData.date).toISOString(), // Send full ISO string
          description: journalData.description,
          transactions: journalData.transactions.map(t => ({
            accountID: t.accountID,
            amount: t.amount || '0', // Send amount as string
            notes: t.notes,
            transactionType: t.transactionType
          }))
        };
      }

      // Make API call with the correctly structured payload
      const response = await apiService[method]<Journal>(endpoint, apiPayload);
      
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
      <DialogContent className="max-w-4xl flex flex-col overflow-hidden">
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
