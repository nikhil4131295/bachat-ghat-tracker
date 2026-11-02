import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Percent, ArrowRight, ArrowLeft, Check, Plus, Trash2, Key } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const GroupSetupPage: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { setupNewGroup } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Info
  const [groupName, setGroupName] = useState('Jai Bhavani Mahila Bachat Ghat');
  const [village, setVillage] = useState('Yerla');
  const [panchayat, setPanchayat] = useState('Yerla Gram Panchayat');
  const [startedDate, setStartedDate] = useState(new Date().toISOString().split('T')[0]);

  // Step 2: Rules
  const [monthlySaving, setMonthlySaving] = useState(100);
  const [monthlyInterest, setMonthlyInterest] = useState(2.0);
  const [lateFine, setLateFine] = useState(0);
  const [meetingDay, setMeetingDay] = useState(10);

  // Step 3: Members
  const [memberNames, setMemberNames] = useState<string[]>([
    'Sunita Tai Shinde',
    'Anusaya Bai Patil',
    'Mangal Tai Gaikwad',
    'Shakuntala Kadam',
    'Shobha Jadhav',
  ]);
  const [newMemberInput, setNewMemberInput] = useState('');

  // Step 4: Finished
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMember = () => {
    if (newMemberInput.trim()) {
      setMemberNames([...memberNames, newMemberInput.trim()]);
      setNewMemberInput('');
    }
  };

  const handleRemoveMember = (index: number) => {
    setMemberNames(memberNames.filter((_, i) => i !== index));
  };

  const handleFinishSetup = async () => {
    setIsSubmitting(true);
    try {
      const created = await setupNewGroup(
        {
          name: groupName,
          village,
          panchayat,
          started_date: startedDate,
          monthly_saving_amount: monthlySaving,
          monthly_interest_rate: monthlyInterest,
          monthly_late_fine: lateFine,
          meeting_day: meetingDay,
        },
        memberNames
      );
      setGeneratedCode(created.group_code);
      setStep(4);
    } catch (err) {
      console.error('Setup failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        {/* Step Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-teal-dark px-1">
            <span className={step >= 1 ? 'text-teal-dark' : 'text-gray-400'}>{t('step1')}</span>
            <span className={step >= 2 ? 'text-teal-dark' : 'text-gray-400'}>{t('step2')}</span>
            <span className={step >= 3 ? 'text-teal-dark' : 'text-gray-400'}>{t('step3')}</span>
            <span className={step >= 4 ? 'text-teal-dark' : 'text-gray-400'}>4. Done</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-teal-primary transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: GROUP INFO */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-surface text-teal-dark flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg text-teal-dark">
                  {t('step1')}
                </h2>
                <p className="text-xs text-muted">Enter group name, village & details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">
                  {t('groupName')} *
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder={t('groupNamePlaceholder')}
                  className="w-full min-h-touch px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-teal-primary focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">
                  {t('village')} *
                </label>
                <input
                  type="text"
                  required
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  placeholder={t('villagePlaceholder')}
                  className="w-full min-h-touch px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-teal-primary focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">
                  {t('panchayat')} *
                </label>
                <input
                  type="text"
                  required
                  value={panchayat}
                  onChange={e => setPanchayat(e.target.value)}
                  placeholder={t('panchayatPlaceholder')}
                  className="w-full min-h-touch px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-teal-primary focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">
                  {t('startedDate')}
                </label>
                <input
                  type="date"
                  value={startedDate}
                  onChange={e => setStartedDate(e.target.value)}
                  className="w-full min-h-touch px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-teal-primary focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!groupName.trim() || !village.trim()}
              onClick={() => setStep(2)}
              className="w-full min-h-touch py-3.5 rounded-2xl bg-teal-primary hover:bg-teal-dark active:scale-98 text-white font-heading font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{t('nextStep')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: GROUP RULES */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-surface text-teal-dark flex items-center justify-center">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg text-teal-dark">
                  {t('step2')}
                </h2>
                <p className="text-xs text-muted">Set saving, interest & meeting rules</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">
                  {t('monthlySaving')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm font-bold text-gray-500">₹</span>
                  <input
                    type="number"
                    step="50"
                    min="10"
                    value={monthlySaving}
                    onChange={e => setMonthlySaving(Number(e.target.value))}
                    className="w-full min-h-touch pl-8 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-base font-bold text-foreground focus:ring-2 focus:ring-teal-primary focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">
                  {t('interestRate')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={monthlyInterest}
                    onChange={e => setMonthlyInterest(Number(e.target.value))}
                    className="w-full min-h-touch px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-base font-bold text-foreground focus:ring-2 focus:ring-teal-primary focus:bg-white focus:outline-none"
                  />
                  <span className="absolute right-4 top-3 text-xs font-bold text-gray-500">% {t('perMonth')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">
                  {t('lateFine')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm font-bold text-gray-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={lateFine}
                    onChange={e => setLateFine(Number(e.target.value))}
                    className="w-full min-h-touch pl-8 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-base font-bold text-foreground focus:ring-2 focus:ring-teal-primary focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">
                  {t('meetingDay')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={meetingDay}
                  onChange={e => setMeetingDay(Number(e.target.value))}
                  className="w-full min-h-touch px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-base font-bold text-foreground focus:ring-2 focus:ring-teal-primary focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 min-h-touch py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-foreground font-heading font-bold text-sm transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('prevStep')}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-2/3 min-h-touch py-3.5 rounded-2xl bg-teal-primary hover:bg-teal-dark active:scale-98 text-white font-heading font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>{t('nextStep')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ADD MEMBERS */}
        {step === 3 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-surface text-teal-dark flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg text-teal-dark">
                  {t('step3')}
                </h2>
                <p className="text-xs text-muted">Add group members (minimum 5 members)</p>
              </div>
            </div>

            {/* Quick add input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMemberInput}
                onChange={e => setNewMemberInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
                placeholder={t('memberNamePlaceholder')}
                className="flex-1 min-h-touch px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:ring-2 focus:ring-teal-primary focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="min-h-touch px-4 rounded-2xl bg-teal-primary hover:bg-teal-dark text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Members List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {memberNames.map((name, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-teal-surface text-teal-dark text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-foreground truncate">
                      {name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(idx)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 min-h-touch py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-foreground font-heading font-bold text-sm transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('prevStep')}</span>
              </button>

              <button
                type="button"
                disabled={memberNames.length === 0 || isSubmitting}
                onClick={handleFinishSetup}
                className="w-2/3 min-h-touch py-3.5 rounded-2xl bg-coral-primary hover:bg-coral-hover active:scale-98 text-white font-heading font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? t('savingInProgress') : t('finishSetup')}</span>
                <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS & GROUP CODE */}
        {step === 4 && (
          <div className="bg-white rounded-3xl p-6 shadow-md border border-teal-light/20 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h2 className="font-heading font-extrabold text-xl text-teal-dark">
                {t('finishSetup')} Successful!
              </h2>
              <p className="text-xs text-muted">
                {groupName} • {village}
              </p>
            </div>

            {/* Big 6-character Group Code card */}
            <div className="p-5 rounded-3xl bg-teal-surface border-2 border-teal-primary/30 space-y-2">
              <div className="text-xs font-bold text-teal-dark uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Key className="w-4 h-4 text-teal-primary" />
                <span>{t('groupCodeTitle')}</span>
              </div>
              <div className="font-heading font-black text-3xl text-teal-dark tracking-widest select-all">
                {generatedCode}
              </div>
              <p className="text-xs text-muted font-medium">
                {t('groupCodeNotice')}
              </p>
            </div>

            <button
              type="button"
              onClick={onComplete}
              className="w-full min-h-touch py-3.5 rounded-2xl bg-teal-primary hover:bg-teal-dark active:scale-98 text-white font-heading font-bold text-base shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{t('navHome')} &rarr;</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
