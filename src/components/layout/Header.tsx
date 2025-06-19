import React, { useState } from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Menu, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { Workplace } from '@/lib/types';
import CreateWorkplaceDialog from '../workplace/CreateWorkplaceDialog';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { state, selectWorkplace } = useWorkplace();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleWorkplaceChange = (workplaceId: string) => {
    const workplace = state.workplaces.find(
      (wp) => wp.workplaceID === workplaceId
    );
    
    if (workplace) {
      selectWorkplace(workplace);
      
      let currentPathSegment = 'dashboard';
      
      const match = location.pathname.match(/^\/workplaces\/[^/]+\/([^/]+)/);
      if (match && match[1]) {
        currentPathSegment = match[1];
      }
      
      navigate(`/workplaces/${workplaceId}/${currentPathSegment}`);
    }
  };

  const toggleMobileMenu = () => {
    onMenuToggle?.();
  };

  return (
    <header className="p-4 border-b sticky top-0 z-40 bg-background">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden mr-2"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <h2 className="text-lg md:text-xl font-semibold mr-4">
            {state.selectedWorkplace?.name || 'Select a Workplace'}
          </h2>
          <div className="flex items-center space-x-2">
            {state.workplaces.length > 0 && (
              <Select
                value={state.selectedWorkplace?.workplaceID || ''}
                onValueChange={handleWorkplaceChange}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a workplace" />
                </SelectTrigger>
                <SelectContent>
                  {state.workplaces.map((workplace: Workplace) => (
                    <SelectItem key={workplace.workplaceID} value={workplace.workplaceID}>
                      {workplace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-100 text-purple-700">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-flex items-center">
                  {user?.name || 'User'}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>User Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CreateWorkplaceDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
      </div>
    </header>
  );
};

// Export as both named and default for backward compatibility
export default Header;
