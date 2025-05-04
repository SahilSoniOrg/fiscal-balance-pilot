import React, { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useWorkplace } from '@/context/WorkplaceContext';
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from './Sidebar';
import Header from './Header';
import { Loader2 } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { token, isLoading: authLoading } = useAuth();
  const { workplaceId } = useParams<{ workplaceId: string }>();
  const { state, selectWorkplace } = useWorkplace();
  
  // Select the workplace based on URL parameter if provided
  useEffect(() => {
    if (workplaceId && state.workplaces.length > 0) {
      const workplace = state.workplaces.find(wp => wp.workplaceID === workplaceId);
      
      if (workplace && (!state.selectedWorkplace || state.selectedWorkplace.workplaceID !== workplaceId)) {
        selectWorkplace(workplace);
      }
    } else if (!state.selectedWorkplace && state.workplaces.length > 0) {
      // Auto-select first workplace if none is selected
      selectWorkplace(state.workplaces[0]);
    }
  }, [workplaceId, state.workplaces, state.selectedWorkplace, selectWorkplace]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/" replace={true} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-6 bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
