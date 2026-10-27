"use client";

import { useEffect } from 'react';
import { syncUserFromCloud } from '@/app/lib/userSync';

export default function UserSyncManager() {
  useEffect(() => {
    // 1. Initial sync on page mount
    syncUserFromCloud();

    // 2. Real-time sync when user switches tab or unlocks device
    const handleSync = () => {
      syncUserFromCloud();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncUserFromCloud();
      }
    };

    window.addEventListener('focus', handleSync);
    window.addEventListener('auth-changed', handleSync);
    document.addEventListener('visibilitychange', handleVisibility);

    // 3. Periodic background check every 45 seconds if tab is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncUserFromCloud();
      }
    }, 45000);

    return () => {
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('auth-changed', handleSync);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  return null;
}
