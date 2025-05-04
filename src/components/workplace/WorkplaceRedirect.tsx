import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkplace } from '@/context/WorkplaceContext';

const WorkplaceRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, selectWorkplace } = useWorkplace();
  
  useEffect(() => {
    // If no workplaces are loaded yet, wait for them
    if (state.isLoading) return;
    
    // Get the workplace to use (either the selected one or the first one)
    const workplace = state.selectedWorkplace || (state.workplaces.length > 0 ? state.workplaces[0] : null);
    
    if (workplace) {
      // If first workplace is not already selected, select it
      if (!state.selectedWorkplace && state.workplaces.length > 0) {
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
    } else {
      // If no workplaces available, redirect to root
      navigate('/', { replace: true });
    }
  }, [state.workplaces, state.selectedWorkplace, state.isLoading, navigate, location.pathname, selectWorkplace]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse text-muted-foreground">Redirecting...</div>
    </div>
  );
};

export default WorkplaceRedirect; 