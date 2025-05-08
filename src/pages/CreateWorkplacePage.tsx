
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateWorkplaceDialog from '../components/workplace/CreateWorkplaceDialog';
import { Loader2 } from 'lucide-react';

const CreateWorkplacePage: React.FC = () => {
  const { token, isLoading } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-finance-blue" />
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/" replace={true} />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-finance-blue">Fiscal Balance</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create your first workplace to get started
          </p>
        </div>
        <div className="mt-8">
          <Button 
            onClick={() => setCreateDialogOpen(true)} 
            size="lg"
            className="mx-auto flex items-center justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Workplace
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-8">
          A workplace is where you'll manage your finances, accounts, and journals.
        </p>
        <CreateWorkplaceDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
      </div>
    </div>
  );
};

export default CreateWorkplacePage;
