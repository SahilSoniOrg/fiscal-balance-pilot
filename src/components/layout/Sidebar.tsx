import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarContent } from './SidebarContent';

export interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  menuItems: MenuItem[];
  className?: string;
  collapsed?: boolean;
}

function Sidebar({ 
  isOpen: isOpenProp, 
  onOpenChange,
  menuItems, 
  className,
  collapsed = false
}: SidebarProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isOpen, setIsOpen] = useState(isOpenProp ?? false);

  // Sync with prop changes
  useEffect(() => {
    if (isOpenProp !== undefined) {
      setIsOpen(isOpenProp);
    }
  }, [isOpenProp]);

  // Handle body scroll
  useEffect(() => {
    if (!isDesktop && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isDesktop]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  // Desktop sidebar
  if (isDesktop) {
    return (
      <aside className={cn(
        'hidden md:flex flex-col h-screen border-r',
        collapsed ? 'w-16' : 'w-64',
        className
      )}>
        <div className="p-4 border-b h-16 flex items-center">
          <h2 className={cn(
            "text-xl font-bold text-finance-blue",
            collapsed && "sr-only"
          )}>
            Fiscal Balance
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <SidebarContent 
            menuItems={menuItems} 
            collapsed={collapsed}
          />
        </div>
      </aside>
    );
  }

  // Mobile sidebar
  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 flex md:hidden',
        isOpen ? 'block' : 'hidden'
      )}
    >
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => handleOpenChange(false)}
        aria-hidden="true"
      />
      <aside className={cn(
        'relative flex flex-col w-72 h-full bg-background border-r',
        'animate-in slide-in-from-left-80 duration-300',
        className
      )}>
        <div className="flex items-center justify-between p-4 border-b h-16">
          <h2 className="text-xl font-bold text-finance-blue">Fiscal Balance</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenChange(false)}
            className="h-10 w-10"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <SidebarContent 
            menuItems={menuItems} 
            onNavigate={() => handleOpenChange(false)}
          />
        </div>
      </aside>
    </div>
  );
}

// Export as default for backward compatibility
export default Sidebar;
