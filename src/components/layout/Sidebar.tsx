import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { useWorkplace } from '@/context/WorkplaceContext';
import { Home, PiggyBank, BookOpen, Settings, LogOut, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const { pathname } = useLocation();
  const { workplaceId } = useParams<{ workplaceId: string }>();
  const { logout } = useAuth();
  const { state } = useWorkplace();

  // If we have a workplaceId from URL params, use it, otherwise use the selected workplace's ID
  const currentWorkplaceId = workplaceId || state.selectedWorkplace?.workplaceID;
  
  // Define menu items with prefixed paths
  const menuItems = [
    { path: `/workplaces/${currentWorkplaceId}/dashboard`, label: 'Dashboard', icon: Home },
    { path: `/workplaces/${currentWorkplaceId}/accounts`, label: 'Accounts', icon: PiggyBank },
    { path: `/workplaces/${currentWorkplaceId}/journals`, label: 'Journals', icon: BookOpen },
    { path: `/workplaces/${currentWorkplaceId}/reports`, label: 'Reports', icon: BarChart3 },
    { path: `/workplaces/${currentWorkplaceId}/settings`, label: 'Workplace', icon: Users },
  ];

  // Don't render navigation if no workplace is selected
  if (!currentWorkplaceId) {
    return (
      <ShadcnSidebar className="border-r border-border h-screen">
        <SidebarHeader className="flex items-center justify-center p-4">
          <h1 className="text-xl font-bold text-finance-blue">
            {!collapsed ? 'Fiscal Balance' : 'FB'}
          </h1>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <div className="text-center p-4 text-muted-foreground">
            Loading workplaces...
          </div>
        </SidebarContent>
      </ShadcnSidebar>
    );
  }

  return (
    <ShadcnSidebar className="border-r border-border h-screen">
      <SidebarHeader className="flex items-center justify-center p-4">
        <h1 className="text-xl font-bold text-finance-blue">
          {!collapsed ? 'Fiscal Balance' : 'FB'}
        </h1>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-sm font-medium text-muted-foreground">
            {!collapsed ? 'Navigation' : ''}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.path} 
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
                        pathname === item.path && "bg-accent text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          {!collapsed && <span>Log out</span>}
        </Button>
      </SidebarFooter>
    </ShadcnSidebar>
  );
};

export default Sidebar;
