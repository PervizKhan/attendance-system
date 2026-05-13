// app/components/HealthCheck.tsx
'use client';

import { useEffect } from 'react';

export function HealthCheck() {
  useEffect(() => {
    const pingInterval = setInterval(async () => {
      try {
        await fetch('/api/health');
      } catch (error) {
        console.error('Health check failed');
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(pingInterval);
  }, []);

  return null;
}