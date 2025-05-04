import React from 'react';
import { AlertCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorDisplayProps {
  /** The error message to display */
  message: string;
  /** Optional error title */
  title?: string;
  /** Error severity level */
  severity?: ErrorSeverity;
  /** Optional callback when retry button is clicked */
  onRetry?: () => void;
  /** Whether to show a retry button */
  showRetry?: boolean;
  /** Custom CSS classes for the alert */
  className?: string;
  /** Whether to show the error icon */
  showIcon?: boolean;
}

/**
 * A standardized error display component
 * 
 * @example
 * // Basic usage
 * <ErrorDisplay message="Failed to load accounts" />
 * 
 * // With retry functionality
 * <ErrorDisplay 
 *   title="Connection Error" 
 *   message="Could not connect to the server" 
 *   severity="error"
 *   showRetry
 *   onRetry={() => fetchData()}
 * />
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  title,
  severity = 'error',
  onRetry,
  showRetry = false,
  className = '',
  showIcon = true,
}) => {
  const getVariant = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'destructive';
    }
  };

  const getIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const defaultTitle = () => {
    switch (severity) {
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Information';
      default:
        return 'Error';
    }
  };

  return (
    <Alert variant={getVariant(severity)} className={`my-4 ${className}`}>
      <div className="flex items-start">
        {showIcon && <div className="mr-2 mt-0.5">{getIcon(severity)}</div>}
        <div className="flex-1">
          {(title || severity !== 'info') && (
            <AlertTitle>{title || defaultTitle()}</AlertTitle>
          )}
          <AlertDescription className="mt-1">{message}</AlertDescription>
        </div>
        {showRetry && onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry} 
            className="ml-2 mt-1"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Retry
          </Button>
        )}
      </div>
    </Alert>
  );
};

export default ErrorDisplay; 