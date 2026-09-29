import { OfflineMutation } from '../types';

const DB_NAME = 'agrisupply_offline_db';
const STORE_NAME = 'mutations';
const STORAGE_KEY = 'agrisupply_fallback_mutations';

class OfflineStorageEngine {
  private db: IDBDatabase | null = null;
  private isOnlineState: boolean = true;
  private listeners: Set<(mutations: OfflineMutation[], isOnline: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnlineState = navigator.onLine;
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      this.initIndexedDB();
    }
  }

  private async initIndexedDB(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) return;

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve();
        };
        request.onerror = () => {
          console.warn('IndexedDB unavailable, falling back to LocalStorage');
          resolve();
        };
      } catch (err) {
        console.warn('IndexedDB initialization failed:', err);
        resolve();
      }
    });
  }

  public subscribe(callback: (mutations: OfflineMutation[], isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    // Initial emit
    this.getQueuedMutations().then((mutations) => {
      callback(mutations, this.isOnlineState);
    });
    return () => {
      this.listeners.delete(callback);
    };
  }

  private async notifyListeners(): Promise<void> {
    const mutations = await this.getQueuedMutations();
    for (const listener of this.listeners) {
      listener(mutations, this.isOnlineState);
    }
  }

  public isOnline(): boolean {
    return this.isOnlineState;
  }

  /**
   * Allows manual simulation of cellular disconnect for live testing / demo
   */
  public setSimulatedNetworkState(online: boolean): void {
    this.isOnlineState = online;
    this.notifyListeners();
  }

  private handleNetworkChange(online: boolean): void {
    this.isOnlineState = online;
    this.notifyListeners();
    if (online) {
      this.syncQueuedMutations();
    }
  }

  /**
   * Queue a local mutation when remote nodes lack connectivity
   */
  public async queueMutation(
    type: OfflineMutation['type'],
    payload: Record<string, unknown>,
    description: string,
    category: OfflineMutation['category'] = 'FORM_SUBMISSION'
  ): Promise<OfflineMutation> {
    const mutation: OfflineMutation = {
      id: `MUT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      category,
      type,
      payload,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
      status: 'PENDING',
      description
    };

    if (this.db) {
      await new Promise<void>((resolve, reject) => {
        try {
          const tx = this.db!.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(mutation);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        } catch (e) {
          reject(e);
        }
      }).catch(() => {
        this.saveFallback(mutation);
      });
    } else {
      this.saveFallback(mutation);
    }

    await this.notifyListeners();
    return mutation;
  }

  private saveFallback(mutation: OfflineMutation): void {
    try {
      const existing = this.getFallback();
      existing.push(mutation);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }

  private getFallback(): OfflineMutation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public async getQueuedMutations(): Promise<OfflineMutation[]> {
    if (this.db) {
      return new Promise<OfflineMutation[]>((resolve) => {
        try {
          const tx = this.db!.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const request = store.getAll();
          request.onsuccess = () => {
            const list = (request.result as OfflineMutation[]) || [];
            // Merge with fallback if any
            const fallback = this.getFallback();
            const combined = [...list, ...fallback.filter((f) => !list.some((l) => l.id === f.id))];
            resolve(combined);
          };
          request.onerror = () => resolve(this.getFallback());
        } catch {
          resolve(this.getFallback());
        }
      });
    }
    return this.getFallback();
  }

  /**
   * Synchronize queued mutations to server or state
   */
  public async syncQueuedMutations(
    onProcessed?: (mutation: OfflineMutation) => void
  ): Promise<{ syncedCount: number; errors: number }> {
    const mutations = await this.getQueuedMutations();
    if (mutations.length === 0) return { syncedCount: 0, errors: 0 };

    let syncedCount = 0;
    let errors = 0;

    for (const mut of mutations) {
      try {
        // Mark as syncing
        mut.status = 'SYNCING';
        // Simulate network processing latency
        await new Promise((r) => setTimeout(r, 450));

        // Call callback if provided to update in-memory state
        if (onProcessed) {
          onProcessed(mut);
        }

        // Delete from store upon successful commit
        await this.deleteMutation(mut.id);
        syncedCount++;
      } catch (err) {
        errors++;
        mut.retryCount += 1;
        mut.status = 'FAILED';
        console.error('Failed to sync mutation:', mut.id, err);
      }
    }

    await this.notifyListeners();
    return { syncedCount, errors };
  }

  public async deleteMutation(id: string): Promise<void> {
    if (this.db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = this.db!.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.delete(id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
    // Also remove from fallback
    const fallback = this.getFallback().filter((m) => m.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    } catch {
      // ignore
    }
  }

  public async clearAll(): Promise<void> {
    if (this.db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = this.db!.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    await this.notifyListeners();
  }
}

export const offlineStorage = new OfflineStorageEngine();
