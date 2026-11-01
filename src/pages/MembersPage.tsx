import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  Plus,
  Phone,
  Wallet,
  Landmark,
  Share2,
  Copy,
  Check,
  X,
  UserX,
  UserCheck,
  ChevronRight,
  Calendar,
  Download
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateMemberStats, formatINR, formatDate } from '../lib/calculations';
import { exportMemberPassbookExcel } from '../lib/excel';
import { Avatar } from '../components/common/Avatar';
import type { MemberWithStats } from '../types';

export const MembersPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    members,
    transactions,
    loans,
    addMember,
    toggleMemberActive,
    currentGroup,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberWithStats | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const membersWithStats: MemberWithStats[] = useMemo(() => {
    return members.map(m => calculateMemberStats(m, transactions, loans));
  }, [members, transactions, loans]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return membersWithStats;
    return membersWithStats.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q))
    );
  }, [membersWithStats, searchQuery]);

  const activeMembersCount = members.filter(m => m.is_active).length;

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setIsSubmitting(true);
    try {
      await addMember(newMemberName.trim(), newMemberPhone.trim() || undefined);
      setNewMemberName('');
      setNewMemberPhone('');
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassbookLink = (token: string) => {
    const origin = window.location.origin;
    const url = `${origin}/passbook/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleShareWhatsApp = (member: MemberWithStats) => {
    const origin = window.location.origin;
    const passbookUrl = `${origin}/passbook/${member.passbook_token}`;
    const text = encodeURIComponent(
      `Hello ${member.name}, click here to view your digital passbook for '${currentGroup?.name.split('(')[0].trim()}':\n${passbookUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-4 pb-24 px-4 max-w-md mx-auto pt-2">
      {/* 1. Header & Active Count */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-extrabold text-xl text-teal-dark">
            {t('membersTitle')}
          </h2>
          <p className="text-xs text-muted font-medium">
            {activeMembersCount} {t('activeMembers')}
          </p>
        </div>

        {/* Add Member Button */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="min-h-touch px-4 py-2.5 rounded-2xl bg-teal-primary hover:bg-teal-dark active:scale-95 text-white font-heading font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('addMember')}</span>
        </button>
      </div>

      {/* 2. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t('searchMembers')}
          className="w-full min-h-touch pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-teal-primary focus:outline-none shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. Members List */}
      <div className="space-y-2.5">
        {filteredMembers.map(member => (
          <div
            key={member.id}
            onClick={() => setSelectedMember(member)}
            className={`w-full p-4 rounded-3xl bg-white border transition-all text-left flex items-center justify-between gap-3 shadow-2xs cursor-pointer active:scale-99 ${
              member.is_active
                ? 'border-gray-100 hover:border-teal-light/40'
                : 'border-gray-200 bg-gray-50/70 opacity-60'
            }`}
          >
            {/* Left: Avatar & Info */}
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={member.name} photoUrl={member.photo_url} size="md" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-sm text-foreground truncate">
                    {member.name}
                  </h3>
                  {!member.is_active && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-200 text-gray-600">
                      Inactive
                    </span>
                  )}
                </div>

                {member.phone && (
                  <p className="text-xs text-muted flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{member.phone}</span>
                  </p>
                )}

                {/* Savings & Loan tags */}
                <div className="flex items-center gap-2 pt-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Wallet className="w-3 h-3 text-emerald-600" />
                    <span>{formatINR(member.total_savings)}</span>
                  </span>

                  {member.outstanding_loan > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                      <Landmark className="w-3 h-3 text-orange-600" />
                      <span>{formatINR(member.outstanding_loan)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
          </div>
        ))}
      </div>

      {/* 4. ADD MEMBER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-teal-light/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-dark font-heading font-bold text-base">
                <Users className="w-5 h-5" />
                <span>{t('addMember')}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  {t('memberName')} *
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  placeholder={t('memberNamePlaceholder')}
                  className="w-full min-h-touch px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-teal-primary focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  {t('phoneOptional')}
                </label>
                <input
                  type="tel"
                  value={newMemberPhone}
                  onChange={e => setNewMemberPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className="w-full min-h-touch px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-teal-primary focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 min-h-touch py-3 rounded-2xl bg-gray-100 text-foreground font-heading font-bold text-sm"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newMemberName.trim()}
                  className="w-1/2 min-h-touch py-3 rounded-2xl bg-teal-primary text-white font-heading font-bold text-sm shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? '...' : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MEMBER PROFILE & PASSBOOK MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom duration-200 border border-teal-light/20">
            {/* Top Close Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                {t('memberDetails')}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Info Card */}
            <div className="flex items-center gap-4 p-4 rounded-3xl bg-teal-surface/60 border border-teal-light/20">
              <Avatar name={selectedMember.name} size="lg" />
              <div>
                <h3 className="font-heading font-extrabold text-base text-teal-dark">
                  {selectedMember.name}
                </h3>
                {selectedMember.phone && (
                  <p className="text-xs text-muted flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-teal-primary" />
                    <span>{selectedMember.phone}</span>
                  </p>
                )}
                <p className="text-[11px] text-muted flex items-center gap-1 pt-0.5">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span>{t('joinedDate')}: {formatDate(selectedMember.joined_date)}</span>
                </p>
              </div>
            </div>

            {/* 2 Big Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-3xl bg-pastel-mint/80 border border-emerald-200">
                <p className="text-xs font-bold text-teal-dark">{t('totalSavingsOfMember')}</p>
                <p className="font-heading font-extrabold text-xl text-teal-dark">
                  {formatINR(selectedMember.total_savings)}
                </p>
                <p className="text-[10px] text-teal-800 font-semibold pt-0.5">
                  {t('monthsSaved', { count: selectedMember.savings_count })}
                </p>
              </div>

              <div className="p-4 rounded-3xl bg-pastel-peach/80 border border-orange-200">
                <p className="text-xs font-bold text-coral-hover">{t('loanPendingOfMember')}</p>
                <p className="font-heading font-extrabold text-xl text-coral-hover">
                  {formatINR(selectedMember.outstanding_loan)}
                </p>
                <p className="text-[10px] text-orange-800 font-semibold pt-0.5">
                  {t('interestPaidSoFar', { amount: formatINR(selectedMember.total_interest_paid) })}
                </p>
              </div>
            </div>

            {/* PASSBOOK SHARE LINK */}
            <div className="p-4 rounded-3xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-teal-dark" />
                <span className="font-heading font-bold text-xs text-teal-dark">
                  {t('passbookLink')}
                </span>
              </div>

              <p className="text-[11px] text-muted font-medium">
                {t('sharePassbookDesc')}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPassbookLink(selectedMember.passbook_token)}
                  className="flex-1 min-h-touch py-2.5 px-3 rounded-2xl bg-white border border-gray-300 hover:border-teal-primary text-xs font-bold text-foreground flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedToken ? t('copied') : t('copyLink')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedMember)}
                  className="min-h-touch py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
              </div>

              {/* Download Member Passbook Excel */}
              <button
                type="button"
                onClick={() => {
                  if (currentGroup) {
                    exportMemberPassbookExcel(selectedMember, currentGroup, transactions, loans);
                  }
                }}
                className="w-full min-h-touch py-2.5 px-3 rounded-2xl bg-teal-surface hover:bg-teal-primary hover:text-white border border-teal-light/30 text-teal-dark text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Passbook (.xlsx)</span>
              </button>
            </div>

            {/* Deactivate / Activate button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={async () => {
                  await toggleMemberActive(selectedMember.id);
                  setSelectedMember(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
                }}
                className={`w-full min-h-touch py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  selectedMember.is_active
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {selectedMember.is_active ? (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>{t('deactivate')}</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>{t('activate')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
