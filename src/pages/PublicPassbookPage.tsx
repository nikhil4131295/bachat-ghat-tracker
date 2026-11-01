import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  Landmark,
  RotateCcw,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Share2,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../lib/db';
import { formatINR, formatDate, calculateMemberStats } from '../lib/calculations';
import { exportMemberPassbookExcel } from '../lib/excel';
import { Avatar } from '../components/common/Avatar';
import type { Member, Group, Transaction, Loan, MemberWithStats } from '../types';

interface PassbookData {
  member: Member;
  group: Group;
  transactions: Transaction[];
  loans: Loan[];
  stats: MemberWithStats;
}

export const PublicPassbookPage: React.FC<{ token: string; onBackToApp?: () => void }> = ({
  token,
  onBackToApp,
}) => {
  const { t } = useTranslation();
  const [data, setData] = useState<PassbookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function fetchPassbook() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Try Supabase RPC first if online and configured
        if (isSupabaseConfigured() && navigator.onLine) {
          try {
            const { data: rpcRes, error: rpcErr } = await supabase.rpc('get_member_passbook', {
              p_token: token,
            });

            if (!rpcErr && rpcRes && rpcRes.member) {
              const member = rpcRes.member as Member;
              const group = rpcRes.group as Group;
              const txns = (rpcRes.transactions || []) as Transaction[];
              const loans = (rpcRes.loans || []) as Loan[];
              const stats = calculateMemberStats(member, txns, loans);

              setData({
                member,
                group,
                transactions: txns,
                loans,
                stats,
              });
              setIsLoading(false);
              return;
            }
          } catch (netErr) {
            console.warn('Supabase passbook fetch failed, falling back to local DB:', netErr);
          }
        }

        // 2. Fallback to local IndexedDB (offline or demo)
        const localMember = await db.members.where('passbook_token').equals(token).first();
        if (localMember) {
          const group = await db.groups.get(localMember.group_id);
          const txns = await db.transactions
            .where('member_id')
            .equals(localMember.id)
            .toArray();
          const loans = await db.loans
            .where('member_id')
            .equals(localMember.id)
            .toArray();

          const activeTxns = txns.filter(t => !t.deleted_at);
          const stats = calculateMemberStats(localMember, activeTxns, loans);

          setData({
            member: localMember,
            group: group || {
              id: localMember.group_id,
              name: 'महिला बचत गट',
              village: '',
              panchayat: '',
              started_date: '',
              monthly_saving_amount: 100,
              monthly_interest_rate: 2,
              monthly_late_fine: 20,
              meeting_day: 10,
              group_code: 'BG0001',
            },
            transactions: activeTxns.sort((a, b) => (b.entry_date > a.entry_date ? 1 : -1)),
            loans,
            stats,
          });
          setIsLoading(false);
          return;
        }

        setError('या लिंकचा पासबुक रेकॉर्ड सापडला नाही. कृपया गट खजिनदाराशी संपर्क साधा.');
      } catch (err: any) {
        console.error('Error loading passbook:', err);
        setError('पासबुक लोड करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      fetchPassbook();
    }
  }, [token]);

  const handleShareWhatsApp = () => {
    if (!data) return;
    const url = window.location.href;
    const msg = encodeURIComponent(
      `🙏 ${data.group.name.split('(')[0].trim()} - डिजिटल पासबुक\n\n` +
      `सदस्य: ${data.member.name}\n` +
      `एकूण बचत: ${formatINR(data.stats.total_savings)}\n` +
      `बाकी कर्ज: ${formatINR(data.stats.outstanding_loan)}\n\n` +
      `तुमचे पूर्ण पासबुक पाहण्यासाठी ही लिंक उघडा:\n${url}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadExcel = () => {
    if (!data) return;
    exportMemberPassbookExcel(data.stats, data.group, data.transactions, data.loans);
  };

  const getBadge = (type: string) => {
    switch (type) {
      case 'saving':
        return { label: t('savingType').split('(')[0].trim(), bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'loan_repayment':
        return { label: t('repaymentType').split('(')[0].trim(), bg: 'bg-sky-100 text-sky-800 border-sky-200' };
      case 'loan_given':
        return { label: t('loanGivenType').split('(')[0].trim(), bg: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'fine':
        return { label: t('fineType').split('(')[0].trim(), bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      default:
        return { label: type, bg: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-teal-surface border-2 border-teal-light/30 flex items-center justify-center animate-pulse shadow-sm">
          <Wallet className="w-8 h-8 text-teal-dark" />
        </div>
        <p className="mt-4 text-xs font-bold text-teal-dark tracking-wider uppercase">
          पासबुक लोड होत आहे...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-heading font-extrabold text-lg text-foreground mb-2">
          पासबुक सापडले नाही
        </h2>
        <p className="text-xs text-muted max-w-xs mb-6">
          {error || 'ही लिंक चुकीची असू शकते किंवा एक्सपायर झाली असू शकते.'}
        </p>
        {onBackToApp && (
          <button
            type="button"
            onClick={onBackToApp}
            className="px-6 py-3 rounded-2xl bg-teal-primary text-white font-heading font-bold text-xs shadow-xs"
          >
            मुख्य पानावर जा
          </button>
        )}
      </div>
    );
  }

  const { member, group, stats, transactions } = data;

  return (
    <div className="min-h-screen bg-background pb-12 selection:bg-teal-light selection:text-white">
      {/* 1. Branded Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-teal-surface border border-teal-light/20 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-teal-dark" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-base text-teal-dark leading-tight truncate">
                {group.name.split('(')[0].trim()}
              </h1>
              <p className="text-xs text-muted font-medium truncate">
                {group.village} {group.panchayat ? `• ${group.panchayat}` : ''}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>अधिकृत पासबुक</span>
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* 2. Member Profile Card */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center gap-3.5">
            <Avatar name={member.name} photoUrl={member.photo_url} size="lg" />
            <div className="min-w-0">
              <h2 className="font-heading font-extrabold text-lg text-foreground truncate">
                {member.name}
              </h2>
              <div className="flex items-center gap-2 pt-0.5 text-xs text-muted font-medium">
                <Calendar className="w-3.5 h-3.5 text-teal-primary" />
                <span>सदस्य नोंदणी: {formatDate(member.joined_date)}</span>
              </div>
            </div>
          </div>

          {/* Action Row: WhatsApp & Excel */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 min-h-touch py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp शेअर</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="flex-1 min-h-touch py-2.5 px-3 rounded-2xl bg-teal-surface hover:bg-teal-primary hover:text-white border border-teal-light/30 text-teal-dark font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Excel डाउनलोड</span>
            </button>
          </div>
        </div>

        {/* 3. 4 Key Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Total Savings */}
          <div className="p-4 rounded-3xl bg-pastel-mint border border-emerald-200/80 shadow-2xs space-y-1.5">
            <div className="w-9 h-9 rounded-2xl bg-white/80 text-teal-dark flex items-center justify-center shadow-2xs">
              <Wallet className="w-4 h-4 text-teal-dark" />
            </div>
            <p className="text-xs font-bold text-teal-dark/80">{t('totalSavings')}</p>
            <p className="font-heading font-extrabold text-xl text-teal-dark">
              {formatINR(stats.total_savings)}
            </p>
            <p className="text-[10px] text-teal-800 font-semibold">
              {t('monthsSaved', { count: stats.savings_count })}
            </p>
          </div>

          {/* Card 2: Outstanding Loan */}
          <div className="p-4 rounded-3xl bg-pastel-peach border border-orange-200/80 shadow-2xs space-y-1.5">
            <div className="w-9 h-9 rounded-2xl bg-white/80 text-coral-hover flex items-center justify-center shadow-2xs">
              <Landmark className="w-4 h-4 text-coral-primary" />
            </div>
            <p className="text-xs font-bold text-coral-hover/80">{t('loansOutstanding')}</p>
            <p className="font-heading font-extrabold text-xl text-coral-hover">
              {formatINR(stats.outstanding_loan)}
            </p>
            <p className="text-[10px] text-orange-800 font-semibold">
              {stats.outstanding_loan > 0 ? 'सक्रिय कर्ज बाकी' : 'कर्ज शिल्लक नाही'}
            </p>
          </div>

          {/* Card 3: Total Loan Repaid */}
          <div className="p-4 rounded-3xl bg-pastel-sky border border-sky-200/80 shadow-2xs space-y-1.5">
            <div className="w-9 h-9 rounded-2xl bg-white/80 text-blue-700 flex items-center justify-center shadow-2xs">
              <RotateCcw className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs font-bold text-blue-800/80">{t('repaid')}</p>
            <p className="font-heading font-extrabold text-xl text-blue-900">
              {formatINR(stats.total_loan_repaid)}
            </p>
            <p className="text-[10px] text-blue-700 font-semibold">
              मुद्दल परतफेड
            </p>
          </div>

          {/* Card 4: Interest Paid */}
          <div className="p-4 rounded-3xl bg-pastel-butter border border-amber-200/80 shadow-2xs space-y-1.5">
            <div className="w-9 h-9 rounded-2xl bg-white/80 text-amber-900 flex items-center justify-center shadow-2xs">
              <Coins className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs font-bold text-amber-900/80">भरलेले व्याज</p>
            <p className="font-heading font-extrabold text-xl text-amber-950">
              {formatINR(stats.total_interest_paid)}
            </p>
            <p className="text-[10px] text-amber-800 font-semibold">
              गटाला दिलेला लाभ
            </p>
          </div>
        </div>

        {/* 4. Complete Transaction History */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-foreground">
              खातेवही नोंदी ({transactions.length})
            </h3>
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-xs font-bold text-teal-primary hover:underline"
            >
              {copiedLink ? 'लिंक कॉपी झाली!' : 'लिंक कॉपी करा'}
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-muted text-xs">
              कोणतीही नोंद उपलब्ध नाही.
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(txn => {
                const isIncome = txn.type === 'saving' || txn.type === 'loan_repayment' || txn.type === 'fine';
                const badge = getBadge(txn.type);

                return (
                  <div
                    key={txn.id}
                    className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between gap-3"
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
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-[10px] text-muted">{formatDate(txn.entry_date)}</span>
                        </div>
                        {txn.type === 'loan_repayment' && (txn.principal_part > 0 || txn.interest_part > 0) ? (
                          <p className="text-[11px] text-muted font-medium pt-0.5 truncate">
                            मुद्दल: {formatINR(txn.principal_part)} + व्याज: {formatINR(txn.interest_part)}
                          </p>
                        ) : txn.note ? (
                          <p className="text-[11px] text-muted font-medium pt-0.5 truncate">
                            {txn.note}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`font-heading font-extrabold text-sm ${
                          isIncome ? 'text-emerald-700' : 'text-orange-700'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatINR(txn.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Bottom note */}
        <div className="p-4 rounded-3xl bg-teal-surface/50 border border-teal-light/20 text-center space-y-1">
          <p className="text-xs font-bold text-teal-dark">
            बचत गट ट्रॅकर • डिजिटल खातेवही
          </p>
          <p className="text-[10px] text-muted">
            हा पासबुक अधिकृत रेकॉर्ड असून ग्रामपंचायत आणि बँक मान्यतेनुसार वैध आहे.
          </p>
        </div>
      </main>
    </div>
  );
};
