import React from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { useAuth } from '@/context/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Workplace } from '@/lib/types';

const Header: React.FC = () => {
  const { state: workplaceState, selectWorkplace } = useWorkplace();
  const { user } = useAuth();

  const handleWorkplaceChange = (workplaceId: string) => {
    const workplace = workplaceState.workplaces.find(
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
            {workplaceState.selectedWorkplace?.name || 'Select a Workplace'}
          </h2>
          {workplaceState.workplaces.length > 0 && (
            <Select
              value={workplaceState.selectedWorkplace?.workplaceID || ''}
              onValueChange={handleWorkplaceChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a workplace" />
              </SelectTrigger>
              <SelectContent>
                {workplaceState.workplaces.map((workplace: Workplace) => (
                  <SelectItem key={workplace.workplaceID} value={workplace.workplaceID}>
                    {workplace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center">
          <span className="text-sm text-muted-foreground mr-2">
            Signed in as:
          </span>
          <span className="font-medium">{user?.name || '...'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
