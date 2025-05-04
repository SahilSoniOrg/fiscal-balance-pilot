import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Plus } from 'lucide-react';

export interface ResourceHeaderProps {
  /** The title of the resource section */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Primary action button text */
  primaryActionText?: string;
  /** Primary action button click handler */
  onPrimaryAction?: () => void;
  /** Custom icon for primary action */
  primaryActionIcon?: ReactNode;
  /** Secondary actions to display */
  actions?: ReactNode;
  /** Back button click handler (if provided, shows back button) */
  onBack?: () => void;
  /** Back button text */
  backText?: string;
  /** Custom CSS classes */
  className?: string;
  /** Custom CSS classes for the title */
  titleClassName?: string;
  /** Custom CSS classes for the actions container */
  actionsClassName?: string;
  /** Whether the component is in a compact mode */
  compact?: boolean;
}

/**
 * A standardized header component for resource lists and detail views
 * 
 * @example
 * // Basic usage for a list view
 * <ResourceHeader
 *   title="Accounts"
 *   subtitle="Manage your financial accounts"
 *   primaryActionText="New Account"
 *   onPrimaryAction={() => setIsCreateDialogOpen(true)}
 * />
 * 
 * // Usage for a detail view with back button
 * <ResourceHeader
 *   title="Account Details"
 *   subtitle={account.name}
 *   onBack={() => navigate('/accounts')}
 *   actions={
 *     <Button variant="outline" onClick={handleEdit}>
 *       Edit
 *     </Button>
 *   }
 * />
 */
const ResourceHeader: React.FC<ResourceHeaderProps> = ({
  title,
  subtitle,
  primaryActionText,
  onPrimaryAction,
  primaryActionIcon,
  actions,
  onBack,
  backText = 'Back',
  className = '',
  titleClassName = '',
  actionsClassName = '',
  compact = false,
}) => {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6',
      compact ? 'mb-3' : 'mb-6',
      className
    )}>
      <div className="flex-1">
        {/* Back button */}
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 text-muted-foreground"
            onClick={onBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {backText}
          </Button>
        )}
        
        {/* Title and subtitle */}
        <div>
          <h1 className={cn(
            'text-2xl font-semibold tracking-tight',
            compact && 'text-xl',
            titleClassName
          )}>
            {title}
          </h1>
          {subtitle && (
            <p className={cn(
              'text-muted-foreground mt-1',
              compact ? 'text-sm' : 'text-base'
            )}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Actions area */}
      <div className={cn(
        'flex flex-wrap items-center gap-2',
        actionsClassName
      )}>
        {actions}
        
        {/* Primary action button */}
        {primaryActionText && onPrimaryAction && (
          <Button onClick={onPrimaryAction} size={compact ? 'sm' : 'default'}>
            {primaryActionIcon || <Plus className="mr-2 h-4 w-4" />}
            {primaryActionText}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResourceHeader; 