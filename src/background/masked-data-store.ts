// src/background/masked-data-store.ts
/**
 * @file: masked-data-store.ts
 * @description: In-memory storage for masked data in Service Worker context
 * Isolated from web pages and protected from XSS attacks
 */

interface MaskedDataEntry {
  id: string;
  data: string;
  createdAt: number;
  expiresAt: number;
}

const EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes - shorter than before for security

class MaskedDataStore {
  private store: Map<string, MaskedDataEntry> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Store masked data in memory
   * @param id - Unique identifier for the masked data
   * @param data - Sensitive data to store (password, API key, etc)
   * @returns Promise that resolves when stored
   */
  set(id: string, data: string): Promise<void> {
    const now = Date.now();
    this.store.set(id, {
      id,
      data,
      createdAt: now,
      expiresAt: now + EXPIRATION_TIME,
    });
    console.log('✅ Masked data stored in Service Worker (expires in 5min)');
    return Promise.resolve();
  }

  /**
   * Retrieve masked data
   * @param id - Unique identifier for the masked data
   * @returns Promise resolving to data or null if not found/expired
   */
  async get(id: string): Promise<string | null> {
    const entry = this.store.get(id);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(id);
      console.log('⏰ Masked data expired, cleaned up');
      return null;
    }

    return entry.data;
  }

  /**
   * Delete masked data
   * @param id - Unique identifier
   */
  delete(id: string): void {
    this.store.delete(id);
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [id, entry] of this.store.entries()) {
        if (now > entry.expiresAt) {
          this.store.delete(id);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired masked data entries`);
      }
    }, 30000); // Check every 30 seconds
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export const maskedDataStore = new MaskedDataStore();
