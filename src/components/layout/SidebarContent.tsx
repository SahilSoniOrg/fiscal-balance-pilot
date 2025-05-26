import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarContentProps {
  menuItems: MenuItem[];
  onNavigate?: () => void;
  className?: string;
  collapsed?: boolean;
}

export const SidebarContent = ({ 
  menuItems, 
  onNavigate,
  className,
  collapsed = false
}: SidebarContentProps) => {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      <nav className={cn("space-y-1 flex-1", className)}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                'hover:bg-accent hover:text-accent-foreground',
                isActive ? 'bg-accent text-accent-foreground' : 'text-foreground/80',
                'transition-colors duration-200'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      
      <div className={cn(
        'p-2 border-t mt-auto',
        collapsed ? 'flex justify-center' : ''
      )}>
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          onClick={handleLogout}
          className={cn(
            'w-full justify-start text-foreground/80 hover:text-foreground',
            collapsed ? 'justify-center' : ''
          )}
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Sign out</span>}
        </Button>
      </div>
    </div>
  );
};
