'use client';

import { useToast } from '@/lib/contexts/ToastContext';
import { useCallback } from 'react';

export function useErrorHandler() {
  const { showError, showSuccess, showWarning } = useToast();

  const handleError = useCallback((error: unknown, customTitle?: string) => {
    console.error('Error caught by error handler:', error);

    let title = customTitle || 'Error';
    let message = 'An unexpected error occurred';

    if (error instanceof Error) {
      title = customTitle || error.name || 'Error';
      message = error.message;

      if (error.message.includes('ZodError')) {
        title = 'Configuration Error';
        message = 'Invalid environment variables detected. Please check your .env configuration.';
      } else if (error.message.includes('ECONNREFUSED')) {
        title = 'Connection Error';
        message = 'Unable to connect to the database. Make sure PostgreSQL is running.';
      } else if (error.message.includes('Authentication')) {
        title = 'Authentication Error';
        message = 'Please check your authentication credentials.';
      } else if (error.message.includes('GitHub')) {
        title = 'GitHub Integration Error';
        message = 'Failed to connect with GitHub. Please check your GitHub App configuration.';
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    showError(title, message);
  }, [showError]);

  const handleSuccess = useCallback((message: string, title?: string) => {
    showSuccess(title || 'Success', message);
  }, [showSuccess]);

  const handleWarning = useCallback((message: string, title?: string) => {
    showWarning(title || 'Warning', message);
  }, [showWarning]);

  return {
    handleError,
    handleSuccess,
    handleWarning,
  };
}