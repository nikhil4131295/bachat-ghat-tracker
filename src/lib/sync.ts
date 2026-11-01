import { db } from './db';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Transaction, Loan, Member } from '../types';

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'pending' | 'error';

export interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncTime: string | null;
  errorMessage?: string | null;
}

// Global state in-memory
let currentState: SyncState = {
  status: navigator.onLine ? 'online' : 'offline',
  pendingCount: 0,
  lastSyncTime: localStorage.getItem('bg_last_sync_time') || null,
  errorMessage: null,
};

const listeners = new Set<(state: SyncState) => void>();

function notify() {
  listeners.forEach(fn => fn({ ...currentState }));
}

/**
 * Subscribe to sync state changes
 */
export function subscribeSyncStatus(fn: (state: SyncState) => void): () => void {
  listeners.add(fn);
  fn({ ...currentState });
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Get current sync state snapshot
 */
export function getSyncState(): SyncState {
  return { ...currentState };
}

/**
 * Count how many transactions are pending sync to Supabase
 */
export async function refreshPendingCount(): Promise<number> {
  try {
    const pendingTxns = await db.transactions
      .filter(t => !!t.is_pending_sync)
      .count();
    
    currentState.pendingCount = pendingTxns;
    
    // Update status if currently online vs pending
    if (navigator.onLine && currentState.status !== 'syncing') {
      currentState.status = pendingTxns > 0 ? 'pending' : 'online';
    } else if (!navigator.onLine) {
      currentState.status = 'offline';
    }
    
    notify();
    return pendingTxns;
  } catch (err) {
    console.error('Failed to get pending count:', err);
    return 0;
  }
}

/**
 * Push all pending transactions and pull remote updates
 */
export async function syncNow(groupId?: string | null): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  if (!navigator.onLine) {
    currentState.status = 'offline';
    notify();
    return { success: false, syncedCount: 0, error: 'Offline' };
  }

  if (!isSupabaseConfigured()) {
    currentState.status = 'online';
    notify();
    return { success: true, syncedCount: 0 };
  }

  currentState.status = 'syncing';
  currentState.errorMessage = null;
  notify();

  let syncedCount = 0;

  try {
    // 1. Find all pending transactions in local DB
    const pendingTxns = await db.transactions
      .filter(t => !!t.is_pending_sync)
      .toArray();

    for (const txn of pendingTxns) {
      // Upsert transaction into Supabase
      const { error: upsertErr } = await supabase.from('transactions').upsert({
        id: txn.id,
        group_id: txn.group_id,
        member_id: txn.member_id,
        type: txn.type,
        amount: txn.amount,
        interest_part: txn.interest_part,
        principal_part: txn.principal_part,
        loan_id: txn.loan_id,
        category: txn.category,
        note: txn.note,
        entry_date: txn.entry_date,
        created_at: txn.created_at,
        deleted_at: txn.deleted_at,
      });

      if (upsertErr) {
        throw new Error(`Transaction ${txn.id} failed: ${upsertErr.message}`);
      }

      // Mark locally as synced
      await db.transactions.update(txn.id, { is_pending_sync: false });
      syncedCount++;
    }

    // 2. If a groupId is given, pull latest remote records to keep Dexie fresh
    if (groupId) {
      const [mRes, lRes, tRes] = await Promise.all([
        supabase.from('members').select('*').eq('group_id', groupId),
        supabase.from('loans').select('*').eq('group_id', groupId),
        supabase.from('transactions').select('*').eq('group_id', groupId).order('entry_date', { ascending: false }),
      ]);

      if (mRes.data && mRes.data.length > 0) {
        await db.members.bulkPut(mRes.data as Member[]);
      }
      if (lRes.data && lRes.data.length > 0) {
        await db.loans.bulkPut(lRes.data as Loan[]);
      }
      if (tRes.data && tRes.data.length > 0) {
        // Only overwrite items that are not pending sync locally
        const remoteTxns = tRes.data as Transaction[];
        const localPendingMap = new Set(
          (await db.transactions.filter(t => !!t.is_pending_sync).toArray()).map(t => t.id)
        );
        const toSave = remoteTxns.filter(t => !localPendingMap.has(t.id));
        if (toSave.length > 0) {
          await db.transactions.bulkPut(toSave);
        }
      }
    }

    const now = new Date().toISOString();
    currentState.status = 'online';
    currentState.pendingCount = 0;
    currentState.lastSyncTime = now;
    localStorage.setItem('bg_last_sync_time', now);
    notify();

    return { success: true, syncedCount };
  } catch (err: any) {
    console.error('Sync failed:', err);
    currentState.status = 'error';
    currentState.errorMessage = err.message || 'Sync error';
    await refreshPendingCount();
    notify();
    return { success: false, syncedCount, error: err.message };
  }
}

// Initialize online/offline event listeners
export function initSyncEngine(getGroupId?: () => string | null | undefined): void {
  window.addEventListener('online', () => {
    currentState.status = 'online';
    notify();
    // Auto-sync when coming back online
    const gid = getGroupId ? getGroupId() : null;
    syncNow(gid).catch(console.error);
  });

  window.addEventListener('offline', () => {
    currentState.status = 'offline';
    notify();
  });

  // Initial count
  refreshPendingCount();
}
