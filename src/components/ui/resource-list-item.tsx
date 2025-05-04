import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ResourceListItemProps {
  /** The primary title text */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Right-aligned value or status display */
  value?: ReactNode;
  /** Additional badges or tags to display */
  badges?: ReactNode;
  /** Timestamp or date information */
  timestamp?: string;
  /** Custom CSS classes */
  className?: string;
  /** Primary action when clicking the item */
  onClick?: () => void;
  /** Whether the item is currently selected */
  isSelected?: boolean;
  /** Whether the item is currently disabled */
  isDisabled?: boolean;
  /** An icon or avatar to display on the left */
  icon?: ReactNode;
  /** Optional right action buttons */
  actions?: ReactNode;
  /** Additional contextual information */
  metadata?: Record<string, string>;
  /** Element to render for the item (default: button if onClick provided, otherwise div) */
  as?: 'div' | 'button' | 'li';
}

/**
 * A reusable list item component for displaying resources in a list
 * 
 * @example
 * // Basic usage
 * <ResourceListItem
 *   title="Cash Account"
 *   subtitle="Asset account - USD"
 *   value="$1,250.00"
 *   onClick={() => selectAccount(account.id)}
 * />
 * 
 * // With badges and actions
 * <ResourceListItem
 *   title="Quarterly Revenue Report"
 *   subtitle="Created by John Doe"
 *   timestamp="2023-06-19"
 *   badges={<Badge>Draft</Badge>}
 *   actions={
 *     <Button variant="ghost" size="sm">
 *       <Pencil className="h-4 w-4" />
 *     </Button>
 *   }
 * />
 */
const ResourceListItem: React.FC<ResourceListItemProps> = ({
  title,
  subtitle,
  value,
  badges,
  timestamp,
  className = '',
  onClick,
  isSelected = false,
  isDisabled = false,
  icon,
  actions,
  metadata,
  as
}) => {
  // Determine the element type
  const Element = as || (onClick ? 'button' : 'div');

  // Base props shared by all element types
  const baseProps = {
    className: cn(
      'w-full text-left px-4 py-3 flex items-center gap-3 border-b last:border-b-0',
      'transition-colors duration-200',
      isSelected && 'bg-muted/50',
      onClick && !isDisabled && 'hover:bg-muted/30 cursor-pointer',
      isDisabled && 'opacity-60 cursor-not-allowed',
      className
    ),
    onClick: isDisabled ? undefined : onClick,
    disabled: isDisabled,
  };

  // Add type property only for button elements
  const buttonProps = Element === 'button' 
    ? { ...baseProps, type: 'button' as 'button' } 
    : baseProps;

  return (
    <Element {...buttonProps}>
      {/* Left icon/avatar */}
      {icon && (
        <div className="flex-shrink-0">
          {icon}
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          {/* Title and subtitle */}
          <div className="truncate">
            <div className="font-medium text-sm truncate">{title}</div>
            {subtitle && (
              <div className="text-muted-foreground text-xs truncate">{subtitle}</div>
            )}
            {timestamp && (
              <div className="text-muted-foreground text-xs mt-1">{timestamp}</div>
            )}
            {metadata && Object.keys(metadata).length > 0 && (
              <div className="text-xs mt-1 space-x-3">
                {Object.entries(metadata).map(([key, value]) => (
                  <span key={key} className="text-muted-foreground">
                    <span className="font-medium">{key}:</span> {value}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Value display */}
          {value && (
            <div className="ml-2 flex-shrink-0 text-sm font-medium">
              {value}
            </div>
          )}
        </div>

        {/* Badges area */}
        {badges && (
          <div className="mt-1 space-x-1">
            {badges}
          </div>
        )}
      </div>

      {/* Right actions */}
      {actions && (
        <div className="flex-shrink-0 ml-2 flex items-center">
          {actions}
        </div>
      )}
    </Element>
  );
};

export default ResourceListItem; 