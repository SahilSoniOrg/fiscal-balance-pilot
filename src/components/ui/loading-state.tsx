import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  /** The loading message to display */
  message?: string;
  /** The size of the loading spinner (default: md) */
  size?: 'sm' | 'md' | 'lg';
  /** Custom CSS classes to apply to the loading container */
  className?: string;
  /** Whether to center the loading indicator in its container */
  centered?: boolean;
  /** Custom CSS classes to apply to the spinner */
  spinnerClassName?: string;
  /** Custom CSS classes to apply to the text */
  textClassName?: string;
}

/**
 * A reusable loading state component that displays a spinner and optional message
 * 
 * @example
 * // Simple usage
 * <LoadingState message="Loading accounts..." />
 * 
 * // Custom styling
 * <LoadingState 
 *   message="Processing data" 
 *   size="lg" 
 *   className="my-8" 
 *   spinnerClassName="text-blue-600" 
 * />
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  className = '',
  centered = true,
  spinnerClassName = '',
  textClassName = '',
}) => {
  // Define classes based on size
  const sizeClasses = {
    sm: {
      spinner: 'h-4 w-4',
      text: 'text-xs',
      container: 'p-2',
    },
    md: {
      spinner: 'h-5 w-5',
      text: 'text-sm',
      container: 'p-4',
    },
    lg: {
      spinner: 'h-8 w-8',
      text: 'text-base',
      container: 'p-6',
    },
  };

  const containerClasses = `
    ${centered ? 'flex justify-center items-center' : 'flex items-center'}
    ${sizeClasses[size].container}
    ${className}
  `;

  const spinnerClasses = `
    animate-spin
    ${sizeClasses[size].spinner}
    ${spinnerClassName || 'text-gray-500'}
  `;

  const textClasses = `
    ${message ? 'ml-2' : ''}
    ${sizeClasses[size].text}
    ${textClassName || 'text-gray-500'}
  `;

  return (
    <div className={containerClasses}>
      <Loader2 className={spinnerClasses} />
      {message && <span className={textClasses}>{message}</span>}
    </div>
  );
};

export default LoadingState; 