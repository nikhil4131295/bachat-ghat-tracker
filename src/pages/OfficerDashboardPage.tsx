import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  ShieldCheck,
  Search,
  Plus,
  FileSpreadsheet,
  Users,
  Wallet,
  Landmark,
  Calendar,
  LogOut,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../lib/db';
import { DEMO_GROUP, DEMO_MEMBERS, DEMO_LOANS, DEMO_TRANSACTIONS } from '../lib/demoData';
import { formatINR, calculateGroupTotals } from '../lib/calculations';
import { exportFullGroupReport, exportMonthlyReport } from '../lib/excel';
import { useApp } from '../context/AppContext';
import type { Group, Member, Loan, Transaction, GroupSummary } from '../types';

interface MonitoredGroup {
  group: Group;
  members: Member[];
  loans: Loan[];
  transactions: Transaction[];
  summary: GroupSummary;
}

export const OfficerDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { setUserRole, exitDemoMode } = useApp();

  const [monitoredGroups, setMonitoredGroups] = useState<MonitoredGroup[]>([]);
  const [groupCodeInput, setGroupCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<MonitoredGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load monitored groups
  useEffect(() => {
    async function loadGroups() {
      setIsLoading(true);
      try {
        const groupsList: MonitoredGroup[] = [];

        // 1. Try fetching from Supabase if online
        if (isSupabaseConfigured() && navigator.onLine) {
          try {
            const { data: dbGroups } = await supabase.from('groups').select('*');
            if (dbGroups && dbGroups.length > 0) {
              for (const grp of dbGroups as Group[]) {
                const [mRes, lRes, tRes] = await Promise.all([
                  supabase.from('members').select('*').eq('group_id', grp.id),
                  supabase.from('loans').select('*').eq('group_id', grp.id),
                  supabase.from('transactions').select('*').eq('group_id', grp.id),
                ]);

                const mems = (mRes.data || []) as Member[];
                const loans = (lRes.data || []) as Loan[];
                const txns = (tRes.data || []) as Transaction[];
                const activeCount = mems.filter(m => m.is_active).length;
                const summary = calculateGroupTotals(txns, loans, activeCount);

                groupsList.push({
                  group: grp,
                  members: mems,
                  loans,
                  transactions: txns,
                  summary,
                });
              }
            }
          } catch (netErr) {
            console.warn('Supabase fetch failed, falling back to local DB:', netErr);
          }
        }

        // 2. Fallback to local IndexedDB
        if (groupsList.length === 0) {
          const localGroups = await db.groups.toArray();
          for (const grp of localGroups) {
            const mems = await db.members.where('group_id').equals(grp.id).toArray();
            const loans = await db.loans.where('group_id').equals(grp.id).toArray();
            const txns = await db.transactions.where('group_id').equals(grp.id).toArray();
            const activeCount = mems.filter(m => m.is_active).length;
            const summary = calculateGroupTotals(txns, loans, activeCount);

            groupsList.push({
              group: grp,
              members: mems,
              loans,
              transactions: txns,
              summary,
            });
          }
        }

        // 3. If still empty, include demo group
        if (groupsList.length === 0) {
          const activeCount = DEMO_MEMBERS.filter(m => m.is_active).length;
          const summary = calculateGroupTotals(DEMO_TRANSACTIONS, DEMO_LOANS, activeCount);
          groupsList.push({
            group: DEMO_GROUP,
            members: DEMO_MEMBERS,
            loans: DEMO_LOANS,
            transactions: DEMO_TRANSACTIONS,
            summary,
          });
        }

        setMonitoredGroups(groupsList);
      } catch (err) {
        console.error('Failed to load officer groups:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadGroups();
  }, []);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = groupCodeInput.trim().toUpperCase();
    if (!code) return;

    setIsJoining(true);
    setJoinError(null);
    setJoinSuccess(null);

    try {
      // 1. Check if already in list
      if (monitoredGroups.some(g => g.group.group_code === code)) {
        setJoinError('हा गट आधीच तुमच्या यादीत जोडलेला आहे.');
        setIsJoining(false);
        return;
      }

      // 2. Look in Supabase
      if (isSupabaseConfigured() && navigator.onLine) {
        const { data: grpData, error: grpErr } = await supabase
          .from('groups')
          .select('*')
          .eq('group_code', code)
          .single();

        if (grpData && !grpErr) {
          const grp = grpData as Group;
          const [mRes, lRes, tRes] = await Promise.all([
            supabase.from('members').select('*').eq('group_id', grp.id),
            supabase.from('loans').select('*').eq('group_id', grp.id),
            supabase.from('transactions').select('*').eq('group_id', grp.id),
          ]);

          const mems = (mRes.data || []) as Member[];
          const loans = (lRes.data || []) as Loan[];
          const txns = (tRes.data || []) as Transaction[];
          const activeCount = mems.filter(m => m.is_active).length;
          const summary = calculateGroupTotals(txns, loans, activeCount);

          setMonitoredGroups(prev => [
            { group: grp, members: mems, loans, transactions: txns, summary },
            ...prev,
          ]);

          setJoinSuccess(`'${grp.name}' गट यशस्वीरीत्या जोडला गेला!`);
          setGroupCodeInput('');
          setIsJoining(false);
          return;
        }
      }

      // 3. Look in local DB
      const localGrp = await db.groups.where('group_code').equals(code).first();
      if (localGrp) {
        const mems = await db.members.where('group_id').equals(localGrp.id).toArray();
        const loans = await db.loans.where('group_id').equals(localGrp.id).toArray();
        const txns = await db.transactions.where('group_id').equals(localGrp.id).toArray();
        const activeCount = mems.filter(m => m.is_active).length;
        const summary = calculateGroupTotals(txns, loans, activeCount);

        setMonitoredGroups(prev => [
          { group: localGrp, members: mems, loans, transactions: txns, summary },
          ...prev,
        ]);

        setJoinSuccess(`'${localGrp.name}' गट यशस्वीरीत्या जोडला गेला!`);
        setGroupCodeInput('');
        setIsJoining(false);
        return;
      }

      setJoinError('हा गट कोड सापडला नाही. कृपया खजिनदाराने दिलेला ६-अक्षरी कोड तपासा.');
    } catch (err: any) {
      setJoinError('गट जोडताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleExportGroupExcel = (mg: MonitoredGroup) => {
    exportFullGroupReport(mg.group, mg.members, mg.loans, mg.transactions);
  };

  const handleSwitchToTreasurer = () => {
    localStorage.setItem('bg_user_role', 'treasurer');
    setUserRole('treasurer');
  };

  return (
    <div className="min-h-screen bg-background pb-12 selection:bg-teal-light selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-surface border border-teal-light/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-teal-dark" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-base text-teal-dark leading-tight truncate">
                ग्रामपंचायत अधिकारी पोर्टल
              </h1>
              <p className="text-xs text-muted font-medium truncate">
                बचत गट निरीक्षण व अहवाल प्रणाली
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSwitchToTreasurer}
              className="px-3 py-1.5 rounded-xl bg-teal-surface border border-teal-light/30 text-xs font-bold text-teal-dark hover:bg-teal-100 transition-colors shadow-2xs"
            >
              खजिनदार मोड
            </button>
            <button
              type="button"
              onClick={exitDemoMode}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-gray-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* 1. Join Group by 6-Character Code Card */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-teal-dark font-heading font-bold text-sm">
            <Plus className="w-4 h-4 text-teal-primary" />
            <span>नवीन बचत गट जोडा (Group Code)</span>
          </div>

          <p className="text-xs text-muted">
            बचत गट खजिनदाराने दिलेला ६-अक्षरी कोड (उदा. <strong>JB0001</strong>) येथे टाका:
          </p>

          <form onSubmit={handleJoinByCode} className="flex gap-2">
            <input
              type="text"
              value={groupCodeInput}
              onChange={e => setGroupCodeInput(e.target.value.toUpperCase())}
              placeholder="उदा. JB0001"
              maxLength={8}
              className="flex-1 min-h-touch px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-mono font-bold tracking-widest text-center uppercase focus:ring-2 focus:ring-teal-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={isJoining || !groupCodeInput.trim()}
              className="min-h-touch px-5 py-2.5 rounded-2xl bg-teal-primary hover:bg-teal-hover active:scale-95 disabled:opacity-50 text-white font-heading font-bold text-xs shadow-xs transition-all"
            >
              {isJoining ? 'शोधत आहे...' : 'जोडा'}
            </button>
          </form>

          {joinSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{joinSuccess}</span>
            </div>
          )}

          {joinError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{joinError}</span>
            </div>
          )}
        </div>

        {/* 2. Monitored Groups Header */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="font-heading font-extrabold text-base text-teal-dark">
            निरीक्षणातील बचत गट ({monitoredGroups.length})
          </h2>
          <span className="text-xs text-muted font-medium">
            गावनिहाय गट यादी
          </span>
        </div>

        {/* 3. Monitored Groups Cards */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted animate-pulse">
            गटांची माहिती लोड होत आहे...
          </div>
        ) : monitoredGroups.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 text-muted text-xs">
            अद्याप कोणताही गट जोडलेला नाही. वरील बॉक्समध्ये गट कोड टाकून गट जोडा.
          </div>
        ) : (
          <div className="space-y-3">
            {monitoredGroups.map(mg => {
              const activeMembers = mg.members.filter(m => m.is_active).length;
              const activeLoans = mg.loans.filter(l => l.status === 'active').length;

              return (
                <div
                  key={mg.group.id}
                  className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-3 transition-all hover:border-teal-light/40"
                >
                  {/* Top: Name & Group Code */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-base text-foreground truncate">
                          {mg.group.name.split('(')[0].trim()}
                        </h3>
                        <span className="px-2 py-0.5 rounded-lg bg-teal-surface text-teal-dark text-2xs font-mono font-bold border border-teal-light/20 shrink-0">
                          {mg.group.group_code}
                        </span>
                      </div>
                      <p className="text-xs text-muted font-medium pt-0.5">
                        {mg.group.village} {mg.group.panchayat ? `• ${mg.group.panchayat}` : ''}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedGroup(mg)}
                      className="px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-teal-50 text-xs font-bold text-teal-dark border border-gray-200 flex items-center gap-1 shadow-2xs"
                    >
                      <span>तपशील</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 3 Mini KPI indicators */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2.5 rounded-2xl bg-pastel-mint/80 border border-emerald-100">
                      <p className="text-[10px] text-teal-800 font-bold uppercase">एकूण बचत</p>
                      <p className="font-heading font-extrabold text-sm text-teal-dark pt-0.5">
                        {formatINR(mg.summary.totalSavings)}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-pastel-peach/80 border border-orange-100">
                      <p className="text-[10px] text-orange-800 font-bold uppercase">बाकी कर्ज</p>
                      <p className="font-heading font-extrabold text-sm text-coral-hover pt-0.5">
                        {formatINR(mg.summary.totalLoansOutstanding)}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-pastel-sky/80 border border-sky-100">
                      <p className="text-[10px] text-blue-800 font-bold uppercase">सदस्य संख्या</p>
                      <p className="font-heading font-extrabold text-sm text-blue-900 pt-0.5">
                        {activeMembers} महिला
                      </p>
                    </div>
                  </div>

                  {/* Quick Export Button */}
                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportGroupExcel(mg)}
                      className="w-full min-h-touch py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      <span>मास्टर अहवाल डाउनलोड (.xlsx)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Detailed Group Inspection Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-teal-light/20 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-base text-foreground">
                  {selectedGroup.group.name}
                </h3>
                <p className="text-xs text-muted">
                  कोड: {selectedGroup.group.group_code} • {selectedGroup.group.village}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGroup(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Highlights */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-muted font-medium">शिल्लक रोकड (Cash in Hand)</span>
                <span className="font-bold text-amber-950 font-heading text-sm">
                  {formatINR(selectedGroup.summary.cashInHand)}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-muted font-medium">दरमहा बैठक तारीख</span>
                <span className="font-bold text-foreground">
                  दरमहा {selectedGroup.group.meeting_day} तारीख
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-muted font-medium">मासिक बचत नियम</span>
                <span className="font-bold text-foreground font-heading">
                  {formatINR(selectedGroup.group.monthly_saving_amount)} / सदस्य
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-muted font-medium">कर्ज व्याज दर</span>
                <span className="font-bold text-foreground">
                  {selectedGroup.group.monthly_interest_rate}% दरमहा (Reducing Balance)
                </span>
              </div>
            </div>

            {/* Member List Preview */}
            <div className="space-y-2">
              <h4 className="font-heading font-bold text-xs text-foreground">
                सदस्य यादी ({selectedGroup.members.length})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {selectedGroup.members.map(m => (
                  <div key={m.id} className="p-2.5 rounded-xl bg-gray-50 text-xs flex justify-between items-center">
                    <span className="font-medium text-foreground">{m.name}</span>
                    <span className="text-muted text-[11px] font-mono">{m.phone || 'नोंद नाही'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Master Excel */}
            <button
              type="button"
              onClick={() => handleExportGroupExcel(selectedGroup)}
              className="w-full min-h-touch py-3 rounded-2xl bg-teal-primary text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>संपूर्ण सरकारी मास्टर अहवाल (.xlsx) डाउनलोड करा</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
