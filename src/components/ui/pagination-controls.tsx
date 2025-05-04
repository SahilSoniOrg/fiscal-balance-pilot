import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronRight } from 'lucide-react';

export interface PaginationControlsProps {
  /** Whether more data is available to load */
  hasMore: boolean;
  /** Whether data is currently being loaded */
  isLoading: boolean;
  /** Function to load more data */
  onLoadMore: () => void;
  /** Custom CSS classes */
  className?: string;
  /** The text to display in the load more button */
  loadMoreText?: string;
  /** The text to display when loading more data */
  loadingText?: string;
  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * A reusable pagination controls component for use with token-based pagination
 * 
 * @example
 * // Basic usage with usePaginatedData hook
 * const { 
 *   data, 
 *   isLoading, 
 *   isPaginationLoading, 
 *   hasMore, 
 *   loadMore 
 * } = usePaginatedData<Account>('/accounts', { dataKey: 'accounts' });
 * 
 * // In your JSX
 * return (
 *   <div>
 *     {data.map(account => <AccountItem key={account.id} account={account} />)}
 *     <PaginationControls 
 *       hasMore={hasMore} 
 *       isLoading={isPaginationLoading} 
 *       onLoadMore={loadMore} 
 *     />
 *   </div>
 * );
 */
const PaginationControls: React.FC<PaginationControlsProps> = ({
  hasMore,
  isLoading,
  onLoadMore,
  className = '',
  loadMoreText = 'Load More',
  loadingText = 'Loading...',
  variant = 'outline', 
  size = 'sm',
}) => {
  // Don't render anything if there's no more data to load
  if (!hasMore && !isLoading) {
    return null;
  }

  return (
    <div className={`flex justify-center pt-4 pb-2 ${className}`}>
      <Button
        variant={variant}
        size={size}
        onClick={onLoadMore}
        disabled={isLoading || !hasMore}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            {loadMoreText}
            <ChevronRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
};

export default PaginationControls; 