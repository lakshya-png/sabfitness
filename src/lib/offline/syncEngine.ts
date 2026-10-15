import { db, type SyncQueueItem } from "@/lib/db/dexie";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export type SyncStatus = "online" | "offline" | "syncing" | "error";

class SyncEngine {
  private status: SyncStatus = typeof window !== "undefined" && navigator.onLine ? "online" : "offline";
  private listeners: Set<(status: SyncStatus, pendingCount: number) => void> = new Set();
  private isProcessing = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleNetworkChange(true));
      window.addEventListener("offline", () => this.handleNetworkChange(false));
    }
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public subscribe(callback: (status: SyncStatus, pendingCount: number) => void) {
    this.listeners.add(callback);
    this.notify();
    return () => {
      this.listeners.delete(callback);
    };
  }

  private async notify() {
    const pendingCount = await this.getPendingCount();
    for (const listener of this.listeners) {
      listener(this.status, pendingCount);
    }
  }

  public async getPendingCount(): Promise<number> {
    try {
      if (typeof window === "undefined") return 0;
      return await db.syncQueue.count();
    } catch {
      return 0;
    }
  }

  private async handleNetworkChange(isOnline: boolean) {
    this.status = isOnline ? "online" : "offline";
    await this.notify();
    if (isOnline) {
      await this.flushQueue();
    }
  }

  public async enqueue(
    table: SyncQueueItem["table"],
    action: SyncQueueItem["action"],
    payload: any
  ) {
    const item: SyncQueueItem = {
      id: `${table}_${payload.id || Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      table,
      action,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };

    try {
      await db.syncQueue.put(item);
    } catch (err) {
      console.warn("Could not save to IndexedDB syncQueue:", err);
    }

    await this.notify();

    if (this.status === "online") {
      await this.flushQueue();
    }
  }

  public async flushQueue() {
    if (this.isProcessing || !isSupabaseConfigured || !supabase) {
      return;
    }

    this.isProcessing = true;
    this.status = "syncing";
    await this.notify();

    try {
      const items = await db.syncQueue.orderBy("timestamp").limit(20).toArray();

      for (const item of items) {
        try {
          if (item.action === "insert" || item.action === "update") {
            const { error } = await supabase.from(item.table).upsert(item.payload);
            if (error) throw error;
          } else if (item.action === "delete") {
            const { error } = await supabase.from(item.table).delete().match({ id: item.payload.id });
            if (error) throw error;
          }

          // Successfully pushed, remove from queue
          await db.syncQueue.delete(item.id);
        } catch (err) {
          console.error(`Failed to sync item ${item.id}:`, err);
          await db.syncQueue.update(item.id, { retryCount: item.retryCount + 1 });
        }
      }

      this.status = "online";
    } catch (err) {
      console.error("Sync flush encountered an error:", err);
      this.status = "error";
    } finally {
      this.isProcessing = false;
      await this.notify();
    }
  }
}

export const syncEngine = new SyncEngine();
