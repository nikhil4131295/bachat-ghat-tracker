import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../lib/calculations';
import { Avatar } from '../components/common/Avatar';

export const LoansPage: React.FC = () => {
  const { t } = useTranslation();
  const { loans, members, summary, setActiveTab } = useApp();

  const getMember = (memberId: string) => members.find(m => m.id === memberId);

  return (
    <div className="space-y-4 pb-24 px-4 max-w-md mx-auto pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-extrabold text-xl text-teal-dark">
            {t('navLoans')}
          </h2>
          <p className="text-xs text-muted font-medium">
            {t('loansSubtitle', { count: summary.activeLoansCount, amount: formatINR(summary.totalLoansOutstanding) })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className="min-h-touch px-4 py-2.5 rounded-2xl bg-coral-primary hover:bg-coral-hover active:scale-95 text-white font-heading font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('newLoanBtn')}</span>
        </button>
      </div>

      {/* Loans List */}
      <div className="space-y-3">
        {loans.map(loan => {
          const member = getMember(loan.member_id);
          const isClosed = loan.status === 'closed';

          return (
            <div
              key={loan.id}
              className="p-4 rounded-3xl bg-white border border-gray-100 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={member?.name || 'Member'} size="md" />
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-sm text-foreground truncate">
                      {member?.name || 'Member'}
                    </h3>
                    <p className="text-xs text-muted">
                      {t('loanPurposeLabel')} {loan.purpose}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    isClosed
                      ? 'bg-gray-100 text-gray-700 border-gray-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {isClosed ? t('loanStatusClosed') : t('loanStatusActive')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-xs">
                <div>
                  <span className="text-muted block text-[11px]">{t('loanPrincipalAmount')}</span>
                  <span className="font-heading font-extrabold text-foreground text-sm">
                    {formatINR(loan.principal_amount)}
                  </span>
                </div>

                <div>
                  <span className="text-muted block text-[11px]">{t('monthlyInterestRateLabel')}</span>
                  <span className="font-bold text-foreground">
                    {loan.monthly_interest_rate}% {t('perMonth')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  {t('date')}: {formatDate(loan.start_date)}
                </span>

                <button
                  type="button"
                  onClick={() => setActiveTab('add')}
                  className="text-teal-dark font-bold hover:underline"
                >
                  {t('repayInstallmentBtn')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
