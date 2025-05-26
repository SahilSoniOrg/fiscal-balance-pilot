import React from 'react';
import { useWorkplace } from '@/context/WorkplaceContext';
import { useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Home, PiggyBank, BookOpen, Users, BarChart3 } from 'lucide-react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const { workplaceId: urlWorkplaceId } = useParams<{ workplaceId: string }>();
  const { state } = useWorkplace();

  // If we have a workplaceId from URL params, use it, otherwise use the selected workplace's ID
  const currentWorkplaceId = urlWorkplaceId || state.selectedWorkplace?.workplaceID;
  
  // Define menu items with prefixed paths
  const menuItems = [
    { path: `/workplaces/${currentWorkplaceId}/dashboard`, label: 'Dashboard', icon: Home },
    { path: `/workplaces/${currentWorkplaceId}/accounts`, label: 'Accounts', icon: PiggyBank },
    { path: `/workplaces/${currentWorkplaceId}/journals`, label: 'Journals', icon: BookOpen },
    { path: `/workplaces/${currentWorkplaceId}/reports`, label: 'Reports', icon: BarChart3 },
    { path: `/workplaces/${currentWorkplaceId}/settings`, label: 'Workplace', icon: Users },
  ];

  // Don't render if no workplace is selected
  if (!currentWorkplaceId) {
    return null;
  }

  return (
    <Sidebar
      menuItems={menuItems}
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="md:hidden"
    />
  );
};

export default MobileSidebar;
