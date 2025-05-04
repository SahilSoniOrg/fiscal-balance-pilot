import React, { useState } from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { useAuth } from '@/context/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Workplace } from '@/lib/types';
import CreateWorkplaceDialog from '../workplace/CreateWorkplaceDialog';

const Header: React.FC = () => {
  const { state, selectWorkplace } = useWorkplace();
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleWorkplaceChange = (workplaceId: string) => {
    const workplace = state.workplaces.find(
      (wp) => wp.workplaceID === workplaceId
    );
    if (workplace) {
      selectWorkplace(workplace);
    }
  };

  return (
    <header className="p-4 border-b">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold mr-4">
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
        <div className="flex items-center">
          <span className="text-sm text-muted-foreground mr-2">
            Signed in as:
          </span>
          <span className="font-medium">{user?.name || '...'}</span>
        </div>
        <CreateWorkplaceDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
      </div>
    </header>
  );
};

export default Header;
