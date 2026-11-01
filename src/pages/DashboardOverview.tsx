import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  Landmark,
  TrendingDown,
  Coins,
  Plus,
  HelpCircle,
  X,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  RotateCcw,
  Trash2,
  CloudUpload,
  WifiOff,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../lib/calculations';

export const DashboardOverview: React.FC = () => {
  const { t } = useTranslation();
  const {
    currentGroup,
    summary,
    transactions,
    members,
    loans,
    setActiveTab,
    softDeleteTransaction,
    undoDeleteTransaction,
    lastDeletedTxnId,
    syncState,
    handleManualSync,
  } = useApp();

  const [showHowCalculated, setShowHowCalculated] = useState(false);

  // Recent 5 entries (excluding soft-deleted)
  const recentEntries = transactions
    .filter(t => !t.deleted_at)
    .slice(0, 5);

  const getMemberName = (memberId?: string | null) => {
    if (!memberId) return t('expenseType');
    const m = members.find(mem => mem.id === memberId);
    return m ? m.name.split('(')[0].trim() : t('navMembers');
  };

  // 1. Bar Chart Data: Savings vs Expenses vs Unpaid Loans
  const barChartData = [
    { name: t('totalSavings'), amount: summary.totalSavings, fill: '#1F5F55' },
    { name: t('loansOutstanding'), amount: summary.totalLoansOutstanding, fill: '#D9694A' },
    { name: t('totalExpenses'), amount: summary.totalExpenses, fill: '#3B82F6' },
  ];

  // 2. Donut Chart Data: Loan Repaid vs Loan Pending
  const totalLoanGiven = loans.reduce((sum, l) => sum + l.principal_amount, 0);
  const totalLoanRepaid = Math.max(0, totalLoanGiven - summary.totalLoansOutstanding);
  const donutChartData = [
    { name: `${t('repaid')}`, value: totalLoanRepaid || 1, color: '#10B981' },
    { name: `${t('pending')}`, value: summary.totalLoansOutstanding || 1, color: '#F97316' },
  ];

  // 3. Line Chart Data: Monthly Savings (last 6 months)
  const monthlySavingsMap: { [month: string]: number } = {};
  transactions
    .filter(t => t.type === 'saving' && !t.deleted_at)
    .forEach(t => {
      const monthKey = t.entry_date.slice(0, 7); // YYYY-MM
      monthlySavingsMap[monthKey] = (monthlySavingsMap[monthKey] || 0) + t.amount;
    });

  const lineChartData = Object.keys(monthlySavingsMap)
    .sort()
    .slice(-6)
    .map(m => {
      const parts = m.split('-');
      const monthLabel = `${parts[1]}/${parts[0].slice(2)}`;
      return {
        month: monthLabel,
        savings: monthlySavingsMap[m],
      };
    });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'saving': return t('savingType').split('(')[0].trim();
      case 'loan_repayment': return t('repaymentType').split('(')[0].trim();
      case 'loan_given': return t('loanGivenType').split('(')[0].trim();
      case 'expense': return t('expenseType').split('(')[0].trim();
      case 'fine': return t('fineType').split('(')[0].trim();
      default: return type;
    }
  };

  return (
    <div className="space-y-6 pb-24 px-4 max-w-md mx-auto pt-2">
      {/* 10-Second Undo Alert Snackbar */}
      {lastDeletedTxnId && (
        <div className="p-3.5 rounded-2xl bg-gray-900 text-white flex items-center justify-between shadow-xl animate-in slide-in-from-top duration-200">
          <span className="text-xs font-medium">{t('undoDeleted')}</span>
          <button
            type="button"
            onClick={() => undoDeleteTransaction(lastDeletedTxnId)}
            className="px-3 py-1 rounded-xl bg-teal-primary text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-teal-light"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('undo')}</span>
          </button>
        </div>
      )}

      {/* 1. Welcome & Meeting Day Banner */}
      <div className="bg-gradient-to-r from-teal-dark to-teal-primary text-white rounded-3xl p-5 shadow-sm space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs text-teal-100 font-medium">{t('dashboardGreeting')} 🙏</p>
            <h2 className="font-heading font-extrabold text-xl tracking-tight text-white truncate">
              {currentGroup?.name.split('(')[0].trim()}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex flex-col items-center justify-center text-center shrink-0">
            <span className="text-[10px] text-teal-100 uppercase tracking-widest leading-none font-bold">
              {t('meeting')}
            </span>
            <span className="font-heading font-extrabold text-lg text-white leading-none">
              {currentGroup?.meeting_day || 10}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 text-xs text-teal-100">
          <Calendar className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="truncate">
            {t('meetingOnDay', { day: currentGroup?.meeting_day || 10 })}
          </span>
        </div>
      </div>

      {/* Offline / Pending Sync Notice */}
      {(syncState.status === 'offline' || syncState.pendingCount > 0) && (
        <div
          className={`p-4 rounded-3xl border flex items-center justify-between gap-3 text-xs shadow-2xs ${
            syncState.status === 'offline'
              ? 'bg-orange-50 border-orange-200 text-orange-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {syncState.status === 'offline' ? (
              <WifiOff className="w-5 h-5 text-orange-600 shrink-0" />
            ) : (
              <CloudUpload className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
            )}
            <p className="font-medium text-xs leading-snug">
              {syncState.status === 'offline'
                ? t('offlineBannerDesc')
                : t('syncPendingCount', { count: syncState.pendingCount })}
            </p>
          </div>
          {syncState.status !== 'offline' && syncState.pendingCount > 0 && (
            <button
              type="button"
              onClick={() => handleManualSync()}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 shadow-2xs active:scale-95 transition-all"
            >
              {t('syncNow')}
            </button>
          )}
        </div>
      )}

      {/* 2. 4 BIG SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Total Savings (Pastel Mint) */}
        <div className="bg-pastel-mint/90 border border-emerald-200/80 rounded-3xl p-4 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-white/80 text-teal-dark flex items-center justify-center shadow-2xs">
            <Wallet className="w-5 h-5 text-teal-dark" />
          </div>
          <div>
            <p className="text-xs font-bold text-teal-dark/80">{t('totalSavings')}</p>
            <p className="font-heading font-extrabold text-2xl text-teal-dark tracking-tight">
              {formatINR(summary.totalSavings)}
            </p>
          </div>
        </div>

        {/* Card 2: Loans Outstanding (Pastel Peach) */}
        <div className="bg-pastel-peach/90 border border-orange-200/80 rounded-3xl p-4 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-white/80 text-coral-hover flex items-center justify-center shadow-2xs">
            <Landmark className="w-5 h-5 text-coral-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-coral-hover/90">{t('loansOutstanding')}</p>
            <p className="font-heading font-extrabold text-2xl text-coral-hover tracking-tight">
              {formatINR(summary.totalLoansOutstanding)}
            </p>
          </div>
        </div>

        {/* Card 3: Total Expenses (Pastel Sky) */}
        <div className="bg-pastel-sky/90 border border-sky-200/80 rounded-3xl p-4 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-white/80 text-blue-700 flex items-center justify-center shadow-2xs">
            <TrendingDown className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-800/80">{t('totalExpenses')}</p>
            <p className="font-heading font-extrabold text-2xl text-blue-900 tracking-tight">
              {formatINR(summary.totalExpenses)}
            </p>
          </div>
        </div>

        {/* Card 4: Cash in Hand (Pastel Butter) */}
        <div className="bg-pastel-butter/90 border border-amber-200/80 rounded-3xl p-4 shadow-2xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-white/80 text-amber-800 flex items-center justify-center shadow-2xs">
            <Coins className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-900/80">{t('cashInHand')}</p>
            <p className="font-heading font-extrabold text-2xl text-amber-950 tracking-tight">
              {formatINR(summary.cashInHand)}
            </p>
          </div>
        </div>
      </div>

      {/* Small "How was this calculated?" link */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowHowCalculated(true)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-dark hover:underline py-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{t('howCalculated')}</span>
        </button>
      </div>

      {/* 3. BIG CORAL "ADD ENTRY" BUTTON */}
      <button
        type="button"
        onClick={() => setActiveTab('add')}
        className="w-full min-h-[56px] py-4 px-6 rounded-3xl bg-coral-primary hover:bg-coral-hover active:scale-98 text-white font-heading font-extrabold text-lg shadow-lg shadow-coral-primary/30 transition-all flex items-center justify-center gap-3 border-2 border-white"
      >
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Plus className="w-6 h-6 stroke-[3]" />
        </div>
        <span>{t('addEntryQuick')}</span>
      </button>

      {/* 4. CHARTS SECTION */}
      <div className="space-y-4">
        {/* Chart A: Savings vs Loans vs Expenses */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-heading font-bold text-sm text-foreground">
            {t('financialComparison')}
          </h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5B6B68' }} />
                <YAxis tick={{ fontSize: 10, fill: '#5B6B68' }} />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), '']}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Donut Chart - Loan Repaid vs Still Pending */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-heading font-bold text-sm text-foreground">
            {t('loanRepaymentStatus')}
          </h3>
          <div className="flex items-center justify-between">
            <div className="h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatINR(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-muted">{t('repaid')}:</span>
                <span className="font-bold text-foreground">{formatINR(totalLoanRepaid)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-orange-500 shrink-0" />
                <span className="text-muted">{t('pending')}:</span>
                <span className="font-bold text-foreground">{formatINR(summary.totalLoansOutstanding)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart C: Monthly Savings Trend */}
        {lineChartData.length > 0 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h3 className="font-heading font-bold text-sm text-foreground">
              {t('sixMonthSavings')}
            </h3>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5B6B68' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#5B6B68' }} />
                  <Tooltip formatter={(val: any) => formatINR(Number(val))} />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    stroke="#1F5F55"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#1F5F55' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* 5. RECENT 5 ENTRIES LIST (with Soft Delete) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-foreground">
            {t('recentEntries')}
          </h3>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className="text-xs font-bold text-teal-dark hover:underline flex items-center gap-0.5"
          >
            <span>{t('viewAll')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentEntries.length === 0 ? (
          <p className="text-xs text-muted text-center py-4">{t('noEntriesYet')}</p>
        ) : (
          <div className="space-y-3">
            {recentEntries.map(entry => {
              const isIncome = entry.type === 'saving' || entry.type === 'loan_repayment' || entry.type === 'fine';
              const badgeColors: Record<string, string> = {
                saving: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                loan_given: 'bg-orange-50 text-orange-800 border-orange-200',
                loan_repayment: 'bg-teal-surface text-teal-dark border-teal-light/30',
                expense: 'bg-blue-50 text-blue-800 border-blue-200',
                fine: 'bg-purple-50 text-purple-800 border-purple-200',
              };

              return (
                <div
                  key={entry.id}
                  className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {isIncome ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {getMemberName(entry.member_id)}
                      </p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            badgeColors[entry.type] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {getTypeLabel(entry.type)}
                        </span>
                        <span className="text-[10px] text-muted">{formatDate(entry.entry_date)}</span>
                        {entry.is_pending_sync && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5"
                            title="Waiting to sync"
                          >
                            <CloudUpload className="w-2.5 h-2.5 text-amber-600" />
                            <span>{t('syncPending')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <p
                      className={`font-heading font-extrabold text-sm ${
                        isIncome ? 'text-emerald-700' : 'text-orange-700'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatINR(entry.amount)}
                    </p>

                    <button
                      type="button"
                      onClick={() => softDeleteTransaction(entry.id)}
                      className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                      title={t('delete')}
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HOW WAS THIS CALCULATED MODAL */}
      {showHowCalculated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-teal-light/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-dark font-heading font-bold text-base">
                <HelpCircle className="w-5 h-5" />
                <span>{t('howCalculatedTitle')}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHowCalculated(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-foreground font-medium leading-relaxed">
              <div className="p-3 rounded-2xl bg-pastel-butter/60 border border-amber-200">
                <p className="font-bold text-amber-950 mb-1">{t('cashInHandFormula')}</p>
                <p className="text-amber-900 font-mono text-[11px]">
                  {t('cashInHandFormulaText')}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-pastel-peach/60 border border-orange-200">
                <p className="font-bold text-orange-950 mb-1">{t('reducingBalanceFormula')}</p>
                <p className="text-orange-900">
                  {t('reducingBalanceFormulaText')}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-pastel-mint/60 border border-emerald-200">
                <p className="font-bold text-teal-dark mb-1">{t('safeLedgerNote')}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHowCalculated(false)}
              className="w-full min-h-touch py-3 rounded-2xl bg-teal-primary text-white font-heading font-bold text-sm"
            >
              {t('understood')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
