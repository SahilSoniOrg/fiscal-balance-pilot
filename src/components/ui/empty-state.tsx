import React from 'react';
import { FolderX, Plus, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type EmptyStateType = 'default' | 'search' | 'filtered' | 'error';

export interface EmptyStateProps {
  /** The title to display */
  title?: string;
  /** The message to display */
  message: string;
  /** The type of empty state */
  type?: EmptyStateType;
  /** Optional action button text */
  actionText?: string;
  /** Optional action button handler */
  onAction?: () => void;
  /** Optional action button variant */
  actionVariant?: 'default' | 'outline' | 'secondary';
  /** Custom CSS classes */
  className?: string;
  /** Custom icon to use */
  icon?: React.ReactNode;
  /** Whether to show an icon */
  showIcon?: boolean;
}

/**
 * A reusable empty state component for showing when there is no data
 * 
 * @example
 * // Basic usage
 * <EmptyState message="No accounts found" />
 * 
 * // With action button
 * <EmptyState
 *   title="No journals"
 *   message="Create your first journal to get started"
 *   actionText="New Journal"
 *   onAction={() => setIsCreateDialogOpen(true)}
 * />
 * 
 * // Search results empty state
 * <EmptyState
 *   type="search"
 *   message="No results match your search"
 *   actionText="Clear Search"
 *   onAction={() => setSearchTerm('')}
 * />
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  type = 'default',
  actionText,
  onAction,
  actionVariant = 'default',
  className = '',
  icon,
  showIcon = true,
}) => {
  const getDefaultTitle = (): string => {
    switch (type) {
      case 'search':
        return 'No results found';
      case 'filtered':
        return 'No matching items';
      case 'error':
        return 'Could not load data';
      default:
        return 'No data available';
    }
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'search':
        return <Search className="h-12 w-12 text-gray-300" />;
      case 'filtered':
        return <FolderX className="h-12 w-12 text-gray-300" />;
      case 'error':
        return <RefreshCw className="h-12 w-12 text-gray-300" />;
      default:
        return <FolderX className="h-12 w-12 text-gray-300" />;
    }
  };

  const getDefaultActionText = (): string | undefined => {
    switch (type) {
      case 'search':
        return 'Clear Search';
      case 'filtered':
        return 'Clear Filters';
      case 'error':
        return 'Try Again';
      default:
        return actionText;
    }
  };

  const getActionIcon = () => {
    switch (type) {
      case 'default':
        return <Plus className="h-4 w-4 mr-1" />;
      case 'search':
        return <Search className="h-4 w-4 mr-1" />;
      case 'filtered':
        return <FolderX className="h-4 w-4 mr-1" />;
      case 'error':
        return <RefreshCw className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className={`text-center p-8 ${className}`}>
      {showIcon && (
        <div className="flex justify-center mb-4">
          {icon || getDefaultIcon()}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        {title || getDefaultTitle()}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {actionText && onAction && (
        <div className="mt-6">
          <Button variant={actionVariant} onClick={onAction}>
            {getActionIcon()}
            {getDefaultActionText() || actionText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState; 