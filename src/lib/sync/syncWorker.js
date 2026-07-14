import { getPendingActions, removeSyncAction } from './localStore';

export async function processSyncQueue() {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const pendingActions = await getPendingActions();
  if (pendingActions.length === 0) return;

  for (const action of pendingActions) {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      });

      if (response.ok) {
        await removeSyncAction(action.id);
      } else {
        console.error(`Failed to sync action ${action.id}:`, await response.text());
        // Handle specific errors like 401 (Unauthorized) here if needed
      }
    } catch (error) {
      console.error('Network error during sync:', error);
      break; // Stop processing on network error
    }
  }
}

// Setup network listeners
export function setupSyncListeners() {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('online', processSyncQueue);
  
  // Periodically process queue to ensure eventual consistency
  const interval = setInterval(processSyncQueue, 30000); // Every 30 seconds
  
  return () => {
    window.removeEventListener('online', processSyncQueue);
    clearInterval(interval);
  };
}
