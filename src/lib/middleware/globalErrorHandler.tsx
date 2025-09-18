'use client';

import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { useEffect } from 'react';

export function GlobalErrorHandler() {
  const { handleError } = useErrorHandler();

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      handleError(event.reason, 'Unhandled Promise Rejection');
    };

    const handleGlobalError = (event: ErrorEvent) => {
      handleError(event.error, 'JavaScript Error');
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [handleError]);

  return null;
}