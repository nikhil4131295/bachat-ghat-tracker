import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { Group, Member, Loan, Transaction, UserRole, GroupSummary } from '../types';
import { db, seedDemoDataToIndexedDB } from '../lib/db';
import { DEMO_GROUP_ID } from '../lib/demoData';
import { calculateGroupTotals, generateGroupCode, generatePassbookToken, splitLoanRepayment, getMemberActiveLoanInfo } from '../lib/calculations';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { subscribeSyncStatus, syncNow as syncLibNow, refreshPendingCount, initSyncEngine, type SyncState } from '../lib/sync';

export type NavigationTab = 'home' | 'members' | 'add' | 'loans' | 'reports' | 'settings';

interface AppContextType {
  currentGroup: Group | null;
  members: Member[];
  loans: Loan[];
  transactions: Transaction[];
  summary: GroupSummary;
  userRole: UserRole | null;
  isDemo: boolean;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  setUserRole: (role: UserRole | null) => void;
  startDemoMode: () => Promise<void>;
  exitDemoMode: () => void;
  setupNewGroup: (groupInfo: Omit<Group, 'id' | 'group_code' | 'created_at'>, initialMembers: string[]) => Promise<Group>;
  updateGroupDetails: (updates: Partial<Group>) => Promise<void>;
  addMember: (name: string, phone?: string) => Promise<Member>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  toggleMemberActive: (id: string) => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'created_at' | 'deleted_at'>) => Promise<Transaction>;
  softDeleteTransaction: (id: string) => Promise<void>;
  undoDeleteTransaction: (id: string) => Promise<void>;
  lastDeletedTxnId: string | null;
  refreshData: () => Promise<void>;
  isLoading: boolean;
  syncState: SyncState;
  handleManualSync: () => Promise<{ success: boolean; syncedCount: number; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastDeletedTxnId, setLastDeletedTxnId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    return (localStorage.getItem('bg_user_role') as UserRole) || null;
  });
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    return localStorage.getItem('bg_is_demo') === 'true';
  });
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncState, setSyncState] = useState<SyncState>({
    status: navigator.onLine ? 'online' : 'offline',
    pendingCount: 0,
    lastSyncTime: localStorage.getItem('bg_last_sync_time') || null,
    errorMessage: null,
  });

  // Subscribe to sync state & network events
  useEffect(() => {
    initSyncEngine(() => currentGroup?.id);
    const unsubscribe = subscribeSyncStatus(state => {
      setSyncState(state);
    });
    refreshPendingCount();
    return () => unsubscribe();
  }, [currentGroup?.id]);

  // Helper to migrate legacy 'Khairi' default to 'Yerla'
  const migrateGroupVillageIfNeeded = async (grp: Group): Promise<Group> => {
    if (grp.village && (grp.village.includes('Khairi') || grp.village.includes('खैरी'))) {
      const updatedVillage = grp.village
        .replace(/खैरी\s*\(Khairi\)/g, 'येरला (Yerla)')
        .replace(/खैरी/g, 'येरला')
        .replace(/Khairi/g, 'Yerla');
      const updatedPanchayat = (grp.panchayat || '')
        .replace(/खैरी\s*ग्रामपंचायत\s*\(Khairi Gram Panchayat\)/g, 'येरला ग्रामपंचायत (Yerla Gram Panchayat)')
        .replace(/खैरी\s*ग्रामपंचायत/g, 'येरला ग्रामपंचायत')
        .replace(/खैरी/g, 'येरला')
        .replace(/Khairi/g, 'Yerla');

      const updatedGroup: Group = {
        ...grp,
        village: updatedVillage,
        panchayat: updatedPanchayat,
      };

      await db.groups.put(updatedGroup);

      if (isSupabaseConfigured() && grp.id !== DEMO_GROUP_ID) {
        try {
          await supabase.from('groups').update({
            village: updatedVillage,
            panchayat: updatedPanchayat,
          }).eq('id', grp.id);
        } catch (e) {
          console.warn('Could not sync migrated village to Supabase:', e);
        }
      }
      return updatedGroup;
    }
    return grp;
  };

  // Initialize data
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        if (isDemo) {
          await loadDemoData();
        } else {
          // If Supabase is configured, check if we have a group there
          if (isSupabaseConfigured()) {
            try {
              const { data: remoteGroups } = await supabase.from('groups').select('*').limit(1);
              if (remoteGroups && remoteGroups.length > 0) {
                const grp = await migrateGroupVillageIfNeeded(remoteGroups[0] as Group);
                setCurrentGroup(grp);
                await db.groups.put(grp);
                await syncGroupFromRemote(grp.id);
                setIsLoading(false);
                return;
              }
            } catch (err) {
              console.warn('Remote fetch failed, falling back to local DB:', err);
            }
          }

          // Otherwise check local IndexedDB
          const savedGroups = await db.groups.toArray();
          const nonDemo = savedGroups.find(g => g.id !== DEMO_GROUP_ID);
          if (nonDemo) {
            const migrated = await migrateGroupVillageIfNeeded(nonDemo);
            setCurrentGroup(migrated);
            await loadGroupData(migrated.id);
          }
        }
      } catch (err) {
        console.error('Error initializing app data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [isDemo]);

  // Sync group data from Supabase
  const syncGroupFromRemote = async (groupId: string) => {
    try {
      const [mRes, lRes, tRes] = await Promise.all([
        supabase.from('members').select('*').eq('group_id', groupId),
        supabase.from('loans').select('*').eq('group_id', groupId),
        supabase.from('transactions').select('*').eq('group_id', groupId).order('entry_date', { ascending: false }),
      ]);

      if (mRes.data) {
        setMembers(mRes.data as Member[]);
        await db.members.bulkPut(mRes.data as Member[]);
      }
      if (lRes.data) {
        setLoans(lRes.data as Loan[]);
        await db.loans.bulkPut(lRes.data as Loan[]);
      }
      if (tRes.data) {
        setTransactions(tRes.data as Transaction[]);
        await db.transactions.bulkPut(tRes.data as Transaction[]);
      }
    } catch (err) {
      console.error('Error syncing from remote:', err);
    }
  };

  // Load demo data helper
  const loadDemoData = async () => {
    await seedDemoDataToIndexedDB();
    const group = await db.groups.get(DEMO_GROUP_ID);
    if (group) {
      const migrated = await migrateGroupVillageIfNeeded(group);
      setCurrentGroup(migrated);
      await loadGroupData(DEMO_GROUP_ID);
    }
  };

  // Load from IndexedDB
  const loadGroupData = async (groupId: string) => {
    const groupMembers = await db.members.where('group_id').equals(groupId).toArray();
    const groupLoans = await db.loans.where('group_id').equals(groupId).toArray();
    const groupTxns = await db.transactions.where('group_id').equals(groupId).toArray();

    setMembers(groupMembers);
    setLoans(groupLoans);
    setTransactions(groupTxns.sort((a, b) => (b.entry_date > a.entry_date ? 1 : -1)));
  };

  // Start Demo Mode
  const startDemoMode = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('bg_is_demo', 'true');
      localStorage.setItem('bg_user_role', 'treasurer');
      setUserRole('treasurer');
      setIsDemo(true);
      await loadDemoData();
      setActiveTab('home');
    } finally {
      setIsLoading(false);
    }
  };

  // Exit Demo Mode
  const exitDemoMode = () => {
    localStorage.removeItem('bg_is_demo');
    localStorage.removeItem('bg_user_role');
    setIsDemo(false);
    setUserRole(null);
    setCurrentGroup(null);
    setMembers([]);
    setLoans([]);
    setTransactions([]);
    setActiveTab('home');
  };

  // Setup New Group
  const setupNewGroup = async (
    groupInfo: Omit<Group, 'id' | 'group_code' | 'created_at'>,
    initialMemberNames: string[]
  ): Promise<Group> => {
    setIsLoading(true);
    try {
      const newGroupId = crypto.randomUUID();
      const code = generateGroupCode(groupInfo.name.slice(0, 2) || 'BG');

      const newGroup: Group = {
        ...groupInfo,
        id: newGroupId,
        group_code: code,
        created_at: new Date().toISOString(),
      };

      await db.groups.put(newGroup);

      const newMembers: Member[] = initialMemberNames
        .filter(n => n.trim().length > 0)
        .map(name => ({
          id: crypto.randomUUID(),
          group_id: newGroupId,
          name: name.trim(),
          passbook_token: generatePassbookToken(),
          is_active: true,
          joined_date: groupInfo.started_date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
        }));

      if (newMembers.length > 0) {
        await db.members.bulkPut(newMembers);
      }

      // Sync to Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('groups').insert([{
            id: newGroup.id,
            name: newGroup.name,
            village: newGroup.village,
            panchayat: newGroup.panchayat,
            started_date: newGroup.started_date,
            monthly_saving_amount: newGroup.monthly_saving_amount,
            monthly_interest_rate: newGroup.monthly_interest_rate,
            monthly_late_fine: newGroup.monthly_late_fine,
            meeting_day: newGroup.meeting_day,
            group_code: newGroup.group_code,
          }]);

          if (newMembers.length > 0) {
            await supabase.from('members').insert(newMembers);
          }
        } catch (syncErr) {
          console.warn('Supabase sync skipped, saved locally:', syncErr);
        }
      }

      setCurrentGroup(newGroup);
      setMembers(newMembers);
      setLoans([]);
      setTransactions([]);
      setUserRole('treasurer');
      localStorage.setItem('bg_user_role', 'treasurer');
      setActiveTab('home');

      return newGroup;
    } finally {
      setIsLoading(false);
    }
  };

  // Update Group details (e.g. Village, Panchayat, Name)
  const updateGroupDetails = async (updates: Partial<Group>): Promise<void> => {
    if (!currentGroup) return;
    const updated: Group = { ...currentGroup, ...updates };
    setCurrentGroup(updated);
    await db.groups.put(updated);

    if (isSupabaseConfigured() && currentGroup.id !== DEMO_GROUP_ID) {
      try {
        await supabase.from('groups').update(updates).eq('id', currentGroup.id);
      } catch (err) {
        console.warn('Group update queued locally:', err);
      }
    }
  };

  // Add Member
  const addMember = async (name: string, phone?: string): Promise<Member> => {
    if (!currentGroup) throw new Error('No active group');

    const newMember: Member = {
      id: crypto.randomUUID(),
      group_id: currentGroup.id,
      name: name.trim(),
      phone: phone?.trim() || undefined,
      passbook_token: generatePassbookToken(),
      is_active: true,
      joined_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    await db.members.put(newMember);
    setMembers(prev => [...prev, newMember]);

    if (isSupabaseConfigured() && !isDemo) {
      try {
        await supabase.from('members').insert([newMember]);
      } catch (err) {
        console.warn('Member added locally:', err);
      }
    }

    return newMember;
  };

  // Update Member
  const updateMember = async (id: string, updates: Partial<Member>): Promise<void> => {
    await db.members.update(id, updates);
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));

    if (isSupabaseConfigured() && !isDemo) {
      try {
        await supabase.from('members').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Member update queued:', err);
      }
    }
  };

  // Toggle active
  const toggleMemberActive = async (id: string): Promise<void> => {
    const member = members.find(m => m.id === id);
    if (!member) return;
    await updateMember(id, { is_active: !member.is_active });
  };

  // Add Transaction with Loan Repayment Split and Loan Closing Check
  const addTransaction = async (
    data: Omit<Transaction, 'id' | 'created_at' | 'deleted_at'>
  ): Promise<Transaction> => {
    const newTxnId = crypto.randomUUID();
    let interestPart = data.interest_part || 0;
    let principalPart = data.principal_part || 0;
    let loanId = data.loan_id;

    // Handle Loan Repayment auto-split & loan status update
    if (data.type === 'loan_repayment' && data.member_id) {
      const loanInfo = getMemberActiveLoanInfo(
        data.member_id,
        loans,
        transactions,
        currentGroup?.monthly_interest_rate || 2.0
      );

      if (loanInfo.loan) {
        loanId = loanInfo.loan.id;
        const split = splitLoanRepayment(data.amount, loanInfo.interestDueThisMonth, loanInfo.pendingPrincipal);
        interestPart = split.interestPart;
        principalPart = split.principalPart;

        // If this payment fully pays off the principal, close the loan!
        if (split.isLoanFullyClosed) {
          const closedLoanUpdate = { status: 'closed' as const, closed_date: data.entry_date };
          await db.loans.update(loanInfo.loan.id, closedLoanUpdate);
          setLoans(prev => prev.map(l => (l.id === loanInfo.loan!.id ? { ...l, ...closedLoanUpdate } : l)));

          if (isSupabaseConfigured() && !isDemo) {
            try {
              await supabase.from('loans').update(closedLoanUpdate).eq('id', loanInfo.loan.id);
            } catch (err) {
              console.warn('Loan status update queued:', err);
            }
          }
        }
      }
    }

    // Handle Loan Given: create new loan record
    if (data.type === 'loan_given' && data.member_id) {
      const newLoanId = crypto.randomUUID();
      loanId = newLoanId;
      const newLoan: Loan = {
        id: newLoanId,
        group_id: data.group_id,
        member_id: data.member_id,
        principal_amount: data.amount,
        monthly_interest_rate: currentGroup?.monthly_interest_rate || 2.0,
        start_date: data.entry_date,
        purpose: (data.category as any) || 'Other',
        status: 'active',
      };
      await db.loans.put(newLoan);
      setLoans(prev => [newLoan, ...prev]);

      if (isSupabaseConfigured() && !isDemo) {
        try {
          await supabase.from('loans').insert([newLoan]);
        } catch (err) {
          console.warn('Loan given insert queued:', err);
        }
      }
    }

    let pending = false;
    if (!isDemo && isSupabaseConfigured()) {
      if (!navigator.onLine) {
        pending = true;
      } else {
        try {
          const { error: insertErr } = await supabase.from('transactions').insert([{
            id: newTxnId,
            group_id: data.group_id,
            member_id: data.member_id,
            type: data.type,
            amount: data.amount,
            interest_part: interestPart,
            principal_part: principalPart,
            loan_id: loanId,
            category: data.category,
            note: data.note,
            entry_date: data.entry_date,
          }]);
          if (insertErr) {
            console.warn('Supabase insert failed, queued for offline sync:', insertErr);
            pending = true;
          }
        } catch (err) {
          console.warn('Network error, queued for offline sync:', err);
          pending = true;
        }
      }
    }

    const newTxn: Transaction = {
      ...data,
      id: newTxnId,
      interest_part: interestPart,
      principal_part: principalPart,
      loan_id: loanId,
      created_at: new Date().toISOString(),
      deleted_at: null,
      is_pending_sync: pending,
    };

    // 1. Save to local IndexedDB
    await db.transactions.put(newTxn);
    setTransactions(prev => [newTxn, ...prev]);
    await refreshPendingCount();

    return newTxn;
  };

  // Soft Delete with 10-second Undo option
  const softDeleteTransaction = async (id: string): Promise<void> => {
    const deletedTime = new Date().toISOString();
    let pending = false;

    if (isSupabaseConfigured() && !isDemo) {
      if (!navigator.onLine) {
        pending = true;
      } else {
        try {
          const { error } = await supabase.from('transactions').update({ deleted_at: deletedTime }).eq('id', id);
          if (error) pending = true;
        } catch (err) {
          console.warn('Soft delete queued for offline sync:', err);
          pending = true;
        }
      }
    }

    await db.transactions.update(id, { deleted_at: deletedTime, is_pending_sync: pending });
    setTransactions(prev => prev.map(t => (t.id === id ? { ...t, deleted_at: deletedTime, is_pending_sync: pending } : t)));
    setLastDeletedTxnId(id);
    await refreshPendingCount();

    // Auto-clear undo state after 10 seconds
    setTimeout(() => {
      setLastDeletedTxnId(prev => (prev === id ? null : prev));
    }, 10000);
  };

  // Undo Delete
  const undoDeleteTransaction = async (id: string): Promise<void> => {
    let pending = false;

    if (isSupabaseConfigured() && !isDemo) {
      if (!navigator.onLine) {
        pending = true;
      } else {
        try {
          const { error } = await supabase.from('transactions').update({ deleted_at: null }).eq('id', id);
          if (error) pending = true;
        } catch (err) {
          console.warn('Undo delete queued for offline sync:', err);
          pending = true;
        }
      }
    }

    await db.transactions.update(id, { deleted_at: null, is_pending_sync: pending });
    setTransactions(prev => prev.map(t => (t.id === id ? { ...t, deleted_at: null, is_pending_sync: pending } : t)));
    setLastDeletedTxnId(null);
    await refreshPendingCount();
  };

  const handleManualSync = async () => {
    const result = await syncLibNow(currentGroup?.id);
    if (result.success && currentGroup) {
      await loadGroupData(currentGroup.id);
    }
    return result;
  };

  const refreshData = async () => {
    if (currentGroup) {
      await loadGroupData(currentGroup.id);
    }
  };

  const summary = useMemo(() => {
    const activeCount = members.filter(m => m.is_active).length;
    return calculateGroupTotals(transactions, loans, activeCount);
  }, [transactions, loans, members]);

  return (
    <AppContext.Provider
      value={{
        currentGroup,
        members,
        loans,
        transactions,
        summary,
        userRole,
        isDemo,
        activeTab,
        setActiveTab,
        setUserRole,
        startDemoMode,
        exitDemoMode,
        setupNewGroup,
        updateGroupDetails,
        addMember,
        updateMember,
        toggleMemberActive,
        addTransaction,
        softDeleteTransaction,
        undoDeleteTransaction,
        lastDeletedTxnId,
        refreshData,
        isLoading,
        syncState,
        handleManualSync,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
