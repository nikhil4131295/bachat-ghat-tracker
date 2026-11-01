import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  Landmark,
  RotateCcw,
  TrendingDown,
  AlertOctagon,
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  Share2,
  Plus,
  Search,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { TransactionType, ExpenseCategory, LoanPurpose } from '../types';
import { formatINR, formatDate, getMemberActiveLoanInfo, splitLoanRepayment } from '../lib/calculations';
import { Avatar } from '../components/common/Avatar';
import { NumberPad } from '../components/common/NumberPad';
import confetti from 'canvas-confetti';

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Stationery', 'Meeting', 'Bank Charges', 'Travel', 'Other'];
const LOAN_PURPOSES: LoanPurpose[] = ['Farming', 'Business', 'Medical', 'Education', 'Home', 'Other'];

export const OneTapEntryPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentGroup, members, loans, transactions, addTransaction } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedType, setSelectedType] = useState<TransactionType>('saving');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');
  const [amount, setAmount] = useState<number>(currentGroup?.monthly_saving_amount || 100);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Stationery');
  const [loanPurpose, setLoanPurpose] = useState<LoanPurpose>('Farming');
  const [note, setNote] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeMembers = members.filter(m => m.is_active);

  const filteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return activeMembers;
    const q = memberSearchQuery.toLowerCase();
    return activeMembers.filter(m => m.name.toLowerCase().includes(q) || (m.phone && m.phone.includes(q)));
  }, [activeMembers, memberSearchQuery]);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const loanInfo = useMemo(() => {
    if (!selectedMemberId) return null;
    return getMemberActiveLoanInfo(selectedMemberId, loans, transactions, currentGroup?.monthly_interest_rate || 2.0);
  }, [selectedMemberId, loans, transactions, currentGroup]);

  const repaymentSplit = useMemo(() => {
    if (selectedType !== 'loan_repayment' || !loanInfo || loanInfo.pendingPrincipal <= 0) return null;
    return splitLoanRepayment(amount, loanInfo.interestDueThisMonth, loanInfo.pendingPrincipal);
  }, [selectedType, loanInfo, amount]);

  const getCategoryLabel = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'Stationery': return t('catStationery');
      case 'Meeting': return t('catMeeting');
      case 'Bank Charges': return t('catBankCharges');
      case 'Travel': return t('catTravel');
      default: return t('catOther');
    }
  };

  const getPurposeLabel = (purp: LoanPurpose) => {
    switch (purp) {
      case 'Farming': return t('purpFarming');
      case 'Business': return t('purpBusiness');
      case 'Medical': return t('purpMedical');
      case 'Education': return t('purpEducation');
      case 'Home': return t('purpHome');
      default: return t('purpOther');
    }
  };

  const handleTypeSelect = (type: TransactionType) => {
    setSelectedType(type);
    if (type === 'saving') {
      setAmount(currentGroup?.monthly_saving_amount || 100);
    } else if (type === 'fine') {
      setAmount(currentGroup?.monthly_late_fine || 10);
    } else if (type === 'loan_given') {
      setAmount(5000);
    } else if (type === 'expense') {
      setAmount(150);
      setStep(3);
      return;
    }
    setStep(2);
  };

  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    if (selectedType === 'loan_repayment') {
      const info = getMemberActiveLoanInfo(memberId, loans, transactions, currentGroup?.monthly_interest_rate || 2.0);
      const suggestedAmount = info.interestDueThisMonth > 0 ? info.interestDueThisMonth + 1000 : 500;
      setAmount(suggestedAmount);
    }
    setStep(3);
  };

  const handleSave = async () => {
    if (!currentGroup || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addTransaction({
        group_id: currentGroup.id,
        member_id: selectedType === 'expense' ? null : selectedMemberId || null,
        type: selectedType,
        amount: Number(amount),
        interest_part: repaymentSplit ? repaymentSplit.interestPart : 0,
        principal_part: repaymentSplit ? repaymentSplit.principalPart : 0,
        category: selectedType === 'expense' ? expenseCategory : selectedType === 'loan_given' ? loanPurpose : null,
        note: note.trim() || undefined,
        entry_date: entryDate,
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSavedSuccess(true);
    } catch (err) {
      console.error('Failed to save entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedMemberId('');
    setNote('');
    setSavedSuccess(false);
  };

  if (savedSuccess) {
    const memberName = selectedMember?.name.split('(')[0].trim() || t('navMembers');
    const groupName = currentGroup?.name.split('(')[0].trim() || t('appName');

    let messageBody = '';
    if (selectedType === 'saving') {
      messageBody = `Namaste ${memberName}, your saving of ${formatINR(amount)} received on ${formatDate(entryDate)}. Thank you! - ${groupName}`;
    } else if (selectedType === 'loan_repayment') {
      messageBody = `Namaste ${memberName}, loan repayment of ${formatINR(amount)} (Interest: ${formatINR(repaymentSplit?.interestPart)}, Principal: ${formatINR(repaymentSplit?.principalPart)}) received on ${formatDate(entryDate)}. Remaining principal: ${formatINR(repaymentSplit?.remainingPendingPrincipal)}. - ${groupName}`;
    } else if (selectedType === 'loan_given') {
      messageBody = `Namaste ${memberName}, loan of ${formatINR(amount)} approved and disbursed on ${formatDate(entryDate)}. - ${groupName}`;
    } else if (selectedType === 'fine') {
      messageBody = `Namaste ${memberName}, fine payment of ${formatINR(amount)} received on ${formatDate(entryDate)}. - ${groupName}`;
    } else {
      messageBody = `Group expense of ${formatINR(amount)} (${getCategoryLabel(expenseCategory)}) recorded on ${formatDate(entryDate)}. - ${groupName}`;
    }

    const shareUrl = `https://wa.me/?text=${encodeURIComponent(messageBody)}`;
    const smsUrl = `sms:${selectedMember?.phone || ''}?body=${encodeURIComponent(messageBody)}`;

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 max-w-md mx-auto text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <Check className="w-12 h-12 stroke-[3]" />
        </div>

        <div className="space-y-1">
          <h2 className="font-heading font-extrabold text-2xl text-teal-dark">
            {t('entrySavedSuccess')}
          </h2>
          <p className="text-sm text-muted font-medium">
            {formatINR(amount)} • {selectedMember ? memberName : getCategoryLabel(expenseCategory)}
          </p>
        </div>

        <div className="w-full p-4 rounded-3xl bg-gray-50 border border-gray-200 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-dark">
            <MessageSquare className="w-4 h-4 text-teal-primary" />
            <span>{t('receiptMessageTitle')}</span>
          </div>
          <p className="text-xs text-foreground bg-white p-3 rounded-2xl border border-gray-100 leading-relaxed font-medium">
            {messageBody}
          </p>
        </div>

        <div className="w-full space-y-2.5">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[52px] py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
          >
            <Share2 className="w-5 h-5" />
            <span>{t('sendWhatsAppReceipt')}</span>
          </a>

          <a
            href={smsUrl}
            className="w-full min-h-[52px] py-3.5 px-4 rounded-2xl bg-teal-primary hover:bg-teal-dark text-white font-heading font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
          >
            <span>{t('sendSMSReceipt')}</span>
          </a>

          <button
            type="button"
            onClick={resetForm}
            className="w-full min-h-[52px] py-3.5 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-foreground font-heading font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addAnotherEntry')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 px-4 max-w-md mx-auto pt-2">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-extrabold text-xl text-teal-dark">
            {t('oneTapEntry')}
          </h2>
          <p className="text-xs text-muted font-medium">
            {t('stepOf', { step })}
          </p>
        </div>

        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((step - 1) as any)}
            className="text-xs font-bold text-teal-dark hover:underline flex items-center gap-1 p-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('prevStep')}</span>
          </button>
        )}
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 py-1">
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-200 ${
              s === step ? 'w-8 bg-teal-primary' : s < step ? 'w-4 bg-teal-light' : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* STEP 1: CHOOSE ENTRY TYPE */}
      {step === 1 && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <p className="text-xs font-bold text-muted uppercase tracking-wider text-center">
            {t('selectEntryType')}
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {/* 1. Saving */}
            <button
              type="button"
              onClick={() => handleTypeSelect('saving')}
              className="min-h-[64px] p-4 rounded-3xl bg-pastel-mint/80 border-2 border-emerald-300 hover:border-emerald-500 text-left flex items-center gap-3 transition-all active:scale-98 shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-white text-emerald-800 flex items-center justify-center shadow-xs shrink-0">
                <Wallet className="w-6 h-6 text-teal-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-base text-teal-dark leading-tight">
                  {t('savingType')}
                </h3>
                <p className="text-xs text-teal-900/80">{t('savingTypeDesc')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-teal-dark/50 shrink-0" />
            </button>

            {/* 2. Loan Repayment */}
            <button
              type="button"
              onClick={() => handleTypeSelect('loan_repayment')}
              className="min-h-[64px] p-4 rounded-3xl bg-teal-surface border-2 border-teal-light/40 hover:border-teal-primary text-left flex items-center gap-3 transition-all active:scale-98 shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-white text-teal-dark flex items-center justify-center shadow-xs shrink-0">
                <RotateCcw className="w-6 h-6 text-teal-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-base text-teal-dark leading-tight">
                  {t('repaymentType')}
                </h3>
                <p className="text-xs text-muted">{t('repaymentTypeDesc')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-teal-dark/50 shrink-0" />
            </button>

            {/* 3. Loan Given */}
            <button
              type="button"
              onClick={() => handleTypeSelect('loan_given')}
              className="min-h-[64px] p-4 rounded-3xl bg-pastel-peach/80 border-2 border-orange-300 hover:border-orange-500 text-left flex items-center gap-3 transition-all active:scale-98 shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-white text-orange-800 flex items-center justify-center shadow-xs shrink-0">
                <Landmark className="w-6 h-6 text-coral-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-base text-coral-hover leading-tight">
                  {t('loanGivenType')}
                </h3>
                <p className="text-xs text-orange-900/80">{t('loanGivenTypeDesc')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-coral-primary/50 shrink-0" />
            </button>

            {/* 4. Expense */}
            <button
              type="button"
              onClick={() => handleTypeSelect('expense')}
              className="min-h-[64px] p-4 rounded-3xl bg-pastel-sky/80 border-2 border-sky-300 hover:border-sky-500 text-left flex items-center gap-3 transition-all active:scale-98 shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-white text-blue-800 flex items-center justify-center shadow-xs shrink-0">
                <TrendingDown className="w-6 h-6 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-base text-blue-900 leading-tight">
                  {t('expenseType')}
                </h3>
                <p className="text-xs text-blue-900/80">{t('expenseTypeDesc')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-700/50 shrink-0" />
            </button>

            {/* 5. Fine */}
            <button
              type="button"
              onClick={() => handleTypeSelect('fine')}
              className="min-h-[64px] p-4 rounded-3xl bg-pastel-lavender/80 border-2 border-purple-300 hover:border-purple-500 text-left flex items-center gap-3 transition-all active:scale-98 shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-white text-purple-800 flex items-center justify-center shadow-xs shrink-0">
                <AlertOctagon className="w-6 h-6 text-purple-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-base text-purple-900 leading-tight">
                  {t('fineType')}
                </h3>
                <p className="text-xs text-purple-900/80">{t('fineTypeDesc')}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-purple-700/50 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CHOOSE MEMBER */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={memberSearchQuery}
              onChange={e => setMemberSearchQuery(e.target.value)}
              placeholder={t('searchMemberPrompt')}
              className="w-full min-h-touch pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-teal-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
            {filteredMembers.map(member => {
              const info = getMemberActiveLoanInfo(member.id, loans, transactions, currentGroup?.monthly_interest_rate || 2.0);
              const hasLoan = info.pendingPrincipal > 0;

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleMemberSelect(member.id)}
                  className="p-3 rounded-2xl border-2 border-gray-200 hover:border-teal-primary bg-white text-left flex items-center gap-2.5 transition-all active:scale-95 shadow-2xs"
                >
                  <Avatar name={member.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <span className="font-heading font-bold text-xs text-foreground truncate block leading-tight">
                      {member.name.split('(')[0].trim()}
                    </span>
                    {selectedType === 'loan_repayment' && hasLoan ? (
                      <span className="text-[10px] text-coral-primary font-bold">
                        {t('pending')}: {formatINR(info.pendingPrincipal)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted">
                        {member.phone ? member.phone.slice(-4) : t('navMembers')}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: AMOUNT & DETAILS */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4 animate-in fade-in duration-150">
          {selectedMember && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-teal-surface/60 border border-teal-light/20">
              <Avatar name={selectedMember.name} size="sm" />
              <div className="min-w-0 flex-1">
                <span className="font-heading font-bold text-xs text-teal-dark truncate block">
                  {selectedMember.name}
                </span>
                <span className="text-[10px] text-muted capitalize">
                  {t('selectEntryType')}: {selectedType}
                </span>
              </div>
            </div>
          )}

          {/* Loan Repayment Live Split */}
          {selectedType === 'loan_repayment' && loanInfo && (
            <div className="p-3.5 rounded-2xl bg-pastel-peach/60 border border-orange-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-950 font-medium">{t('pendingLoanPrincipal')}:</span>
                <span className="font-heading font-bold text-orange-950">{formatINR(loanInfo.pendingPrincipal)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-950 font-medium">{t('interestDueThisMonth')} ({loanInfo.monthlyInterestRate}%):</span>
                <span className="font-heading font-extrabold text-coral-hover">{formatINR(loanInfo.interestDueThisMonth)}</span>
              </div>

              {repaymentSplit && (
                <div className="pt-2 border-t border-orange-200/80 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/80 p-2 rounded-xl">
                    <span className="text-[10px] text-muted block">{t('interestPart')}:</span>
                    <span className="font-bold text-foreground font-heading">{formatINR(repaymentSplit.interestPart)}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl">
                    <span className="text-[10px] text-muted block">{t('principalPart')}:</span>
                    <span className="font-bold text-emerald-700 font-heading">{formatINR(repaymentSplit.principalPart)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Expense Category Chips */}
          {selectedType === 'expense' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted">{t('selectExpenseCategory')}</label>
              <div className="flex flex-wrap gap-1.5">
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setExpenseCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      expenseCategory === cat
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loan Purpose Chips */}
          {selectedType === 'loan_given' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-muted">{t('selectLoanPurpose')}</label>
              <div className="flex flex-wrap gap-1.5">
                {LOAN_PURPOSES.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLoanPurpose(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      loanPurpose === p
                        ? 'bg-coral-primary text-white border-coral-primary'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {getPurposeLabel(p)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Large Amount Display */}
          <div className="text-center py-2">
            <span className="text-xs text-muted font-bold block uppercase tracking-wider">{t('paidAmount')}</span>
            <div className="font-heading font-black text-4xl text-teal-dark tracking-tight">
              {formatINR(amount)}
            </div>
          </div>

          <NumberPad
            value={amount}
            onChange={setAmount}
            quickChips={
              selectedType === 'saving'
                ? [100, 200, 500, 1000]
                : selectedType === 'loan_repayment'
                ? [loanInfo?.interestDueThisMonth || 100, 500, 1000, 2000]
                : [500, 1000, 2000, 5000]
            }
            onSubmit={() => setStep(4)}
            submitLabel={t('reviewEntry')}
          />
        </div>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5 animate-in fade-in duration-150">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">{t('reviewEntry')}</span>
            <h3 className="font-heading font-extrabold text-2xl text-teal-dark">
              {formatINR(amount)}
            </h3>
          </div>

          <div className="space-y-2.5 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">{t('selectEntryType')}:</span>
              <span className="font-bold text-foreground capitalize">{selectedType}</span>
            </div>

            {selectedMember && (
              <div className="flex items-center justify-between">
                <span className="text-muted">{t('memberName')}:</span>
                <span className="font-bold text-foreground">{selectedMember.name}</span>
              </div>
            )}

            {selectedType === 'loan_repayment' && repaymentSplit && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted">{t('interestPart')}:</span>
                  <span className="font-bold text-foreground">{formatINR(repaymentSplit.interestPart)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">{t('principalPart')}:</span>
                  <span className="font-bold text-emerald-700">{formatINR(repaymentSplit.principalPart)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">{t('remainingPendingPrincipal')}:</span>
                  <span className="font-bold text-coral-hover">{formatINR(repaymentSplit.remainingPendingPrincipal)}</span>
                </div>
              </>
            )}

            {selectedType === 'expense' && (
              <div className="flex items-center justify-between">
                <span className="text-muted">{t('selectExpenseCategory')}:</span>
                <span className="font-bold text-blue-700">{getCategoryLabel(expenseCategory)}</span>
              </div>
            )}

            {selectedType === 'loan_given' && (
              <div className="flex items-center justify-between">
                <span className="text-muted">{t('selectLoanPurpose')}:</span>
                <span className="font-bold text-coral-hover">{getPurposeLabel(loanPurpose)}</span>
              </div>
            )}
          </div>

          {/* Date & Note Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-muted mb-1">{t('entryDate')}</label>
              <input
                type="date"
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
                className="w-full min-h-touch px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-teal-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1">{t('optionalNote')}</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={t('optionalNotePlaceholder')}
                className="w-full min-h-touch px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-teal-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Save Button */}
          <button
            type="button"
            disabled={isSubmitting || amount <= 0}
            onClick={handleSave}
            className="w-full min-h-[56px] py-4 rounded-2xl bg-coral-primary hover:bg-coral-hover active:scale-98 text-white font-heading font-extrabold text-lg shadow-lg shadow-coral-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isSubmitting ? t('savingInProgress') : t('save')}</span>
            <Check className="w-6 h-6 stroke-[3]" />
          </button>
        </div>
      )}
    </div>
  );
};
