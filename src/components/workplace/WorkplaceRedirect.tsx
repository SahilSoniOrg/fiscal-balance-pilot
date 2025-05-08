
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreateWorkplaceDialog from './CreateWorkplaceDialog';

const WorkplaceRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, selectWorkplace } = useWorkplace();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  
  useEffect(() => {
    // If no workplaces are loaded yet, wait for them
    if (state.isLoading) return;
    
    // If there are workplaces, redirect to the selected one or first one
    if (state.workplaces.length > 0) {
      // Get the workplace to use (either the selected one or the first one)
      const workplace = state.selectedWorkplace || state.workplaces[0];
      
      // If first workplace is not already selected, select it
      if (!state.selectedWorkplace) {
        selectWorkplace(state.workplaces[0]);
      }
      
      // Determine the path to redirect to
      let targetPath: string;
      
      // Convert current path to workplace-prefixed path if needed
      const currentPath = location.pathname;
      
      if (currentPath === '/select-workplace') {
        // Default to dashboard if just selecting a workplace
        targetPath = `/workplaces/${workplace.workplaceID}/dashboard`;
      } else if (currentPath === '/workplace-settings') {
        // Special case for workplace settings
        targetPath = `/workplaces/${workplace.workplaceID}/settings`;
      } else if (currentPath.startsWith('/')) {
        // For other paths like /dashboard, /accounts, etc.
        // Extract the route name without the leading slash
        const routeName = currentPath.substring(1);
        targetPath = `/workplaces/${workplace.workplaceID}/${routeName}`;
      } else {
        // Fallback to dashboard
        targetPath = `/workplaces/${workplace.workplaceID}/dashboard`;
      }
      
      // Navigate to the new path with replacing the history entry
      navigate(targetPath, { replace: true });
    }
    // If there are no workplaces and not loading, show the create workplace UI
    // (We don't redirect automatically to avoid potential redirect loops)
  }, [state.workplaces, state.selectedWorkplace, state.isLoading, navigate, location.pathname, selectWorkplace]);

  // If not loading and there are no workplaces, show create workplace UI
  if (!state.isLoading && state.workplaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Fiscal Balance</h2>
          <p className="text-gray-600">
            You don't have any workplaces yet. Create your first workplace to get started.
          </p>
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex items-center justify-center"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Workplace
          </Button>
          <p className="text-sm text-gray-500 mt-8">
            A workplace is where you'll manage your finances, accounts, and journals.
          </p>
        </div>
        <CreateWorkplaceDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
      </div>
    );
  }

  // Show loading state while waiting for workplace data
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse text-muted-foreground">Redirecting...</div>
    </div>
  );
};

export default WorkplaceRedirect;
