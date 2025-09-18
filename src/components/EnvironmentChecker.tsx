'use client';

import { useEffect } from 'react';
import { useToast } from '@/lib/contexts/ToastContext';

export function EnvironmentChecker() {
  const { addToast } = useToast();

  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) {
          const errorText = await response.text();

          if (errorText.includes('ZodError') || errorText.includes('Too small')) {
            addToast({
              type: 'error',
              title: 'Environment configuration error',
              message: '⨯ Error [ZodError]: Environment variables validation failed. Check console for details.',
            });
          } else {
            addToast({
              type: 'error',
              title: 'Environment configuration error',
              message: 'Environment configuration error detected.',
            });
          }
        }
      } catch (error) {
        console.warn('Environment check failed:', error);
      }
    };

    const timeoutId = setTimeout(checkEnvironment, 1000);

    return () => clearTimeout(timeoutId);
  }, [addToast]);

  return null;
}