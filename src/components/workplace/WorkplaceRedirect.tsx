import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreateWorkplaceDialog from './CreateWorkplaceDialog';
import { useAuth } from '@/context/AuthContext';

const WorkplaceRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: workplaceCtxState, selectWorkplace } = useWorkplace(); // Renamed state for clarity
  const { user, logout, isLoading: authIsLoading } = useAuth(); // Get auth loading state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  
  const handleLogout = async () => {
    await logout();
    navigate('/'); 
  };

  // Effect 1: Handle redirection to login if not authenticated
  useEffect(() => {
    if (!authIsLoading && !user) {
      navigate('/', { replace: true });
    }
  }, [authIsLoading, user, navigate]);

  // Effect 2: Handles workplace loading and redirection logic for authenticated users
  useEffect(() => {
    // Only proceed if authentication is complete and user exists
    if (authIsLoading || !user) {
      return;
    }

    // If no workplaces are loaded yet from WorkplaceContext, wait for them
    if (workplaceCtxState.isLoading) return;
    
    // If there are workplaces, redirect to the selected one or first one
    if (workplaceCtxState.workplaces.length > 0) {
      const workplace = workplaceCtxState.selectedWorkplace || workplaceCtxState.workplaces[0];
      if (!workplaceCtxState.selectedWorkplace) {
        selectWorkplace(workplaceCtxState.workplaces[0]);
      }
      let targetPath: string;
      const currentPath = location.pathname;
      if (currentPath === '/select-workplace') {
        targetPath = `/workplaces/${workplace.workplaceID}/dashboard`;
      } else if (currentPath === '/workplace-settings') { // This case might be less common now
        targetPath = `/workplaces/${workplace.workplaceID}/settings`;
      } else if (currentPath.startsWith('/')) {
        const routeName = currentPath.substring(1);
        // Avoid self-referencing /select-workplace in a loop
        if (routeName !== 'select-workplace'){
            targetPath = `/workplaces/${workplace.workplaceID}/${routeName}`;
        } else {
            targetPath = `/workplaces/${workplace.workplaceID}/dashboard`;
        }
      } else {
        targetPath = `/workplaces/${workplace.workplaceID}/dashboard`;
      }
      navigate(targetPath, { replace: true });
    }
    // If user is authenticated, auth/workplace not loading, and no workplaces exist,
    // the component will fall through to the "Create Workplace" UI rendering below.
  }, [authIsLoading, user, workplaceCtxState, selectWorkplace, navigate, location.pathname]); // Added authIsLoading, user, and workplaceCtxState to dependencies

  // 1. If authentication is still loading
  if (authIsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Authenticating...</div>
      </div>
    );
  }

  // 2. If not authenticated (auth loaded, but no user), Effect 1 should handle redirect.
  // Render a minimal loader while redirecting.
  if (!user) {
    return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse text-muted-foreground">Redirecting to login...</div>
        </div>
    );
  }
  
  // At this point, user is authenticated.

  // 3. If WorkplaceContext is loading data (and user is authenticated)
  if (workplaceCtxState.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading workplaces...</div>
      </div>
    );
  }

  // 4. If no workplaces, show the "Create Workplace" UI (user is authenticated, workplaces loaded)
  // This check ensures workplaces array is available and not loading
  if (workplaceCtxState.workplaces && workplaceCtxState.workplaces.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        {/* Header with User Info and Logout Button - user is guaranteed here */}
        <div className="w-full max-w-md mb-6 p-4 bg-white rounded-lg shadow flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Logged in as:</p>
            <p className="text-lg font-semibold text-gray-800">{user.email || user.name || 'User'}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="max-w-md w-full space-y-6 text-center bg-white p-8 rounded-lg shadow">
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

  // Fallback: Should be hit if user is authenticated, workplaces are loaded and exist (>0),
  // but Effect 2's navigation hasn't completed yet.
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse text-muted-foreground">Preparing your workplace...</div>
    </div>
  );
};

export default WorkplaceRedirect;
