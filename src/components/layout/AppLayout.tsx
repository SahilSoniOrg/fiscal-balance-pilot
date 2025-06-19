import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useWorkplace } from '@/context/WorkplaceContext';
import Sidebar from './Sidebar';
import { Header } from './Header';
import { Loader2, Home, PiggyBank, BookOpen, Users, BarChart3 } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { token, isLoading: authLoading } = useAuth();
  const { workplaceId: urlWorkplaceId } = useParams<{ workplaceId: string }>();
  const { state, selectWorkplace } = useWorkplace();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Select the workplace based on URL parameter if provided
  useEffect(() => {
    if (urlWorkplaceId && state.workplaces.length > 0) {
      const workplace = state.workplaces.find(wp => wp.workplaceID === urlWorkplaceId);
      
      if (workplace && (!state.selectedWorkplace || state.selectedWorkplace.workplaceID !== urlWorkplaceId)) {
        selectWorkplace(workplace);
      }
    } else if (!state.selectedWorkplace && state.workplaces.length > 0) {
      // Auto-select first workplace if none is selected
      selectWorkplace(state.workplaces[0]);
    }
  }, [urlWorkplaceId, state.workplaces, state.selectedWorkplace, selectWorkplace]);

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

  // Use URL param if available, otherwise fall back to selected workplace
  const workplaceId = urlWorkplaceId || state.selectedWorkplace?.workplaceID;

  if (!workplaceId) {
    return <div>Loading or redirect to workplace selection...</div>;
  }

  const menuItems = [
    { 
      path: `/workplaces/${workplaceId}/dashboard`, 
      label: 'Dashboard', 
      icon: Home 
    },
    { 
      path: `/workplaces/${workplaceId}/accounts`, 
      label: 'Accounts', 
      icon: PiggyBank 
    },
    { 
      path: `/workplaces/${workplaceId}/journals`, 
      label: 'Journals', 
      icon: BookOpen 
    },
    { 
      path: `/workplaces/${workplaceId}/reports`, 
      label: 'Reports', 
      icon: BarChart3 
    },
    { 
      path: `/workplaces/${workplaceId}/settings`, 
      label: 'Workplace Settings', 
      icon: Users 
    }
  ];

  return (
    <div className="flex h-screen">
      <Sidebar
        menuItems={menuItems} 
        isOpen={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
