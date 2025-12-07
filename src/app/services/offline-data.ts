import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PwaDB extends DBSchema {
  polls: {
    key: number;
    value: {
      pollId: number;
      title: string;
      description?: string;
      questions: any[]; // adapta al tipo real
      updatedAt?: string;
      fetchedAt: number;
      thumbnailRef?: string;
    };
    indexes: { 'by-fetchedAt': number };
  };
  attachments: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      mimeType: string;
      createdAt: number;
    };
  };
  offlineQueue: {
    key: string;
    value: {
      id: string;
      type: string;
      payload: any;
      createdAt: number;
      attempts: number;
      status: string; // 'pending' | 'processing' | 'failed' | 'done'
      lastError?: string | null;
    };
  };
  metadata: {
    key: string;
    value: any;
  };
}

@Injectable({ providedIn: 'root' })
export class OfflineData {
  private dbPromise: Promise<IDBPDatabase<PwaDB>>;

  constructor() {
    this.dbPromise = openDB<PwaDB>('pwa-db', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('polls')) {
          const s = db.createObjectStore('polls', { keyPath: 'pollId' });
          s.createIndex('by-fetchedAt', 'fetchedAt');
        }
        if (!db.objectStoreNames.contains('attachments')) {
          db.createObjectStore('attachments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('offlineQueue')) {
          db.createObjectStore('offlineQueue', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata');
        }
      }
    });
  }

  async savePoll(poll: any) {
    const db = await this.dbPromise;
    // normalize: server may return `id` or `pollId`
    const record = { ...poll, fetchedAt: Date.now() } as any;
    if (!record.pollId && record.id) record.pollId = record.id;
    await db.put('polls', record);
  }

  async savePolls(polls: any[]) {
    const db = await this.dbPromise;
    const tx = db.transaction('polls', 'readwrite');
    for (const p of polls) {
      const rec = { ...p, fetchedAt: Date.now() } as any;
      if (!rec.pollId && rec.id) rec.pollId = rec.id;
      tx.store.put(rec);
    }
    await tx.done;
  }

  async getPoll(pollId: number, maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
    const db = await this.dbPromise;
    const p = await db.get('polls', pollId);
    if (!p) return null;
    const age = Date.now() - p.fetchedAt;
    return { ...p, stale: age > maxAgeMs };
  }

  async getPolls(maxAgeMs = 24 * 60 * 60 * 1000) {
    const db = await this.dbPromise;
    const all = await db.getAll('polls');
    return all.map(p => ({ ...p, stale: (Date.now() - p.fetchedAt) > maxAgeMs }));
  }

  async cacheThumbnail(pollId: number, url: string) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) return;
      const blob = await resp.blob();
      const id = `thumb_${pollId}`;
      const db = await this.dbPromise;
      await db.put('attachments', { id, blob, mimeType: blob.type, createdAt: Date.now() });
      const poll = await db.get('polls', pollId);
      if (poll) {
        poll.thumbnailRef = id;
        await db.put('polls', poll);
      }
    } catch (e) {
      console.warn('cacheThumbnail error', e);
    }
  }

  async getThumbnailBlob(pollId: number) {
    const id = `thumb_${pollId}`;
    const db = await this.dbPromise;
    const rec = await db.get('attachments', id);
    return rec?.blob ?? null;
  }

  // --- offline queue methods ---
  async enqueueResponse(item: { type: string; payload: any }) {
    const db = await this.dbPromise;
    const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const record = {
      id,
      type: item.type,
      payload: item.payload,
      createdAt: Date.now(),
      attempts: 0,
      status: 'pending',
      lastError: null,
    } as any;
    await db.put('offlineQueue', record);
    return record;
  }

  async getPendingQueue(limit = 50) {
    const db = await this.dbPromise;
    const all = await db.getAll('offlineQueue');
    const pending = all.filter((i: any) => i.status === 'pending' || i.status === 'failed');
    // order by createdAt asc
    pending.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
    return pending.slice(0, limit);
  }

  async deleteQueueItem(id: string) {
    const db = await this.dbPromise;
    await db.delete('offlineQueue', id);
  }

  async updateQueueItem(item: any) {
    const db = await this.dbPromise;
    await db.put('offlineQueue', item);
  }

  /**
   * Procesa la cola usando la función sendFn(payload) que debe devolver una Promise.
   * Implementación simple: procesa items pendientes, actualiza intentos y elimina los que se envían correctamente.
   */
  async processQueue(sendFn: (payload: any) => Promise<any>, concurrency = 2) {
    const db = await this.dbPromise;
    const pending = await this.getPendingQueue(100);
    if (!pending || pending.length === 0) return;

    const toProcess = pending.slice(0, 100);
    const maxRetries = 5;

    const runWorker = async (item: any) => {
      try {
        item.status = 'processing';
        await db.put('offlineQueue', item);

        await sendFn(item.payload);

        // éxito: eliminar de la cola
        await db.delete('offlineQueue', item.id);
        return;
      } catch (err: any) {
        // actualizar intentos y error
        item.attempts = (item.attempts || 0) + 1;
        item.lastError = err?.message ?? String(err);

        // si supera maxRetries -> marcar failed
        if (item.attempts > maxRetries) {
          item.status = 'failed';
          await db.put('offlineQueue', item);
          return;
        }

        // aplica backoff exponencial antes de reintentar (no bloquea todo, solo este worker)
        const backoffMs = Math.min((2 ** item.attempts) * 1000, 30000);
        await new Promise(res => setTimeout(res, backoffMs));

        // marcar pending y guardar
        item.status = 'pending';
        await db.put('offlineQueue', item);

        // intentar reintento una vez tras backoff
        try {
          item.status = 'processing';
          await db.put('offlineQueue', item);
          await sendFn(item.payload);
          await db.delete('offlineQueue', item.id);
          return;
        } catch (err2: any) {
          item.attempts = (item.attempts || 0) + 1;
          item.lastError = err2?.message ?? String(err2);
          if (item.attempts > maxRetries) {
            item.status = 'failed';
          } else {
            item.status = 'pending';
          }
          await db.put('offlineQueue', item);
          return;
        }
      }
    };

    const batches: Promise<any>[] = [];
    for (let i = 0; i < toProcess.length; i += concurrency) {
      const chunk = toProcess.slice(i, i + concurrency);
      batches.push(Promise.all(chunk.map(runWorker)));
    }

    await Promise.all(batches);
  }

  async getPendingCount() {
    const db = await this.dbPromise;
    const all = await db.getAll('offlineQueue');
    return all.filter((i: any) => i.status === 'pending' || i.status === 'failed').length;
  }

  async clearOldPolls(keepDays = 30) {
    const db = await this.dbPromise;
    const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
    const all = await db.getAll('polls');
    const tx = db.transaction('polls', 'readwrite');
    for (const p of all) {
      if ((p.fetchedAt || 0) < cutoff) {
        tx.store.delete(p.pollId);
      }
    }
    await tx.done;
  }
}