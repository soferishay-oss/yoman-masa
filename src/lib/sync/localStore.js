import { openDB } from 'idb';

const DB_NAME = 'yoman-masa-db';
const DB_VERSION = 1;

export async function initDB() {
  if (typeof window === 'undefined') return null; // Only run on client
  
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for local entries (e.g. Journal, Tasks)
      if (!db.objectStoreNames.contains('entries')) {
        db.createObjectStore('entries', { keyPath: 'localId' });
      }
      
      // Queue for pending sync actions
      if (!db.objectStoreNames.contains('syncQueue')) {
        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('status', 'status');
      }
    },
  });
}

// Queue a new action to be synced with the server
export async function queueSyncAction(actionType, payload) {
  const db = await initDB();
  if (!db) return;
  
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  await store.add({
    actionType,
    payload,
    timestamp: Date.now(),
    status: 'pending'
  });
  await tx.done;
}

// Get all pending actions
export async function getPendingActions() {
  const db = await initDB();
  if (!db) return [];
  return db.getAllFromIndex('syncQueue', 'status', 'pending');
}

// Remove an action from the queue after successful sync
export async function removeSyncAction(id) {
  const db = await initDB();
  if (!db) return;
  const tx = db.transaction('syncQueue', 'readwrite');
  await tx.objectStore('syncQueue').delete(id);
  await tx.done;
}
